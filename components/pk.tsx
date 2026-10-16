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
    <div className="flex flex-col h-screen w-full bg-[#0B0420] text-white px-3 py-2 overflow-hidden font-sans select-none">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-2 mt-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-[30px] h-[30px] bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex justify-center items-center shadow-md">
            <span className="text-[12px]">🥊</span>
          </div>
          <h2 className="text-[18px] font-semibold tracking-wide">Battle</h2>
        </div>
        <button className="w-[24px] h-[24px] rounded-full border-[1.5px] border-white flex justify-center items-center text-[12px] font-bold hover:bg-white/10 transition-colors">
          ?
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-[#1C1342] rounded-[14px] p-2.5 flex justify-between items-center mb-3 border border-[#2C2060] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-[42px] h-[42px] rounded-full overflow-hidden bg-gray-600 border border-gray-500 shrink-0">
            <img
              src="https://i.pravatar.cc/150?img=11"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-[13px] mb-0.5 tracking-wide truncate">A α r α v 💙</h3>
            <p className="text-[#9D93C6] text-[11px] font-medium flex items-center gap-1">
              Today's earning <span className="text-[12px]">🪙</span> 0
            </p>
          </div>
        </div>
        <button className="bg-[#372A63] py-[5px] px-[10px] rounded-[12px] text-[11px] font-medium hover:bg-[#46357D] transition-colors shrink-0">
          Details &gt;
        </button>
      </div>

      {/* Select People */}
      <div className="mb-3 shrink-0">
        <h3 className="text-[#9D93C6] font-medium text-[13px] mb-1.5 pl-1">Select People</h3>
        <div className="flex justify-between gap-2.5 h-[90px]">
          <button className="flex-1 bg-gradient-to-br from-[#1238B8] to-[#1D4BE8] rounded-[14px] flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95">
            <div className="w-[44px] h-[44px] rounded-full bg-[#4B6EEB] flex justify-center items-center">
              <span className="text-[26px] font-light leading-none text-white pb-1">+</span>
            </div>
          </button>
          <button className="flex-1 bg-gradient-to-br from-[#B2166A] to-[#D61E80] rounded-[14px] flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95">
            <div className="w-[44px] h-[44px] rounded-full bg-[#D85B9E] flex justify-center items-center">
              <span className="text-[26px] font-light leading-none text-white pb-1">+</span>
            </div>
          </button>
        </div>
      </div>

      {/* Mode */}
      <div className="mb-3 shrink-0">
        <h3 className="text-[#9D93C6] font-medium text-[13px] mb-1.5 pl-1">Mode</h3>
        <div className="flex gap-1.5">
          {modes.map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`relative flex-1 py-[8px] rounded-[10px] text-[12px] font-medium transition-all duration-200 ${
                selectedMode === mode
                  ? 'bg-[#4B388B] text-white shadow-[0_0_10px_rgba(124,92,230,0.3)]'
                  : 'bg-[#2D2158] text-[#D0C6F5] hover:bg-[#382A6B]'
              }`}
            >
              {mode}
              {mode === 'Earning' && (
                <div className="absolute -top-1.5 -right-1 bg-gradient-to-r from-orange-500 to-red-500 w-[18px] h-[18px] rounded-full flex justify-center items-center text-[9px] shadow-md border-2 border-[#0B0420]">
                  🔥
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Time */}
      <div className="mb-3 shrink-0">
        <h3 className="text-[#9D93C6] font-medium text-[13px] mb-1.5 pl-1">Time</h3>
        <div className="grid grid-cols-3 gap-2">
          {times.map((time) => (
            <button
              key={time}
              onClick={() => setSelectedTime(time)}
              className={`py-[8px] rounded-[10px] text-[12px] font-medium transition-all duration-200 ${
                selectedTime === time
                  ? 'bg-[#4B388B] text-white shadow-[0_0_10px_rgba(124,92,230,0.3)]'
                  : 'bg-[#2D2158] text-[#D0C6F5] hover:bg-[#382A6B]'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Confirm Button - Bottom */}
      <div className="mt-auto pb-1 shrink-0">
        <button 
          onClick={onClose}
          className="w-full bg-[#1D5C7A] py-[13px] rounded-full text-[#8FA8BF] font-bold text-[15px] tracking-wide transition-all hover:bg-[#236e93] hover:text-white active:scale-[0.98]"
        >
          Confirm
        </button>
      </div>
      
    </div>
  );
}
