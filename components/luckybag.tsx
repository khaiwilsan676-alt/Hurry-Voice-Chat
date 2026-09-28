'use client'

import React, { useState } from 'react'

interface LuckyBagProps {
  onClose?: () => void
}

export default function LuckyBag({ onClose }: LuckyBagProps) {
  // Sirf image wale exact values rakhe hain[span_1](start_span)[span_1](end_span)
  const [selectedCoins, setSelectedCoins] = useState<number>(10000)
  const coinOptions = [10000, 100000, 200000, 500000, 1000000, 1500000, 2000000]

  const [recipients, setRecipients] = useState<number>(5)
  const recipientOptions = [5, 10, 30, 50]

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Main Container - Exactly 30vh at the bottom, acting as the background image container */}
      <div 
        className="relative w-full max-w-[440px] mx-auto h-[30vh] animate-in slide-in-from-bottom duration-300 rounded-t-[24px] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: `url('/file_000000008aec8230a4f2d1854cb19882.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Transparent UI wrapper overlapping directly on the image */}
        <div className="w-full h-full p-3 sm:p-4 flex flex-col relative z-20 overflow-y-auto">
          
          {/* Header Area: Lucky Bag Title & Record > */}
          <div className="w-full flex justify-between items-center mb-2 relative h-8 shrink-0">
             {/* Lucky Bag Title Ribbon[span_2](start_span)[span_2](end_span) */}
             <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-[#FCD86C] p-[2px] pb-0 rounded-t-[14px] rounded-b-[14px] shadow-sm">
               <div className="bg-[#FE3C68] px-6 py-0.5 rounded-t-[12px] rounded-b-[12px]">
                  <span className="text-white font-bold text-[15px] tracking-wide">Lucky Bag</span>
               </div>
             </div>
             
             {/* Record Button[span_3](start_span)[span_3](end_span) */}
             <div className="absolute right-0 top-0 bg-black/40 px-2.5 py-1 rounded-full cursor-pointer hover:bg-black/50 transition">
               <span className="text-white text-[12px] font-medium">Record &gt;</span>
             </div>
          </div>

          {/* Gold Quantity Section[span_4](start_span)[span_4](end_span) */}
          <div className="mb-2 mt-3 shrink-0">
            <h3 className="text-white drop-shadow-md font-bold text-[13px] mb-1.5 ml-1">Gold Quantity</h3>
            <div className="flex flex-wrap gap-1.5 px-1">
              {coinOptions.map((coins) => {
                const isSelected = selectedCoins === coins
                return (
                  <button
                    key={coins}
                    onClick={() => setSelectedCoins(coins)}
                    className={`h-[30px] px-3 rounded-full font-bold text-[12px] transition-all flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#FE3C68] text-white shadow-md'
                        : 'bg-[#FFECCC] text-[#BA8154] hover:bg-[#FFDFB8]'
                    }`}
                  >
                    {coins}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Number of people Section[span_5](start_span)[span_5](end_span) */}
          <div className="mb-3 shrink-0">
            <h3 className="text-white drop-shadow-md font-bold text-[13px] mb-1.5 ml-1">Number of people</h3>
            <div className="flex flex-wrap gap-2 px-1">
              {recipientOptions.map((num) => {
                const isSelected = recipients === num
                return (
                  <button
                    key={num}
                    onClick={() => setRecipients(num)}
                    className={`h-[30px] flex-1 min-w-[50px] max-w-[70px] rounded-full font-bold text-[12px] transition-all flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#FE3C68] text-white shadow-md'
                        : 'bg-[#FFECCC] text-[#BA8154] hover:bg-[#FFDFB8]'
                    }`}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Spacer to push Send button to the bottom if there's extra room */}
          <div className="flex-1 min-h-[5px]"></div>

          {/* Send Button[span_6](start_span)[span_6](end_span) */}
          <button className="w-[75%] mx-auto h-[40px] shrink-0 bg-[#FE3C68] active:bg-[#E8335D] text-white font-bold text-[18px] rounded-full shadow-[0_4px_10px_rgba(254,60,104,0.4)] transition-transform active:scale-95 flex items-center justify-center mb-1">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
