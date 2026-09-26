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
    const objectUrl = URL.createObjectURL(cached);\n    return { src: objectUrl, objectUrl };
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
  const [useVideoFallback, setUseVideoFallback] = useState(false);
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
      if (!vehicleUrl) {
        complete();
        return;
      }

      if (!isMp4(vehicleUrl)) {
        if (!cancelled) setSrc(vehicleUrl);
        if (!cancelled) {
          setVisible(true);
          window.setTimeout(() => !cancelled && complete(), 4000);
        }
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
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let cancelled = false;
    let raf = 0;
    let started = false;
    let finishTimer: number | undefined;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      setUseVideoFallback(true);
      return;
    }

    const start = async () => {
      if (cancelled || started) return;
      try {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        await video.play();
        if (cancelled) return;

        started = true;
        setVisible(true);

        const render = () => {
          if (cancelled) return;
          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            const w = video.videoWidth || 512;
            const h = video.videoHeight || 512;
            if (canvas.width !== w || canvas.height !== h) {
              canvas.width = w;
              canvas.height = h;
            }

            try {
              ctx.clearRect(0, 0, w, h);
              ctx.drawImage(video, 0, 0, w, h);

              // Remove only strongly green pixels. Normal vehicle colours are preserved.
              const frame = ctx.getImageData(0, 0, w, h);
              const px = frame.data;
              for (let i = 0; i < px.length; i += 4) {
                const red = px[i];
                const green = px[i + 1];
                const blue = px[i + 2];
                if (green > 125 && green > red * 1.28 && green > blue * 1.28) {
                  px[i + 3] = 0;
                }
              }
              ctx.putImageData(frame, 0, 0);
            } catch {
              setUseVideoFallback(true);
            }
          }
          raf = requestAnimationFrame(render);
        };

        render();
        finishTimer = window.setTimeout(() => !cancelled && complete(), 4000);
      } catch {
        if (!cancelled) setUseVideoFallback(true);
      }
    };

    const onReady = () => void start();
    const onPlaying = () => void start();
    const onPause = () => {
      if (!cancelled && !video.ended && started) {
        void video.play().catch(() => setUseVideoFallback(true));
      }
    };

    video.addEventListener("canplay", onReady);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.load();
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (finishTimer) window.clearTimeout(finishTimer);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.pause();
    };
  }, [src, vehicleUrl]);

  if (!visible && !src) return null;

  return (
    <div
      className="absolute top-1/4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-full max-w-[300px] flex flex-col items-center justify-center animate-bounce-in"
      style={{ opacity: visible ? 1 : 0, visibility: visible ? "visible" : "hidden" }}
    >
      {isMp4(vehicleUrl) ? (
        <>
          <video
            ref={videoRef}
            src={src || undefined}
            muted
            autoPlay
            playsInline
            preload="auto"
            loop
            className={`w-[120px] h-[120px] object-contain ${useVideoFallback ? "block" : "hidden"}`}
            aria-hidden="true"
          />
          <canvas
            ref={canvasRef}
            width={512}
            height={512}
            className={`w-[120px] h-[120px] object-contain ${useVideoFallback ? "hidden" : "block"}`}
          />
        </>
      ) : (
        <img
          src={src || vehicleUrl}
          alt="Vehicle Entry"
          className="w-[120px] h-[120px] object-contain"
          draggable={false}
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
