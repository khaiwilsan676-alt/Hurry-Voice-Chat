'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

type LeaderboardTab = 'honour' | 'charm' | 'room'

interface LeaderboardProps {
  onBack: () => void
  initialTab?: LeaderboardTab
}
type LeaderboardSubTab = 'daily' | 'weekly' | 'monthly'

const processedImageCache: Record<string, string> = {}
const processingPromises: Record<string, Promise<string>> = {}

export function ChromaImage({
  src,
  alt,
  className = '',
}: {
  src: string
  alt: string
  className?: string
}) {
  const [dataUrl, setDataUrl] = useState<string>(processedImageCache[src] || '')

  useEffect(() => {
    let isMounted = true
    if (processedImageCache[src]) {
      setDataUrl(processedImageCache[src])
      return
    }
    if (!processingPromises[src]) {
      processingPromises[src] = new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = src
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth || 300
          canvas.height = img.naturalHeight || 300
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imgData.data
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i], g = data[i + 1], b = data[i + 2]
              if (g > 50 && g > r * 1.15 && g > b * 1.15) data[i + 3] = 0
            }
            ctx.putImageData(imgData, 0, 0)
            const finalUrl = canvas.toDataURL('image/png')
            processedImageCache[src] = finalUrl
            resolve(finalUrl)
          }
        }
      })
    }
    processingPromises[src].then((url) => {
      if (isMounted) setDataUrl(url)
    })
    return () => { isMounted = false }
  }, [src])

  if (!dataUrl) {
    return <div className={`opacity-0 ${className}`} style={{ minHeight: '60px' }} />
  }
  return <img src={dataUrl} alt={alt} className={className} draggable="false" />
}

