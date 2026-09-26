"use client";

import React, { useEffect, useRef, useState } from "react";

interface EntryEffectProps {
  vehicleUrl: string;
  userName: string;
  onComplete?: () => void;
}

const CACHE_DB = "HurryVideoCacheDB";
const CACHE_STORE = "videos";
const CACHE_VERSION = 2;

function openCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(CACHE_DB, CACHE_VERSION);
    req.onerror = () => reject(req.error || new Error("IndexedDB open failed"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: "url" });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

async function getCached(url: string): Promise<Blob | null> {
  try {
    const db = await openCache();
    const value = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction(CACHE_STORE, "readonly");
      const req = tx.objectStore(CACHE_STORE).get(url);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return value?.blob instanceof Blob ? value.blob : null;
  } catch {
    return null;
  }
}

async function putCached(url: string, blob: Blob) {
  try {
    const db = await openCache();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CACHE_STORE, "readwrite");
      tx.objectStore(CACHE_STORE).put({ url, blob, savedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Cache transaction aborted"));
    });
    db.close();
  } catch (e) {
    console.warn("Hurry vehicle cache write failed:", e);
  }
}

async function loadVideo(url: string): Promise<{ src: string; objectUrl: string | null }> {
  const cached = await getCached(url);
  if (cached) {
    const objectUrl = URL.createObjectURL(cached);
    return { src: objectUrl, objectUrl };
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Vehicle video HTTP ${response.status}`);
  const blob = await response.blob();
  if (!blob.size) throw new Error("Vehicle video is empty");

  await putCached(url, blob);
  const objectUrl = URL.createObjectURL(blob);
  return { src: objectUrl, objectUrl };
}

function isMp4(url: string) {
  return /\.mp4(?:[?#].*)?$/i.test(url);
}

export default function EntryEffect({ vehicleUrl, userName, onComplete }: EntryEffectProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const completedRef = useRef(false);

  const complete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setVisible(false);
    onComplete?.();
  };

  useEffect(() => {
    let cancelled = false;
    completedRef.current = false;
    setVisible(false);

    const run = async () => {
      if (!vehicleUrl || !isMp4(vehicleUrl)) {
        complete();
        return;
      }

      try {
        const result = await loadVideo(vehicleUrl);
        if (cancelled) {
          if (result.objectUrl) URL.revokeObjectURL(result.objectUrl);
          return;
        }
        objectUrlRef.current = result.objectUrl;
        setSrc(result.src);
      } catch (e) {
        console.error("Vehicle entry video load failed:", e);
        if (!cancelled) complete();
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    };
  }, [vehicleUrl]);

  useEffect(() => {
    if (!src || !isMp4(vehicleUrl)) return;

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let finishTimer: number | undefined;
    let started = false;

    const renderFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (cancelled || !video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(video, 0, 0, width, height);
      const frame = ctx.getImageData(0, 0, width, height);
      const pixels = frame.data;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        const greenDominance = g - Math.max(r, b);
        const chroma = g - (r + b) * 0.5;
        if (g > 70 && greenDominance > 18 && chroma > 12) {
          const strength = Math.min(1, Math.max(greenDominance / 70, chroma / 60));
          pixels[i + 3] = Math.round(255 * (1 - strength));
        }
      }
      ctx.putImageData(frame, 0, 0);
      requestAnimationFrame(renderFrame);
    };

    const start = async () => {
      if (cancelled || started) return;
      try {
        video.playsInline = true;
        video.currentTime = 0;
        await video.play();
        if (cancelled) return;
        requestAnimationFrame(renderFrame);
        started = true;
        setVisible(true);

        // Keep the real MP4 visible in the room; no image fallback and no green-screen processing.
        finishTimer = window.setTimeout(() => {
          if (!cancelled) complete();
        }, 4000);
      } catch {
        if (!cancelled) complete();
      }
    };

    const onReady = () => void start();
    const onPlaying = () => void start();
    const onEnded = () => complete();
    const onPause = () => {
      if (!cancelled && !video.ended && started) {
        void video.play().catch(() => complete());
      }
    };

    video.addEventListener("canplay", onReady);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("ended", onEnded);
    video.addEventListener("pause", onPause);
    video.load();

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) void start();

    return () => {
      cancelled = true;
      if (finishTimer) window.clearTimeout(finishTimer);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("pause", onPause);
      video.pause();
    };
  }, [src, vehicleUrl]);

  if (!src) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        playsInline
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        preload="auto"
        aria-hidden="true"
        className="absolute h-0 w-0 opacity-0 pointer-events-none"
      />
      <canvas
        ref={canvasRef}
        aria-label={`${userName} vehicle entry`}
        className={`block w-screen h-screen object-contain pointer-events-none transition-opacity duration-75 ${visible ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
