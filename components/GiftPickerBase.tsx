"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronUp } from "lucide-react";
import Image from "next/image";
import socket from "../src/lib/socket";

const SHARED_DB = "FruitPartyDB";
const SHARED_STORE = "GameState";
const DEFAULT_BALANCE = 82927;

// Single cached connection — avoids leaking an IndexedDB connection on every poll
let dbPromise: Promise<IDBDatabase> | null = null;

const initWalletDB = (): Promise<IDBDatabase> => {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(SHARED_DB, 3);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(SHARED_STORE)) db.createObjectStore(SHARED_STORE);
      if (!db.objectStoreNames.contains("transactions")) db.createObjectStore("transactions", { keyPath: "id", autoIncrement: true });
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); dbPromise = null; };
      db.onclose = () => { dbPromise = null; };
      resolve(db);
    };
    request.onerror = () => { dbPromise = null; reject(request.error); };
  });
  return dbPromise;
};

const loadWalletBalance = async (): Promise<number> => {
  try {
    const db = await initWalletDB();
    return new Promise((resolve) => {
      const tx = db.transaction(SHARED_STORE, "readonly");
      const req = tx.objectStore(SHARED_STORE).get("user_data");
      req.onsuccess = () => resolve(req.result && typeof req.result.balance === "number" ? req.result.balance : DEFAULT_BALANCE);
      req.onerror = () => resolve(DEFAULT_BALANCE);
    });
  } catch { return DEFAULT_BALANCE; }
};

const updateWalletBalance = async (delta: number): Promise<void> => {
  try {
    const db = await initWalletDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SHARED_STORE, "readwrite");
      const store = tx.objectStore(SHARED_STORE);
      const req = store.get("user_data");
      req.onsuccess = () => {
        const data = req.result;
        const current = data?.balance ?? DEFAULT_BALANCE;
        const putReq = store.put({ ...(data || {}), balance: Math.max(0, current + delta) }, "user_data");
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) { console.error("Wallet update failed", e); }
};

const recordGiftTransaction = async (title: string, amount: number): Promise<void> => {
  try {
    const db = await initWalletDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction("transactions", "readwrite");
      const now = new Date();
      const record = {
        title,
        amount,
        date: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        timestamp: now.getTime(),
        type: "coin",
      };
      const req = tx.objectStore("transactions").add(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) { console.error("Failed to record gift transaction", e); }
};

const SolidMicIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.39-.9.88 0 2.76-2.24 5-5 5s-5-2.24-5-5c0-.49-.41-.88-.9-.88s-.9.39-.9.88c0 3.66 2.85 6.66 6.4 7.08V22h1.8v-2.92c3.55-.42 6.4-3.42 6.4-7.08 0-.49-.41-.88-.9-.88z" /></svg>
);
const SolidUserIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
);

export interface Gift { id: number; name: string; coins: number; image: string; video?: string; videoStyle?: "fade" | "pure"; noMask?: boolean; sideFade?: boolean; }
interface Seat { number: number; isOccupied: boolean; user?: { name: string; image: string; accountId: string }; }

