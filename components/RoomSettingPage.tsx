'use client'

import React, { useState, useRef, useEffect } from 'react'
import { socket } from '../src/lib/socket'
import { apiUrl } from '../src/lib/api'

const ROOM_SETTINGS_DB_NAME = "HurryRoomSettingsDB";
const ROOM_SETTINGS_STORE = "roomSettings";

const saveMicModeToIndexedDB = async (roomId: string, micMode: number) => {
  if (!roomId || typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(ROOM_SETTINGS_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ROOM_SETTINGS_STORE)) {
        db.createObjectStore(ROOM_SETTINGS_STORE, { keyPath: "roomId" });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(ROOM_SETTINGS_STORE, "readwrite");
      const store = tx.objectStore(ROOM_SETTINGS_STORE);
      const getRequest = store.get(String(roomId));
      getRequest.onsuccess = () => {
        store.put({
          ...(getRequest.result || {}),
          roomId: String(roomId),
          micMode: Number(micMode),
          updatedAt: Date.now(),
        });
      };
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
};

export interface RoomSettingsData {
  roomDp: string;
  roomName: string;
  announcement: string;
  isLocked: boolean;
  roomPassword?: string;
  micMode: number;
  theme: string;
  admin?: string[];
}

interface RoomUser {
  accountId: string;
  name: string;
  image: string;
}

interface RoomSettingPageProps {
  onBack: () => void
  roomOwnerId?: string
  roomData?: {
    roomName?: string
    roomDp?: string
    announcement?: string
    theme?: string
    admin?: string[]
    isLocked?: boolean
    roomPassword?: string
    micMode?: number
  }
  onSave?: (data: Partial<RoomSettingsData>) => void
}

// ---------- Mic mode image card ----------
function MicModeImageCard({ count }: { count: number }) {
  const getModeImage = (count: number) => {
    switch(count) {
      case 5: return '/IMG_20260914_110225.png'
      case 10: return '/IMG_20260914_110239.png'
      case 15: return '/IMG_20260914_110253.png'
      default: return '/IMG_20260914_110239.png'
    }
  }
  return (
    <div className="relative w-full rounded-xl overflow-hidden">
      <img src={getModeImage(count)} alt={`Mic mode ${count}`} className="w-full h-auto object-contain" />
    </div>
  )
}

// ---------- Password Input ----------
function PasswordInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleInput = (index: number, inputValue: string) => {
    const numberValue = inputValue.replace(/[^0-9]/g, '')

    if (numberValue.length > 1) {
      const newPassword = (value.slice(0, index) + numberValue).slice(0, 4)
      onChange(newPassword)
      const nextEmpty = Math.min(newPassword.length, 3)
      inputRefs.current[nextEmpty]?.focus()
      return
    }

    if (numberValue) {
      const newDigits = value.split('')
      newDigits[index] = numberValue.slice(-1)
      const newPassword = newDigits.join('').slice(0, 4)
      onChange(newPassword)
      if (index < 3) inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[index]) {
        const newDigits = value.split('')
        newDigits[index] = ''
        onChange(newDigits.join(''))
      } else if (index > 0) {
        e.preventDefault()
        const newDigits = value.split('')
        newDigits[index - 1] = ''
        onChange(newDigits.join(''))
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleInput(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-black"
        />
      ))}
    </div>
  )
}

