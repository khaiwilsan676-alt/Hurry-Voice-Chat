'use client'

import React, { useState } from 'react'

interface LuckyBagProps {
  onClose?: () => void
}

export default function LuckyBag({ onClose }: LuckyBagProps) {
  const [selectedCoins, setSelectedCoins] = useState<number>(10000)
  const coinOptions = [10000, 100000, 200000, 500000, 1000000, 1500000, 2000000]

  const [recipients, setRecipients] = useState<number>(5)
  const recipientOptions = [5, 10, 30, 50]

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Main Container - Original height adjust karne ke liye min-height di hai */}
      <div 
        className="relative w-full max-w-[440px] mx-auto min-h-[400px] flex flex-col justify-end animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: `url('/file_000000008aec8230a4f2d1854cb19882.png')`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="w-full h-full p-4 flex flex-col relative z-20">
          
          {/* Top Heading hata diya - Sirf Record Button rakha hai */}
          <div className="w-full flex justify-end items-center mb-6 relative shrink-0">
             <div className="bg-black/40 px-3 py-1.5 rounded-full cursor-pointer hover:bg-black/50 transition">
               <span className="text-white text-[13px] font-medium">Record &gt;</span>
             </div>
          </div>

          <div className="mt-auto">
            {/* Gold Quantity Section - Title text red */}
            <div className="mb-4 shrink-0">
              <h3 className="text-[#FE3C68] drop-shadow-sm font-bold text-[16px] mb-2 ml-1">Gold Quantity</h3>
              <div className="flex flex-wrap gap-2 px-1">
                {coinOptions.map((coins) => {
                  const isSelected = selectedCoins === coins
                  return (
                    <button
                      key={coins}
                      onClick={() => setSelectedCoins(coins)}
                      className={`h-[36px] px-4 rounded-full font-bold text-[14px] transition-all flex items-center justify-center ${
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

            {/* Number of people Section - Title text red */}
            <div className="mb-6 shrink-0">
              <h3 className="text-[#FE3C68] drop-shadow-sm font-bold text-[16px] mb-2 ml-1">Number of people</h3>
              <div className="flex flex-wrap gap-2 px-1">
                {recipientOptions.map((num) => {
                  const isSelected = recipients === num
                  return (
                    <button
                      key={num}
                      onClick={() => setRecipients(num)}
                      className={`h-[36px] flex-1 min-w-[60px] max-w-[80px] rounded-full font-bold text-[14px] transition-all flex items-center justify-center ${
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

            {/* Send Button - rounded-none karke ekdam square kar diya */}
            <button className="w-[90%] mx-auto h-[48px] bg-[#FE3C68] active:bg-[#E8335D] text-white font-bold text-[20px] rounded-none shadow-md transition-transform active:scale-95 flex items-center justify-center mb-2">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
