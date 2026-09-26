"use client";

import React, { useEffect, useRef, useState } from 'react';

interface EntryEffectProps {
  vehicleUrl: string;
  userName: string;
  onComplete?: () => void;
}

const VIDEO_CACHE_DB = 'HurryVideoCacheDB';
const VIDEO_CACHE_STORE = 'videos';
const VIDEO_CACHE_VERSION = 1;

function openVideoCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = indexedDB.open(VIDEO_CACHE_DB, VIDEO_CACHE_VERSION);

    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(VIDEO_CACHE_STORE)) {
        db.createObjectStore(VIDEO_CACHE_STORE, { keyPath: 'url' });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

async function getCachedVideo(url: string): Promise<Blob | null> {
  try {
    const db = await openVideoCacheDB();

    const result = await new Promise<{ url: string; blob: Blob } | null>((resolve, reject) => {
      const tx = db.transaction(VIDEO_CACHE_STORE, 'readonly');
      const request = tx.objectStore(VIDEO_CACHE_STORE).get(url);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return result?.blob || null;
  } catch {
    return null;
  }
}

async function saveVideoToCache(url: string, blob: Blob): Promise<void> {
  try {
    const db = await openVideoCacheDB();

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(VIDEO_CACHE_STORE, 'readwrite');
      tx.objectStore(VIDEO_CACHE_STORE).put({
        url,
        blob,
        savedAt: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    });

    db.close();
  } catch (error) {
    // Playback must still work if IndexedDB is unavailable/full.
    console.warn('Hurry video cache save failed:', error);
  }
}

async function getOrDownloadVideo(url: string): Promise<{ src: string; objectUrl: string | null }> {
  const cached = await getCachedVideo(url);

  if (cached) {
    const objectUrl = URL.createObjectURL(cached);
    return { src: objectUrl, objectUrl };
  }

  const response = await fetch(url, {
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error(`Video download failed: ${response.status}`);
  }

  const blob = await response.blob();

  // Save the first successful download permanently in IndexedDB.
  await saveVideoToCache(url, blob);

  const objectUrl = URL.createObjectURL(blob);
  return { src: objectUrl, objectUrl };
}

export default function EntryEffect({ vehicleUrl, userName, onComplete }: EntryEffectProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const startEffect = async () => {
      // MP4: download/cache first. Nothing is rendered while it is loading.
      if (vehicleUrl.toLowerCase().split('?')[0].endsWith('.mp4')) {
        try {
          const result = await getOrDownloadVideo(vehicleUrl);
          if (cancelled) {
            if (result.objectUrl) URL.revokeObjectURL(result.objectUrl);
            return;
          }

          objectUrlRef.current = result.objectUrl;
          setVideoSrc(result.src);
        } catch (error) {
          console.error('EntryEffect video load failed:', error);
          if (!cancelled) onComplete?.();
        }
        return;
      }

      // Image effects do not need video caching.
      setIsVisible(true);
      timer = setTimeout(() => {
        if (!cancelled) {
          setIsVisible(false);
          onComplete?.();
        }
      }, 4000);
    };

    startEffect();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [vehicleUrl, onComplete]);

  // For cached/downloaded MP4, do not show the effect until the video can actually play.
  useEffect(() => {
    if (!videoSrc) return;

    const video = document.createElement('video');
    video.src = videoSrc;
    video.preload = 'auto';
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.controls = false;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('controls', 'false');
    video.style.position = 'fixed';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.left = '-2px';
    video.style.top = '-2px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '-1';
    document.body.appendChild(video);
    videoElementRef.current = video;

    let cancelled = false;
    let playbackStarted = false;
    let completeTimer: ReturnType<typeof setTimeout> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const beginPlayback = async () => {
      if (cancelled || playbackStarted) return;

      try {
        video.controls = false;
        video.muted = true;
        video.defaultMuted = true;
        await video.play();
        if (cancelled) return;

        playbackStarted = true;
        setIsVisible(true);

        completeTimer = setTimeout(() => {
          if (!cancelled) {
            setIsVisible(false);
            onComplete?.();
          }
        }, 4000);
      } catch (error) {
        if (cancelled) return;
        retryTimer = setTimeout(() => {
          if (!cancelled) void beginPlayback();
        }, 120);
      }
    };

    const handleReady = () => {
      void beginPlayback();
    };

    const handlePlaying = () => {
      if (cancelled || playbackStarted) return;
      playbackStarted = true;
      setIsVisible(true);
      completeTimer = setTimeout(() => {
        if (!cancelled) {
          setIsVisible(false);
          onComplete?.();
        }
      }, 4000);
    };

    const handleUnexpectedPause = () => {
      if (cancelled || !videoSrc) return;
      // Never expose the native Android paused-video surface. Resume silently.
      if (!video.ended) {
        video.muted = true;
        void video.play().catch(() => {});
      }
    };

    video.addEventListener('canplay', handleReady);
    video.addEventListener('loadeddata', handleReady);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handleUnexpectedPause);

    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      void beginPlayback();
    } else {
      video.load();
    }

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (completeTimer) clearTimeout(completeTimer);
      video.removeEventListener('canplay', handleReady);
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handleUnexpectedPause);
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (video.parentNode) video.parentNode.removeChild(video);
      videoElementRef.current = null;
    };
  }, [videoSrc, onComplete]);

  // WebGL video renderer with green-screen removal.
  useEffect(() => {
    if (!videoSrc) return;

    const canvas = canvasRef.current;
    const video = videoElementRef.current;
    if (!canvas || !video) return;

    const gl = canvas.getContext('webgl', {
      preserveDrawingBuffer: true,
      alpha: true,
    });

    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;

      void main() {
        vec4 color = texture2D(u_image, v_texCoord);

        if (color.g > 0.5 && color.r < 0.3 && color.b < 0.3) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        } else {
          gl_FragColor = color;
        }
      }
    `;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
      ]),
      gl.STATIC_DRAW
    );

    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let animationFrameId = 0;

    const render = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        try {
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            video
          );

          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        } catch {
          // Wait for the next frame if Android WebView is still preparing the video.
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);

      if (texture) gl.deleteTexture(texture);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (texCoordBuffer) gl.deleteBuffer(texCoordBuffer);
      gl.deleteProgram(program);
    };
  }, [videoSrc]);

  if (!isVisible && !videoSrc) return null;

  return (
    <div
      className="absolute top-1/4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-full max-w-[300px] flex flex-col items-center justify-center animate-bounce-in"
      style={{ opacity: isVisible ? 1 : 0, visibility: isVisible ? 'visible' : 'hidden' }}
    >
      {videoSrc ? (
        <canvas
          ref={canvasRef}
          width={512}
          height={512}
          className="w-[120px] h-[120px] object-contain drop-shadow-2xl"
        />
      ) : (
        <img
          src={vehicleUrl}
          alt="Vehicle Entry"
          className="w-[120px] h-[120px] object-contain drop-shadow-2xl"
        />
      )}

      <div className="mt-2 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500 px-4 py-1.5 rounded-full shadow-lg border border-yellow-200">
        <span className="text-black font-bold text-sm tracking-wide">
          {userName} entered the room!
        </span>
      </div>
    </div>
  );
}
