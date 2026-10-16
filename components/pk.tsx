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
    <div className="flex flex-col h-screen w-full bg-[#0B0420] text-white p-3 overflow-hidden font-sans">
      {/* Header - Fixed Height */}
      <div className="flex justify-between items-center mb-3 mt-1 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-[34px] h-[34px] bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex justify-center items-center shadow-md">
            <span className="text-sm drop-shadow-sm">🥊</span>
          </div>
          <h2 className="text-[22px] font-semibold tracking-wide">Battle</h2>
        </div>
        <button className="w-[26px] h-[26px] rounded-full border-[1.5px] border-white flex justify-center items-center text-[14px] font-bold hover:bg-white/10 transition-colors">
          ?
        </button>
      </div>

      {/* Profile Card - Fixed Height */}
      <div className="bg-[#1C1342] rounded-[16px] p-3 flex justify-between items-center mb-4 border border-[#2C2060] shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-[46px] h-[46px] rounded-full overflow-hidden bg-gray-600 border border-gray-500">
            <img
              src="https://i.pravatar.cc/150?img=11"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-medium text-[15px] mb-0.5 tracking-wide">A α r α v 💙</h3>
            <p className="text-[#9D93C6] text-[12px] font-medium flex items-center gap-1">
              Today's earning <span className="text-[13px]">🪙</span> 0
            </p>
          </div>
        </div>
        <button className="bg-[#372A63] py-[6px] px-[14px] rounded-[14px] text-[12px] font-medium hover:bg-[#46357D] transition-colors">
          Details &gt;
        </button>
      </div>

      {/* Select People - Flex Grow to fill space */}
      <div className="flex flex-col mb-4 shrink-0">
        <h3 className="text-[#9D93C6] font-medium text-[14px] mb-2 pl-1">Select People</h3>
        <div className="flex justify-between gap-3 h-[110px]">
          {/* Blue Box */}
          <button className="flex-1 bg-gradient-to-br from-[#1238B8] to-[#1D4BE8] rounded-[16px] flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95 shadow-lg">
            <div className="w-[52px] h-[52px] rounded-full bg-[#4B6EEB] flex justify-center items-center shadow-inner">
              <span className="text-[32px] font-light leading-none text-white pb-1">+</span>
            </div>
          </button>
          {/* Pink Box */}
          <button className="flex-1 bg-gradient-to-br from-[#B2166A] to-[#D61E80] rounded-[16px] flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95 shadow-lg">
            <div className="w-[52px] h-[52px] rounded-full bg-[#D85B9E] flex justify-center items-center shadow-inner">
              <span className="text-[32px] font-light leading-none text-white pb-1">+</span>
            </div>
          </button>
        </div>
      </div>

      {/* Mode - Fixed Height */}
      <div className="mb-4 shrink-0">
        <h3 className="text-[#9D93C6] font-medium text-[14px] mb-2 pl-1">Mode</h3>
        <div className="flex gap-2">
          {modes.map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`relative flex-1 py-[10px] rounded-[12px] text-[13px] font-medium transition-all duration-200 ${
                selectedMode === mode
                  ? 'bg-[#4B388B] text-white shadow-[0_0_10px_rgba(124,92,230,0.3)]'
                  : 'bg-[#2D2158] text-[#D0C6F5] hover:bg-[#382A6B]'
              }`}
            >
              {mode}
              {mode === 'Earning' && (
                <div className="absolute -top-2 -right-1.5 bg-gradient-to-r from-orange-500 to-red-500 w-[22px] h-[22px] rounded-full flex justify-center items-center text-[11px] shadow-md border-2 border-[#0B0420]">
                  🔥
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Time - Grid Fixed */}
      <div className="mb-4 shrink-0">
        <h3 className="text-[#9D93C6] font-medium text-[14px] mb-2 pl-1">Time</h3>
        <div className="grid grid-cols-3 gap-2.5">
          {times.map((time) => (
            <button
              key={time}
              onClick={() => setSelectedTime(time)}
              className={`py-[10px] rounded-[12px] text-[13px] font-medium transition-all duration-200 ${
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

      {/* Confirm Button - Push to bottom */}
      <div className="mt-auto pb-2 shrink-0">
        <button 
          onClick={onClose}
          className="w-full bg-[#1D5C7A] py-[16px] rounded-full text-[#8FA8BF] font-bold text-[16px] tracking-wide transition-all hover:bg-[#236e93] hover:text-white active:scale-[0.98]"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
