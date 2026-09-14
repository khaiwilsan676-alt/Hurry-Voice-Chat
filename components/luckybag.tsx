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
    <div className="fixed inset-0 z-[200] flex items-end justify-center select-none bg-black/40 backdrop-blur-[1px]">
      {/* Backdrop Click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Bottom Sheet Container */}
      <div
        className="relative w-full max-w-[440px] flex flex-col items-center pb-6 pt-3 px-4 shadow-[0_-10px_35px_rgba(0,0,0,0.8)] rounded-t-[34px] animate-in slide-in-from-bottom duration-300 overflow-visible"
        style={{
          backgroundImage: `url('/file_0000000073ac8211a90c9183e250a8c1.png')`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Top Header Row: Balance Pill, Title, Right Action Icons */}
        <div className="w-full flex items-center justify-between mt-1 mb-2 px-1">
          {/* Balance Pill */}
          <div className="flex items-center gap-1.5 bg-[#32016B]/70 border border-white/10 rounded-full px-2.5 py-1 backdrop-blur-sm cursor-pointer active:scale-95 transition-transform">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-sm">
              <span className="text-[#874900] text-[10px] font-black leading-none">$</span>
            </div>
            <span className="text-white text-[13px] font-bold">16</span>
            <span className="text-white/70 text-[11px] font-bold">&gt;</span>
          </div>

          {/* Lucky Bag Title */}
          <h2
            className="text-[28px] font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#FFF2B2] via-[#FFD700] to-[#E6A100]"
            style={{
              textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              fontFamily: 'cursive, sans-serif',
            }}
          >
            Lucky Bag
          </h2>

          {/* Right Action Icons (Rules & Help) */}
          <div className="flex items-center gap-2">
            {/* Rules / Notepad Icon */}
            <button className="w-7 h-7 rounded-lg border border-[#D8A7FF]/50 bg-[#6510BF]/60 flex items-center justify-center text-[#EBD0FF] active:scale-90 transition-transform">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="13" y2="17" />
              </svg>
            </button>

            {/* Help Question Icon */}
            <button className="w-7 h-7 rounded-full border border-[#D8A7FF]/50 bg-[#6510BF]/60 flex items-center justify-center text-[#EBD0FF] text-[14px] font-black active:scale-90 transition-transform">
              ?
            </button>
          </div>
        </div>

        {/* Tab Switcher: Normal vs Lucky Rain */}
        <div className="w-full h-[46px] rounded-full bg-[#35026F]/90 p-1 flex items-center my-2 shadow-inner border border-purple-400/20">
          <button
            onClick={() => setActiveTab('Normal')}
            className={`flex-1 h-full rounded-full font-black text-[15px] transition-all flex items-center justify-center ${
              activeTab === 'Normal'
                ? 'bg-gradient-to-b from-[#7A22E2] to-[#450596] text-white shadow-[0_2px_8px_rgba(0,0,0,0.5)] border-2 border-[#FFDF6C]'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setActiveTab('Lucky Rain')}
            className={`flex-1 h-full rounded-full font-black text-[15px] transition-all flex items-center justify-center ${
              activeTab === 'Lucky Rain'
                ? 'bg-gradient-to-b from-[#7A22E2] to-[#450596] text-white shadow-[0_2px_8px_rgba(0,0,0,0.5)] border-2 border-[#FFDF6C]'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            Lucky Rain
          </button>
        </div>

        {/* Total Coins Section */}
        <div className="w-full mt-2 mb-3">
          <p className="text-white/90 text-[14px] font-bold mb-2 ml-1">Total Coins</p>

          <div className="grid grid-cols-2 gap-2.5">
            {coinOptions.map((coins) => {
              const isSelected = selectedCoins === coins
              return (
                <button
                  key={coins}
                  onClick={() => setSelectedCoins(coins)}
                  className={`h-[44px] rounded-[14px] flex items-center justify-center gap-2 font-black text-[16px] transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#DFE4F2] via-[#F6F8FD] to-[#D5E1FB] text-[#2D0B5A] shadow-[0_0_12px_rgba(255,255,255,0.4)] border border-white'
                      : 'bg-[#40087F]/80 text-white hover:bg-[#4C0B96] border border-purple-300/10 shadow-sm'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-200 border border-white flex items-center justify-center shadow-sm">
                    <span className="text-[#844502] text-[11px] font-black leading-none">$</span>
                  </div>
                  <span>{coins.toLocaleString()}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dropdown Rows: Number of Recipients, Countdown, How to Join */}
        <div className="w-full flex flex-col gap-2.5 my-1">
          {/* Number of Recipients */}
          <div className="w-full flex items-center justify-between">
            <span className="text-white/90 text-[14px] font-semibold">Number of recipients</span>
            <div className="relative">
              <select
                value={recipients}
                onChange={(e) => setRecipients(Number(e.target.value))}
                className="appearance-none bg-[#370570] text-white font-bold text-[14px] px-4 py-1.5 pr-8 rounded-[12px] border border-purple-300/20 focus:outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/70 text-[11px]">
                ▼
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="w-full flex items-center justify-between">
            <span className="text-white/90 text-[14px] font-semibold">Countdown</span>
            <div className="relative">
              <select
                value={countdown}
                onChange={(e) => setCountdown(e.target.value)}
                className="appearance-none bg-[#370570] text-white font-bold text-[14px] px-4 py-1.5 pr-8 rounded-[12px] border border-purple-300/20 focus:outline-none cursor-pointer"
              >
                <option value="Now">Now</option>
                <option value="30s">30s</option>
                <option value="1m">1m</option>
                <option value="5m">5m</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/70 text-[11px]">
                ▼
              </div>
            </div>
          </div>

          {/* How to Join */}
          <div className="w-full flex items-center justify-between">
            <span className="text-white/90 text-[14px] font-semibold">How to join</span>
            <div className="relative">
              <select
                value={howToJoin}
                onChange={(e) => setHowToJoin(e.target.value)}
                className="appearance-none bg-[#370570] text-white font-bold text-[14px] px-4 py-1.5 pr-8 rounded-[12px] border border-purple-300/20 focus:outline-none cursor-pointer"
              >
                <option value="Everyone">Everyone</option>
                <option value="Followers">Followers</option>
                <option value="VIP Only">VIP Only</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/70 text-[11px]">
                ▼
              </div>
            </div>
          </div>

          {/* Description subtext */}
          <p className="text-[#C4A5FF] text-[12px] -mt-1 font-medium">Everyone can receive it.</p>
        </div>

        {/* Decorative Downward Purple Tip / Notch */}
        <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[14px] border-t-[#49048E] -mb-1 mt-2 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"></div>

        {/* Big SEND Button with Gold Border & Neon Gradient */}
        <div className="w-full mt-4 flex justify-center">
          <button className="w-[88%] h-[50px] rounded-full bg-gradient-to-r from-[#A817FF] via-[#7B1CFD] to-[#A817FF] border-2 border-[#FFDF6C] shadow-[0_0_15px_rgba(168,23,255,0.6),inset_0_1px_2px_rgba(255,255,255,0.7)] active:scale-95 transition-all flex items-center justify-center">
            <span
              className="text-white font-black text-[19px] tracking-widest uppercase"
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.6)',
              }}
            >
              SEND
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
