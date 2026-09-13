'use client';

import React, { useEffect, useState } from 'react';

interface RoomtaskProps {
  onBack?: () => void;
}

// Custom Hook jo WebGL Shader se image ka white background strictly remove karta hai (PURE ORIGINAL)
function useProcessedShaderImage(src: string) {
  return src;
}

// Helper component for task items
function TaskItem({ 
  title, 
  reward,
  iconSrc
}: { 
  title: string; 
  reward: string;
  iconSrc: string;
}) {
  
  // Title ke basis par Left Icon aur uska size decide karna
  const lowerTitle = title.toLowerCase();
  
  let leftIconSrc = iconSrc; 
  let iconSize = "w-10 h-10"; 

  if (lowerTitle.includes('mic')) {
    leftIconSrc = '/file_00000000f8d88211ba5ff45c06383e5f.png';
    iconSize = "w-20 h-20";
  } else if (lowerTitle.includes('share')) {
    leftIconSrc = '/file_0000000019a0821193463686d6fc9184.png';
    iconSize = "w-14.5 h-14.5 ml-2";
  } else if (lowerTitle.includes('gift')) {
    leftIconSrc = '/file_0000000081f48211afe58f6348196b55.png';
    iconSize = "w-20 h-20";
  } else if (lowerTitle.includes('user') || lowerTitle.includes('follower')) {
    leftIconSrc = '/file_00000000858082118b5c81b85cd6d2a8.png';
    iconSize = "w-20 h-20";
  }

  const rewardValue = reward.replace(/coins/gi, '').trim();

  return (
    // Explicitly added rounded-none to ensure NO curves at all
    <div className="relative z-20 w-[100%] max-w-[410px] h-[175px] flex items-center rounded-none">
      <img 
        src="/file_000000004fd0821198ed4e26d5008b16.png"
        alt="Task Background"
        // Force rounded-none on image so original square/rectangle shape remains
        className="absolute inset-0 w-full h-full object-fill cursor-pointer transition-transform hover:scale-105 active:scale-95 select-none z-0 rounded-none"
        draggable={false}
      />

      <div className="relative z-30 w-full pl-2 pr-4 flex items-center justify-between pointer-events-none rounded-none">
        
        {/* Left Side: 0.5 gap */}
        <div className="flex items-center space-x-0.5 flex-1">
          <img 
            src={leftIconSrc} 
            alt="Task Icon" 
            className={`${iconSize} object-contain flex-shrink-0 ${leftIconSrc === iconSrc ? '' : 'drop-shadow-md'} select-none rounded-none`}
            draggable={false}
          />
          <div className="flex flex-col justify-center">
            <span className="text-[15px] sm:text-[16px] font-bold text-white leading-tight drop-shadow-md line-clamp-3">
              {title}
            </span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex-shrink-0 pointer-events-auto flex flex-col items-center justify-center space-y-1.5 pl-1">
          
          <div className="flex items-center space-x-1">
            <img 
              src={iconSrc} 
              alt="Coins" 
              className="w-6 h-6 object-contain flex-shrink-0 select-none rounded-none"
              draggable={false}
            />
            <span className="text-[15px] font-extrabold text-[#ffd700] drop-shadow-md whitespace-nowrap">
              {rewardValue}
            </span>
          </div>

          <button 
            onClick={() => {}}
            className="transition-transform hover:scale-105 active:scale-95 cursor-pointer outline-none rounded-none"
          >
            <img 
              src="/file_00000000196c8208b7ea093e8d7f56c8.png"
              alt="Claim Action"
              className="w-[85px] h-auto object-contain select-none rounded-none"
              draggable={false}
            />
          </button>

        </div>
      </div>
    </div>
  );
}

