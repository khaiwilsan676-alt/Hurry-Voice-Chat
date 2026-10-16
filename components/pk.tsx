'use client';

import React, { useState } from 'react';

interface PkScreenProps {
  onClose?: () => void;
}

export default function PkScreen({ onClose }: PkScreenProps) {
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  // Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetType, setSheetType] = useState<'blue' | 'pink' | null>(null);

  const modes = ['Votes', 'Coins', 'Earning'];
  const times = ['15s', '1min', '3mins', '5mins', '10mins', '15mins'];

  // Open Sheet Function
  const openSheet = (type: 'blue' | 'pink') => {
    setSheetType(type);
    setIsSheetOpen(true);
  };

  // Close Sheet Function
  const closeSheet = () => {
    setIsSheetOpen(false);
    setSheetType(null);
  };

  return (
    <div className="relative flex flex-col h-full bg-[#0a0520] text-white p-4 overflow-hidden">
      
      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-yellow-400 rounded-full flex justify-center items-center">
              <span className="text-xs">🥊</span>
            </div>
            <h2 className="text-lg font-bold">Battle</h2>
          </div>
          <button className="w-5 h-5 rounded-full border border-white flex justify-center items-center text-[10px] font-bold hover:bg-white/10 transition-colors">
            ?
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-[#1b1240] rounded-xl p-3 flex justify-between items-center mb-5 border border-[#2a1e5c]">
          <div className="flex items-center gap-2">
            <img
              src="https://via.placeholder.com/50"
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-sm mb-0.5">A a r a v 💙</h3>
              <p className="text-[#A098C0] text-[10px]">
                Today's earning <span className="text-[10px]">🪙</span> 0
              </p>
            </div>
          </div>
          <button className="bg-[#35295e] py-1 px-2.5 rounded-lg text-[10px] hover:bg-[#4a3882] transition-colors">
            Details &gt;
          </button>
        </div>

        {/* Select People - + Buttons (Thode bade kiye) */}
        <h3 className="text-[#A098C0] font-semibold text-sm mb-2">Select People</h3>
        <div className="flex justify-between gap-3 mb-5">
          {/* Blue Button */}
          <button 
            onClick={() => openSheet('blue')}
            className="flex-1 h-14 bg-[#1a3b9e] rounded-2xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95"
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex justify-center items-center">
              <span className="text-2xl font-light leading-none text-white pb-1">+</span>
            </div>
          </button>
          
          {/* Pink Button */}
          <button 
            onClick={() => openSheet('pink')}
            className="flex-1 h-14 bg-[#a81666] rounded-2xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95"
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex justify-center items-center">
              <span className="text-2xl font-light leading-none text-white pb-1">+</span>
            </div>
          </button>
        </div>

        {/* Mode */}
        <h3 className="text-[#A098C0] font-semibold text-sm mb-2">Mode</h3>
        <div className="flex gap-2 mb-5">
          {modes.map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`relative flex-1 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                selectedMode === mode
                  ? 'bg-[#4a3882] border border-[#7c5ce6] text-[#E0D8FF]'
                  : 'bg-[#35295e] border border-transparent text-[#E0D8FF] hover:bg-[#403273]'
              }`}
            >
              {mode}
              {mode === 'Earning' && (
                <div className="absolute -top-1.5 -right-1 bg-orange-500 w-3.5 h-3.5 rounded-full flex justify-center items-center text-[8px]">
                  🔥
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Time */}
        <h3 className="text-[#A098C0] font-semibold text-sm mb-2">Time</h3>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {times.map((time) => (
            <button
              key={time}
              onClick={() => setSelectedTime(time)}
              className={`py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                selectedTime === time
                  ? 'bg-[#4a3882] border border-[#7c5ce6] text-[#E0D8FF]'
                  : 'bg-[#35295e] border border-transparent text-[#E0D8FF] hover:bg-[#403273]'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Confirm Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0a0520]">
        <button 
          onClick={onClose}
          className="w-full bg-[#1b5a7a] py-2.5 rounded-full text-[#A0B0C0] font-bold text-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          Confirm
        </button>
      </div>

      {/* --- BOTTOM SHEET OVERLAY --- */}
      {isSheetOpen && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity">
          {/* Sheet Content - No Scroll Full */}
          <div 
            className={`w-full max-w-md rounded-t-3xl p-5 pb-6 animate-slide-up ${
              sheetType === 'blue' ? 'bg-[#1a3b9e]' : 'bg-[#a81666]'
            }`}
            style={{ maxHeight: '90vh' }} // Ensures it doesn't overflow
          >
            {/* Header with Close */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white text-center w-full">Select people</h2>
              <button 
                onClick={closeSheet}
                className="absolute right-4 top-4 text-white/80 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* 5x2 Grid for People */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {/* Row 1 */}
              <div className="flex justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" 
                  alt="User" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/50"
                />
              </div>
              {[...Array(4)].map((_, i) => (
                <div key={`r1-${i}`} className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white/40 text-lg">🛋️</span>
                  </div>
                </div>
              ))}

              {/* Row 2 */}
              {[...Array(5)].map((_, i) => (
                <div key={`r2-${i}`} className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white/40 text-lg">🛋️</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mode Buttons inside Sheet */}
            <div className="mb-3">
              <h3 className="text-white/80 text-xs font-semibold mb-2">Mode</h3>
              <div className="flex gap-2">
                {modes.map((mode) => (
                  <button
                    key={`sheet-mode-${mode}`}
                    onClick={() => setSelectedMode(mode)}
                    className={`relative flex-1 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                      selectedMode === mode
                        ? 'bg-white/30 border border-white text-white'
                        : 'bg-white/10 border border-transparent text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {mode}
                    {mode === 'Earning' && (
                      <div className="absolute -top-1.5 -right-1 bg-orange-500 w-3.5 h-3.5 rounded-full flex justify-center items-center text-[8px]">
                        🔥
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Buttons inside Sheet */}
            <div className="mb-4">
              <h3 className="text-white/80 text-xs font-semibold mb-2">Time</h3>
              <div className="grid grid-cols-3 gap-2">
                {times.map((time) => (
                  <button
                    key={`sheet-time-${time}`}
                    onClick={() => setSelectedTime(time)}
                    className={`py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                      selectedTime === time
                        ? 'bg-white/30 border border-white text-white'
                        : 'bg-white/10 border border-transparent text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm Button inside Sheet */}
            <button 
              onClick={closeSheet}
              className="w-full bg-white/20 py-2.5 rounded-full text-white font-bold text-sm hover:bg-white/30 transition-colors"
            >
              Confirm
            </button>

          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
