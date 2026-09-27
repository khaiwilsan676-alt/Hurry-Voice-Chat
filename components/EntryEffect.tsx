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
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const req = indexedDB.open(CACHE_DB, CACHE_VERSION);
    req.onerror = () => reject(req.error || new Error("IndexedDB open failed"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CACHE_STORE)) db.createObjectStore(CACHE_STORE, { keyPath: "url" });
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

async function putCached(url: string, blob: Blob): Promise<void> {
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

function isMp4(url: string): boolean {
  return /\.mp4(?:[?#].*)?$/i.test(url);
}

export default function EntryEffect({ vehicleUrl, userName, onComplete }: EntryEffectProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const completedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const complete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setVisible(false);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    onComplete?.();
  };

  useEffect(() => {
    completedRef.current = false;
    setVisible(false);
    setSrc(null);
    if (!vehicleUrl || !isMp4(vehicleUrl)) {
      complete();
      return;
    }
    let cancelled = false;
    loadVideo(vehicleUrl).then(({ src: loadedSrc, objectUrl }) => {
      if (cancelled) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        return;
      }
      objectUrlRef.current = objectUrl;
      setSrc(loadedSrc);
    }).catch(() => {
      if (!cancelled) complete();
    });
    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      const objectUrl = objectUrlRef.current;
      objectUrlRef.current = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [vehicleUrl]);

  useEffect(() => {
    if (!src) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let cancelled = false;
    let started = false;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const render = () => {
      if (cancelled) return;
      if (video.videoWidth > 0 && video.videoHeight > 0 && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && canvas.width && canvas.height) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const p = frame.data;
        for (let i = 0; i < p.length; i += 4) {
          const r = p[i];
          const g = p[i + 1];
          const b = p[i + 2];
          const greenDominance = g - Math.max(r, b);
          if (g > 70 && greenDominance > 18 && g / Math.max(1, (r + b) / 2) > 1.18) {
            const edge = Math.min(1, Math.max(0, (greenDominance - 18) / 55));
            p[i + 3] = Math.round(p[i + 3] * (1 - edge));
          }
        }
        ctx.putImageData(frame, 0, 0);
      }
      rafRef.current = requestAnimationFrame(render);
    };

    const start = async () => {
      if (cancelled || started) return;
      try {
        video.currentTime = 0;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        if (!cancelled) {
          started = true;
          setVisible(true);
          rafRef.current = requestAnimationFrame(render);
        }
      } catch {
        if (!cancelled) complete();
      }
    };

    const onReady = () => void start();
    const onPlaying = () => {
      if (!started) {
        started = true;
        setVisible(true);
        rafRef.current = requestAnimationFrame(render);
      }
    };
    const onEnded = () => complete();
    const onError = () => complete();
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);
    video.load();
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) void start();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      video.pause();
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
    };
  }, [src]);

  if (!src) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        playsInline
        muted
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        preload="auto"
        aria-hidden="true"
        className="absolute w-px h-px opacity-0 pointer-events-none"
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`max-w-[100vw] max-h-[100vh] w-auto h-auto object-contain pointer-events-none transition-opacity duration-75 ${visible ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
