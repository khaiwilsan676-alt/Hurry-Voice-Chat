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
      if (!db.objectStoreNames.contains(SHARED_STORE)) {
        db.createObjectStore(SHARED_STORE);
      }
      if (!db.objectStoreNames.contains("transactions")) {
        db.createObjectStore("transactions", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); dbPromise = null; };
      db.onclose = () => { dbPromise = null; };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
};

const loadWalletBalance = async (): Promise<number> => {
  try {
    const db = await initWalletDB();
    return new Promise((resolve) => {
      const tx = db.transaction(SHARED_STORE, "readonly");
      const req = tx.objectStore(SHARED_STORE).get("user_data");
      req.onsuccess = () => {
        if (req.result && typeof req.result.balance === "number") {
          resolve(req.result.balance);
        } else resolve(DEFAULT_BALANCE);
      };
      req.onerror = () => resolve(DEFAULT_BALANCE);
    });
  } catch {
    return DEFAULT_BALANCE;
  }
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
        const next = Math.max(0, current + delta);
        const putReq = store.put({ ...(data || {}), balance: next }, "user_data");
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("Wallet update failed", e);
  }
};

// Records a gift send into the shared transactions store (type: 'coin')
const recordGiftTransaction = async (title: string, amount: number): Promise<void> => {
  try {
    const db = await initWalletDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction("transactions", "readwrite");
      const store = tx.objectStore("transactions");

      const now = new Date();
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const record = {
        title,
        amount,
        date: dateStr,
        timestamp: now.getTime(),
        type: "coin",
      };

      const req = store.add(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("Failed to record gift transaction", e);
  }
};

const SolidMicIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.39-.9.88 0 2.76-2.24 5-5 5s-5-2.24-5-5c0-.49-.41-.88-.9-.88s-.9.39-.9.88c0 3.66 2.85 6.66 6.4 7.08V22h1.8v-2.92c3.55-.42 6.4-3.42 6.4-7.08 0-.49-.41-.88-.9-.88z" />
  </svg>
);

const SolidUserIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

export interface Gift {
  id: number;
  name: string;
  coins: number;
  image: string;
  video?: string;
  videoStyle?: "fade" | "pure";
  noMask?: boolean;
  sideFade?: boolean;
}

interface Seat {
  number: number;
  isOccupied: boolean;
  user?: { name: string; image: string; accountId: string };
}

