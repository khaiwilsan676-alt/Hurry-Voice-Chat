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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm select-none">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Card Container */}
      <div
        className="relative w-[90%] max-w-[360px] flex flex-col items-center shadow-2xl rounded-3xl animate-in zoom-in duration-300"
        style={{
          backgroundImage: `url('/file_0000000047b881f49919bca702799d8e.png')`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '480px',
          padding: '110px 20px 24px 20px', // Pushed content down to make room for top graphics
        }}
      >
        {/* Top Icons (List and Help) */}
        <div className="absolute top-[85px] left-5 right-5 flex justify-between items-center z-10">
          {/* List Icon */}
          <button className="w-7 h-7 bg-white/20 border-2 border-white/80 rounded-md flex flex-col justify-center items-center gap-0.5 active:scale-95 transition-transform">
            <div className="w-3.5 h-[2px] bg-white rounded-full"></div>
            <div className="w-3.5 h-[2px] bg-white rounded-full"></div>
            <div className="w-3.5 h-[2px] bg-white rounded-full"></div>
          </button>

          {/* Question Mark Icon */}
          <button className="w-7 h-7 bg-white/20 border-2 border-white/80 rounded-full flex justify-center items-center active:scale-95 transition-transform text-white font-extrabold text-sm">
            ?
          </button>
        </div>

        {/* Section 1: Gold Coins Count */}
        <div className="w-full flex flex-col items-center mt-4">
          <h3 className="text-white font-extrabold text-[19px] mb-3 tracking-wide drop-shadow-md">
            Gold Coins Count
          </h3>
          <div className="w-full bg-[#992020]/60 p-1 rounded-full flex items-center justify-between shadow-inner backdrop-blur-sm">
            {coinOptions.map((amount) => (
              <button
                key={amount}
                onClick={() => setSelectedCoins(amount)}
                className={`flex-1 py-2 text-[13px] font-bold rounded-full transition-all ${
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
        <div className="w-full flex flex-col items-center mt-6">
          <h3 className="text-white font-extrabold text-[19px] mb-3 tracking-wide drop-shadow-md">
            Packets Number
          </h3>
          <div className="w-full bg-[#992020]/60 p-1 rounded-full flex items-center justify-between shadow-inner backdrop-blur-sm">
            {packetOptions.map((num) => (
              <button
                key={num}
                onClick={() => setSelectedPackets(num)}
                className={`flex-1 py-2 text-[15px] font-bold rounded-full transition-all ${
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

        {/* Spacer to push bottom content down */}
        <div className="flex-1"></div>

        {/* Bottom Details Row */}
        <div className="w-full flex justify-between items-center px-1 mb-4 mt-8">
          {/* Balance */}
          <div className="flex items-center gap-1.5 drop-shadow-md">
            <div className="w-5 h-5 bg-yellow-400 rounded-full border-2 border-white flex justify-center items-center">
              <span className="text-[#D97700] text-[10px] font-black">H</span>
            </div>
            <span className="text-yellow-300 font-bold text-[17px] tracking-wide">
              322,661
            </span>
          </div>

          {/* Recharge Link */}
          <button className="text-yellow-300 font-bold text-[15px] drop-shadow-md active:scale-95 transition-transform">
            Recharge&gt;&gt;
          </button>
        </div>

        {/* Big SEND Button */}
        <button
          className="w-full h-[52px] rounded-full bg-gradient-to-b from-[#FFF7C2] via-[#FFC04D] to-[#FF9000] shadow-[0_5px_15px_rgba(200,0,0,0.5),_inset_0_-4px_6px_rgba(214,115,0,0.8),_inset_0_2px_4px_rgba(255,255,255,0.9)] active:translate-y-1 active:shadow-[0_2px_5px_rgba(200,0,0,0.5),_inset_0_-2px_4px_rgba(214,115,0,0.8)] transition-all flex justify-center items-center"
        >
          <span
            className="text-white font-black text-2xl tracking-wider"
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

