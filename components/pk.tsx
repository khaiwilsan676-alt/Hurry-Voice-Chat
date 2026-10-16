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

  return (
    <div className="relative flex flex-col h-full bg-[#0a0520] text-white px-5 py-4 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-yellow-400 rounded-full flex justify-center items-center">
            <span className="text-[14px]">🥊</span>
          </div>
          <h2 className="text-lg font-bold">Battle</h2>
        </div>
        <button
          onClick={() => setShowRules(true)}
          className="w-6 h-6 rounded-full border border-white flex justify-center items-center text-[11px] font-bold hover:bg-white/10 transition-colors"
        >
          ?
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-[#1b1240] rounded-xl px-4 py-3 flex justify-between items-center mb-4 border border-[#2a1e5c]">
        <div className="flex items-center gap-3">
          <img
            src="https://via.placeholder.com/50"
            alt="Avatar"
            className="w-11 h-11 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-[14px] leading-tight">A a r a v 💙</h3>
            <p className="text-[#A098C0] text-[12px] leading-tight mt-0.5">
              Today's earning <span className="text-[12px]">🪙</span> 0
            </p>
          </div>
        </div>
        <button className="bg-[#35295e] py-1.5 px-3 rounded-lg text-[12px] hover:bg-[#4a3882] transition-colors">
          Details &gt;
        </button>
      </div>

      {/* Select People */}
      <h3 className="text-[#A098C0] font-semibold text-[14px] mb-3">Select People</h3>
      <div className="flex justify-between gap-3 mb-5">
        <button className="flex-1 h-32 bg-[#1a3b9e] rounded-2xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95">
          <div className="w-12 h-12 rounded-full bg-white/20 flex justify-center items-center">
            <span className="text-3xl font-light leading-none text-white pb-1">+</span>
          </div>
        </button>
        <button className="flex-1 h-32 bg-[#a81666] rounded-2xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95">
          <div className="w-12 h-12 rounded-full bg-white/20 flex justify-center items-center">
            <span className="text-3xl font-light leading-none text-white pb-1">+</span>
          </div>
        </button>
      </div>

      {/* Mode */}
      <h3 className="text-[#A098C0] font-semibold text-[14px] mb-3">Mode</h3>
      <div className="flex gap-2.5 mb-5">
        {modes.map((mode) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode)}
            className={`relative flex-1 py-3.5 rounded-lg text-[15px] font-medium transition-all ${
              selectedMode === mode
                ? 'bg-[#0d3b3e] border-2 border-[#22d3ee] text-white shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                : 'bg-[#35295e] border-2 border-transparent text-[#E0D8FF] hover:bg-[#403273]'
            }`}
          >
            {mode}
            {mode === 'Earning' && (
              <div className="absolute -top-2 -right-2 bg-orange-500 w-5 h-5 rounded-full flex justify-center items-center text-[10px]">
                🔥
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Time */}
      <h3 className="text-[#A098C0] font-semibold text-[14px] mb-3 mt-auto">Time</h3>
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {times.map((time) => (
          <button
            key={time}
            onClick={() => setSelectedTime(time)}
            className={`py-3.5 rounded-lg text-[15px] font-medium transition-all ${
              selectedTime === time
                ? 'bg-[#0d3b3e] border-2 border-[#22d3ee] text-white shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                : 'bg-[#35295e] border-2 border-transparent text-[#E0D8FF] hover:bg-[#403273]'
            }`}
          >
            {time}
          </button>
        ))}
      </div>

      {/* Confirm Button */}
      <button
        onClick={onClose}
        className="w-full bg-[#1b5a7a] py-4 rounded-full text-[#A0B0C0] font-bold text-base opacity-70 hover:opacity-100 transition-opacity"
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
            className="w-full max-w-md bg-[#0a0520] border-t border-[#2a1e5c] rounded-t-2xl px-4 pt-3 pb-6 max-h-[75%] overflow-y-auto"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-[#35295e] rounded-full mx-auto mb-3" />

            {/* Title */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-white">Rules</h2>
              <button
                onClick={() => setShowRules(false)}
                className="w-6 h-6 rounded-full bg-[#1b1240] border border-[#2a1e5c] flex justify-center items-center text-[#A098C0] text-xs hover:bg-[#2a1e5c] transition-colors"
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
