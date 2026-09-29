'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, ChevronRight } from 'lucide-react'

// ==========================================
// MAIN COMPONENT LOGIC
// ==========================================
interface FamilyMember {
  id: string
  name: string
  relation: string
  avatar?: string
  isAdmin?: boolean
}

interface FamilyProps {
  onBack: () => void
}

// Helper Component for Reward Items
const RewardItem = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center w-[28%]">
    <div className="w-full aspect-square bg-gradient-to-b from-[#8C3A19] to-[#5C1A06] rounded-xl flex items-center justify-center p-2 shadow-inner border border-[#A65329]/50">
      {/* Andar ki image hata di hai */}
    </div>
    <div className="flex gap-[1px] mt-1.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-2.5 h-2.5 text-[#FFD700] fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <span className="text-[#FDE68A] text-[10px] text-center mt-1 leading-tight font-medium opacity-90 drop-shadow-sm">{title}</span>
  </div>
);

// BLACK BACKGROUND VIDEO REWARD ITEM (PAUSED)
const VideoRewardItem = ({ 
  title, 
  videoSrc, 
  onClick, 
  scaleClass = "scale-150", 
  blendScreen = true 
}: { 
  title: string, 
  videoSrc: string, 
  onClick: () => void, 
  scaleClass?: string, 
  blendScreen?: boolean 
}) => (
  <div className="flex flex-col items-center w-[28%] cursor-pointer active:scale-95 transition-transform" onClick={onClick}>
    <div className="w-full aspect-square bg-gradient-to-b from-[#8C3A19] to-[#5C1A06] rounded-xl flex items-center justify-center p-1 shadow-inner border border-[#A65329]/50 overflow-hidden relative">
      <video 
        src={videoSrc} 
        preload="auto"
        playsInline
        muted
        controls
        disablePictureInPicture
        disableRemotePlayback
        className={`w-full h-full object-cover pointer-events-none ${scaleClass}`} 
        style={{ 
          mixBlendMode: blendScreen ? 'screen' : 'normal', 
          filter: 'url(#remove-black)' 
        }} 
      />
    </div>
    <div className="flex gap-[1px] mt-1.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-2.5 h-2.5 text-[#FFD700] fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <span className="text-[#FDE68A] text-[10px] text-center mt-1 leading-tight font-medium opacity-90 drop-shadow-sm">{title}</span>
  </div>
);

// GREEN BACKGROUND VIDEO REWARD ITEM (PAUSED)
const GreenVideoRewardItem = ({ title, videoSrc, onClick }: { title: string, videoSrc: string, onClick: () => void }) => (
  <div className="flex flex-col items-center w-[28%] cursor-pointer active:scale-95 transition-transform" onClick={onClick}>
    <div className="w-full aspect-square bg-gradient-to-b from-[#8C3A19] to-[#5C1A06] rounded-xl flex items-center justify-center p-1 shadow-inner border border-[#A65329]/50 overflow-hidden relative">
      <video 
        src={videoSrc} 
        preload="auto"
        playsInline
        muted
        controls
        disablePictureInPicture
        disableRemotePlayback
        className="w-full h-full object-cover scale-150 pointer-events-none" 
        style={{ 
          filter: 'url(#remove-green)' 
        }} 
      />
    </div>
    <div className="flex gap-[1px] mt-1.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-2.5 h-2.5 text-[#FFD700] fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <span className="text-[#FDE68A] text-[10px] text-center mt-1 leading-tight font-medium opacity-90 drop-shadow-sm">{title}</span>
  </div>
);

// VEHICLE REWARD ITEM
const VehicleRewardItem = ({ title, imageSrc, onClick }: { title: string, imageSrc: string, onClick: () => void }) => (
  <div className="flex flex-col items-center w-[28%] cursor-pointer active:scale-95 transition-transform" onClick={onClick}>
    <div className="w-full aspect-square bg-gradient-to-b from-[#8C3A19] to-[#5C1A06] rounded-xl flex items-center justify-center p-1.5 shadow-inner border border-[#A65329]/50 overflow-hidden relative">
      <img 
        src={imageSrc} 
        alt={title} 
        className="w-full h-full object-cover scale-110 pointer-events-none" 
        style={{
          maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 90%)',
          WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 90%)'
        }}
      />
    </div>
    <div className="flex gap-[1px] mt-1.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-2.5 h-2.5 text-[#FFD700] fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <span className="text-[#FDE68A] text-[10px] text-center mt-1 leading-tight font-medium opacity-90 drop-shadow-sm">{title}</span>
  </div>
);

// TALL REWARD ITEM
const TallRewardItem = ({ title, imageSrc }: { title: string, imageSrc: string }) => (
  <div className="flex flex-col items-center w-[45%]">
    <div className="w-full bg-gradient-to-b from-[#8C3A19] to-[#5C1A06] rounded-xl flex items-center justify-center p-2 shadow-inner border border-[#A65329]/50">
      <img src={imageSrc} alt={title} className="w-full h-auto object-contain rounded-md pointer-events-none" />
    </div>
    <div className="flex gap-[1px] mt-1.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 text-[#FFD700] fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <span className="text-[#FDE68A] text-[12px] text-center mt-1 leading-tight font-bold opacity-90 drop-shadow-sm">{title}</span>
  </div>
);

// NEW: MIXED IMAGE REWARD ITEM (For Top 3 & Top 4-10)
const MixedImageRewardItem = ({ title, imageSrc, onClick }: { title: string, imageSrc: string, onClick: () => void }) => (
  <div className="flex flex-col items-center w-[28%] cursor-pointer active:scale-95 transition-transform" onClick={onClick}>
    <div className="w-full aspect-square bg-gradient-to-b from-[#8C3A19] to-[#5C1A06] rounded-xl flex items-center justify-center p-1.5 shadow-inner border border-[#A65329]/50 overflow-hidden relative">
      <img 
        src={imageSrc} 
        alt={title} 
        className="w-full h-full object-cover scale-110 pointer-events-none" 
        style={{ 
          mixBlendMode: 'screen',
          filter: 'url(#remove-black)',
          maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 90%)',
          WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 90%)'
        }} 
      />
    </div>
    <div className="flex gap-[1px] mt-1.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-2.5 h-2.5 text-[#FFD700] fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <span className="text-[#FDE68A] text-[10px] text-center mt-1 leading-tight font-medium opacity-90 drop-shadow-sm">{title}</span>
  </div>
);

export default function Family({ onBack }: FamilyProps) {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRelation, setNewMemberRelation] = useState('')
  const [familyCode, setFamilyCode] = useState('')

  const [currentView, setCurrentView] = useState<'main' | 'create' | 'topRankings'>('main')
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })

  const [showApplyMode, setShowApplyMode] = useState(false)
  const [applyModeState, setApplyModeState] = useState<'free' | 'admin'>('free')

  const [activeRow, setActiveRow] = useState<'left' | 'mid' | 'right' | null>('left')
  
  // Modal states for videos
  const [activeVideoModal, setActiveVideoModal] = useState<{src: string, type: 'black' | 'green' | 'vehicle' | 'black-noblend' | 'mixed'} | null>(null)

  useEffect(() => {
    const savedMembers = localStorage.getItem('familyMembers')
    if (savedMembers) {
      setMembers(JSON.parse(savedMembers))
    }
    
    const savedCode = localStorage.getItem('familyCode')
    if (savedCode) {
      setFamilyCode(savedCode)
    }

    const timer = setInterval(() => {
      const now = new Date()
      const daysUntilSunday = now.getDay() === 0 ? 0 : 7 - now.getDay()
      const endOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + daysUntilSunday
      )
      endOfWeek.setHours(23, 59, 59, 999)
      
      const diff = endOfWeek.getTime() - now.getTime()
      
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / 1000 / 60) % 60),
        secs: Math.floor((diff / 1000) % 60)
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // ==========================================
  // VIEW 4: TOP RANKINGS PAGE
  // ==========================================
  if (currentView === 'topRankings') {
    return (
      <div className="min-h-screen bg-[#2A1610] flex flex-col relative overflow-y-auto overflow-x-hidden font-sans text-white pb-6">
        
        <style dangerouslySetInnerHTML={{__html: `
          video::-webkit-media-controls { display: none !important; }
          video::-webkit-media-controls-enclosure { display: none !important; }
          video::-webkit-media-controls-start-playback-button { display: none !important; opacity: 0; }
        `}} />

        <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true">
          <filter id="remove-green" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              1.5 -2.5 1.5 1 0
            " />
          </filter>
          <filter id="remove-black" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              1.5 1.5 1.5 0 -0.2
            " />
          </filter>
        </svg>

        <div 
          className="absolute top-0 left-0 w-full h-[50vh] z-0"
          style={{
            backgroundImage: "url('/IMG_20260901_160704.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
          }}
        />

        <div
          className="flex flex-row items-center w-full px-2 relative z-30"
          style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), var(--status-bar-height, 0px)) + 12px)' }}
        >
          <button
            type="button"
            onClick={() => setCurrentView('main')}
            className="p-2 cursor-pointer relative z-30 flex items-center justify-start active:scale-95 transition-transform"
          >
            <ArrowLeft size={28} className="text-white drop-shadow-md" />
          </button>
        </div>

        <div className="flex flex-col w-full mt-2 relative z-20">
          <div className="flex justify-center w-full relative z-20 -mt-16">
            <img 
              src="/IMG_20260901_161023.png" 
              alt="Middle Rank" 
              className="w-68 h-68 object-contain drop-shadow-2xl" 
              style={{ filter: 'url(#remove-green)' }}
            />
          </div>
          <div className="absolute top-27 w-full flex justify-between z-10 px-0">
            <img 
              src="/1788258909655~2.jpg" 
              alt="Left Rank" 
              className="w-40 h-40 object-contain -ml-4 drop-shadow-xl"
              style={{ filter: 'url(#remove-green)' }} 
            />
            <img 
              src="/1788258915366~2.jpg" 
              alt="Right Rank" 
              className="w-40 h-40 object-contain -mr-4 drop-shadow-xl"
              style={{ filter: 'url(#remove-green)' }} 
            />
          </div>
        </div>

        <div className="w-full h-[13vh]"></div>

        <div className="flex flex-row items-end justify-center gap-2 w-full px-4 relative z-20 mb-2">
          <img 
            src="/IMG_20260901_230303.jpg" 
            alt="Left New" 
            onClick={() => { setActiveRow('left'); setCurrentView('main'); }}
            className="w-[35%] max-w-[110px] h-auto object-contain drop-shadow-xl cursor-pointer transition-all duration-300" 
            style={{ filter: activeRow === 'left' ? 'url(#remove-green)' : 'url(#remove-green) grayscale(100%)' }}
          />
          <img 
            src="/IMG_20260901_230319.jpg" 
            alt="Middle New" 
            onClick={() => { setActiveRow('mid'); setCurrentView('main'); }} 
            className="w-[35%] max-w-[130px] h-auto object-contain drop-shadow-2xl z-10 cursor-pointer transition-all duration-300" 
            style={{ filter: activeRow === 'mid' ? 'url(#remove-green)' : 'url(#remove-green) grayscale(100%)' }}
          />
          <img 
            src="/IMG_20260901_230330.jpg" 
            alt="Right New" 
            onClick={() => setActiveRow('right')} 
            className="w-[35%] max-w-[110px] h-auto object-contain drop-shadow-xl cursor-pointer transition-all duration-300 hover:scale-105" 
            style={{ filter: activeRow === 'right' ? 'url(#remove-green)' : 'url(#remove-green) grayscale(100%)' }}
          />
        </div>

        {/* TOP 1 REWARD */}
        <div className="w-full flex flex-col relative px-2 mt-8">
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex justify-center items-center">
            <img src="/file_00000000b9048207a6cb463144ef26f4.png" alt="Header" className="w-56 h-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            <span className="absolute text-white font-black text-sm tracking-widest mt-0.5 drop-shadow-md">TOP 1 Reward</span>
          </div>
          <div className="w-full bg-[#3B0C06] border-2 border-[#FFD700] rounded-xl pt-12 pb-6 flex flex-col gap-6 shadow-[0_0_20px_rgba(255,215,0,0.15)] relative z-10">
            <div className="flex justify-evenly w-full px-2">
              <VideoRewardItem title="Medal *7 days" videoSrc="/1000196572-background (1).mp4" onClick={() => setActiveVideoModal({src: '/1000196572-background (1).mp4', type: 'black'})} />
              <RewardItem title="Top1 Tag *7 days" />
              <VehicleRewardItem 
                title="Vehicle *7 days" 
                imageSrc="/IMG_20260918_141104.jpg" 
                onClick={() => setActiveVideoModal({src: '/gemini_generated_video_e407ad86~2.mp4', type: 'vehicle'})} 
              />
            </div>
            <div className="flex justify-center gap-8 w-full px-2">
              <GreenVideoRewardItem title="Frames *7 days" videoSrc="/gemini_generated_video_0d259062.mp4" onClick={() => setActiveVideoModal({src: '/gemini_generated_video_0d259062.mp4', type: 'green'})} />
              <RewardItem title="Family Frame *7 d" />
            </div>
            <div className="flex justify-center w-full px-2">
              <TallRewardItem title="Room Theme *7 d" imageSrc="/IMG-20260914-WA0043.jpg" />
            </div>
          </div>
        </div>

        {/* TOP 2 REWARD */}
        <div className="w-full flex flex-col relative px-2 mt-12">
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex justify-center items-center">
            <img src="/file_00000000b9048207a6cb463144ef26f4.png" alt="Header" className="w-56 h-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            <span className="absolute text-white font-black text-sm tracking-widest mt-0.5 drop-shadow-md">TOP 2 Reward</span>
          </div>
          <div className="w-full bg-[#3B0C06] border-2 border-[#FFD700] rounded-xl pt-12 pb-6 flex flex-col gap-6 shadow-[0_0_20px_rgba(255,215,0,0.15)] relative z-10">
            <div className="flex justify-evenly w-full px-2">
              <VideoRewardItem title="Medal *7 days" videoSrc="/1000196573-background (1).mp4" onClick={() => setActiveVideoModal({src: '/1000196573-background (1).mp4', type: 'black'})} />
              <RewardItem title="Top2 Tag *7 days" />
              <VehicleRewardItem 
                title="Vehicle *7 days" 
                imageSrc="/IMG_20260919_010054.jpg" 
                onClick={() => setActiveVideoModal({src: '/VID_20260919_010017.mp4', type: 'vehicle'})} 
              />
            </div>
            <div className="flex justify-center gap-8 w-full px-2">
              <GreenVideoRewardItem title="Frames *7 days" videoSrc="/gemini_generated_video_0d259062.mp4" onClick={() => setActiveVideoModal({src: '/gemini_generated_video_0d259062.mp4', type: 'green'})} />
              <RewardItem title="Family Frame *7 d" />
            </div>
            <div className="flex justify-center w-full px-2">
              <TallRewardItem title="Room Theme *7 d" imageSrc="/IMG-20260914-WA0045.jpg" />
            </div>
          </div>
        </div>

        {/* TOP 3 REWARD */}
        <div className="w-full flex flex-col relative px-2 mt-12">
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex justify-center items-center">
            <img src="/file_00000000b9048207a6cb463144ef26f4.png" alt="Header" className="w-56 h-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            <span className="absolute text-white font-black text-sm tracking-widest mt-0.5 drop-shadow-md">TOP 3 Reward</span>
          </div>
          <div className="w-full bg-[#3B0C06] border-2 border-[#FFD700] rounded-xl pt-12 pb-6 flex flex-col gap-6 shadow-[0_0_20px_rgba(255,215,0,0.15)] relative z-10">
            <div className="flex justify-evenly w-full px-2">
              <VideoRewardItem title="Medal *7 days" videoSrc="/1000196574-background (1).mp4" blendScreen={false} onClick={() => setActiveVideoModal({src: '/1000196574-background (1).mp4', type: 'black-noblend'})} />
              <RewardItem title="Top3 Tag *7 days" />
              <MixedImageRewardItem 
                title="Vehicle *7 days" 
                imageSrc="/IMG_20260919_222412.jpg" 
                onClick={() => setActiveVideoModal({src: '/VID_20260919_222502.mp4', type: 'mixed'})} 
              />
            </div>
            <div className="flex justify-center gap-8 w-full px-2">
              <VideoRewardItem title="Frames *7 days" videoSrc="/gemini_generated_video_123c050b~2.mp4" scaleClass="scale-100" blendScreen={false} onClick={() => setActiveVideoModal({src: '/gemini_generated_video_123c050b~2.mp4', type: 'black-noblend'})} />
              <RewardItem title="Family Frame *7 d" />
            </div>
            <div className="flex justify-center w-full px-2">
              <TallRewardItem title="Room Theme *7 d" imageSrc="/IMG-20260914-WA0046.jpg" />
            </div>
          </div>
        </div>

        {/* TOP 4 TO 10 REWARD */}
        <div className="w-full flex flex-col relative px-2 mt-12 mb-10">
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex justify-center items-center">
            <img src="/file_00000000b9048207a6cb463144ef26f4.png" alt="Header" className="w-56 h-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            <span className="absolute text-white font-black text-[11px] tracking-widest mt-0.5 text-center leading-tight drop-shadow-md">TOP 4 TO 10<br/>Reward</span>
          </div>
          <div className="w-full bg-[#3B0C06] border-2 border-[#FFD700] rounded-xl pt-12 pb-8 flex flex-col shadow-[0_0_20px_rgba(255,215,0,0.15)] relative z-10">
            <div className="flex justify-evenly w-full px-2">
              <RewardItem title="Medal *3 days" />
              <GreenVideoRewardItem title="Frames *3 days" videoSrc="/gemini_generated_video_0d259062.mp4" onClick={() => setActiveVideoModal({src: '/gemini_generated_video_0d259062.mp4', type: 'green'})} />
              <MixedImageRewardItem 
                title="Vehicle *3 days" 
                imageSrc="/IMG_20260919_222041.jpg" 
                onClick={() => setActiveVideoModal({src: '/VID_20260919_222549.mp4', type: 'mixed'})} 
              />
            </div>
          </div>
        </div>

        {/* UNIFIED CENTER VIDEO MODAL */}
        {activeVideoModal && (
          <div 
            className="fixed inset-0 w-full h-full bg-transparent z-50 flex cursor-pointer"
            onClick={() => setActiveVideoModal(null)}
          >
            {activeVideoModal.type === 'vehicle' ? (
              <div className="relative w-full h-full flex items-end justify-center pointer-events-none pb-8">
                <video 
                  src={activeVideoModal.src} 
                  autoPlay 
                  loop 
                  playsInline
        muted
        controls
                  disablePictureInPicture
                  disableRemotePlayback
                  className="w-full h-auto max-h-[85vh] object-cover" 
                  style={{
                    maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 70%, transparent 85%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 70%, transparent 85%)'
                  }} 
                />
              </div>
            ) : activeVideoModal.type === 'mixed' ? (
              <div className="relative w-full h-full flex items-end justify-center pointer-events-none pb-8">
                <video 
                  src={activeVideoModal.src} 
                  autoPlay 
                  loop 
                  playsInline
        muted
        controls
                  disablePictureInPicture
                  disableRemotePlayback
                  className="w-full h-auto max-h-[70vh] object-cover" 
                  style={{
                    mixBlendMode: 'screen',
                    backgroundColor: 'transparent',
                    filter: 'url(#remove-black)',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 70%, transparent 85%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 70%, transparent 85%)'
                  }} 
                />
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-transparent pointer-events-none">
                <video 
                  src={activeVideoModal.src} 
                  autoPlay 
                  loop
                  playsInline
        muted
        controls
                  disablePictureInPicture
                  disableRemotePlayback
                  className="w-[85vw] h-[85vw] max-w-[400px] max-h-[400px] object-cover rounded-xl drop-shadow-2xl" 
                  style={activeVideoModal.type === 'black' ? { 
                    mixBlendMode: 'screen', 
                    backgroundColor: 'transparent',
                    filter: 'url(#remove-black)' 
                  } : activeVideoModal.type === 'black-noblend' ? {
                    mixBlendMode: 'normal',
                    backgroundColor: 'transparent',
                    filter: 'url(#remove-black)' 
                  } : {
                    backgroundColor: 'transparent',
                    filter: 'url(#remove-green)' 
                  }} 
                />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // VIEW 3: CREATE FAMILY PAGE
  // ==========================================
  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans text-black relative overflow-y-auto overflow-x-hidden">
        <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true">
          <filter id="remove-white" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              -1 -1 -1 3 0
            " />
          </filter>
          <filter id="remove-green" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              1.5 -2.5 1.5 1 0
            " />
          </filter>
        </svg>

        <div className="flex items-center justify-between px-2 py-4 flex-shrink-0" style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), var(--status-bar-height, 0px)) + 12px)' }}>
          <button onClick={() => setCurrentView('main')} className="p-2 cursor-pointer relative z-30 active:scale-95 transition-transform">
            <ArrowLeft size={28} className="text-black" />
          </button>
          <h1 className="text-xl font-bold text-black tracking-wide">Create</h1>
          <button className="text-black font-bold text-sm cursor-pointer pr-2">Save</button>
        </div>

        <div className="flex-1 w-full pb-36">
          <div className="flex flex-col items-center mt-8">
            <div className="w-24 h-24 border-2 border-[#FFD700] rounded-lg flex items-center justify-center cursor-pointer bg-gray-50/50">
              <Plus size={36} className="text-gray-400" />
            </div>
            <p className="mt-2 text-sm font-bold text-gray-500">Upload Image</p>
          </div>
          <div className="px-5 mt-8">
            <label className="block text-sm font-bold text-black mb-2">Family name</label>
            <input type="text" className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 text-black outline-none font-medium placeholder-gray-400" placeholder="" />
          </div>
          <div className="px-5 mt-5">
            <label className="block text-sm font-bold text-black mb-2">Family Announcement</label>
            <input type="text" className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 text-black outline-none font-medium placeholder-gray-400" placeholder="" />
          </div>
          <div className="px-5 mt-8">
            <h2 className="text-sm font-bold text-gray-500 mb-2">Setting</h2>
            <div onClick={() => setShowApplyMode(true)} className="flex items-center justify-between bg-[#F3F4F6] p-4 rounded-xl cursor-pointer">
              <span className="font-bold text-black">Apply Mode</span>
              <ChevronRight className="text-gray-400" size={20} />
            </div>
          </div>
        </div>

        {/* MODIFIED: Hata diya brown background bas transparent background par image button rakhi hai */}
        <div className="fixed bottom-0 left-0 w-full h-[10vh] flex items-center justify-center z-50 bg-transparent pointer-events-none">
          <button onClick={() => setCurrentView('main')} className="pointer-events-auto hover:scale-105 active:scale-95 transition-transform cursor-pointer drop-shadow-2xl h-full flex items-center w-[45%] justify-center">
            <img src="/IMG_20260901_161001.png" alt="Add Button" className="w-full h-[80%] object-contain" style={{ filter: 'url(#remove-green)' }} />
          </button>
        </div>

        {showApplyMode && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
            <div className="bg-white w-full h-[22vh] rounded-t-3xl p-6 flex flex-col shadow-2xl relative">
              <div onClick={() => { setApplyModeState('free'); setTimeout(() => setShowApplyMode(false), 200) }} className="flex items-center justify-between py-4 border-b border-gray-100 cursor-pointer">
                <span className="font-bold text-black text-sm">Free mode</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${applyModeState === 'free' ? 'border-[#3b82f6]' : 'border-gray-300'}`}>
                  {applyModeState === 'free' && <div className="w-2.5 h-2.5 bg-[#3b82f6] rounded-full"></div>}
                </div>
              </div>
              <div onClick={() => { setApplyModeState('admin'); setTimeout(() => setShowApplyMode(false), 200) }} className="flex items-center justify-between py-4 cursor-pointer">
                <span className="font-bold text-black text-sm">Apply Mode / Admin & Owner</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${applyModeState === 'admin' ? 'border-[#3b82f6]' : 'border-gray-300'}`}>
                  {applyModeState === 'admin' && <div className="w-2.5 h-2.5 bg-[#3b82f6] rounded-full"></div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // VIEW 1: MAIN FAMILY PAGE
  // ==========================================
  return (
    <div className="min-h-screen bg-[#1a0d06] flex flex-col relative overflow-y-auto overflow-x-hidden font-sans text-white">
      <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true">
        <filter id="remove-green" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            1.5 -2.5 1.5 1 0
          " />
        </filter>
        <filter id="remove-black" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            1.5 1.5 1.5 0 -0.2
          " />
        </filter>
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffdf00" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#b8860b" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute top-0 left-0 w-full h-[50vh] z-0" style={{ backgroundImage: "url('/IMG_20260901_160704.png')", backgroundSize: 'cover', backgroundPosition: 'center', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)', WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)' }} />

      <div className="relative z-20 flex flex-col w-full">
        <div className="flex flex-row items-center w-full px-2 relative z-30" style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), var(--status-bar-height, 0px)) + 12px)' }}>
          <button type="button" onClick={onBack} className="p-2 cursor-pointer relative z-30 flex items-center justify-start active:scale-95 transition-transform" aria-label="Go back">
            <ArrowLeft size={28} className="text-white drop-shadow-md" />
          </button>
        </div>

        <div className="flex flex-col w-full mt-2 relative">
          <div className="flex justify-center w-full relative z-20 -mt-16">
            <img src="/IMG_20260901_161023.png" alt="Middle Rank" className="w-68 h-68 object-contain drop-shadow-2xl" style={{ filter: 'url(#remove-green)' }} />
          </div>
          <div className="absolute top-27 w-full flex justify-between z-10 px-0">
            <img src="/1788258909655~2.jpg" alt="Left Rank" className="w-40 h-40 object-contain -ml-4 drop-shadow-xl" style={{ filter: 'url(#remove-green)' }} />
            <img src="/1788258915366~2.jpg" alt="Right Rank" className="w-40 h-40 object-contain -mr-4 drop-shadow-xl" style={{ filter: 'url(#remove-green)' }} />
          </div>
        </div>

        <div className="w-full h-[13vh]"></div>

        <div className="flex flex-row items-end justify-center gap-2 w-full px-4 relative z-20">
          <img 
            src="/IMG_20260901_230303.jpg" 
            alt="Left New" 
            onClick={() => setActiveRow('left')}
            className="w-[35%] max-w-[110px] h-auto object-contain drop-shadow-xl cursor-pointer transition-all duration-300" 
            style={{ filter: activeRow === 'left' ? 'url(#remove-green)' : 'url(#remove-green) grayscale(100%)' }}
          />
          <img 
            src="/IMG_20260901_230319.jpg" 
            alt="Middle New" 
            onClick={() => setActiveRow('mid')}
            className="w-[35%] max-w-[130px] h-auto object-contain drop-shadow-2xl z-10 cursor-pointer transition-all duration-300" 
            style={{ filter: activeRow === 'mid' ? 'url(#remove-green)' : 'url(#remove-green) grayscale(100%)' }}
          />
          <img 
            src="/IMG_20260901_230330.jpg" 
            alt="Right New" 
            onClick={() => { setActiveRow('right'); setCurrentView('topRankings'); }}
            className="w-[35%] max-w-[110px] h-auto object-contain drop-shadow-xl cursor-pointer transition-all duration-300 hover:scale-105" 
            style={{ filter: activeRow === 'right' ? 'url(#remove-green)' : 'url(#remove-green) grayscale(100%)' }}
          />
        </div>

        <div className="relative w-full py-2.5 mt-4 flex items-center justify-center bg-gradient-to-r from-transparent via-[#ffd700]/10 to-transparent shadow-[0_0_15px_rgba(255,215,0,0.05)_inset]">
          <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ffd700]/40 to-transparent shadow-[0_0_8px_rgba(255,215,0,0.8)]"></div>
          <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ffd700]/40 to-transparent shadow-[0_0_8px_rgba(255,215,0,0.8)]"></div>
          <div className="relative z-10 flex items-center justify-center space-x-2 text-white font-medium px-4 w-full">
            <span className="text-[15px] mr-2 tracking-wide text-[#fdf6e3]">Countdown</span>
            <div className="bg-[#1a0f02] border border-[#a67c00] rounded-md px-1.5 py-0.5 text-sm font-bold min-w-[34px] text-center shadow-inner">{String(timeLeft.days).padStart(2, '0')}</div>
            <span className="text-[14px] text-[#fdf6e3]">Days</span>
            <div className="bg-[#1a0f02] border border-[#a67c00] rounded-md px-1.5 py-0.5 text-sm font-bold min-w-[34px] text-center shadow-inner">{String(timeLeft.hours).padStart(2, '0')}</div>
            <span className="text-[14px] text-[#fdf6e3]">:</span>
            <div className="bg-[#1a0f02] border border-[#a67c00] rounded-md px-1.5 py-0.5 text-sm font-bold min-w-[34px] text-center shadow-inner">{String(timeLeft.mins).padStart(2, '0')}</div>
            <span className="text-[14px] text-[#fdf6e3]">:</span>
            <div className="bg-[#1a0f02] border border-[#a67c00] rounded-md px-1.5 py-0.5 text-sm font-bold min-w-[34px] text-center shadow-inner">{String(timeLeft.secs).padStart(2, '0')}</div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full pt-4 space-y-1.5 pb-36">
        <div className="relative w-full">
          <img src="/1788258921361~2.jpg" alt="Top 1, 2, 3" className="w-full h-auto object-contain" style={{ filter: 'url(#remove-green)' }} />
        </div>
        {Array.from({ length: 47 }, (_, i) => {
          const rank = i + 4;
          return (
            <div key={rank} className="relative w-full h-16 flex items-center overflow-hidden">
              <img src="/1788259008478~2.jpg" alt={`Rank ${rank}`} className="absolute inset-0 w-full h-full object-fill" style={{ filter: 'url(#remove-green)' }} />
              <div className="relative z-10 pl-6"><span className="text-xl font-black text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{rank}</span></div>
            </div>
          )
        })}
      </div>

      {/* NEW: Edge to edge bottom bar with overlap create button */}
      <div className="fixed -bottom-6 left-0 w-full z-40 pointer-events-none">
        <div className="relative w-full">
          {/* Edge to edge background image */}
          <img 
            src="/file_000000009d1081f59878648feb821b5e.png" 
            alt="Bottom Background" 
            className="w-full h-auto block pointer-events-auto" 
          />
          {/* Centered overlap image button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button 
              onClick={() => setCurrentView('create')}
              className="cursor-pointer active:scale-95 transition-transform w-[50%] max-w-[200px] pointer-events-auto"
            >
              <img 
                src="/file_0000000056508230808da89fb794a97f.png" 
                alt="Create Family" 
                className="w-full h-auto object-contain drop-shadow-xl" 
              />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}