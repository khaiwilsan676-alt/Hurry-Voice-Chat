"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronUp } from "lucide-react";
import Image from "next/image";
import socket from "../src/lib/socket";

const SHARED_DB = "FruitPartyDB";
const SHARED_STORE = "GameState";
const DEFAULT_BALANCE = 82927;

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
  open = true,
  onClose,
  seats = [],
  onSend,
  roomId,
  currentUserAccountId,
  currentUserName = "User",
  currentUserImage = "/default-avatar.png",
  roomUsers = [],
}: {
  open?: boolean;
  onClose: () => void;
  seats?: Seat[];
  onSend?: (value: number) => void;
  roomId?: string;
  currentUserAccountId?: string;
  currentUserName?: string;
  currentUserImage?: string;
  roomUsers?: Array<{ accountId: string; name: string; image: string }>;
}) {
  const [activeTab, setActiveTab] = useState("Hot");
  const [selectedMultiplier, setSelectedMultiplier] = useState("1×");
  const [showMultipliers, setShowMultipliers] = useState(false);
  const [selectedGift, setSelectedGift] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const originalEmit = socket.emit.bind(socket);
    const patchedEmit = ((event: string, ...args: any[]) => {
      if (event !== "coin_transfer" || !args[0]) return originalEmit(event, ...args);
      const data = { ...args[0] };
      const luckyImages: Record<string, string> = {
        Kiss: "/IMG_20260906_000443.png", Nut: "/IMG_20260906_000508.png",
        Mahjong: "/IMG_20260906_000521.png", Clover: "/IMG_20260906_000541.png",
        Charm: "/IMG_20260906_000624.png", Bouquet: "/IMG_20260906_000643.png",
        Leaves: "/IMG_20260906_000713.png", Crystal: "/IMG_20260906_000756.png",
        Candy: "/IMG_20260906_000814.png", Pop: "/IMG_20260906_000832.png",
        Scarecrow: "/IMG_20260906_000850.png",
      };
      const image = luckyImages[String(data.giftName || "")];
      if (!image) return originalEmit(event, ...args);
      const amount = Number(data.amount);
      const diamondAmount = Number.isFinite(amount) && amount > 0 ? Math.floor(amount * 0.1) : 0;
      originalEmit("coin_transfer", { ...data, luckyGift: true, luckyImage: image, diamondAmount });
      const recipientIds = new Set(Array.isArray(data.recipientIds) ? data.recipientIds.map(String) : []);
      for (const seat of seats) {
        const targetId = String(seat?.user?.accountId || "");
        if (!seat?.isOccupied || !targetId || !recipientIds.has(targetId)) continue;
        const luckyEvent = {
          eventId: `lucky-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          roomId: String(data.roomId || ""),
          userId: String(data.senderId || ""),
          action: "lucky_image",
          seatNumber: Number(seat.number),
          src: image,
          timestamp: Date.now(),
          duration: 1100,
          luckyGift: true,
          targetName: String(seat.user?.name || ""),
          user: { name: "Lucky Gift", image, accountId: targetId },
        };
        window.dispatchEvent(new CustomEvent("hurry:lucky-image", { detail: luckyEvent }));
        originalEmit("room_seat_action", luckyEvent);
      }
      return socket;
    }) as typeof socket.emit;
    (socket as any).emit = patchedEmit;
    return () => { (socket as any).emit = originalEmit; };
  }, [seats]);

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
      name: "Autumn's Embrace",
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
      if (open && sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, playingVideo, open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (targetMenuRef.current && !targetMenuRef.current.contains(e.target as Node)) {
        setShowTargetMenu(false);
      }
    };
    if (showTargetMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTargetMenu]);

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
    : roomUsers.length > 0
      ? roomUsers.map((u) => u.accountId)
      : seats
          .filter((s) => s.isOccupied && s.user)
          .map((s) => s.user!.accountId);
  const recipientCount = recipientIds.length;
  const recipientUsers = recipientIds
    .map((id) => roomUsers.find((u) => String(u.accountId) === String(id)) || seats.find((s) => String(s.user?.accountId || "") === String(id))?.user)
    .filter(Boolean) as Array<{ accountId: string; name: string; image: string }>;
  const firstRecipient = recipientUsers[0];
  const totalSendCost = totalCost * Math.max(1, recipientCount);
  const canAfford = totalCost > 0 && recipientCount > 0 && totalSendCost <= walletBalance;
  const isLuckyGiftTab = activeTab === "Lucky";

  const finishVideo = () => {
    if (videoTimeoutRef.current) {
      clearTimeout(videoTimeoutRef.current);
      videoTimeoutRef.current = null;
    }
    setPlayingVideo(null);
    setSending(false);
    onClose();
  };

  useEffect(() => {
    const handleRemoteGiftVideo = (data: any = {}) => {
      if (!data?.roomId || String(data.roomId) !== String(roomId)) return;
      if (String(data.senderId || "") === String(currentUserAccountId || "")) return;
      if (!data.video) return;
      setPlayingVideo({ src: String(data.video), style: data.videoStyle === "fade" ? "fade" : "pure" });
      setSending(false);
      if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current);
      videoTimeoutRef.current = setTimeout(finishVideo, 15000);
    };
    socket.on("gift_video_play", handleRemoteGiftVideo);
    return () => socket.off("gift_video_play", handleRemoteGiftVideo);
  }, [roomId, currentUserAccountId]);

  const handleSend = async () => {
    if (!selectedGiftObj || sending) return;
    if (!canAfford) return;
    setSending(true);

    let luckyReturnAmount = 0;
    let luckyReturnPercent = 0;
    let netDeductionCost = totalSendCost;
    let winTimes = 0;

    if (isLuckyGiftTab) {
      const luck = Math.random();
      if (luck > 0.96) winTimes = 15;
      else if (luck > 0.90) winTimes = 10;
      else if (luck > 0.82) winTimes = 5;
      else if (luck > 0.65) winTimes = 2;
      else winTimes = 0;

      luckyReturnAmount = winTimes > 0 ? (totalSendCost * winTimes) : 0;
      luckyReturnPercent = winTimes > 0 ? winTimes : 0;
      netDeductionCost = totalSendCost - luckyReturnAmount;
    }

    setWalletBalance((p) => Math.max(0, p - netDeductionCost));
    await updateWalletBalance(-netDeductionCost);
    await recordGiftTransaction(selectedGiftObj.name, -netDeductionCost);

    if (roomId && currentUserAccountId && recipientIds.length > 0) {
      socket.emit("coin_transfer", {
        roomId: String(roomId),
        senderId: String(currentUserAccountId),
        recipientIds: recipientIds.map(String),
        amount: totalCost,
        giftName: selectedGiftObj.name,
        giftType: activeTab,
        senderName: currentUserName,
        senderImage: currentUserImage,
        recipientName: firstRecipient?.name || "User",
        recipientImage: firstRecipient?.image || "/default-avatar.png",
        multiplier: parseMultiplier(selectedMultiplier),
        luckyGift: isLuckyGiftTab,
        luckyReturnAmount,
        luckyReturnPercent,
        luckyImage: selectedGiftObj.image,
        winTimes
      });

      if (isLuckyGiftTab) {
        window.dispatchEvent(new CustomEvent("hurry:lucky-slider", {
          detail: {
            roomId: String(roomId),
            senderId: String(currentUserAccountId),
            senderName: currentUserName,
            senderImage: currentUserImage,
            recipientName: firstRecipient?.name || "User",
            giftImage: selectedGiftObj.image,
            multiplier: parseMultiplier(selectedMultiplier),
            luckyGift: true,
            luckyReturnAmount: luckyReturnAmount,
            winTimes: winTimes
          }
        }));
      }

      if (selectedGiftObj.video && !isLuckyGiftTab) {
        socket.emit("gift_video_play", {
          roomId: String(roomId),
          senderId: String(currentUserAccountId),
          giftName: selectedGiftObj.name,
          video: String(selectedGiftObj.video),
          videoStyle: selectedGiftObj.videoStyle ?? "fade",
          timestamp: Date.now(),
        });
      }
    }

    if (onSend) {
      onSend(totalCost);
    }

    if (isLuckyGiftTab) {
      window.dispatchEvent(new CustomEvent("hurry:lucky-combo", {
        detail: {
          roomId: String(roomId || ""),
          senderId: String(currentUserAccountId || ""),
          senderName: currentUserName,
          senderImage: currentUserImage,
          recipientIds: recipientIds.map(String),
          recipientName: firstRecipient?.name || "User",
          recipientImage: firstRecipient?.image || "/default-avatar.png",
          giftName: selectedGiftObj.name,
          giftImage: selectedGiftObj.image,
          giftCoins: selectedGiftObj.coins,
          initialMultiplier: parseMultiplier(selectedMultiplier),
        },
      }));
      setSending(false);
      onClose();
      return;
    }

    if (selectedGiftObj.video) {
      setPlayingVideo({
        src: selectedGiftObj.video,
        style: selectedGiftObj.videoStyle ?? "fade",
      });
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
            ref={(el) => {
              if (el) {
                el.controls = false;
                el.removeAttribute("controls");
                el.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback");
                el.setAttribute("disablePictureInPicture", "");
                el.setAttribute("disableRemotePlayback", "");
                el.play().catch(() => {});
              }
            }}
            src={playingVideo.src}
            autoPlay
            playsInline
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            poster={playingVideo.src.includes("17e19680") ? "/image_d9df9625~2.jpg" : "/IMG_20260922_142150.jpg"}
            onLoadedData={(e) => {
              setSending(false);
              e.currentTarget.play().catch(() => {});
            }}
            onCanPlay={(e) => {
              e.currentTarget.play().catch(() => {});
            }}
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
    <div>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ display: open ? "flex" : "none" }}
      >
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <filter id="removeWhite" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -0.333 -0.333 -0.333 1 0"
          />
        </filter>
      </svg>

      <style>{`
        video::-webkit-media-controls,
        video::-webkit-media-controls-enclosure,
        video::-webkit-media-controls-panel,
        video::-webkit-media-controls-overlay-play-button,
        video::-webkit-media-controls-start-playback-button { display: none !important; opacity: 0 !important; }
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
          filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.4));
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
                    <span className="text-[14px] tracking-wide font-medium">All on mic</span>
                  </button>
                  <button
                    onClick={handleAllInRoom}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-white/5 transition-colors text-white w-full text-left"
                  >
                    <SolidUserIcon className="w-4 h-4" />
                    <span className="text-[14px] tracking-wide font-medium">All in room</span>
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
                            WebkitMaskImage: "radial-gradient(ellipse 50% 50% at center, black 35%, transparent 100%)",
                            maskImage: "radial-gradient(ellipse 50% 50% at center, black 35%, transparent 100%)",
                          }
                        : {
                            WebkitMaskImage: "radial-gradient(circle, black 40%, transparent 80%)",
                            maskImage: "radial-gradient(circle, black 40%, transparent 80%)",
                          }
                      : {}
                  }
                >
                  <Image
                    src={gift.image}
                    alt={gift.name}
                    fill
                    className={`${gift.noMask ? "object-contain" : "object-cover"} ${gift.sideFade ? "rounded-xl" : ""}`}
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
              <div className="absolute bottom-10 right-0 rounded-md p-1 shadow-xl flex flex-col gap-1 z-50 bg-zinc-900 border border-white/10">
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

            {/* ✅ Divider line hata diya bss */}
            <div className="flex items-center rounded-full border border-[#3b82f6] p-[2px] bg-transparent">
              {/* Multiplier Side */}
              <button
                onClick={() => setShowMultipliers(!showMultipliers)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-l-full text-xs font-bold text-white bg-transparent transition-transform"
              >
                <span>{selectedMultiplier}</span>
                <ChevronUp className={`w-3 h-3 transition-transform ${showMultipliers ? "rotate-180" : ""}`} />
              </button>

              {/* Send Button Side */}
              <button
                onClick={handleSend}
                disabled={!selectedGift || !canAfford || sending}
                className="text-white font-bold text-xs px-6 py-1.5 rounded-full transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  boxShadow: "0 2px 10px rgba(59,130,246,0.35)",
                  opacity: sending ? 0.85 : 1,
                  cursor: !selectedGift || !canAfford || sending ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "..." : "Send"}
              </button>
            </div>

          </div>
        </div>
       </div>
      </div>
      <LuckyGiftNotificationSlider roomId={String(roomId || "")} />
      <BigWinOrb roomId={String(roomId || "")} />
      <LuckyComboButton />
    </div>
  );
}

