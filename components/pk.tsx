'use client';

import React, { useState } from 'react';

interface PkScreenProps {
  onClose?: () => void;
}

// --- Updated Component: Select People Screen (Bottom Sheet) ---
const SelectPeopleScreen = ({ type, onClose }: { type: 'blue' | 'pink'; onClose: () => void }) => {
  const isBlue = type === 'blue';
  
  // Colors based on the image and theme
  const bgColor = isBlue ? 'bg-[#1E52FF]' : 'bg-[#FF1E82]'; // Bright Blue vs Pink
  const circleBg = isBlue ? 'bg-[#3A6BFF]' : 'bg-[#FF4A9A]';
  const iconColor = isBlue ? 'text-[#7A9BFF]' : 'text-[#FF8ABA]';

  // Placeholder array for the 9 empty slots
  const placeholders = Array.from({ length: 9 });

  return (
    // Backdrop (dark area outside the sheet) - Clicking this closes the sheet
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* The Actual Sheet */}
      <div 
        className={`w-full max-w-md mx-auto h-[85vh] rounded-t-3xl p-5 overflow-y-auto ${bgColor} animate-in slide-in-from-bottom duration-300`}
        onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the sheet
      >
        
        {/* Header (No back button) */}
        <div className="flex justify-center items-center mb-8 mt-4">
          <h2 className="text-xl font-bold text-white tracking-wide">Select people</h2>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-5 gap-3 px-1">
          
          {/* First Slot: Real User Image */}
          <div className="relative aspect-square rounded-full overflow-hidden border-2 border-white/20 cursor-pointer hover:scale-105 transition-transform">
            <img 
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80" 
              alt="User" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* 9 Empty Placeholder Slots */}
          {placeholders.map((_, index) => (
            <div 
              key={index} 
              className={`aspect-square rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform ${circleBg}`}
            >
              {/* Sofa/Chair SVG Icon matching the image */}
              <svg className={`w-7 h-7 ${iconColor}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2.5a2.5 2.5 0 0 0-2.5 2.5v4.5h-15v-4.5A2.5 2.5 0 0 0 4 10.5V8zm2 8h12v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2z"/>
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// --- Main PkScreen Component ---
export default function PkScreen({ onClose }: PkScreenProps) {
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showRules, setShowRules] = useState(false);
  
  // State to manage which overlay is open ('blue' | 'pink' | null)
  const [activeOverlay, setActiveOverlay] = useState<'blue' | 'pink' | null>(null);

  const modes = ['Votes', 'Coins', 'Earning'];
  const times = ['15s', '1min', '3mins', '5mins', '10mins', '15mins'];

  return (
    // Main background gradient
    <div className="relative flex flex-col h-full min-h-screen bg-gradient-to-br from-[#6e004b] via-[#1c003f] to-[#000c4d] text-white px-3 py-2 overflow-hidden">
      
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
        
        {/* Blue + Button -> Opens Blue Overlay */}
        <button 
          onClick={() => setActiveOverlay('blue')}
          className="flex-1 h-20 bg-[#1a3b9e]/80 backdrop-blur-sm rounded-xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95 border border-white/10"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex justify-center items-center">
            <span className="text-xl font-light leading-none text-white pb-1">+</span>
          </div>
        </button>

        {/* Pink + Button -> Opens Pink Overlay */}
        <button 
          onClick={() => setActiveOverlay('pink')}
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

      {/* Rules Sheet (Same as before) */}
      {showRules && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={() => setShowRules(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0a0520] border-t border-[#2a1e5c] rounded-t-2xl px-4 pt-3 pb-6 max-h-[75%] overflow-y-auto"
          >
            <div className="w-10 h-1 bg-[#35295e] rounded-full mx-auto mb-3" />
            <div className="mb-4">
              <h2 className="text-base font-bold text-white">Rules</h2>
            </div>
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

      {/* --- ACTIVE OVERLAY RENDER --- */}
      {activeOverlay && (
        <SelectPeopleScreen 
          type={activeOverlay} 
          onClose={() => setActiveOverlay(null)} 
        />
      )}

    </div>
  );
}
