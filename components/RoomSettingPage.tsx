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
// ---------- CROP MODAL (BOX SLIDE + IMAGE FIXED + PINCH ZOOM) ----------
// ------------------------------------------------------------
type HandleType = 'tl' | 'tr' | 'bl' | 'br'

function CropModal({
  imageSrc,
  onCancel,
  onCrop,
}: {
  imageSrc: string
  onCancel: () => void
  onCrop: (cropped: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [imageLoaded, setImageLoaded] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })

  const [box, setBox] = useState({ x: 0, y: 0, size: 300 })

  const [activeHandle, setActiveHandle] = useState<HandleType | 'move' | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [startBox, setStartBox] = useState({ x: 0, y: 0, size: 300 })

  const [initialPinchDist, setInitialPinchDist] = useState(0)
  const [initialPinchScale, setInitialPinchScale] = useState(1)

  const MIN_BOX = 100

  const getImageBounds = () => {
    const c = containerRef.current
    if (!c) return { left: 0, top: 0, right: 0, bottom: 0 }
    const cW = c.offsetWidth
    const cH = c.offsetHeight
    const dispW = naturalSize.w * scale
    const dispH = naturalSize.h * scale
    const left = cW / 2 + position.x - dispW / 2
    const top = cH / 2 + position.y - dispH / 2
    return { left, top, right: left + dispW, bottom: top + dispH }
  }

  useEffect(() => {
    const update = () => {
      const c = containerRef.current
      if (!c) return
      const w = c.offsetWidth
      const h = c.offsetHeight
      const size = Math.min(w, h) * 0.9
      setBox({ x: (w - size) / 2, y: (h - size) / 2, size })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const handleImageLoad = () => {
    const img = imgRef.current
    const c = containerRef.current
    if (!img || !c) return

    const nw = img.naturalWidth
    const nh = img.naturalHeight
    setNaturalSize({ w: nw, h: nh })

    const cW = c.offsetWidth
    const cH = c.offsetHeight

    const initialScale = Math.min(cW / nw, cH / nh)
    setScale(initialScale)
    setPosition({ x: 0, y: 0 })

    const dispW = nw * initialScale
    const dispH = nh * initialScale
    const imgLeft = cW / 2 - dispW / 2
    const imgTop = cH / 2 - dispH / 2

    const imgMinSide = Math.min(dispW, dispH)
    const initialBoxSize = imgMinSide * 0.8

    setBox({
      x: imgLeft + (dispW - initialBoxSize) / 2,
      y: imgTop + (dispH - initialBoxSize) / 2,
      size: initialBoxSize,
    })
    setImageLoaded(true)
  }

  const startDrag = (e: React.MouseEvent | React.TouchEvent, handle: HandleType | 'move') => {
    const point = 'touches' in e ? e.touches[0] : (e as React.MouseEvent)
    setActiveHandle(handle)
    setDragStart({ x: point.clientX, y: point.clientY })
    setStartBox({ ...box })
  }

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeHandle) return
    const point = 'touches' in e ? e.touches[0] : (e as React.MouseEvent)
    const dx = point.clientX - dragStart.x
    const dy = point.clientY - dragStart.y
    const c = containerRef.current
    if (!c) return

    const bounds = getImageBounds()

    if (activeHandle === 'move') {
      let newX = startBox.x + dx
      let newY = startBox.y + dy

      if (newX < bounds.left) newX = bounds.left
      if (newY < bounds.top) newY = bounds.top
      if (newX + startBox.size > bounds.right) newX = bounds.right - startBox.size
      if (newY + startBox.size > bounds.bottom) newY = bounds.bottom - startBox.size

      setBox({ ...box, x: newX, y: newY })
      return
    }

    let newSize = startBox.size
    let newX = startBox.x
    let newY = startBox.y

    if (activeHandle === 'br') {
      const delta = Math.max(dx, dy)
      newSize = startBox.size + delta
    } else if (activeHandle === 'tl') {
      const delta = Math.min(dx, dy)
      newSize = startBox.size - delta
      newX = startBox.x + delta
      newY = startBox.y + delta
    } else if (activeHandle === 'tr') {
      const sizeDelta = (dx - dy) / 2
      newSize = startBox.size + sizeDelta
      newX = startBox.x + (startBox.size - newSize)
    } else if (activeHandle === 'bl') {
      const sizeDelta = (-dx + dy) / 2
      newSize = startBox.size + sizeDelta
      newY = startBox.y + (startBox.size - newSize)
    }

    if (newSize < MIN_BOX) newSize = MIN_BOX

    if (newX < bounds.left) {
      newSize -= (bounds.left - newX)
      newX = bounds.left
    }
    if (newY < bounds.top) {
      newSize -= (bounds.top - newY)
      newY = bounds.top
    }
    if (newX + newSize > bounds.right) {
      newSize = bounds.right - newX
    }
    if (newY + newSize > bounds.bottom) {
      newSize = bounds.bottom - newY
    }

    if (newSize < MIN_BOX) newSize = MIN_BOX

    setBox({ x: newX, y: newY, size: newSize })
  }

  const endDrag = () => setActiveHandle(null)

  useEffect(() => {
    if (!activeHandle) return
    const moveHandler = (e: MouseEvent | TouchEvent) => onMove(e as any)
    const upHandler = () => endDrag()

    window.addEventListener('mousemove', moveHandler)
    window.addEventListener('mouseup', upHandler)
    window.addEventListener('touchmove', moveHandler, { passive: false })
    window.addEventListener('touchend', upHandler)
    window.addEventListener('touchcancel', upHandler)

    return () => {
      window.removeEventListener('mousemove', moveHandler)
      window.removeEventListener('mouseup', upHandler)
      window.removeEventListener('touchmove', moveHandler)
      window.removeEventListener('touchend', upHandler)
      window.removeEventListener('touchcancel', upHandler)
    }
  }, [activeHandle, dragStart, box])

  // Pinch zoom
  const onTouchStartPinch = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]]
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      setInitialPinchDist(dist)
      setInitialPinchScale(scale)
    }
  }

  const onTouchMovePinch = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDist > 0) {
      const [a, b] = [e.touches[0], e.touches[1]]
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const ratio = dist / initialPinchDist
      let newScale = initialPinchScale * ratio

      const img = imgRef.current
      if (img) {
        const minCover = Math.max(box.size / img.naturalWidth, box.size / img.naturalHeight)
        if (newScale < minCover) newScale = minCover
      }

      const maxScale = 5
      if (newScale > maxScale) newScale = maxScale

      setScale(newScale)

      const c = containerRef.current
      if (c) {
        const cW = c.offsetWidth
        const cH = c.offsetHeight
        const boxCenterX = box.x + box.size / 2
        const boxCenterY = box.y + box.size / 2
        const imgCenterX = cW / 2 + position.x
        const imgCenterY = cH / 2 + position.y
        setPosition({
          x: position.x + (boxCenterX - imgCenterX) * 0.1,
          y: position.y + (boxCenterY - imgCenterY) * 0.1,
        })
      }
    }
  }

  const onTouchEndPinch = () => {
    setInitialPinchDist(0)
  }

  const handleCrop = () => {
    const img = imgRef.current
    const c = containerRef.current
    if (!img || !c || !imageLoaded) return

    const outputSize = 640
    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cW = c.offsetWidth
    const cH = c.offsetHeight
    const cCenterX = cW / 2
    const cCenterY = cH / 2

    const dispW = img.naturalWidth * scale
    const dispH = img.naturalHeight * scale
    const imgLeft = cCenterX + position.x - dispW / 2
    const imgTop = cCenterY + position.y - dispH / 2

    const offsetX = box.x - imgLeft
    const offsetY = box.y - imgTop

    const srcX = offsetX / scale
    const srcY = offsetY / scale
    const srcSize = box.size / scale

    let finalSrcX = srcX
    let finalSrcY = srcY
    let finalSrcSize = srcSize

    if (finalSrcX < 0) { finalSrcSize += finalSrcX; finalSrcX = 0 }
    if (finalSrcY < 0) { finalSrcSize += finalSrcY; finalSrcY = 0 }
    if (finalSrcX + finalSrcSize > img.naturalWidth) finalSrcSize = img.naturalWidth - finalSrcX
    if (finalSrcY + finalSrcSize > img.naturalHeight) finalSrcSize = img.naturalHeight - finalSrcY

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outputSize, outputSize)

    ctx.drawImage(
      img,
      finalSrcX,
      finalSrcY,
      finalSrcSize,
      finalSrcSize,
      0,
      0,
      outputSize,
      outputSize
    )

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    onCrop(dataUrl)
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black overflow-hidden select-none touch-none"
    >
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Crop"
        onLoad={handleImageLoad}
        draggable={false}
        className="absolute select-none pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          maxWidth: 'none',
          maxHeight: 'none',
          opacity: imageLoaded ? 1 : 0,
        }}
      />

      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
          Loading...
        </div>
      )}

      {imageLoaded && (
        <>
          <div className="absolute bg-black/60 pointer-events-none" style={{ left: 0, right: 0, top: 0, height: box.y }} />
          <div className="absolute bg-black/60 pointer-events-none" style={{ left: 0, right: 0, top: box.y + box.size, bottom: 0 }} />
          <div className="absolute bg-black/60 pointer-events-none" style={{ left: 0, width: box.x, top: box.y, height: box.size }} />
          <div className="absolute bg-black/60 pointer-events-none" style={{ left: box.x + box.size, right: 0, top: box.y, height: box.size }} />
        </>
      )}

      {imageLoaded && (
        <div
          className="absolute border-2 border-white"
          style={{
            left: box.x,
            top: box.y,
            width: box.size,
            height: box.size,
          }}
        >
          <div
            className="absolute inset-0 touch-none cursor-move"
            style={{ zIndex: 5 }}
            onMouseDown={(e) => { e.stopPropagation(); startDrag(e, 'move') }}
            onTouchStart={(e) => {
              e.stopPropagation()
              onTouchStartPinch(e)
              if (e.touches.length === 1) startDrag(e, 'move')
            }}
            onTouchMove={(e) => {
              onTouchMovePinch(e)
              if (e.touches.length === 1) onMove(e)
            }}
            onTouchEnd={() => {
              onTouchEndPinch()
              endDrag()
            }}
          />

          <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/40 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/40 pointer-events-none" />
          <div className="absolute left-0 right-0 top-1/3 h-px bg-white/40 pointer-events-none" />
          <div className="absolute left-0 right-0 top-2/3 h-px bg-white/40 pointer-events-none" />

          <div
            className="absolute -top-1 -left-1 w-7 h-7 cursor-nwse-resize touch-none"
            style={{ zIndex: 10 }}
            onMouseDown={(e) => { e.stopPropagation(); startDrag(e, 'tl') }}
            onTouchStart={(e) => { e.stopPropagation(); startDrag(e, 'tl') }}
          >
            <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-white" />
          </div>

          <div
            className="absolute -top-1 -right-1 w-7 h-7 cursor-nesw-resize touch-none"
            style={{ zIndex: 10 }}
            onMouseDown={(e) => { e.stopPropagation(); startDrag(e, 'tr') }}
            onTouchStart={(e) => { e.stopPropagation(); startDrag(e, 'tr') }}
          >
            <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-white" />
          </div>

          <div
            className="absolute -bottom-1 -left-1 w-7 h-7 cursor-nesw-resize touch-none"
            style={{ zIndex: 10 }}
            onMouseDown={(e) => { e.stopPropagation(); startDrag(e, 'bl') }}
            onTouchStart={(e) => { e.stopPropagation(); startDrag(e, 'bl') }}
          >
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-white" />
          </div>

          <div
            className="absolute -bottom-1 -right-1 w-7 h-7 cursor-nwse-resize touch-none"
            style={{ zIndex: 10 }}
            onMouseDown={(e) => { e.stopPropagation(); startDrag(e, 'br') }}
            onTouchStart={(e) => { e.stopPropagation(); startDrag(e, 'br') }}
          >
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-white" />
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-3 z-20">
        <button
          onClick={onCancel}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-white stroke-[2.5]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l7-7m-7 7l7 7" />
          </svg>
        </button>

        <h3 className="text-white font-bold text-lg drop-shadow-lg">Crop Image</h3>

        <button
          onClick={handleCrop}
          disabled={!imageLoaded}
          className={`p-2 -mr-2 rounded-full transition-colors ${
            imageLoaded ? 'hover:bg-white/10' : 'opacity-40 cursor-not-allowed'
          }`}
          aria-label="Confirm Crop"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-none stroke-green-400 stroke-[3]">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
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
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)

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
    if (file.size > 10 * 1024 * 1024) { alert('Image size should be less than 10MB'); return }

    const reader = new FileReader()
    reader.onload = (event) => {
      const source = String(event.target?.result || '')
      setCropImageSrc(source)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

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
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="flex items-center px-2 pt-[calc(env(safe-area-inset-top,0px)+24px)] pb-3 flex-shrink-0 bg-white">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
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

        <div className="flex-1 overflow-y-auto px-4 py-6">
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

        {showThemePage && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col">
            <div className="flex items-center px-4 py-3 flex-shrink-0 bg-white">
              <button onClick={() => setShowThemePage(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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

        {showLockCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowLockCard(false)} />
            <div className="relative bg-white w-80 rounded-2xl shadow-2xl p-6 mx-4">
              <h3 className="text-lg font-bold text-gray-800 text-center mb-6">Set Room Password</h3>
              <PasswordInput value={password} onChange={setPassword} />
              {isLocked && password === roomPassword ? (
                <button onClick={handleUnlockPassword} className="w-full mt-6 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-all">
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
              <button onClick={() => { setShowLockCard(false); setPassword('') }} className="w-full mt-3 py-2 text-gray-500 font-medium text-center hover:bg-gray-100 rounded-xl">
                Cancel
              </button>
            </div>
          </div>
        )}

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
              <button onClick={() => setShowMicModeSheet(false)} className="w-full mt-4 py-3 text-gray-500 font-medium text-center hover:bg-gray-100 rounded-xl">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {cropImageSrc && (
        <CropModal
          imageSrc={cropImageSrc}
          onCancel={() => setCropImageSrc(null)}
          onCrop={handleCropComplete}
        />
      )}

      {showAdminSheet && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdminSheet(false)} />
          <div
            className="relative bg-black w-full max-w-md rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: '40vh', maxHeight: '40vh', paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-4 py-3 flex-shrink-0">
              <button onClick={() => setShowAdminSheet(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
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
