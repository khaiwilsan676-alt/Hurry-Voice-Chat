"use client";

import React from "react";
import Image from "next/image";

// ==========================================
// MOCK DATA FOR LIST (Ranks 4+)
// ==========================================
const listData = [
  {
    id: 4,
    name: "Buggu",
    avatar: "/default-avatar.png", // Replace with real avatar if needed
    level: 65,
    coins: 308100,
  },
  {
    id: 5,
    name: "yamat",
    avatar: "/default-avatar.png",
    level: 62,
    coins: 100000,
  },
  {
    id: 6,
    name: "SUFIYAN",
    avatar: "/default-avatar.png",
    level: 59,
    coins: 9000,
  },
  {
    id: 7,
    name: "SK MARK",
    avatar: "/default-avatar.png",
    level: 51,
    coins: 2000,
  },
];

// ==========================================
// REUSABLE COIN ICON
// ==========================================
const CoinIcon = () => (
  <div className="w-3.5 h-3.5 bg-yellow-400 rounded-full flex items-center justify-center border border-yellow-200 shadow-sm mr-1">
    <div className="w-2 h-2 bg-yellow-200 rounded-full flex items-center justify-center">
      <span className="text-[6px] text-yellow-600 font-bold">★</span>
    </div>
  </div>
);

export default function CupIcon() {
  return (
    <div className="relative w-full max-w-md mx-auto h-screen bg-[#b944ff] overflow-hidden flex flex-col font-sans">
      {/* ========================================== */}
      {/* BACKGROUND IMAGE */}
      {/* ========================================== */}
      <div className="absolute inset-0 w-full h-[60vh] z-0">
        <Image
          src="/file_00000000403481f5ae20a522b191c8fa.png"
          alt="Background"
          fill
          className="object-cover object-top"
          priority
        />
        {/* Fallback gradient if image is missing/loading */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#8f28ff]/50 to-[#d25aff]/80 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col h-full overflow-y-auto scrollbar-none">
        
        {/* ========================================== */}
        {/* HEADER SECTION */}
        {/* ========================================== */}
        <div className="flex items-center justify-between px-4 pt-8 pb-4">
          <div className="flex items-center bg-white/20 rounded-full px-2 py-1 backdrop-blur-sm">
            <CoinIcon />
            <span className="text-yellow-300 text-xs font-bold">186.3M</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-white font-semibold text-lg drop-shadow-md">Contribution list</span>
            <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-white text-[10px]">
              ?
            </div>
          </div>
          
          <div className="flex items-center text-yellow-300 text-xs font-bold bg-white/20 rounded-full px-2 py-1 backdrop-blur-sm">
            <span className="mr-1"></span> TOP4 &gt;
          </div>
        </div>

        {/* ========================================== */}
        {/* TAB SECTION (Only Daily List) */}
        {/* ========================================== */}
        <div className="flex items-center justify-between px-4 mt-2">
          <div className="flex items-center gap-3">
            <button className="bg-white text-[#9922ff] font-bold text-sm px-5 py-1.5 rounded-full shadow-md">
              Daily list
            </button>
            {/* Weekly tab removed as requested */}
          </div>
          <button className="text-white/90 text-sm font-medium flex items-center gap-1">
            Today <span className="text-xs">&lt;</span>
          </button>
        </div>

        {/* ========================================== */}
        {/* PODIUM SECTION (Top 3) */}
        {/* ========================================== */}
        <div className="relative mt-24 mb-6 flex justify-center items-end px-2 h-48">
          
          {/* RANK 3 (Left) */}
          <div className="flex flex-col items-center relative w-[30%] z-10 transform translate-x-4">
            <div className="flex items-center mb-1">
              <CoinIcon />
              <span className="text-yellow-300 font-bold text-xs">700000</span>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 absolute">
                <Image src="/default-avatar.png" alt="Rank 3" fill className="object-cover" />
              </div>
              {/* Frame 3 */}
              <Image src="/IMG_20260923_115801.png" alt="Frame 3" fill className="object-contain z-10" />
            </div>
            <div className="bg-white/90 rounded text-[#9922ff] text-[10px] font-bold px-2 py-0.5 mt-1">HONEY</div>
            <div className="flex gap-1 mt-1">
              <div className="bg-gradient-to-r from-purple-800 to-indigo-900 border border-yellow-400 text-white text-[9px] px-1.5 rounded-sm">LV.56</div>
            </div>
          </div>

          {/* RANK 1 (Center) */}
          <div className="flex flex-col items-center relative w-[40%] z-20 -translate-y-8">
            <div className="flex items-center mb-1">
              <CoinIcon />
              <span className="text-yellow-300 font-bold text-sm drop-shadow-md">175901000</span>
            </div>
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-300 absolute">
                <Image src="/default-avatar.png" alt="Rank 1" fill className="object-cover" />
              </div>
              {/* Frame 1 */}
              <Image src="/IMG_20260923_115819.png" alt="Frame 1" fill className="object-contain z-10" />
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-yellow-400 text-[10px]"></span>
              <span className="text-yellow-400 font-bold text-xs drop-shadow-md">Guns</span>
              <span className="text-yellow-400 text-[10px]"></span>
            </div>
            <div className="flex gap-1 mt-1">
              <div className="bg-gradient-to-r from-purple-800 to-indigo-900 border border-yellow-400 text-yellow-400 text-[9px] px-1.5 rounded-sm font-bold">LV.84</div>
              <div className="bg-teal-500 text-white text-[9px] px-1.5 rounded-sm">SVIP1</div>
            </div>
          </div>

          {/* RANK 2 (Right) */}
          <div className="flex flex-col items-center relative w-[30%] z-10 transform -translate-x-4">
            <div className="flex items-center mb-1">
              <CoinIcon />
              <span className="text-yellow-300 font-bold text-xs">9252800</span>
            </div>
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-300 absolute">
                <Image src="/default-avatar.png" alt="Rank 2" fill className="object-cover" />
              </div>
              {/* Frame 2 */}
              <Image src="/IMG_20260923_115834.png" alt="Frame 2" fill className="object-contain z-10" />
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-black text-[10px]">🖤</span>
              <span className="text-yellow-400 font-bold text-xs drop-shadow-md">Divya</span>
            </div>
            <div className="flex gap-1 mt-1">
              <div className="bg-gradient-to-r from-purple-800 to-indigo-900 border border-yellow-400 text-yellow-400 text-[9px] px-1.5 rounded-sm font-bold">LV.102</div>
              <div className="bg-red-500 text-white text-[9px] px-1.5 rounded-sm">SVIP5</div>
            </div>
          </div>
          
        </div>

        {/* ========================================== */}
        {/* LIST SECTION (Ranks 4+) */}
        {/* ========================================== */}
        <div className="flex-1 bg-white rounded-t-[1.5rem] pt-6 px-4 pb-20 z-20 relative min-h-[50vh] shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
          {listData.map((user, index) => (
            <div key={user.id} className="flex items-center justify-between py-3 border-b border-gray-100">
              
              <div className="flex items-center gap-4">
                <span className="text-gray-400 font-medium text-lg w-4 text-center">
                  {user.id}
                </span>
                
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                  <Image src={user.avatar} alt={user.name} fill className="object-cover" />
                </div>
                
                <div className="flex flex-col">
                  <span className="text-gray-800 font-bold text-sm">{user.name}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="bg-gradient-to-r from-green-800 to-green-600 border border-yellow-400 text-yellow-400 text-[9px] px-2 rounded-sm font-bold">
                      LV.{user.level}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <CoinIcon />
                <span className="text-orange-400 font-semibold text-sm">{user.coins}</span>
              </div>
              
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

