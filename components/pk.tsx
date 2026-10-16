'use client';

import React, { useState } from 'react';

interface PkScreenProps {
  onClose?: () => void;
}

export default function PkScreen({ onClose }: PkScreenProps) {
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showRules, setShowRules] = useState(false);
  
  // Naya state "Select People" sheet ke liye
  const [showSelectSheet, setShowSelectSheet] = useState(false);
  const [sheetTheme, setSheetTheme] = useState<'blue' | 'pink'>('blue');

  const modes = ['Votes', 'Coins', 'Earning'];
  const times = ['15s', '1min', '3mins', '5mins', '10mins', '15mins'];

  // Function to open sheet with specific color
  const openSelectSheet = (theme: 'blue' | 'pink') => {
    setSheetTheme(theme);
    setShowSelectSheet(true);
  };

  return (
    // Main background gradient (same as before)
    <div className="relative flex flex-col h-full bg-gradient-to-br from-[#6e004b] via-[#1c003f] to-[#000c4d] text-white px-3 py-2 overflow-hidden">
      
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
          className="w-5 h-5 rounded-full border border-yellow-400 bg-yellow-400/20 flex justify-center items-center text-[10px] font-bold text-yellow-400 hover:bg-yellow-400/30 transition-colors"
        >
          ?
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 flex justify-between items-center mb-2 border border-white/10">
        <div className="flex items-center gap-2">
          <img
            src="https://via.placeholder.com/50"
            alt="Avatar"
            className="w-7 h-7 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-[11px] leading-tight">A a r a v 💙</h3>
            <p className="text-white/60 text-[9px] leading-tight">
              Today's earning <span className="text-[9px]">🪙</span> 0
            </p>
          </div>
        </div>
        <button className="bg-white/10 py-0.5 px-2 rounded-md text-[9px] hover:bg-white/20 transition-colors">
          Details &gt;
        </button>
      </div>

      {/* Select People */}
      <h3 className="text-white/70 font-semibold text-[11px] mb-1.5">Select People</h3>
      <div className="flex justify-between gap-2 mb-3">
        {/* Blue Button - onClick added */}
        <button 
          onClick={() => openSelectSheet('blue')}
          className="flex-1 h-20 bg-[#1a3b9e]/80 backdrop-blur-sm rounded-xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95 border border-white/10"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex justify-center items-center">
            <span className="text-xl font-light leading-none text-white pb-1">+</span>
          </div>
        </button>
        
        {/* Pink Button - onClick added */}
        <button 
          onClick={() => openSelectSheet('pink')}
          className="flex-1 h-20 bg-[#a81666]/80 backdrop-blur-sm rounded-xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95 border border-white/10"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex justify-center items-center">
            <span className="text-xl font-light leading-none text-white pb-1">+</span>
          </div>
        </button>
      </div>

      {/* Mode */}
      <h3 className="text-white/70 font-semibold text-[11px] mb-1.5">Mode</h3>
      <div className="flex gap-2 mb-3">
        {modes.map((mode) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode)}
            className={`relative flex-1 py-2 rounded-lg text-xs font-semibold transition-all border-2 ${
              selectedMode === mode
                ? 'bg-gradient-to-b from-[#0d4d5e] to-[#0a859b] border-[#00e5ff] text-white shadow-[0_0_10px_rgba(0,229,255,0.6)]'
                : 'bg-[#3b2b50]/80 border-transparent text-white/70 hover:bg-[#4a3763]/90'
            }`}
          >
            {mode}
            {mode === 'Earning' && (
              <div className="absolute -top-1.5 -right-1.5 bg-orange-500 w-4 h-4 rounded-full flex justify-center items-center text-[8px] border border-white/20">
                🔥
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Time */}
      <h3 className="text-white/70 font-semibold text-[11px] mb-1.5 mt-auto">Time</h3>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {times.map((time) => (
          <button
            key={time}
            onClick={() => setSelectedTime(time)}
            className={`py-2 rounded-lg text-xs font-semibold transition-all border-2 ${
              selectedTime === time
                ? 'bg-gradient-to-b from-[#0d4d5e] to-[#0a859b] border-[#00e5ff] text-white shadow-[0_0_10px_rgba(0,229,255,0.6)]'
                : 'bg-[#3b2b50]/80 border-transparent text-white/70 hover:bg-[#4a3763]/90'
            }`}
          >
            {time}
          </button>
        ))}
      </div>

      {/* Confirm Button */}
      <button
        onClick={onClose}
        className="w-full mt-3 mb-2 bg-[#1b5a7a]/90 backdrop-blur-sm py-3 rounded-full text-white font-bold text-sm opacity-90 hover:opacity-100 transition-opacity border border-white/10"
      >
        Confirm
      </button>

      {/* Rules Sheet (Bilkul same rakha hai) */}
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
            <div className="mb-4">
              <h2 className="text-base font-bold text-white">Rules</h2>
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

      {/* NEW: Select People Bottom Sheet (Niche se aane wali sheet) */}
      {showSelectSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={() => setShowSelectSheet(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-t-[2rem] px-4 pt-8 pb-6 h-[55vh] flex flex-col transition-colors duration-300 ${
              sheetTheme === 'blue' ? 'bg-[#1240c9]' : 'bg-[#b80f6a]'
            }`}
          >
            {/* Title */}
            <h2 className="text-white text-2xl font-semibold text-center mb-8 tracking-wide">
              Select people
            </h2>

            {/* Grid of People (2 rows, 5 columns) */}
            <div className="grid grid-cols-5 gap-y-6 gap-x-2 place-items-center overflow-y-auto w-full px-2">
              {/* First Item: User Avatar */}
              <div className="w-14 h-14 rounded-full overflow-hidden border border-white/20 shadow-sm">
                <img
                  src="https://via.placeholder.com/50"
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 9 Empty Placeholders */}
              {Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shadow-inner"
                >
                  {/* Couch/Sofa Icon from your image */}
                  <span className="text-xl opacity-80">🛋️</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
