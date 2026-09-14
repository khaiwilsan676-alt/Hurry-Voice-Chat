'use client'

import { useState } from 'react'

interface LuckyBagProps {
  onClose?: () => void
}

export default function LuckyBag({ onClose }: LuckyBagProps) {
  // State for selected option
  const [selectedPackets, setSelectedPackets] = useState<number>(5)

  // Options array
  const packetOptions = [5, 10, 30, 50]

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center select-none">
      {/* Background click to close - Transparent background */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Card Container - EKDAM COMPACT SIZE */}
      <div
        className="relative w-[85%] max-w-[340px] flex flex-col items-center shadow-2xl rounded-3xl animate-in zoom-in duration-300"
        style={{
          backgroundImage: `url('/file_0000000047b881f49919bca702799d8e.png')`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '370px', // Bhot compact height
          padding: '90px 20px 20px 20px', // Image ke header aur borders ke andar fit rakhne ke liye
        }}
      >
        {/* Top Icons (List and Help) - Upar image ke hisaab se set kiya */}
        <div className="absolute top-[75px] left-6 right-6 flex justify-between items-center z-10">
          {/* List Icon (Chota size) */}
          <button className="w-7 h-7 bg-white/20 border-[1.5px] border-white/80 rounded-md flex flex-col justify-center items-center gap-[3px] active:scale-95 transition-transform">
            <div className="w-3.5 h-[1.5px] bg-white rounded-full"></div>
            <div className="w-3.5 h-[1.5px] bg-white rounded-full"></div>
            <div className="w-3.5 h-[1.5px] bg-white rounded-full"></div>
          </button>

          {/* Question Mark Icon (Chota size) */}
          <button className="w-7 h-7 bg-white/20 border-[1.5px] border-white/80 rounded-full flex justify-center items-center active:scale-95 transition-transform text-white font-bold text-sm">
            ?
          </button>
        </div>

        {/* ========================================= */}
        {/* COMPACT DARK RED CARD WRAPPER */}
        {/* ========================================= */}
        <div className="w-full bg-[#8F1616] rounded-[16px] p-3 mt-1 shadow-lg flex flex-col items-center border border-white/5">
          
          {/* Section: Packets Number */}
          <div className="w-full flex flex-col items-center my-1">
            <h3 className="text-white font-extrabold text-[16px] mb-2 tracking-wide drop-shadow-md">
              Packets Number
            </h3>
            {/* Pill Card - Size aur padding compact */}
            <div className="w-full bg-black/10 p-1 rounded-full flex items-center justify-between shadow-inner backdrop-blur-sm">
              {packetOptions.map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedPackets(num)}
                  className={`flex-1 py-1.5 text-[13px] font-bold rounded-full transition-all ${
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

        {/* Spacer to push Send button down perfectly */}
        <div className="flex-1"></div>

        {/* Big SEND Button (Compact height aur text) */}
        <button
          className="w-[85%] h-[42px] rounded-full bg-gradient-to-b from-[#FFF7C2] via-[#FFC04D] to-[#FF9000] shadow-[0_4px_10px_rgba(200,0,0,0.5),_inset_0_-3px_5px_rgba(214,115,0,0.8),_inset_0_2px_4px_rgba(255,255,255,0.9)] active:translate-y-1 active:shadow-[0_2px_4px_rgba(200,0,0,0.5),_inset_0_-1px_3px_rgba(214,115,0,0.8)] transition-all flex justify-center items-center mx-auto mb-1 mt-4"
        >
          <span
            className="text-white font-black text-[18px] tracking-wider"
            style={{
              textShadow: '0px 1px 3px rgba(214, 100, 0, 0.8)',
            }}
          >
            Send
          </span>
        </button>
      </div>
    </div>
  )
}

