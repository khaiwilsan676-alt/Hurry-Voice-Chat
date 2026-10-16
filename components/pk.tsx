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
    <div className="flex flex-col h-full bg-[#0a0520] text-white p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-5 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-400 rounded-full flex justify-center items-center">
            <span className="text-sm">🥊</span>
          </div>
          <h2 className="text-xl font-bold">Battle</h2>
        </div>
        <button className="w-6 h-6 rounded-full border border-white flex justify-center items-center text-sm font-bold hover:bg-white/10 transition-colors">
          ?
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-[#1b1240] rounded-xl p-4 flex justify-between items-center mb-6 border border-[#2a1e5c]">
        <div className="flex items-center gap-3">
          <img
            src="https://via.placeholder.com/50"
            alt="Avatar"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-base mb-1">A a r a v 💙</h3>
            <p className="text-[#A098C0] text-xs">
              Today's earning <span className="text-xs">🪙</span> 0
            </p>
          </div>
        </div>
        <button className="bg-[#35295e] py-1.5 px-3 rounded-xl text-xs hover:bg-[#4a3882] transition-colors">
          Details &gt;
        </button>
      </div>

      {/* Select People */}
      <h3 className="text-[#A098C0] font-semibold text-base mb-3">Select People</h3>
      <div className="flex justify-between gap-4 mb-6">
        <button className="flex-1 aspect-[1.2] bg-[#1a3b9e] rounded-2xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95">
          <div className="w-12 h-12 rounded-full bg-white/20 flex justify-center items-center">
            <span className="text-3xl font-light leading-none text-white pb-1">+</span>
          </div>
        </button>
        <button className="flex-1 aspect-[1.2] bg-[#a81666] rounded-2xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95">
          <div className="w-12 h-12 rounded-full bg-white/20 flex justify-center items-center">
            <span className="text-3xl font-light leading-none text-white pb-1">+</span>
          </div>
        </button>
      </div>

      {/* Mode */}
      <h3 className="text-[#A098C0] font-semibold text-base mb-3">Mode</h3>
      <div className="flex gap-2 mb-6">
        {modes.map((mode) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode)}
            className={`relative flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
              selectedMode === mode
                ? 'bg-[#4a3882] border border-[#7c5ce6] text-[#E0D8FF]'
                : 'bg-[#35295e] border border-transparent text-[#E0D8FF] hover:bg-[#403273]'
            }`}
          >
            {mode}
            {mode === 'Earning' && (
              <div className="absolute -top-2 -right-1 bg-orange-500 w-5 h-5 rounded-full flex justify-center items-center text-[10px]">
                🔥
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Time */}
      <h3 className="text-[#A098C0] font-semibold text-base mb-3">Time</h3>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {times.map((time) => (
          <button
            key={time}
            onClick={() => setSelectedTime(time)}
            className={`py-3 rounded-lg text-sm font-medium transition-colors ${
              selectedTime === time
                ? 'bg-[#4a3882] border border-[#7c5ce6] text-[#E0D8FF]'
                : 'bg-[#35295e] border border-transparent text-[#E0D8FF] hover:bg-[#403273]'
            }`}
          >
            {time}
          </button>
        ))}
      </div>

      {/* Confirm Button */}
      <button 
        onClick={onClose}
        className="w-full bg-[#1b5a7a] py-4 rounded-full text-[#A0B0C0] font-bold text-lg opacity-70 hover:opacity-100 transition-opacity mt-auto mb-4"
      >
        Confirm
      </button>
    </div>
  );
}