// ------------------------------------------------------------
// ---------- CROP MODAL COMPONENT (UPDATED) ----------
// ------------------------------------------------------------
function CropModal({ imageSrc, onCancel, onCrop }: { imageSrc: string; onCancel: () => void; onCrop: (cropped: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  // Image load hone par initial scale set karo taaki wo box ko cover kare
  const handleImageLoad = () => {
    const img = imgRef.current
    const container = containerRef.current
    if (!img || !container) return

    const containerSize = container.offsetWidth // Square box (e.g. 300px)
    const imgRatio = img.naturalWidth / img.naturalHeight
    let initialScale = 1

    if (imgRatio > 1) {
      initialScale = containerSize / img.naturalHeight
    } else {
      initialScale = containerSize / img.naturalWidth
    }

    setScale(initialScale)
    setPosition({ x: 0, y: 0 })
    setImageLoaded(true)
  }

  // Drag handlers (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => setIsDragging(false)

  // Drag handlers (Touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    setPosition({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y })
  }

  const handleTouchEnd = () => setIsDragging(false)

  // Crop & Save logic
  const handleCrop = () => {
    const img = imgRef.current
    const container = containerRef.current
    if (!img || !container) return

    const containerSize = container.offsetWidth
    const outputSize = 640

    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outputSize, outputSize)

    const imgW = img.naturalWidth * scale
    const imgH = img.naturalHeight * scale

    const containerCenter = containerSize / 2
    const imgLeft = containerCenter + position.x - imgW / 2
    const imgTop = containerCenter + position.y - imgH / 2

    const ratio = outputSize / containerSize
    ctx.drawImage(
      img,
      imgLeft * ratio,
      imgTop * ratio,
      imgW * ratio,
      imgH * ratio
    )

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
    onCrop(croppedDataUrl)
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* ✅ Top Bar: Left Back Button + Center Title + Right Tick Button */}
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-3 flex-shrink-0">
        {/* Left: Back Button */}
        <button
          onClick={onCancel}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-white stroke-[2.5]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l7-7m-7 7l7 7" />
          </svg>
        </button>

        {/* Center: Title */}
        <h3 className="text-white font-bold text-lg">Crop Image</h3>

        {/* Right: Tick / Confirm Button */}
        <button
          onClick={handleCrop}
          disabled={!imageLoaded}
          className={`p-2 -mr-2 rounded-full transition-colors ${
            imageLoaded ? 'hover:bg-white/10' : 'opacity-40 cursor-not-allowed'
          }`}
          aria-label="Confirm Crop"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-green-400 stroke-[3]">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Crop Area - Center */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Crop Box */}
          <div
            ref={containerRef}
            className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden cursor-move touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 opacity-30">
              <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white" />
              <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white" />
              <div className="absolute left-0 right-0 top-1/3 h-px bg-white" />
              <div className="absolute left-0 right-0 top-2/3 h-px bg-white" />
            </div>

            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                Loading...
              </div>
            )}

            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop"
              onLoad={handleImageLoad}
              className="absolute select-none pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                maxWidth: 'none',
                maxHeight: 'none',
              }}
              draggable={false}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl font-semibold text-gray-800 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              disabled={!imageLoaded}
              className={`flex-1 py-3 rounded-xl font-semibold text-white transition-colors ${
                imageLoaded ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 cursor-not-allowed'
              }`}
            >
              Crop & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------

