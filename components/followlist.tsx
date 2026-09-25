'use client'

import React, { useState } from 'react'

// ============ TYPES ============
interface FollowListProps {
  onBack: () => void
  type: 'followers' | 'following' | 'visitors' | 'friends'
  onNavigate?: (page: "home" | "message" | "me") => void;
  activePage?: "home" | "message" | "me";
}

interface VisitorsProps {
  onBack: () => void
  onNavigate?: (page: "home" | "message" | "me") => void;
  activePage?: "home" | "message" | "me";
}

// ============ CONSTANTS ============
const FOLLOW_TABS = [
  { id: 'friends', label: 'Friends' },
  { id: 'followers', label: 'Followers' },
  { id: 'following', label: 'Following' },
]

const VISITOR_TABS = [
  { id: 'visitors', label: 'Visitors' },
  { id: 'visited', label: 'Who I Have Visited' },
]

const SINGULAR: { [key: string]: string } = {
  friends: 'Friend',
  followers: 'Follower',
  following: 'Following',
}

// ============ BOTTOM NAV BAR ============
function BottomNavBar({
  activePage,
  onNavigate,
}: {
  activePage: 'home' | 'message' | 'me'
  onNavigate?: (page: "home" | "message" | "me") => void;
}) {
  const handleNav = (page: 'home' | 'message' | 'me') => {
    if (onNavigate) onNavigate(page)
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex justify-center z-50 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex justify-around items-center bg-white border-t border-zinc-100 shadow-lg px-3 py-1.5 w-full h-[65px]">
        {/* Home */}
        <button
          onClick={() => handleNav('home')}
          className="group flex flex-col items-center gap-1 w-16 transition-all duration-200 active:scale-95 origin-center"
        >
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
            <path
              d="M18 2.8C20.2 2.8 30.2 8.2 30.2 12.6V23.2C30.2 27.8 28 31 18 31C8 31 5.8 27.8 5.8 23.2V12.6C5.8 8.2 15.8 2.8 18 2.8Z"
              fill={activePage === 'home' ? '#3b82f6' : 'white'}
              stroke="#1D1D1F"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <path
              d="M12.2 14.2C13.3 12.6 14.9 12.1 16.8 13.4"
              stroke="#1D1D1F"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M11.2 20.8C12.5 24.2 21 25.6 24.3 20.2"
              stroke="#1D1D1F"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <span
            className={`text-[12px] ${
              activePage === 'home' ? 'font-semibold text-black' : 'text-gray-500'
            }`}
          >
            Home
          </span>
        </button>

        {/* Message */}
        <button
          onClick={() => handleNav('message')}
          className="group flex flex-col items-center gap-1 w-16 transition-all duration-200 active:scale-95 origin-center"
        >
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
            <path
              d="M6 10.5C6 7 8.3 5 12.2 5H23.8C27.7 5 30 7 30 10.5V16.5C30 20 27.7 22 23.8 22H21 L17.5 27.2C17 28 15.8 28 15.2 27.2L12.2 22C8.3 22 6 20 6 16.5V10.5Z"
              fill={activePage === 'message' ? '#3b82f6' : 'white'}
              stroke="#1D1D1F"
              strokeWidth="2.4"
            />
            <path
              d="M12 14.5C13.5 12.5 15.5 14.5 19.5 12.5C21.5 14.5 24 14.5 24 14.5"
              stroke="#1D1D1F"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <span
            className={`text-[12px] ${
              activePage === 'message' ? 'font-semibold text-black' : 'text-gray-500'
            }`}
          >
            Message
          </span>
        </button>

        {/* Me */}
        <button
          onClick={() => handleNav('me')}
          className="group flex flex-col items-center gap-1 w-16 transition-all duration-200 active:scale-95 origin-center"
        >
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
            <path
              d="M18 4.5C23.5 4.5 28 8.5 27.2 13.8L26.2 19.8C26 21.2 27.2 22.5 28.6 23.1C30.6 24 31 26.2 29 27.5C27.5 28.5 25 28.8 22 28.8H14C11 28.8 8.5 28.5 7 27.5C5 26.2 5.4 24 7.4 23.1C8.8 22.5 10 21.2 9.8 19.8L8.8 13.8C8 8.5 12.5 4.5 18 4.5Z"
              fill={activePage === 'me' ? '#3b82f6' : 'white'}
              stroke="#1D1D1F"
              strokeWidth="2.4"
            />
            <circle cx="14" cy="15" r="1.6" fill="#1D1D1F" />
            <circle cx="22" cy="15" r="1.6" fill="#1D1D1F" />
          </svg>
          <span
            className={`text-[12px] ${
              activePage === 'me' ? 'font-semibold text-black' : 'text-gray-500'
            }`}
          >
            Me
          </span>
        </button>
      </div>
    </div>
  )
}

