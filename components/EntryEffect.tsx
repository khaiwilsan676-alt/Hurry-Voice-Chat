"use client";

import React, { useEffect, useRef, useState } from 'react';

interface EntryEffectProps {
  vehicleUrl: string;
  userName: string;
  onComplete?: () => void;
}

const isMp4 = (src: string) => {
  try {
    return new URL(src, window.location.href).pathname.toLowerCase().endsWith('.mp4');
  } catch {
    return src.toLowerCase().split('?')[0].endsWith('.mp4');
  }
};

export default function EntryEffect({ vehicleUrl, userName, onComplete }: EntryEffectProps) {
  const [isVisible, setIsVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const video = isMp4(vehicleUrl);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    if (!video) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use a normal 2D canvas instead of WebGL. Android WebView can fail to
    // upload MP4 video frames to WebGL, which leaves the vehicle invisible.
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const media = document.createElement('video');
    media.src = vehicleUrl;
    media.muted = true;
    media.defaultMuted = true;
    media.playsInline = true;
    media.setAttribute('playsinline', '');
    media.setAttribute('webkit-playsinline', '');
    media.preload = 'auto';

    let frameId = 0;
    let started = false;

    const render = () => {
      if (!isVisible) return;
      if (media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && media.videoWidth > 0 && media.videoHeight > 0) {
        if (canvas.width !== media.videoWidth || canvas.height !== media.videoHeight) {
          canvas.width = media.videoWidth;
          canvas.height = media.videoHeight;
        }

        ctx.drawImage(media, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Remove the green screen while keeping the vehicle unchanged.
        for (let i = 0; i < pixels.length; i += 4) {
          const red = pixels[i];
          const green = pixels[i + 1];
          const blue = pixels[i + 2];
          if (green > red * 1.2 && green > blue * 1.2 && green > 70) {
            pixels[i + 3] = 0;
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }
      frameId = requestAnimationFrame(render);
    };

    const start = () => {
      if (started) return;
      started = true;
      media.play().then(() => {
        render();
      }).catch(() => {
        started = false;
      });
    };

    media.addEventListener('loadeddata', start);
    media.addEventListener('canplay', start);
    media.load();
    start();

    return () => {
      cancelAnimationFrame(frameId);
      media.pause();
      media.removeAttribute('src');
      media.load();
    };
  }, [vehicleUrl, video, isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="absolute top-1/4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-full max-w-[300px] flex flex-col items-center justify-center animate-bounce-in"
      style={{ minHeight: '150px' }}
    >
      {video ? (
        <canvas
          ref={canvasRef}
          width={512}
          height={512}
          className="w-[120px] h-[120px] object-contain drop-shadow-2xl"
          aria-label="Vehicle entry animation"
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
