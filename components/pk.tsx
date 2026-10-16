'use client';

import React, { useState } from 'react';

interface PkScreenProps {
  onClose?: () => void;
}

export default function PkScreen({ onClose }: PkScreenProps) {
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showSelectPeople, setShowSelectPeople] = useState<'blue' | 'pink' | null>(null);
  const [showRules, setShowRules] = useState(false);

  const modes = ['Votes', 'Coins', 'Earning'];
  const times = ['15s', '1min', '3mins', '5mins', '10mins', '15mins'];

  // ---------- RULES SHEET ----------
  if (showRules) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#0B0420] text-white px-4 py-4 overflow-hidden font-sans select-none">
        <div className="flex items-center justify-between mb-4 mt-1 shrink-0">
          <h2 className="text-[20px] font-bold tracking-wide">Battle Rules</h2>
          <button
            onClick={() => setShowRules(false)}
            className="w-[30px] h-[30px] rounded-full bg-[#1C1342] border border-[#2C2060] flex justify-center items-center text-[16px] font-bold hover:bg-[#2A1B5C] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2.5 overflow-y-auto pb-2">
          {[
            { icon: '🎯', title: 'Choose Mode', desc: 'Select between Votes, Coins, or Earning mode to decide how the winner is calculated.' },
            { icon: '⏱️', title: 'Set Duration', desc: 'Pick a time limit from 15 seconds to 15 minutes. The battle runs for the selected time.' },
            { icon: '👥', title: 'Invite Opponent', desc: 'Tap the blue or pink "+" to select people and invite them to your team.' },
            { icon: '⚔️', title: 'Start Battle', desc: 'Once both teams are ready, hit Confirm to begin the live PK battle.' },
            { icon: '🏆', title: 'Win & Earn', desc: 'The team with the highest score at the end of the timer wins the battle and rewards.' },
            { icon: '🚫', title: 'Fair Play', desc: 'Any cheating, bots, or fake accounts will result in a permanent ban from battles.' },
          ].map((rule, index) => (
            <div key={index} className="bg-[#1C1342] border border-[#2C2060] rounded-[14px] p-3 flex gap-3 items-start">
              <div className="w-[38px] h-[38px] rounded-full bg-[#2D2158] flex justify-center items-center text-[18px] shrink-0">
                {rule.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-semibold mb-0.5">{rule.title}</h3>
                <p className="text-[12px] text-[#9D93C6] leading-snug">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-2 shrink-0">
          <button
            onClick={() => setShowRules(false)}
            className="w-full bg-[#1D5C7A] py-[14px] rounded-full text-white font-bold text-[15px] tracking-wide transition-all hover:bg-[#236e93] active:scale-[0.98]"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  // ---------- SELECT PEOPLE SCREEN ----------
  if (showSelectPeople) {
    const isBlue = showSelectPeople === 'blue';
    const bgColor = isBlue ? 'bg-[#2050F5]' : 'bg-[#D61E80]';
    const chairBg = isBlue ? 'bg-[#4A73F7]' : 'bg-[#E85BA8]';
    const totalSlots = 11;

    return (
      <div className={`flex flex-col h-screen w-full ${bgColor} text-white px-4 py-6 overflow-hidden font-sans select-none`}>
        <div className="flex justify-center items-center mb-8 shrink-0 relative">
          <h2 className="text-[28px] font-bold tracking-wide">Select people</h2>
          <button
            onClick={() => setShowSelectPeople(null)}
            className="absolute right-0 top-0 w-[34px] h-[34px] rounded-full bg-white/20 flex justify-center items-center text-[20px] font-bold hover:bg-white/30 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-5 gap-x-4 gap-y-6 justify-items-center content-start mt-2">
          {Array.from({ length: totalSlots }).map((_, index) => {
            if (index === 0) {
              return (
                <div key={index} className="w-[62px] h-[62px] rounded-full overflow-hidden border-[2px] border-white/60 shadow-md">
                  <img src="https://i.pravatar.cc/150?img=11" alt="You" className="w-full h-full object-cover" />
                </div>
              );
            }
            return (
              <button key={index} className={`w-[62px] h-[62px] rounded-full ${chairBg} flex justify-center items-center transition-transform hover:scale-105 active:scale-95`}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 10V7C5 5.89543 5.89543 5 7 5H17C18.1046 5 19 5.89543 19 7V10M5 10V17M5 10H19M19 10V17M5 17V19M19 17V19M8 14H16" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                </svg>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pb-2 text-center text-[13px] font-medium opacity-80 shrink-0">
          {isBlue ? 'Blue Team' : 'Pink Team'} · {totalSlots - 1} seats left
        </div>
      </div>
    );
  }

  // ---------- MAIN PK SCREEN ----------
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
        <button
          onClick={() => setShowRules(true)}
          className="w-[24px] h-[24px] rounded-full border-[1.5px] border-white flex justify-center items-center text-[12px] font-bold hover:bg-white/10 transition-colors"
        >
          ?
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-[#1C1342] rounded-[14px] p-2.5 flex justify-between items-center mb-3 border border-[#2C2060] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-[42px] h-[42px] rounded-full overflow-hidden bg-gray-600 border border-gray-500 shrink-0">
            <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-full h-full object-cover" />
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
          <button
            onClick={() => setShowSelectPeople('blue')}
            className="flex-1 bg-gradient-to-br from-[#1238B8] to-[#1D4BE8] rounded-[14px] flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95"
          >
            <div className="w-[44px] h-[44px] rounded-full bg-[#4B6EEB] flex justify-center items-center">
              <span className="text-[26px] font-light leading-none text-white pb-1">+</span>
            </div>
          </button>
          <button
            onClick={() => setShowSelectPeople('pink')}
            className="flex-1 bg-gradient-to-br from-[#B2166A] to-[#D61E80] rounded-[14px] flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95"
          >
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

      {/* Confirm Button */}
      <div className="mt-auto pb-1 shrink-0">
        <button
          onClick={onClose}
          className="w-full bg-[#1D5C7A] py-[14px] rounded-full text-[#8FA8BF] font-bold text-[15px] tracking-wide transition-all hover:bg-[#236e93] hover:text-white active:scale-[0.98]"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