export default function Roomtask({ onBack }: RoomtaskProps) {
  
  // Yaha original WebGL hook se clean image aayegi (base64 data URL)
  const cleanedIconSrc = useProcessedShaderImage('/file_00000000e56882119c217d508b6733dc.png');

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      
      const nextTarget = new Date(now);
      nextTarget.setDate(now.getDate() + daysUntilNextMonday);
      nextTarget.setHours(0, 0, 0, 0);

      const diff = nextTarget.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const tasks = [
    { title: "10 Users Enter the Room", reward: "10,000" },
    { title: "5 Users Enter the Room for Two Consecutive Days", reward: "20,000" },
    { title: "Successfully Share on WhatsApp", reward: "5,000" }, 
    { title: "Successfully Share on Facebook", reward: "5,000" },
    { title: "3 New Users Enter the Room", reward: "10,000" },
    { title: "1 New Follower of the Room", reward: "2,000" },
    { title: "3 New Users Follow the Room", reward: "10,000" },
    { title: "Spend 10 Minutes on Mic", reward: "5,000" },
    { title: "Spend 30 Minutes on Mic", reward: "25,000" },
    { title: "Spend 60 Minutes on Mic", reward: "50,000" },
    { title: "10 New Users on Mic for 10 Minutes at the Same Time", reward: "50,000" }, 
    { title: "5 New Followers of the Room", reward: "25,000" },
    { title: "3 Users on Mic at the Same Time", reward: "10,000" },
    { title: "Send a Gift of 500", reward: "2,000" },
    { title: "Send Gifts of 5,000", reward: "10,000" },
    { title: "Successfully Invite 1 User on Mic", reward: "500" },
    { title: "Successfully Invite 3 New Users on Mic", reward: "10,000" },
    { title: "Send 10 Gifts on Mic", reward: "20,000" },
    { title: "New User Sends a Gift of 1,000 on Mic", reward: "5,000" },
    { title: "Successfully Invite 10 People to the Mic", reward: "25,000" },
    { title: "3 Users on Mic at the Same Time for 10 Minutes", reward: "10,000" },
    { title: "Send 1 Gift", reward: " 1,000" },
  ];

  return (
    <div className="relative w-full h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#380308] scrollbar-none select-none m-0 p-0">
      
      <div className="relative w-full min-h-full flex flex-col m-0 p-0">
        
        <div 
          className="fixed top-0 left-0 w-full z-50 pointer-events-none"
          style={{ height: 'env(safe-area-inset-top, 0px)' }}
        />

        <div 
          className="absolute top-0 left-0 w-full h-[60vh] z-2 pointer-events-none bg-cover bg-top overflow-hidden"
          style={{
            backgroundImage: 'url(/file_00000000cb748211bf0120855b80f449.png)',
            maskImage: 'linear-gradient(to bottom, black 40%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.2) 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 40%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.2) 85%, transparent 100%)',
          }}
        >
          <div 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(56,3,8,0) 0%, rgba(56,3,8,0.2) 50%, rgba(56,3,8,0.7) 75%, #380308 100%)'
            }}
          />
        </div>

        <div 
          className="absolute top-[50vh] left-0 w-full h-[260vh] z-0 pointer-events-none bg-[#380308]"
        />

        <button 
          onClick={onBack} 
          className="fixed z-50 p-1 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-90"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 2px)',
            left: '2px'
          }}
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-none stroke-white stroke-[2.5] stroke-linecap-round stroke-linejoin-round drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>

        <div className="relative z-10 w-full flex flex-col items-center">
          
          <div className="w-full" style={{ height: 'calc(50vh - 45px)' }}></div>

          <div className="w-full flex justify-center px-4 flex-col items-center">
            <div className="relative w-[100%] max-w-[450px] flex items-center justify-center mt-2">
              <img 
                src="/file_00000000f2908208a7b6a2b73c3bbf36.png" 
                alt="Middle Decoration" 
                className="w-full h-auto object-contain drop-shadow-2xl select-none rounded-none"
                draggable={false}
              />
              
              <div 
                className="absolute top-1/2 -translate-y-1/2 flex items-center z-20 pointer-events-none"
                style={{ left: '10%' }} 
              >
                <img 
                  src={cleanedIconSrc}
                  alt="Cleaned Coin Icon" 
                  className="w-7 h-7 object-contain select-none rounded-none"
                  draggable={false}
                />
              </div>

              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none pr-4">
                <span className="text-2xl font-extrabold text-[#ffd700] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  0
                </span>
              </div>

              <div 
                className="absolute top-1/2 -translate-y-1/2 z-20 -mt-1"
                style={{ right: '9%' }} 
              >
                <button 
                  onClick={() => {}}
                  className="px-2 py-1 rounded-full font-black text-[9px] text-[#5a2c00] bg-gradient-to-b from-[#ffe853] via-[#ffc107] to-[#e09b00] shadow-[0_4px_0_#9c6500,0_6px_8px_rgba(0,0,0,0.4)] active:translate-y-[2px] active:shadow-[0_2px_0_#9c6500,0_4px_6px_rgba(0,0,0,0.4)] transition-all cursor-pointer uppercase tracking-wider"
                >
                  Claim
                </button>
              </div>

            </div>
          </div>

          <div className="relative w-full flex flex-col items-center mt-3">
            
            <div className="relative w-full flex-shrink-0 z-30 flex justify-center items-center overflow-hidden">
              <img 
                src="/file_00000000680881faa3dfdb17cce60858.png"
                alt="Frame Top Border"
                className="w-full h-auto object-fill block select-none pointer-events-none rounded-none"
                style={{ transform: 'scaleX(1.12)' }}
                draggable={false}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <h1 className="text-white text-base sm:text-lg font-black tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] -mt-4 sm:-mt-6">
                  Room Task
                </h1>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1 -mt-5 z-40 select-none">
              <span className="text-[#f5b8b8] text-[11px] font-medium">Countdown</span>

              <div className="w-[20px] h-[20px] rounded-[4px] border border-[#d85858] bg-gradient-to-b from-[#8f1a1a] to-[#470a0a] flex items-center justify-center shadow-inner">
                <span className="text-[#ffe0e0] text-[11px] font-bold">{timeLeft.hours}</span>
              </div>
              <span className="text-[#f5b8b8] text-[11px] font-medium">Hour</span>

              <div className="min-w-[20px] px-1 h-[20px] rounded-[4px] border border-[#d85858] bg-gradient-to-b from-[#8f1a1a] to-[#470a0a] flex items-center justify-center shadow-inner">
                <span className="text-[#ffe0e0] text-[11px] font-bold">{timeLeft.minutes}</span>
              </div>
              <span className="text-[#f5b8b8] text-[11px] font-medium">Minute</span>

              <div className="w-[20px] h-[20px] rounded-[4px] border border-[#d85858] bg-gradient-to-b from-[#8f1a1a] to-[#470a0a] flex items-center justify-center shadow-inner">
                <span className="text-[#ffe0e0] text-[11px] font-bold">{timeLeft.seconds}</span>
              </div>
              <span className="text-[#f5b8b8] text-[11px] font-medium">Second</span>
            </div>

            <div className="relative w-full flex flex-col items-center mt-1 -mb-3">
              
              <div 
                className="absolute -top-14 bottom-0 w-12 sm:w-16 z-10 pointer-events-none"
                style={{
                  backgroundImage: 'url(/IMG_20260903_105647.png)',
                  backgroundRepeat: 'repeat-y',
                  backgroundSize: '100% auto',
                  backgroundPosition: 'left top',
                  left: '-15px'
                }}
              />

              <div 
                className="absolute -top-14 bottom-0 w-12 sm:w-16 z-10 pointer-events-none"
                style={{
                  backgroundImage: 'url(/IMG_20260903_105705.png)',
                  backgroundRepeat: 'repeat-y',
                  backgroundSize: '100% auto',
                  backgroundPosition: 'right top',
                  right: '-15px'
                }}
              />

              <div className="w-full max-w-[390px] flex flex-col items-center -space-y-[60px] px-6 z-20 -mt-2">
                {tasks.map((task, index) => (
                  <TaskItem 
                    key={index}
                    title={task.title}
                    reward={task.reward}
                    iconSrc={cleanedIconSrc}
                  />
                ))}
              </div>
            </div>

            <div className="w-full flex-shrink-0 z-30 pointer-events-none overflow-hidden -mt-12">
              <img 
                src="/file_0000000066c88211aa777b1f6da8683f.png"
                alt="Frame Bottom Border"
                className="w-full h-auto object-fill block select-none rounded-none"
                style={{ transform: 'scaleX(1.12)' }}
                draggable={false}
              />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

