'use client';

import React, { useState } from 'react';

// A simple SVG for the sofa icon to match the screenshot
const SofaIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-10 h-10 text-blue-200"
  >
    <path d="M20 9V7c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v2c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2zM6 7h12v2H6V7zm14 9H4v-4h2v2h12v-2h2v4z" />
    <path d="M7 11h10v2H7z" />
  </svg>
);

interface PkScreenProps {
  onClose?: () => void;
}

export default function PkScreen({ onClose }: PkScreenProps) {
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  // State to handle the new "Select people" screen
  const [isSelectPeopleOpen, setIsSelectPeopleOpen] = useState(false);

  const modes = ['Votes', 'Coins', 'Earning'];
  const times = ['15s', '1min', '3mins', '5mins', '10mins', '15mins'];

  // If the select people screen is open, render it instead of the main screen
  // This matches the screenshot where it covers the entire screen
  if (isSelectPeopleOpen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#1052E5] text-white p-6">
        {/* Header */}
        <div className="flex justify-center items-center mt-8 mb-12 relative">
          <h2 className="text-3xl font-bold">Select people</h2>
          {/* Back button to close the sheet */}
          <button 
            onClick={() => setIsSelectPeopleOpen(false)}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        </div>

        {/* Grid of people */}
        <div className="grid grid-cols-5 gap-3 px-2">
          {/* First slot: User Avatar */}
          <button className="aspect-square rounded-full overflow-hidden border-2 border-transparent hover:border-white/50 transition-colors">
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80" // Placeholder for the man in the screenshot
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </button>

          {/* Remaining 9 empty slots */}
          {Array.from({ length: 9 }).map((_, index) => (
            <button
              key={index}
              className="aspect-square rounded-full bg-[#2A6BFF] flex items-center justify-center hover:bg-[#3B7CFF] transition-colors"
              onClick={() => {
                // Handle selecting a person here
                console.log(`Selected slot ${index + 1}`);
              }}
            >
              <SofaIcon />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Original PkScreen UI
  return (
    <div className="flex flex-col h-full bg-[#0a0520] text-white px-3 py-2 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-yellow-400 rounded-full flex justify-center items-center">
            <span className="text-[10px]">🥊</span>
          </div>
          <h2 className="text-sm font-bold">Battle</h2>
        </div>
        <button className="w-4 h-4 rounded-full border border-white flex justify-center items-center text-[8px] font-bold hover:bg-white/10 transition-colors">
          ?
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-[#1b1240] rounded-lg px-2 py-1.5 flex justify-between items-center mb-2 border border-[#2a1e5c]">
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
        <button className="bg-[#35295e] py-0.5 px-2 rounded-md text-[9px] hover:bg-[#4a3882] transition-colors">
          Details &gt;
        </button>
      </div>

      {/* Select People - Image ke hisaab se full width aur bada kiya */}
      <h3 className="text-[#A098C0] font-semibold text-[11px] mb-1.5">Select People</h3>
      <div className="flex justify-between gap-2 mb-3">
        {/* Left + Button */}
        <button 
          onClick={() => setIsSelectPeopleOpen(true)}
          className="flex-1 h-20 bg-[#1a3b9e] rounded-xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex justify-center items-center">
            <span className="text-xl font-light leading-none text-white pb-1">+</span>
          </div>
        </button>
        
        {/* Right + Button */}
        <button 
          onClick={() => setIsSelectPeopleOpen(true)}
          className="flex-1 h-20 bg-[#a81666] rounded-xl flex justify-center items-center transition-transform hover:scale-[1.02] active:scale-95"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex justify-center items-center">
            <span className="text-xl font-light leading-none text-white pb-1">+</span>
          </div>
        </button>
      </div>

      {/* Mode - Same size as image */}
      <h3 className="text-[#A098C0] font-semibold text-[11px] mb-1.5">Mode</h3>
      <div className="flex gap-2 mb-3">
        {modes.map((mode) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode)}
            className={`relative flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
              selectedMode === mode
                ? 'bg-[#4a3882] border border-[#7c5ce6] text-[#E0D8FF]'
                : 'bg-[#35295e] border border-transparent text-[#E0D8FF] hover:bg-[#403273]'
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

      {/* Time - Same size as image, thoda upar */}
      <h3 className="text-[#A098C0] font-semibold text-[11px] mb-1.5 mt-auto">Time</h3>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {times.map((time) => (
          <button
            key={time}
            onClick={() => setSelectedTime(time)}
            className={`py-2 rounded-md text-xs font-medium transition-colors ${
              selectedTime === time
                ? 'bg-[#4a3882] border border-[#7c5ce6] text-[#E0D8FF]'
                : 'bg-[#35295e] border border-transparent text-[#E0D8FF] hover:bg-[#403273]'
            }`}
          >
            {time}
          </button>
        ))}
      </div>

      {/* Confirm Button - Image ke hisaab se thoda mota kiya */}
      <button
        onClick={onClose}
        className="w-full bg-[#1b5a7a] py-3 rounded-full text-[#A0B0C0] font-bold text-sm opacity-70 hover:opacity-100 transition-opacity"
      >
        Confirm
      </button>
    </div>
  );
}
