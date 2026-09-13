'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, HelpCircle, Plus, ChevronRight } from 'lucide-react'

// ==========================================
// MAIN COMPONENT LOGIC (UNTOUCHED)
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

export default function Family({ onBack }: FamilyProps) {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRelation, setNewMemberRelation] = useState('')
  const [familyCode, setFamilyCode] = useState('')

  const [currentView, setCurrentView] = useState<'main' | 'join' | 'create' | 'topRankings'>('main')
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })

  const [showApplyMode, setShowApplyMode] = useState(false)
  const [applyModeState, setApplyModeState] = useState<'free' | 'admin'>('free')

  // NEW STATE: Sirf ek active image ko track karega (Radio Button Logic)
  const [activeRow, setActiveRow] = useState<'left' | 'mid' | 'right' | null>(null)

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
      // WEEKLY COUNTDOWN LOGIC (Ends on Sunday 23:59:59)
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

  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberRelation.trim()) {
      alert('Please fill in all fields')
      return
    }

    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: newMemberName,
      relation: newMemberRelation,
      isAdmin: members.length === 0
    }

    const updatedMembers = [...members, newMember]
    setMembers(updatedMembers)
    localStorage.setItem('familyMembers', JSON.stringify(updatedMembers))
    
    setNewMemberName('')
    setNewMemberRelation('')
    setShowAddMember(false)
  }

  // ==========================================
  // VIEW 4: TOP RANKINGS PAGE (UPDATED)
  // ==========================================
  if (currentView === 'topRankings') {
    return (
      <div className="min-h-screen bg-[#2A1610] flex flex-col relative overflow-y-auto font-sans text-white pb-20">
        <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true">
          <filter id="remove-green" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              1.5 -2.5 1.5 1 0
            " />
          </filter>
        </svg>

        {/* SAME MAIN PAGE 50VH Background */}
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

        {/* Top Left Back Icon */}
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

        {/* 3 BIG IMAGES FRAME (SAME AS MAIN) */}
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

        {/* SPACE TO MATCH LAYOUT */}
        <div className="w-full h-[12vh]"></div>

        {/* ROW IMAGES - Color Selection Logic */}
        <div className="flex flex-row items-end justify-center gap-2 w-full px-4 relative z-20">
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
            onClick={() => setActiveRow('mid')}
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

        <div className="h-4"></div>

        {/* TOP 1 SECTION (Edge-to-Edge Square Red Card, White Text) */}
        <div className="w-full flex flex-col mt-4">
          <div className="flex items-center w-full">
            <div className="h-[3px] bg-[#FFD700] flex-1"></div>
            <div className="relative flex justify-center items-center">
              <img src="/file_00000000b9048207a6cb463144ef26f4.png" alt="Header" className="w-48 h-auto object-contain" />
              <span className="absolute text-white font-black text-xl tracking-widest mt-1 drop-shadow-md">Top 1</span>
            </div>
            <div className="h-[3px] bg-[#FFD700] flex-1"></div>
          </div>
          <div className="w-full mt-2 bg-[#4a0b0b] border-y-2 border-[#FFD700] p-5 flex flex-col gap-3 shadow-[0_0_15px_rgba(255,215,0,0.15)] relative z-10">
            <div className="flex justify-center gap-3 w-full">
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
            </div>
            <div className="flex justify-center gap-3 w-full">
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
            </div>
            <div className="flex justify-center w-full">
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
            </div>
          </div>
        </div>

        <div className="h-8"></div>

        {/* TOP 2 SECTION (Edge-to-Edge) */}
        <div className="w-full flex flex-col">
          <div className="flex items-center w-full">
            <div className="h-[3px] bg-[#FFD700] flex-1"></div>
            <div className="relative flex justify-center items-center">
              <img src="/file_00000000b9048207a6cb463144ef26f4.png" alt="Header" className="w-48 h-auto object-contain" />
              <span className="absolute text-white font-black text-xl tracking-widest mt-1 drop-shadow-md">Top 2</span>
            </div>
            <div className="h-[3px] bg-[#FFD700] flex-1"></div>
          </div>
          <div className="w-full mt-2 bg-[#4a0b0b] border-y-2 border-[#FFD700] p-5 flex flex-col gap-3 shadow-[0_0_15px_rgba(255,215,0,0.15)] relative z-10">
            <div className="flex justify-center gap-3 w-full">
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
            </div>
            <div className="flex justify-center gap-3 w-full">
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
            </div>
            <div className="flex justify-center w-full">
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
            </div>
          </div>
        </div>

        <div className="h-8"></div>

        {/* TOP 3 SECTION (Edge-to-Edge) */}
        <div className="w-full flex flex-col">
          <div className="flex items-center w-full">
            <div className="h-[3px] bg-[#FFD700] flex-1"></div>
            <div className="relative flex justify-center items-center">
              <img src="/file_00000000b9048207a6cb463144ef26f4.png" alt="Header" className="w-48 h-auto object-contain" />
              <span className="absolute text-white font-black text-xl tracking-widest mt-1 drop-shadow-md">Top 3</span>
            </div>
            <div className="h-[3px] bg-[#FFD700] flex-1"></div>
          </div>
          <div className="w-full mt-2 bg-[#4a0b0b] border-y-2 border-[#FFD700] p-5 flex flex-col gap-3 shadow-[0_0_15px_rgba(255,215,0,0.15)] relative z-10">
            <div className="flex justify-center gap-3 w-full">
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
            </div>
            <div className="flex justify-center gap-3 w-full">
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
            </div>
            <div className="flex justify-center w-full">
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[30%] object-contain" alt="Card" />
            </div>
          </div>
        </div>

        <div className="h-8"></div>

        {/* TOP 4 TO 10 SECTION (Edge-to-Edge) */}
        <div className="w-full flex flex-col">
          <div className="flex items-center w-full">
            <div className="h-[3px] bg-[#FFD700] flex-1"></div>
            <div className="relative flex justify-center items-center">
              <img src="/file_00000000b9048207a6cb463144ef26f4.png" alt="Header" className="w-48 h-auto object-contain" />
              <span className="absolute text-white font-black text-sm tracking-widest mt-1 text-center w-full leading-tight drop-shadow-md">Top<br/>4 to 10</span>
            </div>
            <div className="h-[3px] bg-[#FFD700] flex-1"></div>
          </div>
          <div className="w-full mt-2 bg-[#4a0b0b] border-y-2 border-[#FFD700] p-5 flex flex-col gap-3 shadow-[0_0_15px_rgba(255,215,0,0.15)] relative z-10">
            <div className="flex justify-center gap-6 w-full">
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[35%] object-contain" alt="Card" />
              <img src="/file_0000000013a08211898f7703f6a3704a.png" className="w-[35%] object-contain" alt="Card" />
            </div>
          </div>
        </div>

      </div>
    )
  }

  // ==========================================
  // VIEW 3: CREATE FAMILY PAGE
  // ==========================================
  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans text-black relative overflow-y-auto">
        <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true">
          <filter id="remove-white" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              -1 -1 -1 3 0
            " />
          </filter>
        </svg>

        <div className="flex items-center justify-between p-4 flex-shrink-0" style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), var(--status-bar-height, 0px)) + 12px)' }}>
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

        <div className="fixed bottom-6 left-0 w-full flex justify-center px-6 z-40 pointer-events-none">
          <button className="w-[90%] max-w-md bg-[#3b82f6] shadow-[0_5px_0_#2563eb] active:shadow-[0_0px_0_#2563eb] active:translate-y-1 rounded-full transition-all cursor-pointer flex flex-row items-center justify-center py-3.5 gap-2 pointer-events-auto">
            <span className="text-white font-bold text-lg tracking-wide">Create</span>
            <img src="/file_00000000e56882119c217d508b6733dc.png" alt="Coin" className="w-5 h-5 object-contain" style={{ filter: 'url(#remove-white)' }} />
            <span className="font-bold text-white/90 text-sm tracking-wider mt-0.5">1500000</span>
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
  // VIEW 2: JOIN FAMILY PAGE
  // ==========================================
  if (currentView === 'join') {
    return (
      <div className="min-h-screen bg-[#1a0d06] flex flex-col relative overflow-y-auto font-sans text-white">
        <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true">
          <filter id="remove-green" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              1.5 -2.5 1.5 1 0
            " />
          </filter>
        </svg>

        <div className="relative w-full h-[50vh] flex-shrink-0">
          <div className="absolute inset-0 w-full h-full z-0" style={{ backgroundImage: "url('/IMG_20260901_162148.png')", backgroundSize: 'cover', backgroundPosition: 'center', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)', WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)' }} />
          <div className="absolute top-0 left-0 w-full flex flex-row items-center justify-between px-2 z-20" style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), var(--status-bar-height, 0px)) + 12px)' }}>
            <button onClick={() => setCurrentView('main')} className="p-2 cursor-pointer relative z-30 flex items-center justify-start text-white active:scale-95 transition-transform">
              <ArrowLeft size={28} className="text-white drop-shadow-md" />
            </button>
            <button className="p-1 cursor-pointer flex items-center justify-end">
              <HelpCircle size={28} className="text-white drop-shadow-md" />
            </button>
          </div>
        </div>

        <div className="w-full pt-2 pb-16 space-y-2 z-10 relative">
          {Array.from({ length: 50 }, (_, index) => {
            const rank = index + 1;
            return (
              <div key={rank} className="relative w-full h-20 flex items-center justify-between px-2">
                <img src="/1788259008478~2.jpg" alt="Row Background" className="absolute inset-0 w-full h-full object-fill" style={{ filter: 'url(#remove-green)' }} />
                <div className="relative z-10 pl-4"><span className="text-lg font-black text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{rank}</span></div>
                <div className="relative z-10 pr-4"><img src="/IMG_20260901_160944.png" alt="Icon" className="w-18 h-18 object-contain" style={{ filter: 'url(#remove-green)' }} /></div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: MAIN FAMILY PAGE
  // ==========================================
  return (
    <div className="min-h-screen bg-[#1a0d06] flex flex-col relative overflow-y-auto font-sans text-white">
      <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true">
        <filter id="remove-green" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            1.5 -2.5 1.5 1 0
          " />
        </filter>
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

        <div className="w-full h-[10vh]"></div>

        {/* MAIN PAGE ROW IMAGES - Color Selection Logic */}
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

      <div className="fixed bottom-6 left-0 w-full px-6 flex items-center justify-between z-50 pointer-events-none">
        <button onClick={() => setCurrentView('create')} className="hover:scale-105 transition-transform cursor-pointer drop-shadow-2xl pointer-events-auto">
          <img src="/IMG_20260901_161001.png" alt="Add Button" className="w-44 h-auto object-contain" style={{ filter: 'url(#remove-green)' }} />
        </button>
        <button onClick={() => setCurrentView('join')} className="hover:scale-105 transition-transform cursor-pointer drop-shadow-2xl pointer-events-auto">
          <img src="/1788263346291~2.jpg" alt="Join Family" className="w-44 h-auto object-contain" style={{ filter: 'url(#remove-green)' }} />
        </button>
      </div>
    </div>
  )
}

