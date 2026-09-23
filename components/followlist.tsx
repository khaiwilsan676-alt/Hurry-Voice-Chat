'use client'

import React, { useState } from 'react'

// ============ TYPES ============
interface FollowListProps {
  onBack: () => void
  type: 'followers' | 'following' | 'visitors' | 'friends'
}

interface VisitorsProps {
  onBack: () => void
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

// ============ FOLLOW LIST COMPONENT ============
export function FollowList({ onBack, type }: FollowListProps) {
  const initialTab = type === 'visitors' ? 'friends' : type
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  const currentLabel = FOLLOW_TABS.find(t => t.id === activeTab)?.label || 'Friends'
  const singularLabel = SINGULAR[activeTab] || 'User'

  const count =
    activeTab === 'followers' ? 10 :
    activeTab === 'following' ? 7 : 12

  const users = Array.from({ length: count }, (_, i) => i + 1)

  return (
    <div
      className="min-h-screen flex flex-col select-none"
      style={{
        background: 'linear-gradient(to bottom, #3b82f6 0%, #dbeafe 18%, #f3f4f6 42%, #f3f4f6 100%)',
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), var(--status-bar-height, 0px)) + 8px)',
        touchAction: 'manipulation',
        WebkitUserSelect: 'none'
      }}
    >
      {/* Header */}
      <div className="relative flex items-center justify-center w-full h-[52px] shrink-0 px-3">
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

        <h1 className="text-[19px] font-bold text-[#1E1E1E]">
          {currentLabel}
        </h1>
      </div>

      {/* Tabs Bar — transparent, corner md */}
      <div className="px-3 mb-3">
        <div className="bg-white/40 rounded-md p-1 flex items-center gap-1">
          {FOLLOW_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-[12px] font-semibold rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-transparent text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* User List — no cards, plain items */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {users.map(item => (
          <div
            key={item}
            className="flex items-center gap-3 py-3"
          >
            <div className="w-11 h-11 rounded-full bg-gray-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm truncate">
                {singularLabel} {item}
              </div>
              <div className="text-xs text-gray-500 truncate">
                @{activeTab}{item}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ VISITORS COMPONENT ============
export function VisitorsPage({ onBack }: VisitorsProps) {
  const [activeTab, setActiveTab] = useState<'visitors' | 'visited'>('visitors')

  return (
    <div
      className="min-h-screen flex flex-col select-none"
      style={{
        background: 'linear-gradient(to bottom, #3b82f6 0%, #dbeafe 18%, #f3f4f6 42%, #f3f4f6 100%)',
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), var(--status-bar-height, 0px)) + 8px)',
        touchAction: 'manipulation',
        WebkitUserSelect: 'none'
      }}
    >
      {/* Header */}
      <div className="relative flex items-center justify-center w-full h-[52px] shrink-0 px-3">
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

        <h1 className="text-[19px] font-bold text-[#1E1E1E]">
          Visitors
        </h1>
      </div>

      {/* Tabs Bar — transparent, corner md */}
      <div className="px-3 mb-3">
        <div className="bg-white/40 rounded-md p-1 flex items-center gap-1">
          {VISITOR_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'visitors' | 'visited')}
              className={`flex-1 py-2.5 text-[12px] font-semibold rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-transparent text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content — Empty */}
      <div className="flex-1 overflow-y-auto px-3 pb-4" />
    </div>
  )
}

// ============ DEFAULT EXPORT ============
export default FollowList
