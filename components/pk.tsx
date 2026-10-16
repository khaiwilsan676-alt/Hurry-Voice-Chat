'use client';

import React, { useState } from 'react';

interface PkScreenProps {
  onClose?: () => void;
}

export default function PkScreen({ onClose }: PkScreenProps) {
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showRules, setShowRules] = useState(false);

  const modes = ['Votes', 'Coins', 'Earning'];
  const times = ['15s', '1min', '3mins', '5mins', '10mins', '15mins'];

  // Exact gradient string matching the provided image
  const bgGradient = "bg-[linear-gradient(135deg,_#7C0A4E_0%,_#1C0A4A_50%,_#00124B_100%)]";

  return (
    <div className={`relative flex flex-col h-full ${bgGradient} text-white px-3 py-2 overflow-hidden`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-yellow-400 rounded-full flex justify-center items-center">
            <span className="text-[10px]">🥊</span>
          </div>
          <h2 className="text-sm font-bold">Battle</h2>
        </div>
        <button
          onClick={() => setShowRules(true)}
          className="w-4 h-4 rounded-full border border-white flex justify-center items-center text-[8px] font-bold hover:bg-white/10 transition-colors"
        >
          ?
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-[#1b1240]/60 backdrop-blur-sm rounded-lg px-2 py-1.5 flex justify-between items-center mb-2 border border-white/5">
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
        <button className="bg-[#35295e]/80 py-0.5 px-2 rounded-md text-[9px] hover:bg-[#4a3882] transition-colors">
          Details &gt;
        </button>
      </div>

      {/* Select People */}
      <h3 className="text-[#A098C0] font-semibold text-[11px] mb-1.5">Select People</h3>
      <div className="flex justify-between gap-2 mb-3">
        <button className="flex-1 h-20 bg-[#1a3b9e]/80 rounded-xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95">
          <div className="w-8 h-8 rounded-full bg-white/20 flex justify-center items-center">
            <span className="text-xl font-light leading-none text-white pb-1">+</span>
          </div>
        </button>
        <button className="flex-1 h-20 bg-[#a81666]/80 rounded-xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95">
          <div className="w-8 h-8 rounded-full bg-white/20 flex justify-center items-center">
            <span className="text-xl font-light leading-none text-white pb-1">+</span>
          </div>
        </button>
      </div>

      {/* Mode */}
      <h3 className="text-[#A098C0] font-semibold text-[11px] mb-1.5">Mode</h3>
      <div className="flex gap-2 mb-3">
        {modes.map((mode) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode)}
            className={`relative flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
              selectedMode === mode
                ? 'bg-[#4a3882] border border-[#7c5ce6] text-[#E0D8FF]'
                : 'bg-[#35295e]/80 border border-transparent text-[#E0D8FF] hover:bg-[#403273]'
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

      {/* Time */}
      <h3 className="text-[#A098C0] font-semibold text-[11px] mb-1.5 mt-auto">Time</h3>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {times.map((time) => (
          <button
            key={time}
            onClick={() => setSelectedTime(time)}
            className={`py-2 rounded-md text-xs font-medium transition-colors ${
              selectedTime === time
                ? 'bg-[#4a3882] border border-[#7c5ce6] text-[#E0D8FF]'
                : 'bg-[#35295e]/80 border border-transparent text-[#E0D8FF] hover:bg-[#403273]'
            }`}
          >
            {time}
          </button>
        ))}
      </div>

      {/* Confirm Button */}
      <button
        onClick={onClose}
        className="w-full bg-[#1b5a7a]/80 py-3 rounded-full text-[#A0B0C0] font-bold text-sm opacity-70 hover:opacity-100 transition-opacity"
      >
        Confirm
      </button>

      {/* Rules Sheet */}
      {showRules && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={() => setShowRules(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            // Applied the exact same gradient to the bottom sheet
            className={`w-full max-w-md ${bgGradient} border-t border-white/10 rounded-t-2xl px-4 pt-3 pb-6 max-h-[75%] overflow-y-auto`}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-[#35295e] rounded-full mx-auto mb-3" />

            {/* Title */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-white">Rules</h2>
              <button
                onClick={() => setShowRules(false)}
                className="w-6 h-6 rounded-full bg-[#1b1240]/60 border border-white/10 flex justify-center items-center text-[#A098C0] text-xs hover:bg-[#2a1e5c] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 text-[#E0D8FF]">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Vote Mode</h3>
                <p className="text-xs leading-relaxed text-[#A098C0]">
                  The person with the most votes wins; 1 person, 1 vote.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-1">Coin Mode</h3>
                <ol className="text-xs leading-relaxed text-[#A098C0] space-y-1.5 list-decimal list-inside">
                  <li>
                    The person who receives the most coins (as gifts) wins. 1 coin
                    equals 1 point.
                  </li>
                  <li>
                    If a participant leaves the PK (battle) before the time runs out,
                    they will be disqualified.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
