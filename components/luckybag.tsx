'use client'

import { useState } from 'react'

interface LuckyBagProps {
  onClose?: () => void
}

export default function LuckyBag({ onClose }: LuckyBagProps) {
  // States for selected options
  const [selectedCoins, setSelectedCoins] = useState<number>(50000)
  const [selectedPackets, setSelectedPackets] = useState<number>(5)

  // Options arrays
  const coinOptions = [50000, 250000, 500000, 5000000]
  const packetOptions = [5, 10, 30, 50]

  return (
    // items-end aur pb-12 lagaya jisse card center se niche shift ho jaye
    <div className="fixed inset-0 z-[200] flex items-end justify-center pb-12 select-none">
      {/* Background click to close - Transparent background */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Card Container */}
      <div
        className="relative w-[95%] max-w-[420px] flex flex-col items-center shadow-2xl rounded-3xl animate-in zoom-in duration-300"
        style={{
          backgroundImage: `url('/file_0000000047b881f49919bca702799d8e.png')`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '550px', 
          // Padding thori adjust ki taaki niche wale icons overlap na karein
          padding: '140px 24px 28px 24px', 
        }}
      >
        {/* Top Icons (List and Help) - Top value badha kar niche kiya */}
        <div className="absolute top-[125px] left-6 right-6 flex justify-between items-center z-10">
          {/* List Icon */}
          <button className="w-8 h-8 bg-white/20 border-2 border-white/80 rounded-md flex flex-col justify-center items-center gap-1 active:scale-95 transition-transform">
            <div className="w-4 h-[2px] bg-white rounded-full"></div>
            <div className="w-4 h-[2px] bg-white rounded-full"></div>
            <div className="w-4 h-[2px] bg-white rounded-full"></div>
          </button>

          {/* Question Mark Icon */}
          <button className="w-8 h-8 bg-white/20 border-2 border-white/80 rounded-full flex justify-center items-center active:scale-95 transition-transform text-white font-extrabold text-base">
            ?
          </button>
        </div>

        {/* ========================================= */}
        {/* BIG DARK RED CARD WRAPPER - Padding aur margin kam karke chota kiya */}
        {/* ========================================= */}
        <div className="w-full bg-[#8F1616] rounded-[20px] p-3 mt-2 shadow-lg flex flex-col items-center border border-white/5">
          
          {/* Section 1: Gold Coins Count */}
          <div className="w-full flex flex-col items-center mb-1">
            <h3 className="text-white font-extrabold text-[18px] mb-2 tracking-wide drop-shadow-md">
              Gold Coins Count
            </h3>
            {/* Pill Card */}
            <div className="w-[90%] bg-black/10 p-1 rounded-full flex items-center justify-between shadow-inner backdrop-blur-sm">
              {coinOptions.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setSelectedCoins(amount)}
                  // py-1.5 karke buttons chote kiye
                  className={`flex-1 py-1.5 text-[13px] font-bold rounded-full transition-all ${
                    selectedCoins === amount
                      ? 'bg-white text-[#E52E2E] shadow-md scale-100'
                      : 'text-white hover:bg-white/10 scale-95'
                  }`}
                >
                  {amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Packets Number */}
          <div className="w-full flex flex-col items-center mt-4 mb-1">
            <h3 className="text-white font-extrabold text-[18px] mb-2 tracking-wide drop-shadow-md">
              Packets Number
            </h3>
            {/* Pill Card */}
            <div className="w-[90%] bg-black/10 p-1 rounded-full flex items-center justify-between shadow-inner backdrop-blur-sm">
              {packetOptions.map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedPackets(num)}
                  // py-1.5 karke buttons chote kiye
                  className={`flex-1 py-1.5 text-[15px] font-bold rounded-full transition-all ${
                    selectedPackets === num
                      ? 'bg-white text-[#E52E2E] shadow-md scale-100'
                      : 'text-white hover:bg-white/10 scale-95'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

        </div>
        {/* ========================================= */}
        {/* END DARK RED CARD WRAPPER */}
        {/* ========================================= */}

        {/* Spacer to push bottom content down */}
        <div className="flex-1"></div>

        {/* Bottom Details Row - Margins kam kiye (mt-3, mb-3) taaki upar shift ho */}
        <div className="w-full flex justify-between items-center px-2 mb-3 mt-3">
          {/* Balance */}
          <div className="flex items-center gap-2 drop-shadow-md">
            <div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-white flex justify-center items-center">
              <span className="text-[#D97700] text-[12px] font-black">H</span>
            </div>
            <span className="text-yellow-300 font-bold text-[19px] tracking-wide">
              322,661
            </span>
          </div>

          {/* Recharge Link */}
          <button className="text-yellow-300 font-bold text-[16px] drop-shadow-md active:scale-95 transition-transform">
            Recharge&gt;&gt;
          </button>
        </div>

        {/* Big SEND Button (Chota size aur mx-auto center) */}
        <button
          className="w-[85%] h-[48px] rounded-full bg-gradient-to-b from-[#FFF7C2] via-[#FFC04D] to-[#FF9000] shadow-[0_5px_15px_rgba(200,0,0,0.5),_inset_0_-4px_6px_rgba(214,115,0,0.8),_inset_0_2px_4px_rgba(255,255,255,0.9)] active:translate-y-1 active:shadow-[0_2px_5px_rgba(200,0,0,0.5),_inset_0_-2px_4px_rgba(214,115,0,0.8)] transition-all flex justify-center items-center mx-auto"
        >
          <span
            className="text-white font-black text-[20px] tracking-wider"
            style={{
              textShadow: '0px 2px 4px rgba(214, 100, 0, 0.8)',
            }}
          >
            Send
          </span>
        </button>
      </div>
    </div>
  )
}