// ==========================================================
// 🎇 BIG WIN ORB (Video version) — Sirf 10x ya usse zyada pe
// ==========================================================
export function BigWinOrb({ roomId }: { roomId: string }) {
  const [orbData, setOrbData] = useState<{ amount: number, times: number, avatar: string, id: string, isExiting: boolean } | null>(null);

  useEffect(() => {
    const handleOrb = (e: any) => {
      const data = e.detail;
      if (String(data.roomId || "") !== String(roomId || "")) return;
      if (data.luckyGift !== true) return;
      
      const winTimes = Number(data.winTimes) || 0;
      const winAmount = Number(data.luckyReturnAmount) || 0;

      if (winAmount > 0 && winTimes >= 10) {
        const newId = `orb-${Date.now()}-${Math.random()}`;
        setOrbData({
          amount: winAmount,
          times: winTimes,
          avatar: data.senderImage || "/default-avatar.png",
          id: newId,
          isExiting: false
        });

        setTimeout(() => {
          setOrbData(prev => (prev?.id === newId ? { ...prev, isExiting: true } : prev));
        }, 3500);
      }
    };

    window.addEventListener("hurry:lucky-slider", handleOrb);
    return () => window.removeEventListener("hurry:lucky-slider", handleOrb);
  }, [roomId]);

  useEffect(() => {
    if (orbData?.isExiting) {
      const t = setTimeout(() => setOrbData(null), 600);
      return () => clearTimeout(t);
    }
  }, [orbData?.isExiting]);

  if (!orbData) return null;

  return (
    <>
      <style>{`
        @keyframes orbPopIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes orbBlastOut {
          0% { transform: scale(1); opacity: 1; filter: brightness(1); }
          30% { transform: scale(0.85); opacity: 1; filter: brightness(1.2); }
          60% { transform: scale(1.5); opacity: 1; filter: brightness(2); }
          100% { transform: scale(2.8); opacity: 0; filter: brightness(3); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: "20vh",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2147483005,
          pointerEvents: "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <div
          key={orbData.id}
          style={{
            position: "relative",
            width: 220,
            height: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            animation: orbData.isExiting 
              ? "orbBlastOut 0.6s ease-out forwards" 
              : "orbPopIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
          }}
        >
          <video
            key={orbData.id}
            src="/VID_20260927_033315_204_bsl.mp4"
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              mixBlendMode: "screen",
              backgroundColor: "transparent",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          <div style={{ position: "absolute", top: 15, zIndex: 5, width: 44, height: 44, borderRadius: "50%", border: "2px solid #fff", overflow: "hidden", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
            <img src={orbData.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          <div style={{ zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", marginTop: 25 }}>
            <span style={{ color: "#ffe800", fontSize: 22, fontWeight: "900", textShadow: "0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,232,0,0.8)", letterSpacing: "1px" }}>
              Win {orbData.amount}
            </span>
            <span style={{ color: "#00ffcc", fontSize: 16, fontWeight: "800", textShadow: "0 2px 4px rgba(0,0,0,0.8)", marginTop: 4 }}>
              {orbData.times} Times
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ==========================================================
// 🎲 Lucky Gift Notification Slider
// ==========================================================
interface LuckyNotice {
  id: string;
  senderId: string;
  senderName: string;
  recipientName: string;
  senderImage: string;
  giftImage: string;
  multiplier: number;
  totalWinAmount: number;
  isExiting: boolean;
}

export function LuckyGiftNotificationSlider({ roomId }: { roomId: string }) {
  const [notice, setNotice] = useState<LuckyNotice | null>(null);
  const [floatingWins, setFloatingWins] = useState<{id: string, amount: number, giftImage: string}[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const processNotice = (data: any = {}) => {
      if (String(data.roomId || "") !== String(roomId || "")) return;
      if (data.luckyGift !== true) return;

      const senderId = String(data.senderId || "");
      const senderName = String(data.senderName || "User");
      const recipientName = String(data.recipientName || "User");
      const senderImage = String(data.senderImage || "/default-avatar.png");
      const giftImage = String(data.luckyImage || data.giftImage || "");
      const multiplier = Math.max(1, Number(data.multiplier) || 1);
      const incomingWin = Math.floor(Number(data.luckyReturnAmount) || 0); 

      setNotice((prev) => {
        if (prev && prev.senderId === senderId && prev.giftImage === giftImage) {
          if (multiplier > prev.multiplier) {
            return { ...prev, multiplier, isExiting: false }; 
          }
          return { ...prev, isExiting: false }; 
        }
        return {
          id: `notify-${Date.now()}-${Math.random()}`,
          senderId,
          senderName,
          recipientName,
          senderImage,
          giftImage,
          multiplier,
          totalWinAmount: 0,
          isExiting: false
        };
      });

      if (incomingWin > 0) {
        const floatId = `float-${Date.now()}-${Math.random()}`;
        setFloatingWins(prev => [...prev, { id: floatId, amount: incomingWin, giftImage }]);

        setTimeout(() => {
          setNotice(currentNotice => {
            if (!currentNotice) return currentNotice;
            return { 
              ...currentNotice, 
              totalWinAmount: currentNotice.totalWinAmount + incomingWin 
            };
          });
        }, 600);

        setTimeout(() => {
          setFloatingWins(prev => prev.filter(f => f.id !== floatId));
        }, 1200);
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setNotice(prev => (prev ? { ...prev, isExiting: true } : null));
      }, 5500); 
    };

    socket.on("coin_transfer_received", processNotice);
    window.addEventListener("hurry:lucky-slider", (e: any) => processNotice(e.detail));

    const handleClose = () => {
      setNotice(prev => (prev ? { ...prev, isExiting: true } : null));
    };
    window.addEventListener("hurry:lucky-slider-close", handleClose);

    return () => {
      socket.off("coin_transfer_received", processNotice);
      window.removeEventListener("hurry:lucky-slider", (e: any) => processNotice(e.detail));
      window.removeEventListener("hurry:lucky-slider-close", handleClose);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [roomId]);

  useEffect(() => {
    if (notice?.isExiting) {
      const t = setTimeout(() => {
        setNotice(null);
        setFloatingWins([]);
      }, 400); 
      return () => clearTimeout(t);
    }
  }, [notice?.isExiting]);

  if (!notice) return null;

  return (
    <>
      <style>{`
        @keyframes noticeSlideIn {
          0% { transform: translate3d(115vw, 0, 0); opacity: 0; }
          100% { transform: translate3d(0, 0, 0); opacity: 1; }
        }
        @keyframes noticeSlideOut {
          0% { transform: translate3d(0, 0, 0); opacity: 1; }
          100% { transform: translate3d(-115vw, 0, 0); opacity: 0; }
        }
        @keyframes floatUpFade {
          0% { transform: translate(-50%, 0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -40px) scale(1.3); opacity: 0; }
        }
      `}</style>

      <div
        key={notice.id}
        style={{
          position: "fixed",
          left: 8,
          right: 8,
          bottom: "40vh", 
          zIndex: 2147483000,
          pointerEvents: "none",
          display: "flex",
          justifyContent: "center",
          animation: notice.isExiting 
            ? "noticeSlideOut 0.4s ease-in forwards" 
            : "noticeSlideIn 0.4s ease-out forwards",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "min(94vw, 420px)",
            height: 88,
            backgroundImage: "url('/file_000000006f008211bade0d2ed6277792.png')",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 9,
              top: "50%",
              transform: "translateY(-50%)",
              width: 52,
              height: 52,
              zIndex: 10,
            }}
          >
            <img
              src={notice.senderImage}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
                display: "block",
              }}
              draggable={false}
            />
            <img
              src="/file_00000000fc488211afad439cacecc7c5.png"
              alt=""
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "135%",
                height: "135%",
                maxWidth: "none",
                objectFit: "contain",
                pointerEvents: "none",
                zIndex: 20,
              }}
              draggable={false}
            />
          </div>

          <div
            style={{
              position: "absolute",
              left: 70, 
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              maxWidth: "75px", 
              zIndex: 10,
            }}
          >
            <span
              style={{
                color: "white",
                fontSize: 12,
                fontWeight: "bold",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.2
              }}
            >
              {notice.senderName}
            </span>
            <span
              style={{
                color: "#ffd700", 
                fontSize: 10,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.2
              }}
            >
              To {notice.recipientName}
            </span>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              zIndex: 10,
            }}
          >
            {notice.giftImage && (
              <img
                src={notice.giftImage}
                alt=""
                style={{
                  width: 42,
                  height: 42, 
                  objectFit: "contain",
                  display: "block",
                  opacity: 1
                }}
                draggable={false}
              />
            )}
            <span
              style={{
                color: "#fff",
                fontWeight: 800,
                fontSize: 22,
                textShadow: "0 2px 4px rgba(0,0,0,0.85)",
                lineHeight: 1,
              }}
            >
              ×{notice.multiplier}
            </span>
          </div>

          <div
            style={{
              position: "absolute",
              right: -8, 
              top: "50%",
              transform: "translateY(-50%)",
              width: 85,
              height: 85,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {floatingWins.map(fw => (
              <div
                key={fw.id}
                style={{
                  position: "absolute",
                  top: -15, 
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  animation: "floatUpFade 1.2s ease-out forwards",
                  zIndex: 20,
                  whiteSpace: "nowrap"
                }}
              >
                <img src={fw.giftImage} alt="" style={{width: 18, height: 18, objectFit: "contain", filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.8))"}} />
                <span
                  style={{
                    color: "#ffff00", 
                    fontWeight: "900",
                    fontSize: 18,
                    textShadow: "-1px -1px 0 #d9381e, 1px -1px 0 #d9381e, -1px 1px 0 #d9381e, 1px 1px 0 #d9381e, 0px 4px 6px rgba(0,0,0,0.8)", 
                  }}
                >
                  +{fw.amount}
                </span>
              </div>
            ))}

            <div
              style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <img
                  src="/file_00000000e56882119c217d508b6733dc.png"
                  alt="Coins"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  draggable={false}
                />
              </div>
              <span
                style={{
                  color: "#ffe800",
                  fontWeight: "900",
                  fontSize: 18,
                  textShadow: "-1px -1px 0 #7a0000, 1px -1px 0 #7a0000, -1px 1px 0 #7a0000, 1px 1px 0 #7a0000, 0px 3px 5px rgba(0,0,0,1)",
                  letterSpacing: "0.5px",
                  lineHeight: 1,
                }}
              >
                {notice.totalWinAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ==========================================================
// ⭕ COMBO BUTTON — Border patla (2px) aur andar, image ke jaisa
// ==========================================================
export function LuckyComboButton() {
  const [comboData, setComboData] = useState<any>(null);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleLuckyCombo = (e: any) => {
      const data = e.detail;
      setComboData(data);
      setComboMultiplier(data.initialMultiplier || 1);
      startTimer();
    };

    window.addEventListener("hurry:lucky-combo", handleLuckyCombo);
    return () => window.removeEventListener("hurry:lucky-combo", handleLuckyCombo);
  }, []);

  const startTimer = () => {
    setTimeLeft(5);
    if (countdownRef.current) clearInterval(countdownRef.current);

    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.dispatchEvent(new CustomEvent("hurry:lucky-slider-close"));
          setComboData(null);
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleComboClick = async () => {
    if (!comboData || busy) return;
    setBusy(true);

    startTimer();

    const nextMultiplier = comboMultiplier + 1;
    setComboMultiplier(nextMultiplier);

    const baseCost = comboData.giftCoins;
    const recipientCount = comboData.recipientIds.length;
    const totalCost = baseCost * recipientCount;

    let luckyReturnAmount = 0;
    let luckyReturnPercent = 0;
    let winTimes = 0;

    const luck = Math.random();
    if (luck > 0.96) winTimes = 15;
    else if (luck > 0.90) winTimes = 10;
    else if (luck > 0.82) winTimes = 5;
    else if (luck > 0.65) winTimes = 2;
    else winTimes = 0;
    
    luckyReturnAmount = winTimes > 0 ? (totalCost * winTimes) : 0;
    luckyReturnPercent = winTimes > 0 ? winTimes : 0;
    const finalDeductionCost = totalCost - luckyReturnAmount;

    const bal = await loadWalletBalance();
    if (bal < finalDeductionCost) {
      setBusy(false);
      setComboData(null);
      return;
    }

    await updateWalletBalance(-finalDeductionCost);
    await recordGiftTransaction(comboData.giftName, -finalDeductionCost);

    socket.emit("coin_transfer", {
      roomId: comboData.roomId,
      senderId: comboData.senderId,
      recipientIds: comboData.recipientIds,
      amount: totalCost,
      giftName: comboData.giftName,
      giftType: "Lucky",
      senderName: comboData.senderName,
      senderImage: comboData.senderImage,
      recipientName: comboData.recipientName,
      recipientImage: comboData.recipientImage,
      multiplier: nextMultiplier,
      luckyGift: true,
      luckyReturnAmount,
      luckyReturnPercent,
      luckyImage: comboData.giftImage,
      winTimes
    });

    window.dispatchEvent(new CustomEvent("hurry:lucky-slider", {
      detail: {
        roomId: comboData.roomId,
        senderId: comboData.senderId,
        senderName: comboData.senderName,
        senderImage: comboData.senderImage,
        recipientName: comboData.recipientName,
        giftImage: comboData.giftImage,
        multiplier: nextMultiplier,
        luckyGift: true,
        luckyReturnAmount: luckyReturnAmount,
        winTimes: winTimes
      }
    }));

    setBusy(false);
  };

  if (!comboData) return null;

  return (
    <>
      <style>{`
        @keyframes comboPulseRed {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .combo-wave-red {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 51, 102, 0.6) 0%, rgba(255, 51, 102, 0.1) 100%);
          animation: comboPulseRed 1.8s infinite cubic-bezier(0.2, 0.8, 0.4, 1);
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          bottom: "12vh",
          right: "5vw",
          zIndex: 2147483001,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
          
          <div className="combo-wave-red" style={{ animationDelay: "0s" }} />
          <div className="combo-wave-red" style={{ animationDelay: "0.6s" }} />

          <button
            onClick={handleComboClick}
            className="active:scale-95 transition-transform"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72, 
              height: 72,
              borderRadius: "50%",
              border: "none",
              outline: "none",
              cursor: "pointer",
              background: "radial-gradient(circle at center, #ff4d79 0%, #ff1a4d 100%)",
              boxShadow: "0 4px 20px rgba(255, 26, 77, 0.7)",
              zIndex: 2,
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 16,
                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                letterSpacing: "0.5px",
                zIndex: 3,
              }}
            >
              Combo
            </span>

            {/* ✅ Border patla (2px) aur andar — image ke jaisa */}
            <svg
              viewBox="0 0 72 72"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                transform: "rotate(-90deg)",
                pointerEvents: "none",
                zIndex: 3,
                padding: 6,
                boxSizing: "border-box",
              }}
            >
              <circle
                cx="36"
                cy="36"
                r="32"
                fill="none"
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth="1.5"
              />
              <circle
                cx="36"
                cy="36"
                r="32"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="201.06"
                strokeDashoffset={201.06 - (201.06 * timeLeft) / 5}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}


