'use client'

import { useState } from 'react'

interface LuckyBagProps {
  onClose?: () => void
}

export default function LuckyBag({ onClose }: LuckyBagProps) {
  // Tabs: Normal vs Lucky Rain
  const [activeTab, setActiveTab] = useState<'Normal' | 'Lucky Rain'>('Normal')

  // Selected coin options
  const [selectedCoins, setSelectedCoins] = useState<number>(5777)
  const coinOptions = [5777, 17777, 99999, 177777]

  // Dropdown states
  const [recipients, setRecipients] = useState<number>(5)
  const [countdown, setCountdown] = useState<string>('Now')
  const [howToJoin, setHowToJoin] = useState<string>('Everyone')

  return (
    // Backdrop: Removed blur as requested, kept slight darkening so UI is readable
    <div className="fixed inset-0 z-[200] flex items-end justify-center select-none bg-black/30">
      {/* Backdrop Click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Bottom Sheet Container */}
      <div
        className="relative w-full max-w-[440px] flex flex-col items-center pb-8 pt-4 px-5 shadow-[0_-10px_35px_rgba(0,0,0,0.8)] rounded-t-[20px] animate-in slide-in-from-bottom duration-300"
        style={{
          // Matching the deep purple gradient background with a slight gold border effect from the image
          background: 'linear-gradient(180deg, #3C0A7A 0%, #2A045B 100%)',
          borderTop: '1px solid #FFD700',
          borderLeft: '1px solid rgba(255, 215, 0, 0.3)',
          borderRight: '1px solid rgba(255, 215, 0, 0.3)',
        }}
      >
        {/* Top Header Row: Balance Pill, Title, Right Action Icons */}
        <div className="w-full flex items-center justify-between mb-4 px-1">
          {/* Balance */}
          <div className="flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#FFDF00] to-[#FFB800] flex items-center justify-center">
              <span className="text-[#874900] text-[10px] font-black leading-none">S</span>
            </div>
            <span className="text-[#FFD700] text-[15px] font-bold">16 &gt;</span>
          </div>

          {/* Lucky Bag Title */}
          <h2
            className="text-[32px] font-bold italic tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#FFF2B2] via-[#FFD700] to-[#E6A100]"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.4)',
              fontFamily: 'cursive, "Brush Script MT", "Comic Sans MS", sans-serif',
            }}
          >
            Lucky Bag
          </h2>

          {/* Right Action Icons (Rules & Help) */}
          <div className="flex items-center gap-3">
            {/* Rules / Notepad Icon */}
            <button className="w-7 h-7 rounded-[6px] border border-[#FFD700] bg-[#490B8F] flex items-center justify-center text-[#FFD700] active:scale-90 transition-transform">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="8" y1="9" x2="16" y2="9" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="12" y2="17" />
              </svg>
            </button>

            {/* Help Question Icon */}
            <button className="w-7 h-7 rounded-full border border-[#FFD700] bg-[#490B8F] flex items-center justify-center text-[#FFD700] text-[15px] font-bold active:scale-90 transition-transform">
              ?
            </button>
          </div>
        </div>

        {/* Tab Switcher: Normal vs Lucky Rain */}
        <div className="w-full h-[42px] rounded-full bg-[#290561] p-1 flex items-center mb-5 shadow-inner">
          <button
            onClick={() => setActiveTab('Normal')}
            className={`flex-1 h-full rounded-full font-bold text-[15px] transition-all flex items-center justify-center ${
              activeTab === 'Normal'
                ? 'bg-gradient-to-r from-[#6911D6] to-[#992BFF] text-white border-[2px] border-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.4)]'
                : 'text-[#A386D4] hover:text-white'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setActiveTab('Lucky Rain')}
            className={`flex-1 h-full rounded-full font-bold text-[15px] transition-all flex items-center justify-center ${
              activeTab === 'Lucky Rain'
                ? 'bg-gradient-to-r from-[#6911D6] to-[#992BFF] text-white border-[2px] border-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.4)]'
                : 'text-[#A386D4] hover:text-white'
            }`}
          >
            Lucky Rain
          </button>
        </div>

        {/* Total Coins Section */}
        <div className="w-full mb-4">
          <p className="text-white text-[15px] font-medium mb-3">Total Coins</p>

          <div className="grid grid-cols-2 gap-3">
            {coinOptions.map((coins) => {
              const isSelected = selectedCoins === coins
              return (
                <button
                  key={coins}
                  onClick={() => setSelectedCoins(coins)}
                  className={`h-[48px] rounded-[8px] flex items-center justify-center gap-2 font-semibold text-[16px] transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#FFFFFF] via-[#E8F0FF] to-[#D0DFFF] text-black shadow-[0_0_10px_rgba(255,255,255,0.6)]'
                      : 'bg-[#3A0D78] text-white hover:bg-[#46128F]'
                  }`}
                >
                  <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-tr from-[#FFDF00] to-[#FFB800] flex items-center justify-center">
                    <span className="text-[#844502] text-[11px] font-black leading-none">S</span>
                  </div>
                  <span>{coins.toLocaleString()}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dropdown Rows: Number of Recipients, Countdown, How to Join */}
        <div className="w-full flex flex-col gap-4 mt-2">
          {/* Number of Recipients */}
          <div className="w-full flex items-center justify-between">
            <span className="text-white text-[15px] font-medium">Number of recipients</span>
            <div className="relative">
              <select
                value={recipients}
                onChange={(e) => setRecipients(Number(e.target.value))}
                className="appearance-none bg-[#1A0340] text-white font-medium text-[15px] pl-4 pr-8 py-1.5 rounded-[6px] focus:outline-none cursor-pointer text-right min-w-[70px]"
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
            <span className="text-white text-[15px] font-medium">Countdown</span>
            <div className="relative">
              <select
                value={countdown}
                onChange={(e) => setCountdown(e.target.value)}
                className="appearance-none bg-[#1A0340] text-white font-medium text-[15px] pl-4 pr-8 py-1.5 rounded-[6px] focus:outline-none cursor-pointer text-right min-w-[80px]"
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
          <div className="w-full flex flex-col">
            <div className="w-full flex items-center justify-between">
              <span className="text-white text-[15px] font-medium">How to join</span>
              <div className="relative">
                <select
                  value={howToJoin}
                  onChange={(e) => setHowToJoin(e.target.value)}
                  className="appearance-none bg-[#1A0340] text-white font-medium text-[15px] pl-4 pr-8 py-1.5 rounded-[6px] focus:outline-none cursor-pointer text-right min-w-[100px]"
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
            <span className="text-[#A386D4] text-[13px] mt-1">Everyone can receive it.</span>
          </div>
        </div>

        {/* Decorative Downward Pointer shape matching image */}
        <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[20px] border-t-[#2A045B]"></div>

      </div>
        
      {/* Big SEND Button Section (Positioned just like the image) */}
      <div className="relative w-full max-w-[440px] flex justify-center pb-8 pt-4 bg-transparent z-10">
        <button className="w-[85%] h-[48px] rounded-full bg-gradient-to-r from-[#C241FF] via-[#9120FF] to-[#C241FF] border border-white/40 shadow-[0_0_15px_rgba(194,65,255,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)] active:scale-95 transition-all flex items-center justify-center">
          <span className="text-white font-bold text-[18px] tracking-wide uppercase drop-shadow-md">
            SEND
          </span>
        </button>
      </div>

    </div>
  )
}
