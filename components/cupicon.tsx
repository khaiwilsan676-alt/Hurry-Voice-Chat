"use client";

import React from "react";
import Image from "next/image";

const listData = [
  { id: 4, name: "Buggu", avatar: "/default-avatar.png", level: 65, coins: 308100 },
  { id: 5, name: "yamat", avatar: "/default-avatar.png", level: 62, coins: 100000 },
  { id: 6, name: "SUFIYAN", avatar: "/default-avatar.png", level: 59, coins: 9000 },
  { id: 7, name: "SK MARK", avatar: "/default-avatar.png", level: 51, coins: 2000 },
];

const CoinIcon = () => (
  <div className="w-3.5 h-3.5 bg-yellow-400 rounded-full flex items-center justify-center border border-yellow-200 shadow-sm mr-1">
    <div className="w-2 h-2 bg-yellow-200 rounded-full flex items-center justify-center">
      <span className="text-[6px] text-yellow-600 font-bold">★</span>
    </div>
  </div>
);

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};

interface CupIconProps {
  onBack?: () => void;
  count?: number;
}

export default function CupIcon({ onBack, count = 0 }: CupIconProps) {
  return (
    <div className="fixed inset-0 z-[11000] flex items-end justify-center pointer-events-none">

      {/* Invisible backdrop - click to close */}
      <div
        className="absolute inset-0 pointer-events-auto"
        style={{ background: 'transparent' }}
        onClick={onBack}
      />

      {/* BOTTOM 50vh SHEET — sirf background image */}
      <div
        className="relative w-full max-w-md h-[50vh] overflow-hidden rounded-t-3xl shadow-2xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================== */}
        {/* BACKGROUND IMAGE — Sheet ka pura background */}
        {/* ========================================== */}
        <Image
          src="/file_00000000403481f5ae20a522b191c8fa.png"
          alt="Background"
          fill
          className="object-cover object-top z-0"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#8f28ff]/40 to-[#d25aff]/70 mix-blend-overlay z-0" />

        {/* ========================================== */}
        {/* SAARA CONTENT UPAR FLOATING (image ke upar) */}
        {/* ========================================== */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Drag Handle */}
          <div className="flex justify-center pt-2 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/40" />
          </div>

          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-3 left-3 z-30 p-1.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors cursor-pointer"
              aria-label="Back"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-none stroke-white stroke-[2.5] stroke-linecap-round stroke-linejoin-round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* ========================================== */}
          {/* HEADER */}
          {/* ========================================== */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
            <div className="flex items-center bg-white/20 rounded-full px-2 py-1 backdrop-blur-sm">
              <CoinIcon />
              <span className="text-yellow-300 text-xs font-bold">{formatCount(count)}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-white font-semibold text-sm drop-shadow-md">Contribution list</span>
              <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-white text-[10px]">
                ?
              </div>
            </div>

            <div className="flex items-center text-yellow-300 text-xs font-bold bg-white/20 rounded-full px-2 py-1 backdrop-blur-sm">
              TOP4 &gt;
            </div>
          </div>

          {/* ========================================== */}
          {/* TAB */}
          {/* ========================================== */}
          <div className="flex items-center justify-between px-4 flex-shrink-0">
            <button className="bg-white text-[#9922ff] font-bold text-xs px-4 py-1 rounded-full shadow-md">
              Daily list
            </button>
            <button className="text-white/90 text-xs font-medium flex items-center gap-1">
              Today <span className="text-xs">&lt;</span>
            </button>
          </div>

          {/* ========================================== */}
          {/* LIST (Ranks 4+) — Image ke upar scroll */}
          {/* ========================================== */}
          <div className="flex-1 overflow-y-auto scrollbar-none pt-2 px-4 pb-4 mt-1">
            {listData.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2.5 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <span className="text-white/80 font-medium text-base w-4 text-center drop-shadow-md">
                    {user.id}
                  </span>
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/50">
                    <Image src={user.avatar} alt={user.name} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-xs drop-shadow-md">{user.name}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="bg-gradient-to-r from-green-800 to-green-600 border border-yellow-400 text-yellow-400 text-[8px] px-1.5 rounded-sm font-bold">
                        LV.{user.level}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <CoinIcon />
                  <span className="text-yellow-300 font-semibold text-xs drop-shadow-md">{user.coins}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Safe area bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        />
      </div>
    </div>
  );
}