export default function RoomSettingPage({ onBack, roomOwnerId, roomData, onSave }: RoomSettingPageProps) {
  const [roomDp, setRoomDp] = useState<string>(roomData?.roomDp || '/default-avatar.png')
  const [roomName, setRoomName] = useState<string>(roomData?.roomName || 'Room')
  const [announcement, setAnnouncement] = useState<string>(roomData?.announcement || '')
  const [isLocked, setIsLocked] = useState<boolean>(roomData?.isLocked || false)
  const [selectedMicMode, setSelectedMicMode] = useState<number>(roomData?.micMode || 10)
  const [showMicModeSheet, setShowMicModeSheet] = useState(false)
  const [showThemePage, setShowThemePage] = useState(false)
  const [showLockCard, setShowLockCard] = useState(false)
  const [password, setPassword] = useState('')
  const [roomPassword, setRoomPassword] = useState(roomData?.roomPassword || '')
  const [selectedTheme, setSelectedTheme] = useState(roomData?.theme || 'forest-night')

  const [showAdminSheet, setShowAdminSheet] = useState(false)
  const [adminSearchQuery, setAdminSearchQuery] = useState('')
  const [roomMembers, setRoomMembers] = useState<RoomUser[]>([])
  const [admins, setAdmins] = useState<string[]>(roomData?.admin || [])

  const [isSaving, setIsSaving] = useState(false)

  // ✅ CROP MODAL STATE
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)

  // ============ FETCH ROOM MEMBERS ============
  useEffect(() => {
    if (!roomOwnerId) return

    const applyMembers = (users: any[]) => {
      if (!Array.isArray(users)) return
      const mapped: RoomUser[] = users.map((m: any) => ({
        accountId: String(m.accountId || m.userId || m.appLongId || ''),
        name: m.name || m.userName || m.displayName || 'User',
        image: m.image || m.dp || m.avatar || m.photo || '/default-avatar.png',
      })).filter(u => u.accountId)
      setRoomMembers(mapped)
    }

    const handleRoomMembers = (data: any) => {
      if (String(data?.roomId) !== String(roomOwnerId)) return
      applyMembers(data?.users || [])
    }

    socket.on('room_members_list', handleRoomMembers)
    socket.emit('get_room_members', { roomId: roomOwnerId })

    const fetchFromApi = async () => {
      try {
        const res = await fetch(apiUrl(`/api/rooms?roomId=${encodeURIComponent(roomOwnerId)}&members=true`))
        if (!res.ok) return
        const data = await res.json()
        const users = data?.users || data?.members || data?.room?.users || []
        if (users.length > 0) applyMembers(users)
      } catch (err) {
        console.warn('Members API fetch failed:', err)
      }
    }
    fetchFromApi()

    return () => {
      socket.off('room_members_list', handleRoomMembers)
    }
  }, [roomOwnerId])

  const micModes = [5, 10, 15]

  const themes = [
    { id: 'forest-night', name: 'Forest Night', image: '/1784875884052~2.jpg' },
    { id: 'mood-light', name: 'Moon Light', image: '/1784533036732~2.jpg' },
  ]

  // ✅ IMAGE UPLOAD - ab crop modal open karega
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return }
    if (file.size > 10 * 1024 * 1024) { alert('Image size should be less than 10MB'); return }

    const reader = new FileReader()
    reader.onload = (event) => {
      const source = String(event.target?.result || '')
      setCropImageSrc(source) // Crop modal open karo
    }
    reader.readAsDataURL(file)
    // Input reset karo taaki same file dobara select kar sake
    e.target.value = ''
  }

  // ✅ CROP COMPLETE - yahan se DP set hogi
  const handleCropComplete = (croppedDataUrl: string) => {
    setRoomDp(croppedDataUrl)
    setCropImageSrc(null)
  }

  const handleSetPassword = () => {
    if (password.length === 4) {
      setIsLocked(true)
      setRoomPassword(password)
      setShowLockCard(false)
      setPassword('')
    }
  }

  const handleUnlockPassword = () => {
    setIsLocked(false)
    setRoomPassword('')
    setShowLockCard(false)
    setPassword('')
  }

  const toggleAdminStatus = (accountId: string) => {
    setAdmins(prev =>
      prev.includes(accountId) ? prev.filter(id => id !== accountId) : [...prev, accountId]
    )
  }

  // ============ SAVE — ASLI FIX ============
  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)

    const settingsData: Partial<RoomSettingsData> = {
      roomDp,
      roomName: roomName.trim() || 'Room',
      announcement,
      isLocked,
      roomPassword,
      micMode: selectedMicMode,
      theme: selectedTheme,
      admin: admins,
    }

    try {
      if (roomOwnerId) {
        const res = await fetch(apiUrl('/api/rooms'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: roomOwnerId,
            roomId: roomOwnerId,
            id: roomOwnerId,
            roomName: settingsData.roomName,
            name: settingsData.roomName,
            'Room Name': settingsData.roomName,
            roomDp: settingsData.roomDp,
            image: settingsData.roomDp,
            'Room dp': settingsData.roomDp,
            announcement: settingsData.announcement,
            message: settingsData.announcement,
            theme: settingsData.theme,
            admin: settingsData.admin,
            isLocked: settingsData.isLocked,
            roomPassword: settingsData.roomPassword,
            micMode: settingsData.micMode,
          }),
        })

        if (!res.ok) {
          const errorText = await res.text().catch(() => 'Unknown error')
          throw new Error(`Save failed: ${res.status} - ${errorText.slice(0, 200)}`)
        }
      }

      await saveMicModeToIndexedDB(String(roomOwnerId || ""), Number(settingsData.micMode || 15));

      const currentUserId = localStorage.getItem('userUID') || localStorage.getItem('accountNumber') || '';
      socket.emit('room_settings_update', {
        roomId: roomOwnerId,
        userId: currentUserId,
        roomOwnerId: roomOwnerId,
        roomName: settingsData.roomName,
        roomDp: settingsData.roomDp,
        announcement: settingsData.announcement,
        micMode: settingsData.micMode,
        theme: settingsData.theme,
        isLocked: settingsData.isLocked,
        roomPassword: settingsData.roomPassword,
        updatedAt: Date.now(),
      })

      if (onSave) onSave(settingsData)

      try {
        const stored = localStorage.getItem('myRoom')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (String(parsed.id) === String(roomOwnerId) || String(parsed.accountId) === String(roomOwnerId)) {
            const updated = {
              ...parsed,
              name: settingsData.roomName,
              image: settingsData.roomDp,
              isLocked: settingsData.isLocked,
              roomPassword: settingsData.roomPassword,
            }
            localStorage.setItem('myRoom', JSON.stringify(updated))
          }
        }
      } catch {}

      onBack()
    } catch (err: any) {
      console.error('Save error:', err)

      const statusMatch = String(err?.message || '').match(/Save failed: (\d+)/)
      const status = statusMatch ? statusMatch[1] : 'unknown'

      let hint = ''
      if (status === '404') hint = '\n\n(API route /api/rooms nahi mil rahi)'
      else if (status === '413') hint = '\n\n(DP bahut bada hai, chhota image use karo)'
      else if (status === '400') hint = '\n\n(Data format galat hai)'
      else if (status === '500') hint = '\n\n(Server error — MongoDB check karo)'

      alert(`Save failed!\n\nStatus: ${status}${hint}\n\nMessage: ${err?.message || 'Network error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredMembers = roomMembers.filter(user =>
    user.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
    user.accountId.toLowerCase().includes(adminSearchQuery.toLowerCase())
  )

  return (
    <>
      {/* MAIN SETTINGS PAGE */}
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center px-2 pt-[calc(env(safe-area-inset-top,0px)+24px)] pb-3 flex-shrink-0 bg-white">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-gray-800 stroke-[2.5]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l7-7m-7 7l7 7" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-gray-800">Room Setting</h1>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
              isSaving ? 'text-gray-400' : 'text-blue-500 hover:text-blue-600'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Room Cover / Photo Section */}
          <div className="mb-6 flex flex-col items-center">
            <label className="cursor-pointer relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-md">
                <img src={roomDp} alt="Room Cover" className="w-full h-full object-cover" />
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <button
              onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (input) input.click();
              }}
              className="mt-3 flex items-center gap-1.5 px-4 py-1.5 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-gray-700 stroke-[2]">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Edit Room photo
            </button>
          </div>

          {/* Room Name */}
          <div className="mb-5">
            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-medium text-gray-600">Room Name</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                className="text-right text-gray-800 bg-transparent border-none focus:outline-none placeholder-gray-400 text-sm w-1/2"
              />
            </div>
          </div>

          {/* Announcement */}
          <div className="mb-5">
            <div className="flex items-start justify-between px-1">
              <label className="text-sm font-medium text-gray-600 pt-1">Room Announcement</label>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Enter announcement..."
                rows={2}
                className="text-right text-gray-800 bg-transparent border-none focus:outline-none placeholder-gray-400 text-sm w-1/2 resize-none"
              />
            </div>
          </div>

          {/* Theme */}
          <div className="mb-5">
            <button
              onClick={() => setShowThemePage(true)}
              className="flex items-center justify-between px-1 w-full hover:bg-gray-50 active:bg-gray-100 py-2 rounded-lg"
            >
              <label className="text-sm font-medium text-gray-600">Theme</label>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-gray-400 stroke-[2]">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Admin */}
          <div className="mb-5">
            <button
              onClick={() => setShowAdminSheet(true)}
              className="flex items-center justify-between px-1 w-full hover:bg-gray-50 active:bg-gray-100 py-2 rounded-lg cursor-pointer"
            >
              <label className="text-sm font-medium text-gray-600">Admin</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{admins.length} Selected</span>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-gray-400 stroke-[2]">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
          </div>

          {/* Lock Room */}
          <div className="mb-5">
            <button
              onClick={() => { setPassword(isLocked ? roomPassword : ''); setShowLockCard(true) }}
              className="flex items-center justify-between px-1 w-full hover:bg-gray-50 active:bg-gray-100 py-2 rounded-lg"
            >
              <label className="text-sm font-medium text-gray-600">Lock Room</label>
              <div className="flex items-center gap-2">
                {isLocked && <span className="text-xs text-red-500 font-medium">Locked</span>}
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-gray-400 stroke-[2]">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
          </div>

          {/* Mic Mode */}
          <div className="mb-5">
            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-medium text-gray-600">Mic Mode</label>
              <button
                onClick={() => setShowMicModeSheet(true)}
                className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-lg"
              >
                <span className="text-sm font-semibold text-gray-800">Mic {selectedMicMode}</span>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-gray-400 stroke-[2]">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Theme Full Page */}
        {showThemePage && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col">
            <div className="flex items-center px-4 py-3 flex-shrink-0 bg-white">
              <button
                onClick={() => setShowThemePage(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-gray-800 stroke-[2.5]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l7-7m-7 7l7 7" />
                </svg>
              </button>
              <h3 className="flex-1 text-center text-lg font-bold text-gray-800">Room Theme</h3>
              <div className="w-10"></div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="grid grid-cols-2 gap-4">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => { setSelectedTheme(theme.id); setShowThemePage(false) }}
                    className={`flex flex-col rounded-xl overflow-hidden transition-all ${
                      selectedTheme === theme.id ? 'ring-2 ring-blue-400 ring-offset-2' : 'hover:opacity-90'
                    }`}
                  >
                    <div className="w-full h-64 rounded-xl overflow-hidden">
                      <img src={theme.image} alt={theme.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 mt-2 mb-1 text-center">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lock Room Card */}
        {showLockCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowLockCard(false)} />
            <div className="relative bg-white w-80 rounded-2xl shadow-2xl p-6 mx-4">
              <h3 className="text-lg font-bold text-gray-800 text-center mb-6">Set Room Password</h3>
              <PasswordInput value={password} onChange={setPassword} />
              {isLocked && password === roomPassword ? (
                <button
                  onClick={handleUnlockPassword}
                  className="w-full mt-6 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-all"
                >
                  Unlock Room
                </button>
              ) : (
                <button
                  onClick={handleSetPassword}
                  disabled={password.length !== 4}
                  className={`w-full mt-6 py-3 rounded-xl font-semibold text-white transition-all ${
                    password.length === 4 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isLocked ? 'Update Password' : 'Set Password'}
                </button>
              )}
              <button
                onClick={() => { setShowLockCard(false); setPassword('') }}
                className="w-full mt-3 py-2 text-gray-500 font-medium text-center hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Mic Mode Sheet */}
        {showMicModeSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowMicModeSheet(false)} />
            <div className="relative bg-white w-full max-w-md rounded-t-2xl shadow-2xl px-4 py-6">
              <h3 className="text-lg font-bold text-gray-800 text-center mb-4">Select Mic Mode</h3>
              <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {micModes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setSelectedMicMode(mode); setShowMicModeSheet(false) }}
                    className="flex flex-col items-center rounded-xl overflow-hidden transition-all hover:opacity-90"
                  >
                    <MicModeImageCard count={mode} />
                    <span className={`text-sm mt-2 mb-1 ${
                      selectedMicMode === mode ? 'text-blue-500 font-bold' : 'text-gray-700 font-medium'
                    }`}>
                      Mic {mode}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowMicModeSheet(false)}
                className="w-full mt-4 py-3 text-gray-500 font-medium text-center hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ✅ CROP MODAL */}
      {cropImageSrc && (
        <CropModal
          imageSrc={cropImageSrc}
          onCancel={() => setCropImageSrc(null)}
          onCrop={handleCropComplete}
        />
      )}

      {/* ADMIN SHEET */}
      {showAdminSheet && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdminSheet(false)} />
          <div
            className="relative bg-black w-full max-w-md rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: '40vh', maxHeight: '40vh', paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-4 py-3 flex-shrink-0">
              <button
                onClick={() => setShowAdminSheet(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-white stroke-[2.5]">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <h3 className="flex-1 text-center text-base font-bold text-white pr-8">Admin</h3>
            </div>

            <div className="px-4 py-3 flex-shrink-0">
              <input
                type="text"
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                placeholder="Search a ID for Admin"
                className="w-full bg-white/10 text-white placeholder-gray-400 text-xs px-3 py-2 rounded-md focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member, idx) => {
                  const isAdmin = admins.includes(member.accountId)
                  return (
                    <div key={`${member.accountId}_${idx}`} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                          <img src={member.image || '/default-avatar.png'} alt={member.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate">{member.name}</h4>
                          <p className="text-[10px] text-gray-400">ID: {member.accountId}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAdminStatus(member.accountId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 flex-shrink-0 ${
                          isAdmin ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        <span>{isAdmin ? '×1 Admin' : 'Admin'}</span>
                      </button>
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-xs">No members found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
