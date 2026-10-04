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

  const [showClaim, setShowClaim] = useState(false)
  const [showRules, setShowRules] = useState(false)
  
  // New state for countdown selection
  const [selectedTime, setSelectedTime] = useState<string>('Now')
  const timeOptions = ['Now', '5 min', '10 min', '20 min']

  const rules = [
    'Click and select the Amount to be send in the lucky packet',
    'Select the Number of the user who can open',
    'If no user grab lucky packet coins will be return in the wallet of the packet sender',
  ]

  return (
    <>
      <div className="fixed inset-0 z-[200] flex flex-col justify-end select-none">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        {/* Main Container */}
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
          {/* ===== Top-Left Corner Document Icon (with Y) ===== */}
          <button
            onClick={() => setShowClaim(true)}
            className="absolute top-8 left-4 z-30 w-7 h-7 active:scale-95 transition"
            aria-label="Open claim details"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="512"
              height="512"
              viewBox="0 0 512 512"
              className="w-full h-full"
            >
              <g
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="94" y="76" width="324" height="360" rx="48" />
                <path d="M174 194 H292" />
                <path d="M174 256 H338" />
                <path d="M174 318 H338" />
              </g>

              {/* "Y" in top-left corner */}
              <path
                d="M6 6 L26 26 L46 6 M26 26 L26 46"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="w-full h-full p-4 flex flex-col relative z-20">

            {/* Top Right - Question Mark Icon */}
            <div className="w-full flex justify-end items-center mb-6 mt-4 relative shrink-0">
              <button
                onClick={() => setShowRules(true)}
                className="w-7 h-7 cursor-pointer active:scale-95 transition"
                aria-label="Help"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 512 512"
                >
                  <circle
                    cx="256"
                    cy="256"
                    r="210"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="18"
                  />
                  <g
                    transform="translate(256 256) scale(0.65) translate(-280 -267)"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="36"
                    strokeLinecap="round"
                  >
                    <path
                      d="M176 176
                         C176 112 224 80 280 80
                         C344 80 384 120 384 176
                         C384 232 344 256 296 288
                         C264 312 256 336 256 368"
                    />
                    <circle cx="256" cy="432" r="22" fill="#FFFFFF" stroke="none" />
                  </g>
                </svg>
              </button>
            </div>

            <div className="mt-auto">
              {/* Gold Quantity Section */}
              <div className="mb-4 shrink-0">
                <h3 className="text-[#8B5E3C] drop-shadow-sm font-bold text-[16px] mb-2 ml-1">
                  Gold Quantity
                </h3>
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
                            : 'bg-[#F5D9A8] text-[#8B5E3C] hover:bg-[#EFC98A]'
                        }`}
                      >
                        {coins}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Number of people Section */}
              <div className="mb-6 shrink-0">
                <h3 className="text-[#8B5E3C] drop-shadow-sm font-bold text-[16px] mb-2 ml-1">
                  Number of people
                </h3>
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
                            : 'bg-[#F5D9A8] text-[#8B5E3C] hover:bg-[#EFC98A]'
                        }`}
                      >
                        {num}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ================= COUNTDOWN & TIME OPTIONS SECTION ================= */}
              {/* Added just above the Send button as requested */}
              <div className="mb-5 shrink-0 flex flex-col gap-3">
                
                {/* Countdown Header */}
                <div className="flex items-center justify-center gap-2 px-1">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#F5D9A8] to-[#F5D9A8]"></div>
                  <div className="w-2 h-2 rotate-45 bg-[#F5D9A8]"></div>
                  <span className="text-[#F5D9A8] font-bold text-[15px] tracking-wide drop-shadow-sm">
                    countdown
                  </span>
                  <div className="w-2 h-2 rotate-45 bg-[#F5D9A8]"></div>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#F5D9A8] to-[#F5D9A8]"></div>
                </div>

                {/* Time Options */}
                <div className="flex justify-between gap-2 px-1">
                  {timeOptions.map((time) => {
                    const isSelected = selectedTime === time
                    return (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`flex-1 h-[36px] rounded-full font-bold text-[13px] transition-all flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#FE3C68] text-white shadow-md border border-[#FE3C68]'
                            : 'bg-[#F5D9A8] text-[#8B5E3C] hover:bg-[#EFC98A] border border-transparent'
                        }`}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={() => setShowClaim(true)}
                className="w-[90%] mx-auto h-[48px] bg-[#FE3C68] active:bg-[#E8335D] text-white font-bold text-[20px] rounded-full shadow-md transition-transform active:scale-95 flex items-center justify-center mb-2"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RULES BOTTOM SHEET ================= */}
      {showRules && (
        <div className="fixed inset-0 z-[400] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowRules(false)}
          />

          <div className="relative w-full max-w-[440px] mx-auto h-[30vh] bg-black rounded-t-3xl flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="relative w-full flex items-center justify-center pt-4 pb-3 shrink-0">
              <button
                onClick={() => setShowRules(false)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center active:scale-95 transition"
                aria-label="Back"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
              </button>

              <h2 className="text-white font-bold text-[17px]">Rules</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <ul className="space-y-3">
                {rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#FE3C68] text-[14px] mt-[2px]">•</span>
                    <span className="text-white/90 text-[13.5px] leading-snug">
                      {rule}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ================= CLAIM DETAILS SHEET ================= */}
      {showClaim && (
        <div className="fixed inset-0 z-[300] flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
          <div className="relative w-full shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1536 700"
              className="w-full h-auto block"
            >
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#E92350" />
                  <stop offset="100%" stopColor="#E91E46" />
                </linearGradient>
                <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FBE0C5" />
                  <stop offset="100%" stopColor="#FFF4A8" />
                </linearGradient>
              </defs>

              <rect width="1536" height="700" fill="#FFFFFF" />

              <path
                d="M0 0 H1536 V365
                   C1320 650 1060 570 768 580
                   C476 570 216 650 0 365 Z"
                fill="url(#bg)"
              />

              <path
                d="M0 365
                   C216 650 476 570 768 580
                   C1060 570 1320 650 1536 365
                   V445
                   C1320 730 1060 650 768 660
                   C476 650 216 730 0 445 Z"
                fill="url(#gold)"
              />

              <path
                d="M0 445
                   C216 730 476 650 768 660
                   C1060 650 1320 730 1536 445
                   V700 H0 Z"
                fill="#FFFFFF"
              />
            </svg>

            <button
              onClick={() => setShowClaim(false)}
              className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center active:scale-95 transition"
              aria-label="Back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>

            <h1
              className="absolute left-0 right-0 text-center text-white font-bold text-[22px] tracking-wide pointer-events-none drop-shadow-sm"
              style={{ top: '35%' }}
            >
              Claim details
            </h1>
          </div>

          <div className="flex-1 bg-white" />
        </div>
      )}
    </>
  )
}
