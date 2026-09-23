'use client'

import React from 'react'

interface FollowListProps {
  onBack: () => void
  type: 'followers' | 'following' | 'visitors' | 'friends'
}

export default function FollowList({ onBack, type }: FollowListProps) {
  // Get the heading based on type
  const getHeading = () => {
    switch (type) {
      case 'followers':
        return 'Followers'
      case 'following':
        return 'Following'
      case 'visitors':
        return 'Visitors'
      case 'friends':
        return 'Friends'
    }
  }

  // Get content based on type
  const getContent = () => {
    switch (type) {
      case 'followers':
        return (
          <div className="flex-1 overflow-y-auto p-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
              <div key={item} className="flex items-center gap-4 py-3 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900">User {item}</div>
                  <div className="text-sm text-gray-500">@user{item}</div>
                </div>
              </div>
            ))}
          </div>
        )
      case 'following':
        return (
          <div className="flex-1 overflow-y-auto p-4">
            {[1, 2, 3, 4, 5, 6, 7].map((item) => (
              <div key={item} className="flex items-center gap-4 py-3 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900">Following {item}</div>
                  <div className="text-sm text-gray-500">@following{item}</div>
                </div>
              </div>
            ))}
          </div>
        )
      case 'visitors':
        return (
          <div className="flex-1 overflow-y-auto p-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center gap-4 py-3 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900">Visitor {item}</div>
                  <div className="text-sm text-gray-500">Visited 2 hours ago</div>
                </div>
              </div>
            ))}
          </div>
        )
      case 'friends':
        return (
          <div className="flex-1 overflow-y-auto p-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item) => (
              <div key={item} className="flex items-center gap-4 py-3 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">Friend {item}</div>
                  <div className="text-sm text-gray-500 truncate">@friend{item}</div>
                </div>
                <button className="shrink-0 px-4 py-1.5 text-sm font-medium text-gray-900 border border-gray-300 rounded-full active:opacity-70 transition-opacity">
                  Message
                </button>
              </div>
            ))}
          </div>
        )
    }
  }

  // Handle back button click - calls the onBack prop
  const handleBack = () => {
    if (onBack) {
      onBack()
    }
  }

  return (
    <div
      className="min-h-screen bg-white flex flex-col select-none"
      style={{
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), var(--status-bar-height, 0px)) + 12px)',
        touchAction: 'manipulation',
        WebkitUserSelect: 'none'
      }}
    >
      {/* Header - Back Arrow in Extreme Corner + Centered Heading */}
      <div className="relative flex items-center justify-center w-full h-[56px] shrink-0">
        {/* Back Button - Extreme Left Corner */}
        <button
          onClick={handleBack}
          className="absolute left-0 top-0 h-full flex items-center justify-center pl-3 pr-2 active:opacity-70 transition-opacity cursor-pointer"
          aria-label="Back"
        >
          {/* Strict Back Left Arrow Icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 12H5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 19L5 12L12 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Heading - Center */}
        <h1 className="text-[17px] font-semibold text-gray-900">
          {getHeading()}
        </h1>
      </div>

      {/* Content */}
      {getContent()}
    </div>
  )
}