export default function GiftPicker({
  onClose,
  seats = [],
  onSend,
  roomId,
  currentUserAccountId,
}: {
  onClose: () => void;
  seats?: Seat[];
  onSend?: (value: number) => void;
  roomId?: string;
  currentUserAccountId?: string;
}) {
  const [activeTab, setActiveTab] = useState("Hot");
  const [selectedMultiplier, setSelectedMultiplier] = useState("1×");
  const [showMultipliers, setShowMultipliers] = useState(false);
  const [selectedGift, setSelectedGift] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [sending, setSending] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<
    { src: string; style: "fade" | "pure" } | null
  >(null);

  const sheetRef = useRef<HTMLDivElement>(null);
  const [showTargetMenu, setShowTargetMenu] = useState(false);
  const targetMenuRef = useRef<HTMLDivElement>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [selectionLabel, setSelectionLabel] = useState<"All" | "All room">("All");
  const videoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabs = ["Hot", "Lucky", "Luxury", "Event"];
  const multipliers = ["1×", "10×", "299×", "599×", "999×"];

  const hotGifts: Gift[] = [
    {
      id: 1,
      name: "Teddy",
      coins: 70000,
      image: "/IMG_20260922_142150.jpg",
      video: "/VID_20260921_011932.mp4",
      videoStyle: "fade",
    },
    {
      id: 2,
      name: "Autumn's Embrace ",
      coins: 54900,
      image: "/IMG_20260922_182259.png",
      video: "/gemini_generated_video_89e836bd~2.mp4",
      videoStyle: "pure",
      noMask: true,
    },
    {
      id: 3,
      name: "Arab King",
      coins: 500000,
      image: "/image_d9df9625~2.jpg",
      video: "/gemini_generated_video_17e19680~2.mp4",
      videoStyle: "fade",
      sideFade: true,
    },
  ];

  const luckyGifts: Gift[] = [
    { id: 101, name: "Kiss", coins: 1999, image: "/IMG_20260906_000443.png" },
    { id: 102, name: "Nut", coins: 3999, image: "/IMG_20260906_000508.png" },
    { id: 103, name: "Mahjong", coins: 5999, image: "/IMG_20260906_000521.png" },
    { id: 104, name: "Clover", coins: 4250, image: "/IMG_20260906_000541.png" },
    { id: 105, name: "Charm", coins: 7000, image: "/IMG_20260906_000624.png" },
    { id: 106, name: "Bouquet", coins: 10999, image: "/IMG_20260906_000643.png" },
    { id: 107, name: "Leaves", coins: 6799, image: "/IMG_20260906_000713.png" },
    { id: 108, name: "Crystal", coins: 2999, image: "/IMG_20260906_000756.png" },
    { id: 109, name: "Candy", coins: 15499, image: "/IMG_20260906_000814.png" },
    { id: 110, name: "Pop", coins: 4000, image: "/IMG_20260906_000832.png" },
    { id: 111, name: "Scarecrow", coins: 7500, image: "/IMG_20260906_000850.png" },
  ];

  const currentGifts: Gift[] =
    activeTab === "Lucky" ? luckyGifts : activeTab === "Hot" ? hotGifts : [];

  useEffect(() => {
    let alive = true;
    const fetchBal = async () => {
      const b = await loadWalletBalance();
      if (alive) setWalletBalance(b);
    };
    fetchBal();
    const id = setInterval(fetchBal, 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (playingVideo) return;
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, playingVideo]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (targetMenuRef.current && !targetMenuRef.current.contains(e.target as Node)) {
        setShowTargetMenu(false);
      }
    };
    if (showTargetMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTargetMenu]);

  // cleanup video timeout on unmount
  useEffect(() => {
    return () => {
      if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current);
    };
  }, []);

  const parseMultiplier = (m: string) => parseInt(m.replace("×", ""), 10) || 1;
  const selectedGiftObj = currentGifts.find((g) => g.id === selectedGift);
  const totalCost = selectedGiftObj
    ? selectedGiftObj.coins * parseMultiplier(selectedMultiplier)
    : 0;
  const recipientIds = selectedTargets.length
    ? selectedTargets
    : seats
        .filter((s) => s.isOccupied && s.user && s.user.accountId !== currentUserAccountId)
        .map((s) => s.user!.accountId);
  const recipientCount = recipientIds.length;
  const totalSendCost = totalCost * Math.max(1, recipientCount);
  const canAfford = totalCost > 0 && recipientCount > 0 && totalSendCost <= walletBalance;

  const finishVideo = () => {
    if (videoTimeoutRef.current) {
      clearTimeout(videoTimeoutRef.current);
      videoTimeoutRef.current = null;
    }
    setPlayingVideo(null);
    setSending(false);
    onClose();
  };

  const handleSend = async () => {
    if (!selectedGiftObj || sending) return;
    if (!canAfford) return;
    setSending(true);
    setWalletBalance((p) => Math.max(0, p - totalSendCost));
    await updateWalletBalance(-totalSendCost);
    await recordGiftTransaction(selectedGiftObj.name, -totalSendCost);

    if (roomId && currentUserAccountId && recipientIds.length > 0) {
      socket.emit("coin_transfer", {
        roomId: String(roomId),
        senderId: String(currentUserAccountId),
        recipientIds: recipientIds.map(String),
        amount: totalCost,
        giftName: selectedGiftObj.name,
      });
    }

    if (onSend) {
      onSend(totalCost);
    }

    if (selectedGiftObj.video) {
      setPlayingVideo({
        src: selectedGiftObj.video,
        style: selectedGiftObj.videoStyle ?? "fade",
      });
      // 🔥 safety fallback: agar video kisi wajah se start/end na ho, 10s me close
      if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current);
      videoTimeoutRef.current = setTimeout(() => {
        finishVideo();
      }, 10000);
    } else {
      setSending(false);
      onClose();
    }
  };

  const handleAllOnMic = () => {
    const micUsers = seats
      .filter((s) => s.isOccupied && s.user)
      .map((s) => s.user!.accountId);
    setSelectedTargets(micUsers);
    setSelectionLabel("All");
    setShowTargetMenu(false);
  };

  const handleAllInRoom = () => {
    setSelectedTargets([]);
    setSelectionLabel("All room");
    setShowTargetMenu(false);
  };

  const handleAvatarClick = (accountId: string) => {
    setSelectedTargets((prev) => {
      if (prev.includes(accountId)) return prev.filter((id) => id !== accountId);
      return [...prev, accountId];
    });
    if (selectionLabel === "All room") setSelectionLabel("All");
  };

  // ============================================================
  // 🎬 VIDEO
  // ============================================================
  if (playingVideo) {
    const isFade = playingVideo.style === "fade";
    const isArabKing = playingVideo.src.includes("17e19680");

    const teddyVideoMask =
      "linear-gradient(to bottom, transparent 0%, transparent 18%, black 26%, black 70%, transparent 83%, transparent 100%)";

    const kingVideoMask =
      "linear-gradient(to bottom, transparent 0%, transparent 10%, black 16%, black 85%, transparent 94%, transparent 100%)";

    return (
      <>
        {!isFade && (
          <svg style={{ width: 0, height: 0, position: "absolute" }} aria-hidden="true">
            <filter id="remove-black" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1.5 1.5 1.5 0 -0.2"
              />
            </filter>
          </svg>
        )}

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          style={{ background: "transparent" }}
        >
          <video
            src={playingVideo.src}
            autoPlay
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            onLoadedData={() => setSending(false)}
            onPlaying={() => setSending(false)}
            onEnded={finishVideo}
            onError={finishVideo}
            className={
              isFade
                ? "w-full h-full object-cover"
                : "w-auto h-auto max-w-[72vw] max-h-[72vh] object-contain"
            }
            style={
              isFade
                ? isArabKing
                  ? {
                      WebkitMaskImage: kingVideoMask,
                      maskImage: kingVideoMask,
                      transform: "translateY(2%)",
                      transformOrigin: "center",
                    }
                  : {
                      WebkitMaskImage: teddyVideoMask,
                      maskImage: teddyVideoMask,
                    }
                : {
                    mixBlendMode: "screen",
                    backgroundColor: "transparent",
                    filter: "url(#remove-black)",
                  }
            }
          />
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <filter id="removeWhite" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -0.333 -0.333 -0.333 1 0"
          />
        </filter>
      </svg>

      <style jsx>{`
        .main-container { background: rgba(0, 0, 0, 0.95); }
        .gift-item {
          background: transparent;
          border: 2px solid transparent;
          transition: all 0.2s ease;
          padding: 6px 2px;
          border-radius: 8px;
          width: 100%;
        }
        .gift-item.selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }
        .coin-image {
          filter: url(#removeWhite) drop-shadow(0 0 4px rgba(255, 215, 0, 0.4));
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        ref={sheetRef}
        className="main-container h-[50vh] w-full max-w-md mx-auto text-white flex flex-col rounded-t-md border-t border-white/10 shadow-2xl relative px-4 pt-3 pb-2"
      >
        <div className="absolute top-3 right-4 z-[60]" ref={targetMenuRef}>
          <div className="relative">
            <button
              onClick={() => setShowTargetMenu(!showTargetMenu)}
              className="flex items-center gap-1.5 text-white px-2 py-1 rounded-[6px] shadow-sm transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
            >
              {selectionLabel === "All" ? (
                <SolidMicIcon className="w-3.5 h-3.5" />
              ) : (
                <SolidUserIcon className="w-3.5 h-3.5" />
              )}
              <span className="text-[13px] font-medium leading-none whitespace-nowrap">
                {selectionLabel}
              </span>
              <div className="w-[1px] h-3.5 bg-white/50 mx-0.5" />
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-white" />
            </button>

            {showTargetMenu && (
              <div className="absolute top-full right-0 mt-2 bg-[#0c1418] rounded-md shadow-2xl border border-white/5 w-[140px] z-[70]">
                <div className="absolute -top-1.5 right-4 w-3 h-3 bg-[#0c1418] border-t border-l border-white/5 rotate-45" />
                <div className="relative z-10 flex flex-col py-1.5">
                  <button
                    onClick={handleAllOnMic}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-white/5 transition-colors text-[#3b82f6] w-full text-left"
                  >
                    <SolidMicIcon className="w-4 h-4" />
                    <span className="text-[14px] tracking-wide font-medium">
                      All on mic
                    </span>
                  </button>
                  <button
                    onClick={handleAllInRoom}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-white/5 transition-colors text-white w-full text-left"
                  >
                    <SolidUserIcon className="w-4 h-4" />
                    <span className="text-[14px] tracking-wide font-medium">
                      All in room
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pr-24 pt-0 pb-2 -mt-2 min-h-[52px]">
          {seats
            .filter((seat) => seat.isOccupied && seat.user)
            .map((seat) => {
              const isSelected = selectedTargets.includes(seat.user!.accountId);
              return (
                <div
                  key={seat.user!.accountId}
                  onClick={() => handleAvatarClick(seat.user!.accountId)}
                  className={`relative w-11 h-11 flex-shrink-0 rounded-full cursor-pointer transition-all duration-200 border-[2.5px] ${
                    isSelected ? "border-[#3b82f6]" : "border-transparent"
                  }`}
                >
                  <Image
                    src={seat.user!.image || "/default-avatar.png"}
                    alt={seat.user!.name}
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
              );
            })}
        </div>

        <div className="w-full h-px bg-white/10 mb-1 -mt-2" />

        <div className="flex items-center gap-4 py-2 px-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[14px] font-semibold transition-all ${
                  isActive
                    ? "text-white font-bold scale-105"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto py-2 scrollbar-none">
          <div className="grid grid-cols-4 gap-1 content-start">
            {currentGifts.map((gift) => (
              <div
                key={gift.id}
                onClick={() => setSelectedGift(gift.id)}
                className={`gift-item flex flex-col items-center justify-center transition cursor-pointer active:scale-95 ${
                  selectedGift === gift.id ? "selected" : ""
                }`}
              >
                <div
                  className={`relative mb-1 overflow-hidden ${
                    gift.noMask ? "w-15 h-15" : "w-16 h-16"
                  } ${gift.sideFade ? "rounded-xl" : ""}`}
                  style={
                    activeTab === "Hot" && !gift.noMask
                      ? gift.sideFade
                        ? {
                            WebkitMaskImage:
                              "radial-gradient(ellipse 50% 50% at center, black 35%, transparent 100%)",
                            maskImage:
                              "radial-gradient(ellipse 50% 50% at center, black 35%, transparent 100%)",
                          }
                        : {
                            WebkitMaskImage:
                              "radial-gradient(circle, black 40%, transparent 80%)",
                            maskImage:
                              "radial-gradient(circle, black 40%, transparent 80%)",
                          }
                      : {}
                  }
                >
                  <Image
                    src={gift.image}
                    alt={gift.name}
                    fill
                    className={`${
                      gift.noMask ? "object-contain" : "object-cover"
                    } ${gift.sideFade ? "rounded-xl" : ""}`}
                    sizes={gift.noMask ? "44px" : "64px"}
                    priority={gift.id === 1}
                  />
                </div>

                <span className="text-gray-300 font-medium text-[10px] truncate w-full text-center">
                  {gift.name}
                </span>

                <span className="text-yellow-400 flex items-center gap-0.5 mt-0.5 text-[9px]">
                  <div className="w-2.5 h-2.5 relative overflow-hidden rounded-full">
                    <Image
                      src="/file_00000000e56882119c217d508b6733dc.png"
                      alt="Coins"
                      fill
                      className="coin-image object-cover"
                      sizes="10px"
                    />
                  </div>
                  {gift.coins.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 relative">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 relative overflow-hidden rounded-full">
              <Image
                src="/file_00000000e56882119c217d508b6733dc.png"
                alt="Coins"
                fill
                className="coin-image object-cover"
                sizes="20px"
              />
            </div>
            <span className="text-[11px] font-bold text-yellow-300 tracking-wide">
              {walletBalance.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 relative">
            {showMultipliers && (
              <div className="absolute bottom-10 right-14 rounded-md p-1 shadow-xl flex flex-col gap-1 z-50 bg-zinc-900 border border-white/10">
                {multipliers.map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setSelectedMultiplier(num);
                      setShowMultipliers(false);
                    }}
                    className={`px-2.5 py-0.5 text-xs rounded-md text-center font-medium transition ${
                      selectedMultiplier === num
                        ? "bg-blue-600 text-white"
                        : "hover:bg-white/10 text-gray-300"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowMultipliers(!showMultipliers)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-[#1f2937] border border-white/15 active:scale-95 transition-transform"
            >
              <span>{selectedMultiplier}</span>
              <ChevronUp
                className={`w-3 h-3 transition-transform ${
                  showMultipliers ? "rotate-180" : ""
                }`}
              />
            </button>

            <button
              onClick={handleSend}
              disabled={!selectedGift || !canAfford || sending}
              className="text-white font-bold text-xs px-5 py-1.5 rounded-full transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                boxShadow: "0 2px 15px rgba(59,130,246,0.35)",
                opacity: sending ? 0.85 : 1,
                cursor: !selectedGift || !canAfford || sending ? "not-allowed" : "pointer",
              }}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
                                                                                                                                                                                                                    }