export default function GiftPicker({ onClose, seats = [], onSend, roomId, currentUserAccountId, roomUsers = [] }: {
  onClose: () => void; seats?: Seat[]; onSend?: (value: number) => void; roomId?: string; currentUserAccountId?: string; roomUsers?: Array<{ accountId: string; name: string; image: string }>;
}) {
  const [activeTab, setActiveTab] = useState("Hot");
  const [selectedMultiplier, setSelectedMultiplier] = useState("1×");
  const [showMultipliers, setShowMultipliers] = useState(false);
  const [selectedGift, setSelectedGift] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [sending, setSending] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<{ src: string; style: "fade" | "pure" } | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [showTargetMenu, setShowTargetMenu] = useState(false);
  const targetMenuRef = useRef<HTMLDivElement>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [selectionLabel, setSelectionLabel] = useState<"All" | "All room">("All");
  const videoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabs = ["Hot", "Lucky", "Luxury", "Event"];
  const multipliers = ["1×", "10×", "299×", "599×", "999×"];

  const hotGifts: Gift[] = [
    { id: 1, name: "Teddy", coins: 70000, image: "/IMG_20260922_142150.jpg", video: "/VID_20260921_011932.mp4", videoStyle: "fade" },
    { id: 2, name: "Autumn's Embrace ", coins: 54900, image: "/IMG_20260922_182259.png", video: "/gemini_generated_video_89e836bd~2.mp4", videoStyle: "pure", noMask: true },
    { id: 3, name: "Arab King", coins: 500000, image: "/image_d9df9625~2.jpg", video: "/gemini_generated_video_17e19680~2.mp4", videoStyle: "fade", sideFade: true },
  ];
  const luckyGifts: Gift[] = [
    { id: 101, name: "Kiss", coins: 1999, image: "/IMG_20260906_000443.png" }, { id: 102, name: "Nut", coins: 3999, image: "/IMG_20260906_000508.png" }, { id: 103, name: "Mahjong", coins: 5999, image: "/IMG_20260906_000521.png" }, { id: 104, name: "Clover", coins: 4250, image: "/IMG_20260906_000541.png" }, { id: 105, name: "Charm", coins: 7000, image: "/IMG_20260906_000624.png" }, { id: 106, name: "Bouquet", coins: 10999, image: "/IMG_20260906_000643.png" }, { id: 107, name: "Leaves", coins: 6799, image: "/IMG_20260906_000713.png" }, { id: 108, name: "Crystal", coins: 2999, image: "/IMG_20260906_000756.png" }, { id: 109, name: "Candy", coins: 15499, image: "/IMG_20260906_000814.png" }, { id: 110, name: "Pop", coins: 4000, image: "/IMG_20260906_000832.png" }, { id: 111, name: "Scarecrow", coins: 7500, image: "/IMG_20260906_000850.png" },
  ];
  const currentGifts: Gift[] = activeTab === "Lucky" ? luckyGifts : activeTab === "Hot" ? hotGifts : [];

  useEffect(() => { let alive = true; const fetchBal = async () => { const b = await loadWalletBalance(); if (alive) setWalletBalance(b); }; fetchBal(); const id = setInterval(fetchBal, 1000); return () => { alive = false; clearInterval(id); }; }, []);
  useEffect(() => { if (playingVideo) return; const handler = (e: MouseEvent) => { if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) onClose(); }; document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler); }, [onClose, playingVideo]);
  useEffect(() => { const handler = (e: MouseEvent) => { if (targetMenuRef.current && !targetMenuRef.current.contains(e.target as Node)) setShowTargetMenu(false); }; if (showTargetMenu) document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler); }, [showTargetMenu]);
  useEffect(() => () => { if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current); }, []);

  const parseMultiplier = (m: string) => parseInt(m.replace("×", ""), 10) || 1;
  const selectedGiftObj = currentGifts.find((g) => g.id === selectedGift);
  const totalCost = selectedGiftObj ? selectedGiftObj.coins * parseMultiplier(selectedMultiplier) : 0;
  const recipientIds = selectedTargets.length ? selectedTargets : roomUsers.length > 0 ? roomUsers.map((u) => u.accountId) : seats.filter((s) => s.isOccupied && s.user).map((s) => s.user!.accountId);
  const recipientCount = recipientIds.length;
  const totalSendCost = totalCost * Math.max(1, recipientCount);
  const canAfford = totalCost > 0 && recipientCount > 0 && totalSendCost <= walletBalance;

  const finishVideo = () => { if (videoTimeoutRef.current) { clearTimeout(videoTimeoutRef.current); videoTimeoutRef.current = null; } setPlayingVideo(null); setSending(false); onClose(); };
  const handleSend = async () => {
    if (!selectedGiftObj || sending || !canAfford) return;
    setSending(true); setWalletBalance((p) => Math.max(0, p - totalSendCost)); await updateWalletBalance(-totalSendCost); await recordGiftTransaction(selectedGiftObj.name, -totalSendCost);
    if (roomId && currentUserAccountId && recipientIds.length > 0) socket.emit("coin_transfer", { roomId: String(roomId), senderId: String(currentUserAccountId), recipientIds: recipientIds.map(String), amount: totalCost, giftName: selectedGiftObj.name });
    if (onSend) onSend(totalCost);
    if (selectedGiftObj.video) { setPlayingVideo({ src: selectedGiftObj.video, style: selectedGiftObj.videoStyle ?? "fade" }); if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current); videoTimeoutRef.current = setTimeout(finishVideo, 10000); } else { setSending(false); onClose(); }
  };

  const handleAllOnMic = () => { const micUsers = seats.filter((s) => s.isOccupied && s.user).map((s) => s.user!.accountId); setSelectedTargets(micUsers); setSelectionLabel("All"); setShowTargetMenu(false); };
  const handleAllInRoom = () => { setSelectedTargets([]); setSelectionLabel("All room"); setShowTargetMenu(false); };
  const handleAvatarClick = (accountId: string) => { setSelectedTargets((prev) => prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]); if (selectionLabel === "All room") setSelectionLabel("All"); };

  if (playingVideo) {
    const isFade = playingVideo.style === "fade";
    const isArabKing = playingVideo.src.includes("17e19680");
    const teddyVideoMask = "linear-gradient(to bottom, transparent 0%, transparent 18%, black 26%, black 70%, transparent 83%, transparent 100%)";
    const kingVideoMask = "linear-gradient(to bottom, transparent 0%, transparent 10%, black 16%, black 85%, transparent 94%, transparent 100%)";
    return (
      <>
        <style>{`
          video::-webkit-media-controls,
          video::-webkit-media-controls-enclosure,
          video::-webkit-media-controls-panel,
          video::-webkit-media-controls-overlay-play-button,
          video::-webkit-media-controls-start-playback-button,
          video::-webkit-media-controls-play-button,
          video::-webkit-media-controls-timeline,
          video::-webkit-media-controls-current-time-display,
          video::-webkit-media-controls-time-remaining-display,
          video::-webkit-media-controls-mute-button,
          video::-webkit-media-controls-volume-slider,
          video::-webkit-media-controls-fullscreen-button,
          video::-webkit-media-controls-picture-in-picture-button,
          video::-webkit-media-controls-toggle-closed-captions-button {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          video::-webkit-media-controls-overlay-enclosure,
          video::-webkit-media-controls-overlay-play-button,
          video::-webkit-media-controls-start-playback-button {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
          video { -webkit-appearance: none !important; appearance: none !important; -webkit-user-select: none !important; user-select: none !important; -webkit-user-modify: read-only !important; touch-action: none !important; }
        `}</style>
        {!isFade && <svg style={{ width: 0, height: 0, position: "absolute" }} aria-hidden="true"><filter id="remove-black" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1.5 1.5 1.5 0 -0.2" /></filter></svg>}
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none" style={{ background: "transparent" }}>
          <video
            ref={(el) => {
              if (!el) return;
              el.controls = false;
              el.removeAttribute("controls");
              el.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback");
              el.setAttribute("disablePictureInPicture", "");
              el.setAttribute("disableRemotePlayback", "");
              el.style.pointerEvents = "none";
              el.style.userSelect = "none";
              const observer = new MutationObserver(() => {
                if (el.controls || el.hasAttribute("controls")) { el.controls = false; el.removeAttribute("controls"); }
              });
              observer.observe(el, { attributes: true, attributeFilter: ["controls"] });
              (el as any).__hurryControlsObserver = observer;
              el.play().catch(() => {});
            }}
            src={playingVideo.src}
            autoPlay
            playsInline
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            onLoadedData={(e) => { setSending(false); e.currentTarget.controls = false; e.currentTarget.removeAttribute("controls"); e.currentTarget.play().catch(() => {}); }}
            onCanPlay={(e) => { e.currentTarget.controls = false; e.currentTarget.removeAttribute("controls"); e.currentTarget.play().catch(() => {}); }}
            onPlaying={(e) => { e.currentTarget.controls = false; e.currentTarget.removeAttribute("controls"); setSending(false); }}
            onEnded={finishVideo}
            onError={finishVideo}
            className={isFade ? "w-full h-full object-cover pointer-events-none" : "w-auto h-auto max-w-[72vw] max-h-[72vh] object-contain pointer-events-none"}
            style={isFade ? (isArabKing ? { WebkitMaskImage: kingVideoMask, maskImage: kingVideoMask, transform: "translateY(2%)", transformOrigin: "center" } : { WebkitMaskImage: teddyVideoMask, maskImage: teddyVideoMask }) : { mixBlendMode: "screen", backgroundColor: "transparent", filter: "url(#remove-black)" }}
          />
        </div>
      </>
    );
  }

  return (
    <div ref={sheetRef} className="fixed bottom-0 left-0 right-0 z-50 bg-[#101014] text-white rounded-t-2xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3"><div className="flex gap-5">{tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div><button onClick={() => setShowMultipliers((v) => !v)}>{selectedMultiplier}</button></div>
      <div className="grid grid-cols-4 gap-3 p-4">{currentGifts.map((gift) => <button key={gift.id} onClick={() => setSelectedGift(gift.id)} className="relative"><Image src={gift.image} alt={gift.name} width={80} height={80} className="object-contain" /><span>{gift.name}</span><span>{gift.coins}</span></button>)}</div>
      <div className="flex items-center justify-between p-4"><button onClick={handleAllOnMic}><SolidMicIcon className="w-5 h-5" /> All</button><button onClick={handleAllInRoom}><SolidUserIcon className="w-5 h-5" /> All room</button><button disabled={!canAfford || sending} onClick={handleSend}>Send</button></div>
    </div>
  );
}
