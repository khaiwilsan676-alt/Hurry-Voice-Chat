'use client';

import React, { useEffect, useState } from 'react';

interface SellerCenterProps {
  onBack?: () => void;
}

// Custom Hook jo WebGL Shader se image ka white background strictly remove karta hai (PURE ORIGINAL)
function useProcessedShaderImage(src: string) {
  return src;
}

export default function SellerCenter({ onBack }: SellerCenterProps) {
  // State to toggle between 'seller' and 'record' (Details) pages
  const [currentView, setCurrentView] = useState<'seller' | 'record'>('seller');
  
  // State for Sales Method selection (User or Seller)
  const [salesMethod, setSalesMethod] = useState<'user' | 'seller'>('user');

  // WebGL Shader se white background hataya hua coin image (Logic ekdam same)
  const cleanedCoinIcon = useProcessedShaderImage('/file_00000000e56882119c217d508b6733dc.png');

  // Dummy transactions logic unchanged
  const transactions = [
    {
      id: 1,
      transferTo: "💫FAKE SMILE🦅",
      nameColor: "text-yellow-500",
      date: "09/04/2026 19:16",
      amount: "-6,450,000",
      balance: "2,204,251,179",
      userId: "116943047"
    },
    {
      id: 2,
      transferTo: "🇮🇳Indian_Tiger🇮🇳",
      nameColor: "text-green-500",
      date: "09/04/2026 19:10",
      amount: "-2,150,000",
      balance: "2,210,701,179",
      userId: "116943047"
    },
    {
      id: 3,
      transferTo: "🖤KING—⭐",
      nameColor: "text-yellow-400",
      date: "09/04/2026 19:06",
      amount: "-2,150,000",
      balance: "2,212,851,179",
      userId: "116943047"
    },
    {
      id: 4,
      transferTo: "Asael🖤",
      nameColor: "text-yellow-500",
      date: "09/04/2026 18:52",
      amount: "-2,150,000",
      balance: "2,215,001,179",
      userId: "116943047"
    }
  ];

  // 1. RECORD VIEW (Details UI)
  if (currentView === 'record') {
    return (
      <div className="w-full min-h-screen bg-white font-sans text-gray-800 flex flex-col">
        {/* Header with Safe Area applied for Android/iOS Status Bar */}
        <div className="bg-white sticky top-0 z-50">
          <div className="w-full h-[env(safe-area-inset-top)] bg-white"></div>
          <div className="flex items-center px-4 py-3">
            <button onClick={() => setCurrentView('seller')} className="p-1 cursor-pointer">
              <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-black fill-none stroke-[2.5] stroke-linecap-round stroke-linejoin-round">
                {/* Strict Left Arrow */}
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <h1 className="text-[17px] font-bold text-gray-800 tracking-wide flex-1 text-center pr-6">
              Details
            </h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Please input the user id"
              className="w-full bg-[#f2f2f2] rounded-full px-5 py-2.5 text-sm outline-none text-gray-800 placeholder-gray-500"
            />
            <svg viewBox="0 0 24 24" className="w-5 h-5 absolute right-4 stroke-gray-500 fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>

        {/* Filter Area */}
        <div className="px-4 py-3 flex items-center">
          <span className="text-[15px] font-bold text-gray-800">Order Type</span>
          <span className="text-[15px] font-bold text-gray-800 ml-2 cursor-pointer flex items-center">
            All
            <svg viewBox="0 0 24 24" className="w-4 h-4 ml-0.5 fill-black">
              <path d="M7 10l5 5 5-5z"></path>
            </svg>
          </span>
        </div>

        {/* Transaction List */}
        <div className="flex flex-col px-4 pb-8">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex justify-between items-start border-b border-gray-100 py-4">
              <div className="flex flex-col">
                <span className="inline-block bg-blue-100 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded w-max mb-3">
                  Transfer
                </span>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[14px] font-bold text-gray-800 w-16">To User</span>
                  <img src="https://i.pravatar.cc/150?u=nawab" alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-gray-800">{tx.transferTo}</span>
                    <span className="text-[10px] text-gray-400 leading-tight">{tx.userId}</span>
                  </div>
                </div>
                <span className="text-[12px] text-gray-400 mt-1">{tx.date}</span>
              </div>

              <div className="flex items-center space-x-1 pt-8">
                <img src={cleanedCoinIcon} alt="Coin" className="w-4 h-4 object-contain" />
                <span className="text-[14px] font-bold text-gray-800">{tx.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. SELLER CENTER VIEW (Flat Pure White UI - No Cards)
  return (
    <div className="w-full min-h-screen bg-white font-sans text-gray-800 flex flex-col">
      
      {/* Header with Safe Area applied for Android/iOS Status Bar */}
      <div className="bg-white sticky top-0 z-50">
        <div className="w-full h-[env(safe-area-inset-top)] bg-white"></div>
        <div className="flex items-center px-4 py-3">
          <button onClick={onBack} className="p-1 cursor-pointer">
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-black fill-none stroke-[2.5] stroke-linecap-round stroke-linejoin-round">
              {/* Strict Left Arrow */}
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h1 className="text-[17px] font-bold tracking-wide flex-1 text-center pr-6">Coin Seller Center</h1>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-2">
        
        {/* Profile Info Section (No Card) */}
        <div className="w-full py-4 flex flex-col">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
              <img src="https://i.pravatar.cc/150?u=nawab" alt="Profile" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-gray-800">꧁Ks༒Prad...</span>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="text-[12px] text-gray-400">ID:116943047</span>
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-gray-400">
                  <path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100 mb-3"></div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-[14px] text-gray-800 font-medium">WhatsApp</span>
            <div className="flex items-center text-gray-800 text-[14px] font-medium">
              +91 9837152239
              <svg viewBox="0 0 24 24" className="w-4 h-4 ml-1 stroke-black fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round">
                {/* Right chevron for navigation */}
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between py-1.5 mt-1">
            <span className="text-[14px] text-gray-800 font-medium">Payment Method</span>
            <div className="flex items-center text-gray-800 text-[14px] font-medium">
              {/* Real Emoji Flag */}
              <span className="mr-1 text-[18px] leading-none">🇮🇳</span>
              <svg viewBox="0 0 24 24" className="w-4 h-4 ml-1 stroke-black fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round">
                {/* Right chevron for navigation */}
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Divider to separate Profile and Transfer Form clearly */}
        <div className="w-full h-2 bg-gray-50 rounded-full my-2"></div>

        {/* Transfer Action Section (No Card) */}
        <div className="w-full py-4 flex flex-col">
          
          {/* Top Balance Area & Details Button */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5 mb-1">
                <img src={cleanedCoinIcon} alt="Coin" className="w-6 h-6 object-contain" />
                <span className="text-[22px] font-extrabold text-gray-800">2,167</span>
              </div>
              <span className="text-[12px] text-gray-400 font-medium">Available Balance</span>
            </div>
            <button 
              onClick={() => setCurrentView('record')} 
              className="flex items-center text-blue-400 text-[13px] font-bold cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 mr-0.5 fill-current">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
              Details
            </button>
          </div>

          <div className="w-full h-px bg-gray-100 mb-4"></div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-[13px] text-gray-500 font-medium">Total Balance:</span>
            <div className="flex items-center space-x-1">
              <img src={cleanedCoinIcon} alt="Coin" className="w-4 h-4 object-contain" />
              <span className="text-[14px] font-bold text-gray-800">2,167</span>
            </div>
          </div>

          <div className="flex items-center space-x-6 mb-6">
            <span className="text-[13px] text-gray-800 font-bold">Sales method:</span>
            
            <div className="flex items-center space-x-4">
              {/* User Radio */}
              <label 
                className="flex items-center space-x-1.5 cursor-pointer"
                onClick={() => setSalesMethod('user')}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${salesMethod === 'user' ? 'border-blue-400' : 'border-gray-300'}`}>
                  {salesMethod === 'user' && <div className="w-2 h-2 bg-blue-400 rounded-full"></div>}
                </div>
                <span className="text-[14px] text-gray-800 font-medium">User</span>
              </label>

              {/* Seller Radio */}
              <label 
                className="flex items-center space-x-1.5 cursor-pointer"
                onClick={() => setSalesMethod('seller')}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${salesMethod === 'seller' ? 'border-blue-400' : 'border-gray-300'}`}>
                  {salesMethod === 'seller' && <div className="w-2 h-2 bg-blue-400 rounded-full"></div>}
                </div>
                <span className="text-[14px] text-gray-800 font-medium">Seller</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col mb-4 space-y-2">
            <label className="text-[13px] font-bold text-gray-800">
              {salesMethod === 'user' ? 'User ID:' : 'Seller ID:'}
            </label>
            <div className="relative flex items-center bg-[#f7f8fa] rounded-xl overflow-hidden px-4 py-3.5">
              <input 
                type="text" 
                placeholder="Please input the id"
                className="flex-1 bg-transparent text-[14px] outline-none text-gray-800 placeholder-gray-400"
              />
              <button className="text-blue-400 font-medium text-[14px] cursor-pointer ml-2">
                Check
              </button>
            </div>
          </div>

          <div className="flex flex-col mb-8 space-y-2">
            <label className="text-[13px] font-bold text-gray-800">Amount:</label>
            <div className="relative flex items-center bg-[#f7f8fa] rounded-xl overflow-hidden px-4 py-3.5">
              <input 
                type="number" 
                placeholder="Please input the number"
                className="flex-1 bg-transparent text-[14px] outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          <button className="w-full bg-blue-300 hover:bg-blue-400 text-white font-bold text-[16px] py-3.5 rounded-full transition-colors cursor-pointer">
            Transfer
          </button>

        </div>
      </div>
    </div>
  );
}

