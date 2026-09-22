'use client'

import React, { useState } from 'react'


interface LuckyBagProps {
  onClose?: () => void
}

export default function LuckyBag({ onClose }: LuckyBagProps) {
  // Selected coin options
  const [selectedCoins, setSelectedCoins] = useState<number>(5777)
  const coinOptions = [5777, 17777, 99999, 177777]

  // Dropdown states
  const [recipients, setRecipients] = useState<number>(5)
  const [countdown, setCountdown] = useState<string>('Now')
  const [howToJoin, setHowToJoin] = useState<string>('Everyone')

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center select-none bg-transparent">
      {/* Backdrop Click to close - Completely transparent */}
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />

      {/* Main Bottom Sheet Container - EXACTLY TUMHARA ORIGINAL, KUCH TOUCH NAHI KIYA */}
      <div
        className="relative w-full max-w-[440px] flex flex-col items-center pb-[100px] pt-3 px-4 rounded-t-[34px] animate-in slide-in-from-bottom duration-300 overflow-visible" onClick={(e) => e.stopPropagation()}
        style={{
          // Nayi background image update kar di hai
          backgroundImage: `url('/file_00000000e08881f68258aed00843ff1b.png')`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Top Header Row: Balance Pill, Title, Right Action Icons */}
        <div className="w-full flex items-center justify-between mt-1 mb-2 px-1">
          {/* Balance Pill */}
          <div className="flex items-center gap-1.5 bg-[#32016B]/70 border border-white/10 rounded-full px-2.5 py-1 cursor-pointer active:scale-95 transition-transform">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#FFD700] to-[#FFF2B2] flex items-center justify-center shadow-sm">
              <span className="text-[#874900] text-[10px] font-black leading-none">$</span>
            </div>
            <span className="text-white text-[13px] font-bold">16</span>
            <span className="text-white/70 text-[11px] font-bold">&gt;</span>
          </div>

          {/* Lucky Bag Title */}
          <h2
            className="text-[32px] font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5C3] via-[#FFD700] to-[#E6A100]"
            style={{
              textShadow: '0 3px 6px rgba(0,0,0,0.7)',
              fontFamily: 'cursive, sans-serif',
            }}
          >
            Lucky Bag
          </h2>

          {/* Right Action Icons (Rules & Help) */}
          <div className="flex items-center gap-2">
            {/* Rules / Notepad Icon */}
            <button className="w-7 h-7 rounded-md border border-[#FFDF6C] bg-[#49048E]/80 flex items-center justify-center text-[#FFDF6C] active:scale-90 transition-transform">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="13" y2="17" />
              </svg>
            </button>

            {/* Help Question Icon */}
            <button className="w-7 h-7 rounded-full border border-[#FFDF6C] bg-[#49048E]/80 flex items-center justify-center text-[#FFDF6C] text-[14px] font-black active:scale-90 transition-transform">
              ?
            </button>
          </div>
        </div>

        {/* Total Coins Section */}
        <div className="w-full mt-4 mb-3">
          <p className="text-white text-[14px] font-bold mb-2 ml-1">Total Coins</p>

          <div className="grid grid-cols-2 gap-2.5">
            {coinOptions.map((coins) => {
              const isSelected = selectedCoins === coins
              return (
                <button
                  key={coins}
                  onClick={() => setSelectedCoins(coins)}
                  className={`h-[44px] rounded-[10px] flex items-center justify-center gap-2 font-black text-[16px] transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#DFE4F2] via-[#F6F8FD] to-[#D5E1FB] text-[#2D0B5A] shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                      : 'bg-[#4B1B91] text-white hover:bg-[#5923A3]'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FFB800] via-[#FFD700] to-[#FFF2B2] flex items-center justify-center shadow-sm">
                    <span className="text-[#844502] text-[11px] font-black leading-none">$</span>
                  </div>
                  <span>{coins.toLocaleString()}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dropdown Rows: Number of Recipients, Countdown, How to Join */}
        <div className="w-full flex flex-col gap-3 my-1">
          {/* Number of Recipients */}
          <div className="w-full flex items-center justify-between">
            <span className="text-white text-[14px] font-semibold">Number of recipients</span>
            <div className="relative">
              <select
                value={recipients}
                onChange={(e) => setRecipients(Number(e.target.value))}
                className="appearance-none bg-[#370570] text-white font-bold text-[14px] px-4 py-1.5 pr-8 rounded-[8px] focus:outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="w-full flex items-center justify-between">
            <span className="text-white text-[14px] font-semibold">Countdown</span>
            <div className="relative">
              <select
                value={countdown}
                onChange={(e) => setCountdown(e.target.value)}
                className="appearance-none bg-[#370570] text-white font-bold text-[14px] px-4 py-1.5 pr-8 rounded-[8px] focus:outline-none cursor-pointer"
              >
                <option value="Now">Now</option>
                <option value="30s">30s</option>
                <option value="1m">1m</option>
                <option value="5m">5m</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* How to Join */}
          <div className="w-full flex items-center justify-between">
            <span className="text-white text-[14px] font-semibold">How to join</span>
            <div className="relative">
              <select
                value={howToJoin}
                onChange={(e) => setHowToJoin(e.target.value)}
                className="appearance-none bg-[#370570] text-white font-bold text-[14px] px-4 py-1.5 pr-8 rounded-[8px] focus:outline-none cursor-pointer"
              >
                <option value="Everyone">Everyone</option>
                <option value="Followers">Followers</option>
                <option value="VIP Only">VIP Only</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Description subtext */}
          <p className="text-[#AFA1CE] text-[12px] -mt-1 font-medium">Everyone can receive it.</p>
        </div>

        {/* Triangle Hata Diya - Pehle yahan tha */}

        {/* 3D Big SEND Button (Flow ke andar rakha hai taaki bg height same rahe) */}
        <div className="w-full mt-14 flex justify-center">
          <button 
            className="w-[85%] h-[50px] rounded-full bg-gradient-to-r from-[#A817FF] via-[#7B1CFD] to-[#A817FF] border-2 border-[#FFDF6C] shadow-[0_6px_0_#49048E,0_10px_20px_rgba(168,23,255,0.5),inset_0_1px_2px_rgba(255,255,255,0.5)] active:shadow-[0_0px_0_#49048E,0_4px_6px_rgba(168,23,255,0.4)] active:translate-y-[6px] transition-all flex items-center justify-center"
          >
            <span
              className="text-white font-black text-[20px] tracking-widest uppercase"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
            >
              SEND
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

