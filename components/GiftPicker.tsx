"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronUp } from "lucide-react";
import Image from "next/image";

interface Seat {
  number: number;
  isOccupied: boolean;
  user?: { name: string; image: string; accountId: string };
}

export default function GiftPicker({ onClose, seats = [] }: { onClose: () => void, seats?: Seat[] }) {
  const [activeTab, setActiveTab] = useState("Hot");
  const [selectedMultiplier, setSelectedMultiplier] = useState("1×");
  const [showMultipliers, setShowMultipliers] = useState(false);
  const [selectedGift, setSelectedGift] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const tabs = ["Hot", "Lucky", "Luxury", "Event"];
  const multipliers = ["1×", "10×", "299×", "599×", "999×"];

  const hotGifts = [
    { id: 1, name: "Rose", coins: 10, image: "/IMG_20260815_103351.jpg" },
    { id: 2, name: "Heart", coins: 99, image: "/IMG_20260815_103351.jpg" },
    { id: 3, name: "Car", coins: 500, image: "/IMG_20260815_103351.jpg" },
    { id: 4, name: "Crown", coins: 1000, image: "/IMG_20260815_103351.jpg" },
    { id: 5, name: "Rocket", coins: 2000, image: "/IMG_20260815_103351.jpg" },
    { id: 6, name: "Castle", coins: 5000, image: "/IMG_20260815_103351.jpg" },
    { id: 7, name: "Diamond", coins: 10000, image: "/IMG_20260815_103351.jpg" },
    { id: 8, name: "Yacht", coins: 20000, image: "/IMG_20260815_103351.jpg" },
    { id: 9, name: "Plane", coins: 50000, image: "/IMG_20260815_103351.jpg" },
    { id: 10, name: "Island", coins: 100000, image: "/IMG_20260815_103351.jpg" },
    { id: 11, name: "Star", coins: 500000, image: "/IMG_20260815_103351.jpg" },
    { id: 12, name: "Galaxy", coins: 1000000, image: "/IMG_20260815_103351.jpg" },
  ];

  const luckyGifts = [
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

  const getCurrentGifts = () => {
    if (activeTab === "Lucky") return luckyGifts;
    return hotGifts;
  };

  const currentGifts = getCurrentGifts();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* SVG FILTER – PURE WEB SHADER to remove white background from coin */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="removeWhite" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              -0.333 -0.333 -0.333 1 0"
          />
        </filter>
      </svg>

      <style jsx>{`
        .main-container {
          background: rgba(0, 0, 0, 0.95);
        }

        .gift-item {
          background: transparent;
          border: 2px solid transparent;
          transition: all 0.2s ease;
          padding: 6px 2px; /* reduced horizontal padding to give more width */
          border-radius: 8px;
          width: 100%; /* ensures full width of grid cell */
        }
        .gift-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .gift-item.selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }

        .gift-image {
          /* pure original */
        }

        .coin-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent !important;
        }

        .coin-image {
          filter: url(#removeWhite) drop-shadow(0 0 4px rgba(255,215,0,0.4));
          background: transparent !important;
        }

        .gift-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          display: block;
          text-align: center;
        }

        .bottom-bar {
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .balance-container {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px) saturate(150%);
          -webkit-backdrop-filter: blur(10px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .multiplier-btn {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(8px) saturate(150%);
          -webkit-backdrop-filter: blur(8px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .multiplier-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
        }
        .send-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 2px 15px rgba(59, 130, 246, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .send-btn:hover {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 25px rgba(59, 130, 246, 0.35);
        }
        .multiplier-dropdown {
          background: rgba(24, 24, 27, 0.92);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }
        .tab-active {
          text-shadow: 0 0 30px rgba(255, 255, 255, 0.05);
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        ref={sheetRef}
        className="main-container h-[50vh] w-full max-w-md mx-auto text-white flex flex-col justify-between rounded-t-md border-t border-white/10 shadow-2xl relative px-4 pt-3 pb-2"
      >
        {/* TOP: "All" */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 mr-2">
            {seats.filter(seat => seat.isOccupied && seat.user).map(seat => (
              <div key={seat.number} className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-white/20 relative">
                <Image
                  src={seat.user!.image || "/IMG_20260921_210113.png"}
                  alt={seat.user!.name || "User"}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-300 whitespace-nowrap shrink-0">All</span>
        </div>

        {/* TABS – gap=1 */}
        <div className="flex items-center gap-1 py-1.5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-semibold transition-all relative px-1 ${
                activeTab === tab
                  ? "text-white font-bold scale-105 tab-active"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* GIFT GRID – wider items: gap reduced to 1 and image slightly bigger */}
        <div className="flex-1 overflow-y-auto py-2 grid grid-cols-4 gap-1 scrollbar-none">
          {currentGifts.map((gift) => (
            <div
              key={gift.id}
              onClick={() => setSelectedGift(gift.id)}
              className={`gift-item flex flex-col items-center justify-center transition cursor-pointer active:scale-95 ${
                selectedGift === gift.id ? "selected" : ""
              }`}
            >
              {/* Increased image size to w-18 h-18 (72px) for a bit wider feel */}
              <div className="relative w-18 h-18 mb-0.5">
                <Image
                  src={gift.image}
                  alt={gift.name}
                  fill
                  className="gift-image object-contain"
                  sizes="72px"
                />
              </div>
              <span className="gift-name text-gray-300 font-medium text-[10px]">
                {gift.name}
              </span>
              <span className="text-yellow-400 flex items-center gap-0.5 mt-0.5 text-[9px]">
                <div className="coin-wrapper w-2.5 h-2.5 relative overflow-hidden rounded-full">
                  <Image
                    src="/file_00000000e56882119c217d508b6733dc.png"
                    alt="Coins"
                    fill
                    className="coin-image object-cover"
                    sizes="10px"
                  />
                </div>
                {gift.coins}
              </span>
            </div>
          ))}
        </div>

        {/* BOTTOM BAR */}
        <div className="bottom-bar flex items-center justify-between pt-1.5 relative rounded-b-md">
          <div className="balance-container flex items-center gap-1 px-2.5 py-1 rounded-full">
            <div className="coin-wrapper w-5 h-5 relative overflow-hidden rounded-full">
              <Image
                src="/file_00000000e56882119c217d508b6733dc.png"
                alt="Coins"
                fill
                className="coin-image object-cover"
                sizes="20px"
              />
            </div>
            <span className="text-[10px] font-bold text-yellow-300 tracking-wide">66457</span>
          </div>

          <div className="flex items-center gap-1.5 relative">
            {showMultipliers && (
              <div className="multiplier-dropdown absolute bottom-10 right-14 rounded-md p-1 shadow-xl flex flex-col gap-1 z-50">
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
              className="multiplier-btn flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-gray-200 transition"
            >
              <span>{selectedMultiplier}</span>
              <ChevronUp className={`w-3 h-3 transition-transform ${showMultipliers ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={() => console.log(`Sent Gift ID: ${selectedGift} with ${selectedMultiplier}`)}
              className="send-btn text-white font-bold text-xs px-4 py-1.5 rounded-full transition-all active:scale-95"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
            }
