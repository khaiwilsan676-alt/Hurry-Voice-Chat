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

        {/* Select People - + Buttons (Chota kar diya) */}
        <h3 className="text-[#A098C0] font-semibold text-base mb-3">Select People</h3>
        <div className="flex justify-between gap-4 mb-6">
          {/* Blue Button */}
          <button 
            onClick={() => openSheet('blue')}
            className="flex-1 aspect-[1.5] bg-[#1a3b9e] rounded-2xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex justify-center items-center">
              <span className="text-2xl font-light leading-none text-white pb-1">+</span>
            </div>
          </button>
          
          {/* Pink Button */}
          <button 
            onClick={() => openSheet('pink')}
            className="flex-1 aspect-[1.5] bg-[#a81666] rounded-2xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex justify-center items-center">
              <span className="text-2xl font-light leading-none text-white pb-1">+</span>
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
      </div>

      {/* Confirm Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0a0520]">
        <button 
          onClick={onClose}
          className="w-full bg-[#1b5a7a] py-4 rounded-full text-[#A0B0C0] font-bold text-lg opacity-70 hover:opacity-100 transition-opacity"
        >
          Confirm
        </button>
      </div>

      {/* --- BOTTOM SHEET OVERLAY --- */}
      {isSheetOpen && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity">
          {/* Sheet Content */}
          <div 
            className={`w-full max-w-md rounded-t-3xl p-5 pb-8 animate-slide-up ${
              sheetType === 'blue' ? 'bg-[#1a3b9e]' : 'bg-[#a81666]'
            }`}
          >
            {/* Header with Close */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white text-center w-full">Select people</h2>
              <button 
                onClick={closeSheet}
                className="absolute right-4 top-4 text-white/80 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* 5x2 Grid for People */}
            <div className="grid grid-cols-5 gap-3">
              {/* Row 1 */}
              <div className="flex justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" 
                  alt="User" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-white/50"
                />
              </div>
              {[...Array(4)].map((_, i) => (
                <div key={`r1-${i}`} className="flex justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white/40 text-xl">🛋️</span>
                  </div>
                </div>
              ))}

              {/* Row 2 */}
              {[...Array(5)].map((_, i) => (
                <div key={`r2-${i}`} className="flex justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white/40 text-xl">🛋️</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Note: The UI uses Sofa emoji as placeholder for empty slots as seen in screenshot */}
          </div>
        </div>
      )}

      {/* Animation Styles (Add to global css or tailwind config) */}
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