// ============ FOLLOW LIST ============
export function FollowList({ onBack, type, onNavigate, activePage = "me" }: FollowListProps) {
  const initialTab = type === 'visitors' ? 'friends' : type
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  const currentLabel = FOLLOW_TABS.find((t) => t.id === activeTab)?.label || 'Friends'
  const singularLabel = SINGULAR[activeTab] || 'User'

  const count =
    activeTab === 'followers' ? 10 : activeTab === 'following' ? 7 : 12

  const users = Array.from({ length: count }, (_, i) => i + 1)

  return (
    <div
      className="h-screen flex flex-col select-none overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #3b82f6 0%, #dbeafe 15%, #f3f4f6 29%, #f3f4f6 100%)',
        paddingTop:
          'calc(max(env(safe-area-inset-top, 0px), var(--status-bar-height, 0px)) + 8px)',
        touchAction: 'manipulation',
        WebkitUserSelect: 'none',
        paddingBottom: '80px',
      }}
    >
      {/* Header — FIXED */}
      <div className="relative flex items-center w-full h-[58px] shrink-0 px-4 bg-transparent">
        <h1 className="text-[24px] font-bold text-[#1E1E1E]">{currentLabel}</h1>
      </div>

      {/* Tabs Bar — FIXED, no card look */}
      <div className="px-3 mb-3 shrink-0 bg-transparent">
        <div className="rounded-md flex items-center overflow-hidden bg-white/30">
          {FOLLOW_TABS.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 text-[12px] font-semibold transition-all flex items-center justify-center h-[42px] ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-transparent text-gray-600'
              } ${i === 0 ? 'rounded-l-md' : ''} ${
                i === FOLLOW_TABS.length - 1 ? 'rounded-r-md' : ''
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* User List — SIRF YAHI SCROLL HOGA */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {users.map((item) => (
          <div key={item} className="flex items-center gap-2 py-2">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm truncate">
                {singularLabel} {item}
              </div>
              <div className="text-xs text-gray-500 truncate">
                @{activeTab}
                {item}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav Bar */}
      <BottomNavBar activePage={activePage} onNavigate={onNavigate} />
    </div>
  )
}

// ============ VISITORS ============
export function VisitorsPage({ onBack, onNavigate }: VisitorsProps) {
  const [activeTab, setActiveTab] = useState<'visitors' | 'visited'>('visitors')

  return (
    <div
      className="h-screen flex flex-col select-none overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #3b82f6 0%, #dbeafe 15%, #f3f4f6 29%, #f3f4f6 100%)',
        paddingTop:
          'calc(max(env(safe-area-inset-top, 0px), var(--status-bar-height, 0px)) + 8px)',
        touchAction: 'manipulation',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Header — Back arrow left, Heading middle (FIXED) */}
      <div className="relative flex items-center justify-center w-full h-[58px] shrink-0 px-3">
        <button
          onClick={onBack}
          className="absolute left-3 top-0 h-full flex items-center justify-center active:opacity-70 transition-opacity cursor-pointer"
          aria-label="Back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5" stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19L5 12L12 5" stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <h1 className="text-[24px] font-bold text-[#1E1E1E]">Visitors</h1>
      </div>

      {/* Tabs Bar — FIXED, no card look, black underline on active */}
      <div className="px-3 mb-3 shrink-0 bg-transparent">
        <div className="flex items-center bg-transparent">
          {VISITOR_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'visitors' | 'visited')}
              className="flex-1 flex flex-col items-center justify-center h-[42px] bg-transparent"
            >
              <span
                className={`text-[12px] font-semibold transition-all ${
                  activeTab === tab.id ? 'text-black' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </span>
              <span
                className={`mt-1 h-[2px] rounded-full transition-all ${
                  activeTab === tab.id ? 'w-6 bg-black' : 'w-0 bg-transparent'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Content — SIRF YAHI SCROLL HOGA (empty) */}
      <div className="flex-1 overflow-y-auto px-3 pb-4" />
    </div>
  )
}

// ============ DEFAULT EXPORT ============
export default FollowList
