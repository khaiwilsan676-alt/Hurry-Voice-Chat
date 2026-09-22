"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronUp } from "lucide-react";
import Image from "next/image";

// Solid Icons (Bina kisi outline ke, jaisa aapne maanga tha)
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
}

interface Seat {
  number: number;
  isOccupied: boolean;
  user?: { name: string; image: string; accountId: string };
}

export default function GiftPicker({
  onClose,
  seats = [],
}: {
  onClose: () => void;
  seats?: Seat[];
}) {
  const [activeTab, setActiveTab] = useState("Hot");
  const [selectedMultiplier, setSelectedMultiplier] = useState("1×");
  const [showMultipliers, setShowMultipliers] = useState(false);
  const [selectedGift, setSelectedGift] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [sending, setSending] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null); // 🎬
  const sheetRef = useRef<HTMLDivElement>(null);
  
  // Naye Dropdown ke liye State & Ref
  const [showTargetMenu, setShowTargetMenu] = useState(false);
  const targetMenuRef = useRef<HTMLDivElement>(null);

  // ✅ NAYA STATE: Select kiye hue users ko track karne ke liye
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

  const tabs = ["Hot", "Lucky", "Luxury", "Event"];
  const multipliers = ["1×", "10×", "299×", "599×", "999×"];

  // ✅ Hot – sirf Teddy with video
  const hotGifts: Gift[] = [
    {
      id: 1,
      name: "Teddy",
      coins: 70000,
      image: "/IMG_20260922_142150.jpg",
      video: "/VID_20260921_011932.mp4",
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

  // Balance real-time sync
  useEffect(() => {
    let alive = true;
    const fetchBal = async () => {
      const b = 500000; 
      if (alive) setWalletBalance(b);
    };
    fetchBal();
    const id = setInterval(fetchBal, 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Click outside → close
  useEffect(() => {
    if (playingVideo) return;
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, playingVideo]);

  // Naye Dropdown ke liye click outside logic
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (targetMenuRef.current && !targetMenuRef.current.contains(e.target as Node)) {
        setShowTargetMenu(false);
      }
    };
    if (showTargetMenu) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [showTargetMenu]);

  const parseMultiplier = (m: string) => parseInt(m.replace("×", ""), 10) || 1;

  const selectedGiftObj = currentGifts.find((g) => g.id === selectedGift);
  const totalCost = selectedGiftObj
    ? selectedGiftObj.coins * parseMultiplier(selectedMultiplier)
    : 0;
  const canAfford = totalCost <= walletBalance;

  const handleSend = async () => {
    if (!selectedGiftObj || sending) return;
    if (!canAfford) return;

    setSending(true);
    setWalletBalance((p) => Math.max(0, p - totalCost));
    setSending(false);

    if (selectedGiftObj.video) {
      setPlayingVideo(selectedGiftObj.video);
    } else {
      onClose();
    }
  };

  // ✅ All Mic Click Handler
  const handleAllOnMic = () => {
    const micUsers = seats
      .filter((s) => s.isOccupied && s.user)
      .map((s) => s.user!.accountId);
    setSelectedTargets(micUsers);
    setShowTargetMenu(false);
  };

  // ✅ Single Avatar Click Handler (Sirf ek select hoga, baaki clear ho jayenge)
  const handleAvatarClick = (accountId: string) => {
    setSelectedTargets([accountId]);
  };

  // ============================================================
  // 🎬 VIDEO OVERLAY
  // ============================================================
  if (playingVideo) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent pointer-events-none"
        style={{ touchAction: "manipulation" }}
      >
        <video
          src={playingVideo}
          autoPlay
          playsInline
          onEnded={() => {
            setPlayingVideo(null);
            onClose();
          }}
          onError={() => {
            setPlayingVideo(null);
            onClose();
          }}
          className="block"
          style={{
            width: "auto",
            height: "auto",
            maxWidth: "none",
            maxHeight: "none",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
          }}
        />
      </div>
    );
  }

  // ============================================================
  // NORMAL PICKER UI
  // ============================================================
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
          filter: url(#removeWhite) drop-shadow(0 0 4px rgba(255,215,0,0.4));
        }
        .balance-container {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .send-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          box-shadow: 0 2px 15px rgba(59,130,246,0.25);
        }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        ref={sheetRef}
        className="main-container h-[50vh] w-full max-w-md mx-auto text-white flex flex-col justify-between rounded-t-md border-t border-white/10 shadow-2xl relative px-4 pt-3 pb-2"
      >
        {/* ============================================================ */}
        {/* NAYA "ALL" DROPDOWN MENU (Top Right) */}
        {/* ============================================================ */}
        <div className="absolute top-3 right-4 z-[60]" ref={targetMenuRef}>
          <div className="relative">
            {/* Main Button */}
            <button
              onClick={() => setShowTargetMenu(!showTargetMenu)}
              className="flex items-center gap-1.5 bg-[#31c4d3] text-white px-2 py-1 rounded-[6px] shadow-sm transition-transform active:scale-95"
            >
              <SolidMicIcon className="w-3.5 h-3.5" />
              <span className="text-[13px] font-medium leading-none">All</span>
              <div className="w-[1px] h-3.5 bg-white/50 mx-0.5"></div>
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-white"></div>
            </button>

            {/* Dropdown Options */}
            {showTargetMenu && (
              <div className="absolute top-full right-0 mt-2 bg-[#0c1418] rounded-md shadow-2xl border border-white/5 w-[140px] z-[70]">
                <div className="absolute -top-1.5 right-4 w-3 h-3 bg-[#0c1418] border-t border-l border-white/5 rotate-45"></div>
                
                <div className="relative z-10 flex flex-col py-1.5">
                  <button
                    onClick={handleAllOnMic} // ✅ All on mic logic attached
                    className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-white/5 transition-colors text-[#31c4d3] w-full text-left"
                  >
                    <SolidMicIcon className="w-4 h-4" />
                    <span className="text-[14px] tracking-wide font-medium">All on mic</span>
                  </button>
                  <button
                    onClick={() => setShowTargetMenu(false)}
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
        {/* ============================================================ */}

        {/* ✅ USER AVATAR LIST SECTION (Only this was added for showing avatars) */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pr-24 pt-1 pb-3">
          {seats
            .filter((seat) => seat.isOccupied && seat.user)
            .map((seat) => {
              const isSelected = selectedTargets.includes(seat.user!.accountId);
              return (
                <div
                  key={seat.user!.accountId}
                  onClick={() => handleAvatarClick(seat.user!.accountId)}
                  className={`relative w-11 h-11 flex-shrink-0 rounded-full cursor-pointer transition-all duration-200 border-[2.5px] ${
                    isSelected ? "border-[#31c4d3]" : "border-transparent"
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

        {/* GIFT GRID */}
        {activeTab === "Hot" ? (
          <div className="flex-1 flex flex-col items-center justify-center py-2 overflow-y-auto scrollbar-none">
            {hotGifts.map((gift) => (
              <div
                key={gift.id}
                onClick={() => setSelectedGift(gift.id)}
                className={`gift-item flex flex-col items-center justify-center transition cursor-pointer active:scale-95 max-w-[140px] ${
                  selectedGift === gift.id ? "selected" : ""
                }`}
              >
                <div className="relative w-24 h-24 mb-1">
                  <Image
                    src={gift.image}
                    alt={gift.name}
                    fill
                    className="object-contain"
                    sizes="96px"
                    priority
                    style={{
                      WebkitMaskImage: "radial-gradient(circle, black 55%, transparent 100%)",
                      maskImage: "radial-gradient(circle, black 55%, transparent 100%)",
                      mixBlendMode: "screen" 
                    }}
                  />
                </div>
                <span className="text-gray-200 font-semibold text-xs">
                  {gift.name}
                </span>
                <span className="text-yellow-400 flex items-center gap-0.5 mt-0.5 text-[10px]">
                  <div className="w-3 h-3 relative overflow-hidden rounded-full">
                    <Image
                      src="/file_00000000e56882119c217d508b6733dc.png"
                      alt="Coins"
                      fill
                      className="coin-image object-cover"
                      sizes="12px"
                    />
                  </div>
                  {gift.coins.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-2 grid grid-cols-4 gap-1 scrollbar-none">
            {currentGifts.map((gift) => (
              <div
                key={gift.id}
                onClick={() => setSelectedGift(gift.id)}
                className={`gift-item flex flex-col items-center justify-center transition cursor-pointer active:scale-95 ${
                  selectedGift === gift.id ? "selected" : ""
                }`}
              >
                <div className="relative w-18 h-18 mb-0.5">
                  <Image
                    src={gift.image}
                    alt={gift.name}
                    fill
                    className="object-contain"
                    sizes="72px"
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
        )}

        {/* BOTTOM BAR */}
        <div className="bottom-bar flex items-center justify-between pt-1.5 relative rounded-b-md">
          <div className="balance-container flex items-center gap-1 px-2.5 py-1 rounded-full">
            <div className="w-5 h-5 relative overflow-hidden rounded-full">
              <Image
                src="/file_00000000e56882119c217d508b6733dc.png"
                alt="Coins"
                fill
                className="coin-image object-cover"
                sizes="20px"
              />
            </div>
            <span className="text-[10px] font-bold text-yellow-300 tracking-wide">
              {walletBalance.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 relative">
            {selectedGiftObj && (
              <span
                className={`text-[10px] font-semibold ${
                  canAfford ? "text-gray-400" : "text-red-400"
                }`}
              >
                -{totalCost.toLocaleString()}
              </span>
            )}

            {showMultipliers && (
              <div className="multiplier-dropdown absolute bottom-10 right-14 rounded-md p-1 shadow-xl flex flex-col gap-1 z-50 bg-zinc-900/95 border border-white/10">
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
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-gray-200 bg-white/5 border border-white/10"
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
              className="send-btn text-white font-bold text-xs px-4 py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-40"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

