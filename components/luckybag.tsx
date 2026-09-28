'use client'

import React, { useState } from 'react'

interface LuckyBagProps {
  onClose?: () => void
}

export default function LuckyBag({ onClose }: LuckyBagProps) {
  // Sirf image wale exact values rakhe hain, purana sab hata diya[span_0](start_span)[span_0](end_span)
  const [selectedCoins, setSelectedCoins] = useState<number>(10000)
  const coinOptions = [10000, 100000, 200000, 500000, 1000000, 1500000, 2000000]

  const [recipients, setRecipients] = useState<number>(5)
  const recipientOptions = [5, 10, 30, 50]

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 30Vh Background Image */}
      <div 
        className="absolute top-0 left-0 w-full h-[30vh]"
        style={{
          backgroundImage: `url('/file_000000008aec8230a4f2d1854cb19882.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Main Container */}
      <div 
        className="relative w-full max-w-[440px] mx-auto animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Area: Lucky Bag Title & Record > */}
        <div className="w-full flex justify-between items-end px-4 mb-4 relative h-12">
           {/* Lucky Bag Title Ribbon */}
           <div className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-[#FCD86C] p-[3px] pb-0 rounded-t-[24px] rounded-b-[24px] z-10 shadow-sm">
             <div className="bg-[#FE3C68] px-10 py-1.5 rounded-t-[20px] rounded-b-[20px]">
                <span className="text-white font-bold text-[20px] tracking-wide">Lucky Bag</span>
             </div>
           </div>
           
           {/* Record Button[span_1](start_span)[span_1](end_span) */}
           <div className="absolute right-4 bottom-2 bg-black/15 px-3 py-1 rounded-full cursor-pointer hover:bg-black/25 transition">
             <span className="text-white text-[13px] font-medium">Record &gt;</span>
           </div>
        </div>

        {/* Cream Theme Container */}
        <div className="bg-[#FFF9EA] rounded-t-[32px] w-full p-5 pb-8 shadow-2xl relative z-20 min-h-[380px] flex flex-col">
          
          {/* Gold Quantity Section[span_2](start_span)[span_2](end_span) */}
          <div className="mb-7 mt-4">
            <h3 className="text-[#9C7A63] font-bold text-[15px] mb-3 ml-2">Gold Quantity</h3>
            <div className="flex flex-wrap gap-2.5 px-1">
              {coinOptions.map((coins) => {
                const isSelected = selectedCoins === coins
                return (
                  <button
                    key={coins}
                    onClick={() => setSelectedCoins(coins)}
                    className={`h-[42px] px-5 rounded-full font-bold text-[15px] transition-all flex items-center justify-center ${
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

          {/* Number of people Section[span_3](start_span)[span_3](end_span) */}
          <div className="mb-10">
            <h3 className="text-[#9C7A63] font-bold text-[15px] mb-3 ml-2">Number of people</h3>
            <div className="flex flex-wrap gap-3 px-1">
              {recipientOptions.map((num) => {
                const isSelected = recipients === num
                return (
                  <button
                    key={num}
                    onClick={() => setRecipients(num)}
                    className={`h-[42px] flex-1 min-w-[70px] max-w-[85px] rounded-full font-bold text-[15px] transition-all flex items-center justify-center ${
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

          <div className="flex-1"></div>

          {/* Send Button[span_4](start_span)[span_4](end_span) */}
          <button className="w-[80%] mx-auto h-[52px] bg-[#FE3C68] active:bg-[#E8335D] text-white font-bold text-[22px] rounded-full shadow-[0_4px_12px_rgba(254,60,104,0.3)] transition-transform active:scale-95 flex items-center justify-center mb-2">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