// ==========================================================
// EMBEDDED LUCKY GIFT FLY / TARGET ANIMATION
// ==========================================================
type LuckyGiftAnimationProps = { roomId: string };

function findTargetAvatar(data: any): HTMLImageElement | null {
  const seatNumber = Number(data?.seatNumber || 0);
  const accountId = String(data?.user?.accountId || "");
  const name = String(data?.targetName || data?.user?.name || "");

  if (Number.isFinite(seatNumber) && seatNumber > 0) {
    const el = document.querySelector(`img[data-hurry-seat="${seatNumber}"]`) as HTMLImageElement | null;
    if (el) return el;
  }

  if (accountId) {
    const els = document.querySelectorAll("img[data-hurry-account]");
    for (const el of Array.from(els)) {
      if (String(el.getAttribute("data-hurry-account") || "") === accountId) {
        return el as HTMLImageElement;
      }
    }
  }

  if (name) {
    const els = document.querySelectorAll("img[data-hurry-account]");
    for (const el of Array.from(els)) {
      if (String(el.getAttribute("alt") || "") === name) return el as HTMLImageElement;
    }
  }
  return null;
}

const embeddedSeenLuckyEvents = new Set<string>();

function animateEmbeddedLuckyGift(data: any, roomId: string) {
  if (typeof document === "undefined") return;
  if (String(data?.roomId || "") !== String(roomId)) return;
  if (data?.action !== "lucky_image") return;

  const eventId = String(
    data?.eventId ||
    `${data?.roomId || ""}-${data?.seatNumber || ""}-${data?.timestamp || ""}-${data?.src || ""}`
  );
  if (embeddedSeenLuckyEvents.has(eventId)) return;
  embeddedSeenLuckyEvents.add(eventId);
  window.setTimeout(() => embeddedSeenLuckyEvents.delete(eventId), 5000);

  const src = String(data?.src || "");
  if (!src) return;

  let attempts = 0;
  let cancelled = false;

  const findAndRun = () => {
    if (cancelled) return;
    const target = findTargetAvatar(data);
    if (!target) {
      if (attempts++ < 20) window.setTimeout(findAndRun, 75);
      return;
    }

    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const flyer = document.createElement("img");
    flyer.src = src;
    flyer.alt = "";
    flyer.setAttribute("aria-hidden", "true");
    flyer.draggable = false;

    const size = Math.max(48, Math.min(82, Math.round(rect.width * 1.35)));
    const half = size / 2;

    const startX = window.innerWidth / 2;
    const startY = window.innerHeight * 0.52;

    const endX = rect.left + rect.width / 2;
    const endY = rect.top + rect.height / 2;

    const travelDuration = Number(data?.duration) > 0
      ? Math.min(1800, Math.max(600, Number(data.duration)))
      : 900;

    Object.assign(flyer.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: `${size}px`,
      height: `${size}px`,
      objectFit: "contain",
      pointerEvents: "none",
      userSelect: "none",
      zIndex: "2147483647",
      opacity: "1",
      transform: `translate3d(${startX - half}px,${startY - half}px,0) scale(1)`,
      willChange: "transform",
    });

    const start = () => {
      if (cancelled) {
        flyer.remove();
        return;
      }
      document.documentElement.appendChild(flyer);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          flyer.style.transition = `transform ${travelDuration}ms cubic-bezier(.18,.72,.32,1)`;
          flyer.style.transform =
            `translate3d(${endX - half}px,${endY - half}px,0) scale(0.12)`;

          window.setTimeout(() => flyer.remove(), travelDuration + 120);
        });
      });
    };

    flyer.onload = start;
    flyer.onerror = () => flyer.remove();
    if (flyer.complete && flyer.naturalWidth > 0) start();
  };

  requestAnimationFrame(findAndRun);
}

export function LuckyGiftAnimation({ roomId }: LuckyGiftAnimationProps) {
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  useEffect(() => {
    const handler = (data: any) => animateEmbeddedLuckyGift(data, roomIdRef.current);
    const localHandler = (event: Event) => {
      animateEmbeddedLuckyGift((event as CustomEvent).detail, roomIdRef.current);
    };

    socket.on("room_seat_action", handler);
    window.addEventListener("hurry:lucky-image", localHandler);

    return () => {
      socket.off("room_seat_action", handler);
      window.removeEventListener("hurry:lucky-image", localHandler);
    };
  }, []);

  return null;
    }