export default function Leaderboard({ onBack, initialTab = 'honour' }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>(initialTab)
  const [activeSubTab, setActiveSubTab] = useState<LeaderboardSubTab>('daily')
  const [showRulesSheet, setShowRulesSheet] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => { setMounted(true) }, [])

  const tabs: { id: LeaderboardTab; label: string }[] = [
    { id: 'honour', label: 'Honour' },
    { id: 'charm', label: 'Charm' },
    { id: 'room', label: 'Room' },
  ]

  const subTabs: { id: LeaderboardSubTab; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
  ]

  const tabImages: Record<LeaderboardTab, { top: string }> = {
    honour: { top: '/file_00000000b83c81fa93d3e53e046c1b81.png' },
    charm: { top: '/file_0000000086f481fa8653fc12d2577596.png' },
    room: { top: '/file_00000000619c822f8a1577f69e039527.png' },
  }

  const activeSubTabIndex = subTabs.findIndex(st => st.id === activeSubTab)
  const rankCards = Array.from({ length: 47 }, (_, i) => i + 4)

  const rulesSheet = showRulesSheet && mounted
    ? createPortal(
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            pointerEvents: 'auto',
            animation: 'zSlideUp 0.28s ease-out',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              width: '100%',
              maxWidth: 520,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              boxShadow: '0 -6px 24px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 20px 12px' }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.5, color: '#1A0204', margin: 0 }}>
                Rules
              </h2>
            </div>

            {/* Content */}
            <div style={{ padding: '4px 20px 0', fontSize: 12.5, lineHeight: 1.55, color: '#2B2B2B' }}>
              <h3 style={{ fontSize: 13.5, fontWeight: 700, color: '#1A0204', margin: '0 0 4px' }}>Contribution Leaderboard:</h3>
              <p style={{ margin: '0 0 10px', color: '#444' }}>
                Your ranking on this leaderboard is determined by the total number of Coins you have spent in the room. The higher the amount spent, the higher your position on the leaderboard.
              </p>

              <h3 style={{ fontSize: 13.5, fontWeight: 700, color: '#1A0204', margin: '0 0 4px' }}>Charm Leaderboard:</h3>
              <p style={{ margin: '0 0 10px', color: '#444' }}>
                Your ranking on this leaderboard is determined by the total number of Coins you Receive. The higher the amount spent, the higher your position on the leaderboard.
              </p>

              <h3 style={{ fontSize: 13.5, fontWeight: 700, color: '#1A0204', margin: '0 0 4px' }}>Room Leaderboard:</h3>
              <p style={{ margin: '0 0 10px', color: '#444' }}>
                Your ranking on this leaderboard is determined by the total number of Coins you have spent in the room. The higher the amount spent, the higher your position on the leaderboard.
              </p>

              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A0204', margin: '12px 0 8px' }}>Data Periods</h3>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: '#1A0204', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginTop: 1 }}>1</span>
                  <p style={{ margin: 0, color: '#444', paddingTop: 1 }}>Daily leaderboard data is finalized every day at <span style={{ fontWeight: 600, color: '#1A0204' }}>(5:30+GMT)</span>.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: '#1A0204', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginTop: 1 }}>2</span>
                  <p style={{ margin: 0, color: '#444', paddingTop: 1 }}>Weekly leaderboard data is finalized every Monday at <span style={{ fontWeight: 600, color: '#1A0204' }}>(5:30+GMT)</span>.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: '#1A0204', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginTop: 1 }}>3</span>
                  <p style={{ margin: 0, color: '#444', paddingTop: 1 }}>Monthly leaderboard data is finalized on the first day of every month at <span style={{ fontWeight: 600, color: '#1A0204' }}>(5:30+GMT)</span>.</p>
                </div>
              </div>

              <div style={{ borderRadius: 8, background: '#F5F5F5', border: '1px solid #E0E0E0', padding: '8px 12px', marginBottom: 12 }}>
                <p style={{ margin: 0, color: '#333', fontStyle: 'italic' }}>
                  <span style={{ fontWeight: 700, fontStyle: 'normal', color: '#1A0204' }}>Note:</span> Users who violate platform rules are ineligible to participate in the rankings.
                </p>
                <p style={{ margin: '4px 0 0', color: '#333', fontStyle: 'italic' }}>
                  The platform reserves the right to make the final decision.
                </p>
              </div>

              <p style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#1A0204', margin: 0 }}>
                Regard Zyora team
              </p>
            </div>
          </div>
          <style>{`@keyframes zSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </div>,
        document.body
      )
    : null

  return (
    <div
      className="min-h-screen bg-[#1A0204] text-white overflow-y-auto overflow-x-hidden flex flex-col select-none relative"
      style={{ touchAction: 'manipulation', WebkitUserSelect: 'none' }}
    >
      {/* BACKGROUND TOP IMAGE */}
      <div
        className="absolute top-0 left-0 w-full pointer-events-none z-0 overflow-hidden"
        style={{
          height: '60vh',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
        }}
      >
        <img key={`${activeTab}-top`} src={tabImages[activeTab].top} alt={`${activeTab} top`} className="w-full h-full object-cover" draggable="false" />
      </div>

      {/* FIXED TOP HEADER */}
      <header className="relative z-50 flex flex-col w-full" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>
        <div className="relative flex items-center justify-center w-full h-[45px] mb-1.5">
          <button onClick={onBack} className="absolute left-2 flex items-center justify-center active:opacity-70 transition-opacity p-1" aria-label="Back">
            <img src="/file_0000000051d881f5af4f9cf84a56dcd3.png" alt="Back" className="w-10 h-10 object-contain" draggable="false" />
          </button>

          <div className="flex items-center justify-between h-[42px] border-[1px] border-[#D4AF37] rounded-full bg-[#110A07]/80 w-[55%] max-w-[260px] overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.6)] px-[2px]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 text-[15px] font-semibold h-[38px] rounded-full transition-all flex items-center justify-center ${
                  activeTab === tab.id ? 'text-white' : 'text-[#8A857D]'
                }`}
              >
                {activeTab === tab.id && (
                  <span className="absolute inset-0 bg-gradient-to-b from-[#E7B865] via-[#BA7627] to-[#743410] rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]" />
                )}
                <span className="relative z-10 drop-shadow-md">{tab.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowRulesSheet(true)}
            className="absolute right-2 flex items-center justify-center active:opacity-70 transition-opacity p-1 cursor-pointer"
            aria-label="Info"
          >
            <img src="/file_0000000073ec820b832b6dafb168dabe.png" alt="Info" className="w-10 h-10 object-contain pointer-events-none" draggable="false" />
          </button>
        </div>

        {/* SUB-TABS */}
        <div className="relative w-[180px] h-[40px] z-10 flex items-center justify-start gap-0.5 ml-4 shrink-0 self-start">
          {subTabs.map((st) => (
            <button
              key={st.id}
              onClick={() => setActiveSubTab(st.id)}
              className="relative z-10 flex-1 flex items-center justify-center text-[15px] font-bold transition-colors"
              style={{ color: activeSubTab === st.id ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)' }}
            >
              {st.label}
            </button>
          ))}
          <span
            className="absolute z-0 bottom-0 top-[2px] h-full w-[33.33%] bg-gradient-to-b from-[#D4AF37]/40 via-[#D4AF37]/15 to-transparent rounded-md transition-transform duration-300 ease-out"
            style={{ transform: `translateX(calc(${activeSubTabIndex * 100}%))`, boxShadow: '0 -2px 5px rgba(212, 175, 55, 0.4)' }}
          >
            <span className="absolute left-[30%] right-[30%] top-[-1px] h-[3px] bg-[#FFF] rounded-full scale-y-[1.2] blur-[0.5px]" />
          </span>
        </div>

        {/* PODIUM */}
        <div className="relative z-10 w-full shrink-0 flex flex-col items-center">
          <div className="w-full flex flex-col items-center gap-0.5 mt-5">
            <div className="flex justify-center w-full">
              <ChromaImage src="/1787994771034~2.jpg" alt="Top 1" className="w-45 h-auto object-contain drop-shadow-2xl" />
            </div>
            <div className="flex justify-between items-center w-full px-0 mt-4">
              <ChromaImage src="/1787994751636~2.jpg" alt="Top 2" className="w-40 h-auto object-contain drop-shadow-lg -ml-1" />
              <ChromaImage src="/1787994761762~2.jpg" alt="Top 3" className="w-40 h-auto object-contain drop-shadow-lg -mr-1" />
            </div>
          </div>
        </div>

        <div style={{ height: '5vh' }} className="w-full shrink-0 relative z-10" />
      </header>

      {/* RANK CARDS */}
      <div className="relative z-10 flex-1">
        {rankCards.map((rank) => (
          <div key={rank} className="relative w-full flex items-center justify-start overflow-hidden shrink-0 h-[80px]">
            <ChromaImage src="/1787992320047~2.jpg" alt={`Rank ${rank}`} className="absolute inset-0 w-full h-full object-fill" />
            <span className="relative z-10 left-10 text-white font-bold text-lg">{rank}</span>
          </div>
        ))}
      </div>

      {/* FIXED BOTTOM USER CARD */}
      <div className="fixed bottom-0 left-0 w-full h-[90px] px-0 py-0 z-50 pointer-events-auto shadow-[0_-5px_20px_rgba(0,0,0,0.8)] border-t-[1.5px] border-[#694B2E] bg-gradient-to-b from-[#3E2114] via-[#2A1309] to-[#120703]">
        <div className="relative w-full h-full flex items-center justify-start px-6 gap-5" />
      </div>

      {rulesSheet}
    </div>
  )
            }
