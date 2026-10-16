'use client';

import React, { useState } from 'react';

interface PkScreenProps {
  onClose?: () => void;
}

export default function PkScreen({ onClose }: PkScreenProps) {
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const modes = ['Votes', 'Coins', 'Earning'];
  const times = ['15s', '1min', '3mins', '5mins', '10mins', '15mins'];

  return (
    <div className="flex flex-col h-full bg-[#0a0520] text-white px-3 py-2 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-yellow-400 rounded-full flex justify-center items-center">
            <span className="text-[10px]">🥊</span>
          </div>
          <h2 className="text-sm font-bold">Battle</h2>
        </div>
        <button className="w-4 h-4 rounded-full border border-white flex justify-center items-center text-[8px] font-bold hover:bg-white/10 transition-colors">
          ?
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-[#1b1240] rounded-lg px-2 py-1.5 flex justify-between items-center mb-2 border border-[#2a1e5c]">
        <div className="flex items-center gap-2">
          <img
            src="https://via.placeholder.com/50"
            alt="Avatar"
            className="w-7 h-7 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-[11px] leading-tight">A a r a v 💙</h3>
            <p className="text-[#A098C0] text-[9px] leading-tight">
              Today's earning <span className="text-[9px]">🪙</span> 0
            </p>
          </div>
        </div>
        <button className="bg-[#35295e] py-0.5 px-2 rounded-md text-[9px] hover:bg-[#4a3882] transition-colors">
          Details &gt;
        </button>
      </div>

      {/* Select People - Image ke hisaab se full width aur bada kiya */}
      <h3 className="text-[#A098C0] font-semibold text-[11px] mb-1.5">Select People</h3>
      <div className="flex justify-between gap-2 mb-3">
        <button className="flex-1 h-20 bg-[#1a3b9e] rounded-xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95">
          <div className="w-8 h-8 rounded-full bg-white/20 flex justify-center items-center">
            <span className="text-xl font-light leading-none text-white pb-1">+</span>
          </div>
        </button>
        <button className="flex-1 h-20 bg-[#a81666] rounded-xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95">
          <div className="w-8 h-8 rounded-full bg-white/20 flex justify-center items-center">
            <span className="text-xl font-light leading-none text-white pb-1">+</span>
          </div>
        </button>
      </div>

      {/* Mode - Same size as image */}
      <h3 className="text-[#A098C0] font-semibold text-[11px] mb-1.5">Mode</h3>
      <div className="flex gap-2 mb-3">
        {modes.map((mode) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode)}
            className={`relative flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
              selectedMode === mode
                ? 'bg-[#4a3882] border border-[#7c5ce6] text-[#E0D8FF]'
                : 'bg-[#35295e] border border-transparent text-[#E0D8FF] hover:bg-[#403273]'
            }`}
          >
            {mode}
            {mode === 'Earning' && (
              <div className="absolute -top-1.5 -right-1.5 bg-orange-500 w-4 h-4 rounded-full flex justify-center items-center text-[8px]">
                🔥
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Time - Same size as image, thoda upar */}
      <h3 className="text-[#A098C0] font-semibold text-[11px] mb-1.5 mt-auto">Time</h3>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {times.map((time) => (
          <button
            key={time}
            onClick={() => setSelectedTime(time)}
            className={`py-2 rounded-md text-xs font-medium transition-colors ${
              selectedTime === time
                ? 'bg-[#4a3882] border border-[#7c5ce6] text-[#E0D8FF]'
                : 'bg-[#35295e] border border-transparent text-[#E0D8FF] hover:bg-[#403273]'
            }`}
          >
            {time}
          </button>
        ))}
      </div>

      {/* Confirm Button - Image ke hisaab se thoda mota kiya */}
      <button
        onClick={onClose}
        className="w-full bg-[#1b5a7a] py-3 rounded-full text-[#A0B0C0] font-bold text-sm opacity-70 hover:opacity-100 transition-opacity"
      >
        Confirm
      </button>
    </div>
  );
}
