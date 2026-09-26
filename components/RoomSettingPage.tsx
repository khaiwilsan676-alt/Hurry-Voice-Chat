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

export default function RoomSettingPage({ onBack, roomOwnerId, roomData, onSave }: RoomSettingPageProps) {
  const [roomDp, setRoomDp] = useState<string>(roomData?.roomDp || '/1784533036732~2.jpg')
  const [roomName, setRoomName] = useState<string>(roomData?.roomName || '')
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Image size should be less than 5MB'); return }

    const reader = new FileReader()
    reader.onload = (event) => {
      const source = String(event.target?.result || '')
      const img = new Image()
      img.onload = () => {
        const maxSide = 640
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || 1, img.naturalHeight || 1))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round((img.naturalWidth || 1) * scale))
        canvas.height = Math.max(1, Math.round((img.naturalHeight || 1) * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) { setRoomDp(source); return }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        setRoomDp(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.onerror = () => setRoomDp(source)
      img.src = source
    }
    reader.readAsDataURL(file)
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
      // ✅ 1. DIRECT MONGO SAVE
      if (roomOwnerId) {
        const res = await fetch(apiUrl('/api/rooms'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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

      // Mic Mode local cache: keep the latest room mode in IndexedDB.
      await saveMicModeToIndexedDB(String(roomOwnerId || ""), Number(settingsData.micMode || 15));

      // ✅ 2. Socket broadcast
      socket.emit('room_settings_update', {
        roomId: roomOwnerId,
        roomName: settingsData.roomName,
        roomDp: settingsData.roomDp,
        announcement: settingsData.announcement,
        micMode: settingsData.micMode,
        theme: settingsData.theme,
        isLocked: settingsData.isLocked,
        roomPassword: settingsData.roomPassword,
        updatedAt: Date.now(),
      })

      // ✅ 3. Parent ko bhi batao
      if (onSave) onSave(settingsData)

      // ✅ 4. LocalStorage update
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
        <div className="flex items-center px-2 pt-[calc(env(safe-area-inset-top)+0.25rem)] pb-3 flex-shrink-0 bg-white">
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
          {/* Room Cover */}
          <div className="mb-6 flex flex-col items-center">
            <label className="cursor-pointer relative group">
              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
                <img src={roomDp} alt="Room Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 stroke-white fill-none opacity-0 group-hover:opacity-100 stroke-[2]">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <p className="text-sm font-medium text-gray-600 mt-2">Room Cover</p>
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
