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