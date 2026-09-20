'use client'

import { apiUrl } from "../src/lib/api";
import { generateStableId } from "../lib/hash";

import React, { useEffect, useState, useRef } from 'react'
import {
  ArrowLeft,
  Edit3,
  MapPin,
  Copy,
  Camera,
  ChevronRight,
  X,
  Heart,
  MessageCircle,
  MoreHorizontal,
} from 'lucide-react'


// Import the WebRTC ChatScreen component
import ChatScreen from './ChatScreen' // adjust path if necessary

// ============ IndexedDB Functions for Profile Data ============
const PROFILE_DB_NAME = 'ProfileDataDB';
const PROFILE_STORE = 'profileData';

const openProfileDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PROFILE_DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE, { keyPath: 'uid' });
      }
    };
  });
};

// Save complete profile data to IndexedDB
const saveProfileToDB = async (profileData: any) => {
  try {
    const db = await openProfileDB();
    const transaction = db.transaction([PROFILE_STORE], 'readwrite');
    const store = transaction.objectStore(PROFILE_STORE);

    const completeData = {
      ...profileData,
      cachedAt: Date.now(),
      lastUpdated: new Date().toISOString(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(completeData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('❌ Profile save error:', error);
  }
};

// Load profile data from IndexedDB
const loadProfileFromDB = async (uid: string): Promise<any> => {
  try {
    const db = await openProfileDB();
    const transaction = db.transaction([PROFILE_STORE], 'readonly');
    const store = transaction.objectStore(PROFILE_STORE);

    const profileData = await new Promise<any>((resolve, reject) => {
      const request = store.get(uid);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return profileData || null;
  } catch (error) {
    console.error('❌ Profile load error:', error);
    return null;
  }
};

export interface TargetUser {
  id?: string
  uid?: string
  name?: string
  displayAccountNumber?: string
  accountId?: string
  photo?: string
  image?: string
  coverPhoto?: string
  gender?: string
  age?: number | string
  followers?: number
  bio?: string
  location?: string
  country?: string
  countryCode?: string
  flag?: string
  officialTag?: boolean
  adminTag?: boolean
  vipTag?: boolean
  premiumTag?: boolean
}

interface PublicProfileProps {
  onBack?: () => void
  onJoinRoom?: (roomId: string) => void
  isOtherUser?: boolean
  targetUser?: TargetUser | null
}

const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
]

const SPECIAL_ACCOUNTS: { [key: string]: string } = {
  HUSxSvQnabgU029dWYt1TUV04hd2: '100002',
  ADqW31RGBMaosOzy0HiqexKSD7h1: '100003',
}

const OFFICIAL_IDS = ['500001', '500002', '500003', '500004', '500005']
const ADMIN_IDS = ['700001', '700002', '700003']

const isValidName = (val?: string | null): boolean => {
  if (!val) return false;
  const clean = val.trim().toLowerCase();
  return clean !== '' && clean !== 'guest' && clean !== 'user' && clean !== 'null' && clean !== 'undefined';
}

const getDefaultAvatar = (gender: string): string => {
  if (gender === '♀' || gender === 'female') {
    return '/IMG_20260804_211013.jpg'
  }
  return '/IMG_20260804_211031.jpg'
}

const getOrCreateAccountNumber = (uid: string) => {
  if (!uid || uid === 'N/A') return '100379620'

  if (OFFICIAL_IDS.includes(uid) || ADMIN_IDS.includes(uid)) {
    return uid
  }

  if (SPECIAL_ACCOUNTS[uid]) {
    return SPECIAL_ACCOUNTS[uid]
  }

  const storageKey = `user_account_number_${uid}`
  let savedAccountNumber =
    typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null

  if (!savedAccountNumber) {
    let hash = 0
    for (let i = 0; i < uid.length; i++) {
      hash = (hash << 5) - hash + uid.charCodeAt(i)
      hash |= 0
    }
    const positiveHash = Math.abs(hash)
    savedAccountNumber = String(10000000 + (positiveHash % 90000000))
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, savedAccountNumber)
    }
  }

  return savedAccountNumber
}

const compressImage = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}

// Green Color Removal Shader Component - For Official/Admin tags
const GreenColorRemovalShader = ({
  imageSrc,
  className = "",
  style = {}
}: {
  imageSrc: string
  className?: string
  style?: React.CSSProperties
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { premultipliedAlpha: true })
    if (!gl) return

    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `

    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;
      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        if (color.g > 0.25 && color.g > color.r * 1.3 && color.g > color.b * 1.3) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        } else {
          gl_FragColor = color;
        }
      }
    `

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return

    gl.useProgram(program)

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    const texCoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]), gl.STATIC_DRAW)

    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord')
    gl.enableVertexAttribArray(texCoordLocation)
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0)

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      canvas.width = image.width
      canvas.height = image.height
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0.0, 0.0, 0.0, 0.0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      setIsLoaded(true)
    }
    image.src = imageSrc

    return () => {
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      gl.deleteBuffer(positionBuffer)
      gl.deleteBuffer(texCoordBuffer)
      gl.deleteTexture(texture)
    }
  }, [imageSrc])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        ...style,
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  )
}

// WebGL Shader Component for removing white color (for avatar overlay)
const WhiteColorRemovalShader = ({
  imageSrc,
  threshold = 0.9,
  className = "",
  style = {}
}: {
  imageSrc: string
  threshold?: number
  className?: string
  style?: React.CSSProperties
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { premultipliedAlpha: true })
    if (!gl) return

    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `

    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;
      uniform float u_threshold;
      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        float maxColor = max(color.r, max(color.g, color.b));
        float minColor = min(color.r, min(color.g, color.b));
        float lightness = (maxColor + minColor) / 2.0;
        float saturation = maxColor - minColor;
        if (lightness > u_threshold && saturation < 0.3) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        } else {
          gl_FragColor = color;
        }
      }
    `

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return

    gl.useProgram(program)

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    const texCoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]), gl.STATIC_DRAW)

    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord')
    gl.enableVertexAttribArray(texCoordLocation)
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0)

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      const thresholdLocation = gl.getUniformLocation(program, 'u_threshold')
      gl.uniform1f(thresholdLocation, threshold)
      canvas.width = image.width
      canvas.height = image.height
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0.0, 0.0, 0.0, 0.0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      setIsLoaded(true)
    }
    image.src = imageSrc

    return () => {
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      gl.deleteBuffer(positionBuffer)
      gl.deleteBuffer(texCoordBuffer)
      gl.deleteTexture(texture)
    }
  }, [imageSrc, threshold])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        ...style,
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  )
}

export default function PublicProfile({
  onBack,
  onJoinRoom,
  isOtherUser = false,
  targetUser = null,
}: PublicProfileProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const albumInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Instant Synchronous Lock state load to prevent Guest/blank flashing
  const [user, setUser] = useState(() => {
    if (isOtherUser && targetUser) {
      const targetUid = targetUser.uid || targetUser.id || 'N/A'
      const searchKey = targetUser.accountId || targetUser.displayAccountNumber || targetUid
      const displayAccNum = searchKey !== 'N/A' ? generateStableId(searchKey) : ''
      const initialName = isValidName(targetUser.name) ? targetUser.name! : (displayAccNum || 'User')
      const photo = targetUser.photo || targetUser.image || '/default-avatar.png'
      return {
        name: initialName,
        uid: targetUid,
        displayAccountNumber: displayAccNum,
        photo: photo,
        coverPhoto: targetUser.coverPhoto || '',
        gender: (targetUser.gender === 'female' || targetUser.gender === '♀' ? '♀' : '♂') as '♂' | '♀',
        age: targetUser.age ? (typeof targetUser.age === 'number' ? targetUser.age : parseInt(String(targetUser.age))) : 22,
        followers: targetUser.followers || 0,
        bio: targetUser.bio || '',
        location: targetUser.location || targetUser.country || 'India',
        flag: targetUser.flag || '🇮🇳',
        countryCode: targetUser.countryCode || 'IN',
        officialTag: Boolean(targetUser.officialTag),
        adminTag: Boolean(targetUser.adminTag),
        vipTag: Boolean(targetUser.vipTag),
        premiumTag: Boolean(targetUser.premiumTag),
      }
    }

    if (typeof window === 'undefined') {
      return {
        name: '',
        uid: '',
        displayAccountNumber: '100379620',
        photo: '',
        coverPhoto: '',
        gender: '♂',
        age: 24,
        followers: 0,
        bio: '',
        location: 'India',
        flag: '🇮🇳',
        countryCode: 'IN',
        officialTag: false,
        adminTag: false,
        vipTag: false,
        premiumTag: false,
      }
    }

    const uid = localStorage.getItem('userUID') || localStorage.getItem('userPhone') || localStorage.getItem('userId') || ''
    const localName = localStorage.getItem('userName')
    const validName = isValidName(localName) ? localName! : ''
    const photo = localStorage.getItem('userPhoto') || ''
    const coverPhoto = localStorage.getItem('userCoverPhoto') || ''
    const bio = localStorage.getItem('userBio') || ''
    const country = localStorage.getItem('userCountry') || 'India'
    const countryCode = localStorage.getItem('userCountryCode') || 'IN'
    const age = localStorage.getItem('userAge') ? parseInt(localStorage.getItem('userAge')!) : 24
    const gender = localStorage.getItem('userGender') || '♂'
    const displayAccNum = localStorage.getItem('accountNumber') || (uid ? getOrCreateAccountNumber(uid) : '100379620')

    return {
      name: validName,
      uid: uid,
      displayAccountNumber: displayAccNum,
      photo,
      coverPhoto,
      gender: gender === 'female' || gender === '♀' ? '♀' : '♂',
      age,
      followers: 0,
      bio,
      location: country,
      flag: '🇮🇳',
      countryCode,
      officialTag: false,
      adminTag: false,
      vipTag: false,
      premiumTag: false,
    }
  })

  const [albumImages, setAlbumImages] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    const storedAlbum = localStorage.getItem('userAlbumImages')
    return storedAlbum ? JSON.parse(storedAlbum) : []
  })

  const [showEditSheet, setShowEditSheet] = useState(false)
  const [editName, setEditName] = useState(user.name)
  const [editAge, setEditAge] = useState(user.age.toString())
  const [editBio, setEditBio] = useState(user.bio)

  const [editGender, setEditGender] = useState('')
  const [genderLocked, setGenderLocked] = useState(false)

  const [editCountry, setEditCountry] = useState(user.location)
  const [editCountryCode, setEditCountryCode] = useState(user.countryCode)
  const [countryLocked, setCountryLocked] = useState(false)

  const [showBioInput, setShowBioInput] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const [fullImageView, setFullImageView] = useState<string | null>(null)

  const [isFollowing, setIsFollowing] = useState(false)

  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false)

  const [showChat, setShowChat] = useState(false)

  const isSpecialAccount = SPECIAL_ACCOUNTS.hasOwnProperty(user.uid || '')

  const saveToMongoDB = async (updateData: Record<string, any>) => {
  const currentUid =
    user.uid ||
    localStorage.getItem('userUID') ||
    localStorage.getItem('userPhone')

  if (!currentUid || currentUid === 'N/A') return

  try {
    const response = await fetch(apiUrl('/api/users'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: currentUid,
        ...updateData,
      }),
    })

    if (!response.ok) {
      throw new Error(`MongoDB user update failed: ${response.status}`)
    }

    const roomUpdateData = { ...updateData }

    delete roomUpdateData.name
    delete roomUpdateData.displayName
    delete roomUpdateData.userName
    delete roomUpdateData.image
    delete roomUpdateData.photo
    delete roomUpdateData.photoURL
    delete roomUpdateData.coverPhoto
    delete roomUpdateData.coverImage

    if (Object.keys(roomUpdateData).length > 0) {
      const roomResponse = await fetch(apiUrl('/api/rooms'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: currentUid,
          ...roomUpdateData,
        }),
      })

      if (!roomResponse.ok) {
        throw new Error(`MongoDB room update failed: ${roomResponse.status}`)
      }
    }
  } catch (err) {
    console.error('Error saving data to MongoDB:', err)
  }
}

// Save current user data to IndexedDB
  const saveCurrentUserToDB = async () => {
    if (isOtherUser) return;
    const uid = user.uid || localStorage.getItem('userUID') || localStorage.getItem('userPhone');
    if (uid && uid !== 'N/A') {
      const profileData = {
        uid: uid,
        name: user.name,
        displayAccountNumber: user.displayAccountNumber,
        photo: user.photo,
        coverPhoto: user.coverPhoto,
        gender: user.gender,
        age: user.age,
        followers: user.followers,
        bio: user.bio,
        location: user.location,
        flag: user.flag,
        countryCode: user.countryCode,
        albumImages: albumImages,
        officialTag: user.officialTag,
        adminTag: user.adminTag,
        vipTag: user.vipTag,
        premiumTag: user.premiumTag,
      };
      await saveProfileToDB(profileData);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const loadProfileData = async () => {
      if (isOtherUser && targetUser) {
        const targetUid = targetUser.uid || targetUser.id || 'N/A'
        const searchKey = targetUser.accountId || targetUser.displayAccountNumber || targetUid
        let displayAccNum = searchKey !== 'N/A' ? generateStableId(searchKey) : ''
        let initialName = isValidName(targetUser.name) ? targetUser.name! : (displayAccNum || 'User')

        let photo = targetUser.photo || targetUser.image || '/default-avatar.png'
        let coverPhoto = targetUser.coverPhoto || ''
        let bio = targetUser.bio || ''
        let country = targetUser.country || targetUser.location || 'India'
        let countryCode = targetUser.countryCode || 'IN'
        let gender = targetUser.gender || '♀'
        let age = targetUser.age
          ? typeof targetUser.age === 'number'
            ? targetUser.age
            : parseInt(String(targetUser.age))
          : 22
        let followers = targetUser.followers || 0
        let album: string[] = []
        let officialTag = Boolean(targetUser.officialTag)
        let adminTag = Boolean(targetUser.adminTag)
        let vipTag = Boolean(targetUser.vipTag)
        let premiumTag = Boolean(targetUser.premiumTag)

        const initialTargetUser = {
          uid: targetUid,
          name: initialName,
          displayAccountNumber: displayAccNum,
          photo,
          coverPhoto,
          gender: (gender === 'female' || gender === '♀' ? '♀' : '♂') as '♂' | '♀',
          age,
          followers,
          bio,
          location: country,
          flag: '🇮🇳',
          countryCode,
          albumImages: album,
          officialTag,
          adminTag,
          vipTag,
          premiumTag,
        }

        setUser(initialTargetUser)

        if (targetUid && targetUid !== 'N/A') {
          const cachedProfile = await loadProfileFromDB(targetUid);
          if (cachedProfile && isValidName(cachedProfile.name)) {
            setUser({
              name: cachedProfile.name,
              uid: targetUid,
              displayAccountNumber: cachedProfile.displayAccountNumber || displayAccNum,
              photo: cachedProfile.photo || photo,
              coverPhoto: cachedProfile.coverPhoto || coverPhoto,
              gender: cachedProfile.gender || gender,
              age: cachedProfile.age || age,
              followers: cachedProfile.followers || followers,
              bio: cachedProfile.bio || bio,
              location: cachedProfile.location || country,
              flag: cachedProfile.flag || '🇮🇳',
              countryCode: cachedProfile.countryCode || countryCode,
              officialTag: cachedProfile.officialTag || officialTag,
              adminTag: cachedProfile.adminTag || adminTag,
              vipTag: cachedProfile.vipTag || vipTag,
              premiumTag: cachedProfile.premiumTag || premiumTag,
            });
            setAlbumImages(cachedProfile.albumImages || []);
            return;
          }

          try {
            const mongoResponse = await fetch(
              apiUrl(`/api/users?search=${encodeURIComponent(searchKey)}&accountId=${encodeURIComponent(searchKey)}&uid=${encodeURIComponent(targetUid)}`)
            );

            if (mongoResponse.ok) {
              const res = await mongoResponse.json();
              const data = res && (res.user || (Array.isArray(res.users) ? res.users[0] : null) || res.data);

              if (data && (data.id || data.uid || data.accountId || data.name)) {
                displayAccNum = data.accountId || data.accountNumber || data['Account Number'] || displayAccNum;

                const docName = data.name || data.Name || data.displayName || data.userName || data.fullName;
                const finalName = isValidName(docName) ? docName : initialName;

                photo = data.photo || data.photoURL || data.image || data.avatar || photo;
                coverPhoto = data.coverPhoto || data.coverImage || data.backCover || coverPhoto;
                bio = data.bio || data.Bio || data.about || bio;
                country = data.country || data.Country || data.location || country;
                countryCode = data.countryCode || countryCode;
                gender = data.gender || data.Gender || gender;
                age = data.age || data.Age ? parseInt(String(data.age || data.Age)) : age;
                followers = data.followers !== undefined ? data.followers : followers;
                officialTag = Boolean(data.officialTag ?? officialTag);
                adminTag = Boolean(data.adminTag ?? adminTag);
                vipTag = Boolean(data.vipTag ?? vipTag);
                premiumTag = Boolean(data.premiumTag ?? premiumTag);

                if (data.albumImages && Array.isArray(data.albumImages)) {
                  album = data.albumImages;
                } else if (data.album && Array.isArray(data.album)) {
                  album = data.album;
                }

                const matchedCountry = COUNTRIES.find(
                  (c) => c.code === countryCode || c.name === country || c.flag === country
                ) || { name: 'India', flag: '🇮🇳', code: 'IN' };

                const profileData = {
                  uid: targetUid,
                  name: finalName,
                  displayAccountNumber: String(displayAccNum),
                  photo,
                  coverPhoto,
                  gender: (gender === 'female' || gender === '♀' ? '♀' : '♂') as '♂' | '♀',
                  age,
                  followers,
                  bio,
                  location: matchedCountry.name,
                  flag: matchedCountry.flag,
                  countryCode: matchedCountry.code,
                  albumImages: album,
                  officialTag,
                  adminTag,
                  vipTag,
                  premiumTag,
                };

                setUser(profileData);
                setAlbumImages(album);
                await saveProfileToDB(profileData);
              }
            }
          } catch (err) {
            console.warn('MongoDB fetch error for Target User:', err);
          }
        }
        return
      }

      // For current user
      const uid =
        localStorage.getItem('userUID') || localStorage.getItem('userPhone') || localStorage.getItem('userId') || 'N/A'

      if (uid !== 'N/A') {
        const cachedProfile = await loadProfileFromDB(uid);
        if (cachedProfile && isValidName(cachedProfile.name)) {
          setUser({
            name: cachedProfile.name,
            uid: uid,
            displayAccountNumber: cachedProfile.displayAccountNumber || '',
            photo: cachedProfile.photo || '',
            coverPhoto: cachedProfile.coverPhoto || '',
            gender: cachedProfile.gender || '♂',
            age: cachedProfile.age || 24,
            followers: cachedProfile.followers || 0,
            bio: cachedProfile.bio || '',
            location: cachedProfile.location || 'India',
            flag: cachedProfile.flag || '🇮🇳',
            countryCode: cachedProfile.countryCode || 'IN',
            officialTag: cachedProfile.officialTag || false,
            adminTag: cachedProfile.adminTag || false,
            vipTag: cachedProfile.vipTag || false,
            premiumTag: cachedProfile.premiumTag || false,
          });
          setAlbumImages(cachedProfile.albumImages || []);
          setEditName(cachedProfile.name);
          setEditAge(String(cachedProfile.age || '24'));
          setEditBio(cachedProfile.bio || '');
          setEditCountry(cachedProfile.location || 'India');
          setEditCountryCode(cachedProfile.countryCode || 'IN');
          return;
        }
      }

      let storedName = localStorage.getItem('userName') || ''
      if (!isValidName(storedName)) storedName = ''

      let photo = localStorage.getItem('userPhoto') || ''
      let coverPhoto = localStorage.getItem('userCoverPhoto') || ''
      let storedBio = localStorage.getItem('userBio') || ''
      let storedCountry = localStorage.getItem('userCountry') || 'India'
      let storedCountryCode = localStorage.getItem('userCountryCode') || 'IN'
      let storedAge = localStorage.getItem('userAge') || '24'
      let storedGender =
        localStorage.getItem('userGender') ||
        localStorage.getItem('userGenderLocked') ||
        ''
      let isCountryLockedInStorage =
        localStorage.getItem('userCountryLocked') === 'true' ||
        localStorage.getItem('setupComplete') === 'true'

      const storedAlbum = localStorage.getItem('userAlbumImages')
      if (storedAlbum) {
        setAlbumImages(JSON.parse(storedAlbum))
      }

      let displayAccNum = localStorage.getItem('accountNumber') || ''

      if (uid && uid !== 'N/A') {
        try {
      const mongoResponse = await fetch(
        apiUrl(`/api/users?uid=${encodeURIComponent(uid)}`)
      )

      if (!mongoResponse.ok) {
        throw new Error(`MongoDB user fetch failed: ${mongoResponse.status}`)
      }

      const result = await mongoResponse.json()
      const data = result?.user

      if (data) {
        if (data.accountId) {
          displayAccNum = String(data.accountId)
          localStorage.setItem('accountNumber', displayAccNum)
        }

        const docName = data.name || data.displayName || data.userName
        if (isValidName(docName)) {
          storedName = docName
          localStorage.setItem('userName', storedName)
        }

        if (data.photo || data.photoURL || data.image) {
          photo = data.photo || data.photoURL || data.image || photo
          localStorage.setItem('userPhoto', photo)
        }

        if (data.coverPhoto || data.coverImage) {
          coverPhoto = data.coverPhoto || data.coverImage || coverPhoto
          localStorage.setItem('userCoverPhoto', coverPhoto)
        }

        if (data.bio) {
          storedBio = data.bio
          localStorage.setItem('userBio', storedBio)
        }

        if (data.country || data.location) {
          storedCountry = data.country || data.location
          localStorage.setItem('userCountry', storedCountry)
        }

        if (data.countryCode) {
          storedCountryCode = data.countryCode
          localStorage.setItem('userCountryCode', storedCountryCode)
        }

        if (data.countryLocked !== undefined) {
          isCountryLockedInStorage = data.countryLocked
          if (data.countryLocked) {
            localStorage.setItem('userCountryLocked', 'true')
          }
        }

        if (data.setupComplete) {
          isCountryLockedInStorage = true
          localStorage.setItem('userCountryLocked', 'true')
        }

        if (data.gender) {
          storedGender = data.gender
          localStorage.setItem('userGender', storedGender)
        }

        if (data.age) {
          storedAge = String(data.age)
          localStorage.setItem('userAge', storedAge)
        }

        if (data.albumImages && Array.isArray(data.albumImages)) {
          setAlbumImages(data.albumImages)
          localStorage.setItem(
            'userAlbumImages',
            JSON.stringify(data.albumImages)
          )
        }

        if (!displayAccNum) {
          displayAccNum = getOrCreateAccountNumber(uid)
        }

        if (!isValidName(storedName)) {
          storedName = displayAccNum
        }

        const matchedCountry = COUNTRIES.find(
          (c) =>
            c.code === storedCountryCode ||
            c.flag === storedCountry ||
            c.name === storedCountry
        ) || { name: 'India', flag: '🇮🇳', code: 'IN' }

        const profileData = {
          uid: uid,
          name: storedName,
          displayAccountNumber: displayAccNum,
          photo,
          coverPhoto,
          bio: storedBio,
          location: matchedCountry.name,
          flag: matchedCountry.flag,
          countryCode: matchedCountry.code,
          gender:
            storedGender === 'female' || storedGender === '♀' ? '♀' : '♂',
          age: storedAge ? parseInt(storedAge) : 24,
          followers: data.followers || 0,
          albumImages: data.albumImages || [],
          officialTag: data.officialTag || false,
          adminTag: data.adminTag || false,
          vipTag: data.vipTag || false,
          premiumTag: data.premiumTag || false,
        }

        setUser(profileData)
        await saveProfileToDB(profileData)
        setEditName(storedName)
        setEditAge(storedAge || '24')
        setEditBio(storedBio || '')
        setEditCountry(matchedCountry.name)
        setEditCountryCode(matchedCountry.code)
        setCountryLocked(isCountryLockedInStorage)

        if (storedGender) {
          setEditGender(
            storedGender === 'female' || storedGender === '♀'
              ? 'female'
              : 'male'
          )
          setGenderLocked(true)
        }
          }
        } catch (err) {
          console.warn('MongoDB fetch error in PublicProfile:', err)
        }
      }
    }

    loadProfileData()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [isOtherUser, targetUser])
  // Save to IndexedDB whenever user data changes
  useEffect(() => {
    if (user.uid && user.uid !== 'N/A') {
      saveCurrentUserToDB();
    }
  }, [user, albumImages]);

  const handleCopyID = () => {
    if (user.displayAccountNumber && user.displayAccountNumber !== 'N/A') {
      navigator.clipboard.writeText(user.displayAccountNumber)
      alert('ID Copied!')
    }
  }

  const handleOpenEditSheet = () => {
    if (isOtherUser) return
    setEditName(user.name)
    setEditAge(user.age.toString())
    setEditBio(user.bio)
    setEditCountry(user.location || 'India')
    setEditCountryCode(user.countryCode || 'IN')
    setShowEditSheet(true)
  }

  const handleCloseEditSheet = () => {
    setShowEditSheet(false)
    setShowBioInput(false)
  }

  const handleGenderSelect = async (gender: string) => {
    if (genderLocked) return
    setEditGender(gender)
    setGenderLocked(true)
    const formattedGender = gender === 'male' ? '♂' : '♀'
    localStorage.setItem('userGender', gender)
    localStorage.setItem('userGenderLocked', gender)
    setUser((prev) => ({ ...prev, gender: formattedGender }))

    await saveToMongoDB({ gender: formattedGender })
  }

  const handleCountrySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (countryLocked) return
    const selectedCountryName = e.target.value
    const matchedCountry = COUNTRIES.find((c) => c.name === selectedCountryName)
    setEditCountry(selectedCountryName)
    if (matchedCountry) {
      setEditCountryCode(matchedCountry.code)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 300, 300, 0.7)
        localStorage.setItem('userPhoto', compressedBase64)
        setUser((prev) => ({ ...prev, photo: compressedBase64 }))

        await saveToMongoDB({
          photo: compressedBase64,
          image: compressedBase64,
          photoURL: compressedBase64,
        })
      } catch (err) {
        console.error('Avatar compression error:', err)
      }
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 800, 400, 0.7)
        localStorage.setItem('userCoverPhoto', compressedBase64)
        setUser((prev) => ({ ...prev, coverPhoto: compressedBase64 }))

        await saveToMongoDB({
          coverPhoto: compressedBase64,
          coverImage: compressedBase64,
        })
      } catch (err) {
        console.error('Cover compression error:', err)
      }
    }
  }

  const handleRemoveCoverPhoto = async () => {
    localStorage.removeItem('userCoverPhoto')
    setUser((prev) => ({ ...prev, coverPhoto: '' }))
    await saveToMongoDB({ coverPhoto: '', coverImage: '' })
  }

  const handleAlbumUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (albumImages.length >= 4) {
        alert('You can only upload up to 4 images in the album.')
        return
      }
      try {
        const compressedBase64 = await compressImage(file, 600, 600, 0.7)
        const updatedAlbum = [...albumImages, compressedBase64]
        setAlbumImages(updatedAlbum)
        localStorage.setItem('userAlbumImages', JSON.stringify(updatedAlbum))

        await saveToMongoDB({ albumImages: updatedAlbum, album: updatedAlbum })
      } catch (err) {
        console.error('Album image compression error:', err)
      }
    }
  }

  const handleRemoveAlbumImage = async (indexToRemove: number) => {
    const updated = albumImages.filter((_, index) => index !== indexToRemove)
    setAlbumImages(updated)
    localStorage.setItem('userAlbumImages', JSON.stringify(updated))
    await saveToMongoDB({ albumImages: updated, album: updated })
  }

  const handleSaveEdit = async () => {
    const finalNewName = isValidName(editName) ? editName : user.displayAccountNumber
    localStorage.setItem('userName', finalNewName)
    if (editAge) localStorage.setItem('userAge', editAge)
    if (editBio) localStorage.setItem('userBio', editBio)

    if (editCountry && editCountryCode) {
      localStorage.setItem('userCountry', editCountry)
      localStorage.setItem('userCountryCode', editCountryCode)
      localStorage.setItem('userCountryLocked', 'true')
      setCountryLocked(true)
    }

    const matchedCountry = COUNTRIES.find(
      (c) => c.name === editCountry || c.code === editCountryCode
    ) || { name: 'India', flag: '🇮🇳', code: 'IN' }

    const updatedUser = {
      ...user,
      name: finalNewName,
      age: parseInt(editAge) || user.age,
      bio: editBio,
      location: matchedCountry.name,
      flag: matchedCountry.flag,
      countryCode: matchedCountry.code,
    };

    setUser(updatedUser);

    await saveToMongoDB({
      name: finalNewName,
      displayName: finalNewName,
      userName: finalNewName,
      age: parseInt(editAge) || user.age,
      bio: editBio,
      about: editBio,
      country: matchedCountry.flag,
      countryCode: matchedCountry.code,
      location: matchedCountry.name,
      countryLocked: true,
    })

    await saveProfileToDB({
      ...updatedUser,
      albumImages: albumImages,
    });

    setShowEditSheet(false)
    setShowBioInput(false)
  }

  const handleBioSave = async () => {
    localStorage.setItem('userBio', editBio)
    const updatedUser = { ...user, bio: editBio };
    setUser(updatedUser);
    setShowBioInput(false);
    await saveToMongoDB({ bio: editBio, about: editBio });

    await saveProfileToDB({
      ...updatedUser,
      albumImages: albumImages,
    });
  }

  const getDisplayID = () => {
    return user.displayAccountNumber
  }

  const handleToggleFollow = () => {
    setIsFollowing((prev) => {
      const nextState = !prev
      setUser((u) => ({
        ...u,
        followers: nextState ? u.followers + 1 : Math.max(0, u.followers - 1),
      }))
      return nextState
    })
  }

  const getCurrentUserData = () => {
    const uid =
      typeof window !== 'undefined'
        ? localStorage.getItem('userUID') || localStorage.getItem('userPhone') || localStorage.getItem('userId') || 'N/A'
        : 'N/A'
    const name =
      typeof window !== 'undefined' ? localStorage.getItem('userName') || user.displayAccountNumber : user.displayAccountNumber
    const photo =
      typeof window !== 'undefined' ? localStorage.getItem('userPhoto') || '' : ''
    return { uid, name, photo }
  }

  // Strict Name Resolution: No Guest allowed anywhere
  const finalDisplayName = isValidName(user.name)
    ? user.name
    : (user.displayAccountNumber ? user.displayAccountNumber : 'User');

  const avatarLetter = finalDisplayName ? finalDisplayName.charAt(0).toUpperCase() : '?';

  return (
    <div
      className={`w-full bg-white min-h-screen text-gray-900 relative ${
        isOtherUser ? 'pb-24' : 'pb-10'
      }`}
    >
      {/* Cover Image & Header Section */}
      <div className="relative w-full h-[350px] bg-gray-800">
        {user.coverPhoto ? (
          <img src={user.coverPhoto} alt="" className="w-full h-full object-cover" />
        ) : user.photo ? (
          <img src={user.photo} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white text-4xl font-bold">
            {avatarLetter}
          </div>
        )}

        {/* --- Top Icons Header Wrapper --- */}
        <div 
          className="absolute top-0 pt-[max(env(safe-area-inset-top),10px)] mt-2 left-0 right-0 px-3 flex items-center justify-between z-10"
        >
          <button onClick={onBack} className="text-white">
            <ArrowLeft size={28} />
          </button>

          {isOtherUser ? (
            <div className="relative">
              <button
                onClick={() => setShowThreeDotMenu(!showThreeDotMenu)}
                className="text-white"
              >
                <MoreHorizontal size={24} />
              </button>

              {showThreeDotMenu && (
                <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg py-2 w-48 z-50">
                  <button
                    onClick={() => {
                      setShowThreeDotMenu(false)
                      alert('Report user')
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Report
                  </button>
                  <button
                    onClick={() => {
                      setShowThreeDotMenu(false)
                      alert('Block user')
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Block
                  </button>
                  <button
                    onClick={() => {
                      setShowThreeDotMenu(false)
                      alert('Share profile')
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Share Profile
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleOpenEditSheet} className="text-white">
              <Edit3 size={22} />
            </button>
          )}
        </div>

        {/* Avatar with WebGL Shader Overlay */}
        <div className="absolute bottom-12 left-6 flex items-center z-30">
          <div className="relative w-24 h-24 rounded-full shadow-lg border-3 border-white bg-gray-700">
            <div className="w-full h-full rounded-full overflow-hidden">
              {user.photo ? (
                <img src={user.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center text-4xl text-white font-bold">
                  {avatarLetter}
                </div>
              )}
            </div>

            {/* WebGL Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <WhiteColorRemovalShader
                imageSrc="/1786867564769.png"
                threshold={0.85}
                className="w-full h-full"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) scale(1.5)',
                  width: '100%',
                  height: '100%',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info Details Section */}
      <div className="relative bg-white rounded-xl -mt-6 px-3 pt-6 z-20">

        <div className="flex flex-wrap items-center gap-0.5">
          <h1 className="text-2xl font-bold text-black tracking-wide">{finalDisplayName}</h1>
          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-0.5 whitespace-nowrap">
            {user.gender} {user.age}
          </span>

          {user.adminTag && (
            <GreenColorRemovalShader
              imageSrc="/1788021461820~2.jpg"
              className="h-9 w-auto object-contain"
            />
          )}

          {user.officialTag && (
            <GreenColorRemovalShader
              imageSrc="/1788021468845~2.jpg"
              className="h-9 w-auto object-contain"
            />
          )}

          {user.vipTag && (
            <img src="/1785469775751.png" alt="VIP" className="h-7 w-auto object-contain" />
          )}

          {user.premiumTag && (
            <img src="/1785469365805.png" alt="Premium" className="h-7 w-auto object-contain" />
          )}
        </div>

        <div className="flex items-center gap-1 text-xs mt-0.5 font-medium">
          <div className="flex items-center gap-1">
            {isSpecialAccount ? (
              <>
                <span
                  className="relative font-bold rounded text-white -ml-2.5"
                  style={{
                    backgroundImage: 'url(/1785137282040.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minWidth: '90px',
                    paddingLeft: '0px',
                    paddingRight: '5px',
                    paddingTop: '2px',
                    paddingBottom: '2px',
                  }}
                >
                  <span className="relative text-xs" style={{ paddingLeft: '32px' }}>
                    {user.displayAccountNumber}
                  </span>
                </span>
                <button onClick={handleCopyID} className="text-gray-400 hover:text-gray-600">
                  <Copy size={12} />
                </button>
              </>
            ) : (
              <>
                <span className="text-gray-500">ID:{getDisplayID()}</span>
                <button onClick={handleCopyID} className="text-gray-400 hover:text-gray-600">
                  <Copy size={12} />
                </button>
              </>
            )}
          </div>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500">{user.followers} Fans</span>
        </div>

        <div className="mt-1 flex items-center gap-1 -ml-2">
          <div className="relative inline-flex items-center justify-center ml-0.5">
            <img src="/1785137410522.png" alt="" className="h-6 w-auto object-contain" />
            <span
              className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-sm"
              style={{ paddingLeft: '10px' }}
            >
              Lv.1
            </span>
          </div>
          <img src="/1785486414756.png" alt="" className="h-6 w-auto object-contain" />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-3">
          <MapPin size={14} className="text-gray-400" />
          <span className="text-base">{user.flag}</span>
          <span className="text-gray-500">{user.location || 'India'}</span>
        </div>

        {/* Bio Section */}
        <div className="flex items-start gap-2 mt-2">
          <button
            onClick={!isOtherUser ? handleOpenEditSheet : undefined}
            className={`mt-0.5 shrink-0 ${isOtherUser ? 'text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Edit3 size={14} />
          </button>
          {user.bio ? (
            <p className="text-xs text-gray-500 italic">{user.bio}</p>
          ) : (
            <p className="text-xs text-gray-400 italic">
              {isOtherUser ? 'No bio added yet' : 'Add bio...'}
            </p>
          )}
        </div>

        <div className="flex gap-0 mt-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2 text-sm font-semibold transition-colors relative ${
              activeTab === 'profile' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            Profile
            {activeTab === 'profile' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-blue-500 rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content Tabs Section */}
      <div className="px-5 mt-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2 flex justify-between items-center">
            Albums
            <span className="text-xs text-gray-400 font-normal">{albumImages.length}/4</span>
          </h3>
          {albumImages.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto">
              {albumImages.map((img, index) => (
                <div
                  key={index}
                  className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setFullImageView(img)}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-28 rounded-2xl overflow-hidden bg-gray-100">
              <img
                src="/IMG_20260726_225835.jpg"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2">Vehicle</h3>
          <div className="w-full h-28 rounded-2xl overflow-hidden">
            <img src="/1785091443553.png" alt="" className="w-full h-full object-cover" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2">Medal</h3>
          <div className="w-full h-28 rounded-2xl overflow-hidden">
            <img src="/1785091431545.png" alt="" className="w-full h-full object-cover" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2">Frame</h3>
          <div className="w-full h-28 rounded-2xl overflow-hidden">
            <img src="/1785091457562.png" alt="" className="w-full h-full object-cover" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2">Gift</h3>
          <div className="w-full h-28 rounded-2xl overflow-hidden">
            <img src="/1785091520912.png" alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Bottom Action Bar for Other User */}
      {isOtherUser && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md px-6 py-3.5 border-t border-gray-100 flex items-center justify-between gap-4 max-w-md mx-auto shadow-lg">
          <button
            onClick={handleToggleFollow}
            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-[#ff5874] to-[#ff6b8b] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 text-white font-medium text-lg shadow-md shadow-pink-200"
          >
            <Heart className="w-6 h-6 fill-white stroke-none" />
            <span>{isFollowing ? 'Following' : 'Follow'}</span>
          </button>

          <button
            onClick={() => setShowChat(true)}
            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-[#1dc4e9] to-[#1de9b6] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 text-white font-medium text-lg shadow-md shadow-cyan-200"
          >
            <MessageCircle className="w-6 h-6 fill-white stroke-none" />
            <span>Chat</span>
          </button>
        </div>
      )}

      {/* Full Image View Modal */}
      {fullImageView && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullImageView(null)}
        >
          <button
            onClick={() => setFullImageView(null)}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
          >
            <X size={24} />
          </button>
          <img
            src={fullImageView}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Edit Profile Bottom Sheet */}
      {!isOtherUser && showEditSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseEditSheet}></div>

          <div className="relative bg-white w-full max-w-md rounded-t-3xl animate-slide-up flex flex-col h-[70vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <button onClick={handleCloseEditSheet}>
                <ArrowLeft size={24} className="text-gray-700" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">Edit Information</h2>
              <div className="w-6"></div>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-5 flex-1 pb-24">
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <input
                type="file"
                ref={albumInputRef}
                accept="image/*"
                onChange={handleAlbumUpload}
                className="hidden"
              />
              <input
                type="file"
                ref={coverInputRef}
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Avatar</span>
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300 cursor-pointer"
                >
                  {user.photo ? (
                    <img src={user.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xl text-white font-bold">
                      {avatarLetter}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Background Cover</span>
                  <div className="flex items-center gap-2">
                    {user.coverPhoto && (
                      <button
                        onClick={handleRemoveCoverPhoto}
                        className="px-2 py-1 rounded-lg bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                    <button
                      onClick={() => coverInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors"
                    >
                      <Camera size={14} /> Add Photo
                    </button>
                  </div>
                </div>
                {user.coverPhoto && (
                  <div className="w-full h-20 rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={user.coverPhoto}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Album Photos ({albumImages.length}/4)
                  </span>
                  {albumImages.length < 4 && (
                    <button
                      onClick={() => albumInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold flex items-center gap-1 hover:bg-blue-100 transition-colors"
                    >
                      <Camera size={14} /> Add Photo
                    </button>
                  )}
                </div>

                {albumImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {albumImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative w-full h-16 rounded-xl overflow-hidden border border-gray-200 group"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemoveAlbumImage(idx)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Name</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-sm text-gray-900 text-right bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none px-2 py-1 w-48"
                  placeholder="Enter name"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Age</span>
                <input
                  type="number"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  className="text-sm text-gray-900 text-right bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none px-2 py-1 w-48"
                  placeholder="0"
                  min="0"
                  max="150"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Bio</span>
                {showBioInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="text-sm text-gray-900 text-right bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none px-2 py-1 w-36"
                      placeholder="Add bio"
                      autoFocus
                    />
                    <button
                      onClick={handleBioSave}
                      className="text-xs text-blue-500 font-medium"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowBioInput(true)}
                    className="flex items-center gap-1 text-sm text-gray-400"
                  >
                    <span className="max-w-[180px] truncate">
                      {editBio || 'Add bio'}
                    </span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Country</span>
                <select
                  value={editCountry}
                  onChange={handleCountrySelect}
                  disabled={countryLocked}
                  className={`text-sm text-right outline-none px-2 py-1 bg-transparent border-b w-48 ${
                    countryLocked
                      ? 'text-gray-400 border-transparent cursor-not-allowed'
                      : 'text-gray-900 border-gray-200 focus:border-blue-500'
                  }`}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Gender</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenderSelect('male')}
                    disabled={genderLocked && editGender !== 'male'}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                      editGender === 'male'
                        ? 'bg-blue-500 text-white'
                        : genderLocked
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ♂ Male
                  </button>
                  <button
                    onClick={() => handleGenderSelect('female')}
                    disabled={genderLocked && editGender !== 'female'}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                      editGender === 'female'
                        ? 'bg-pink-500 text-white'
                        : genderLocked
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ♀ Female
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-white border-t border-gray-100 shrink-0">
              <button
                onClick={handleSaveEdit}
                className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ChatScreen Overlay */}
      {isOtherUser && showChat && targetUser && (
        <div className="fixed inset-0 z-[100]">
          <ChatScreen
            currentUser={getCurrentUserData()}
            targetUser={{
              uid: targetUser.uid || targetUser.id || '',
              accountId: targetUser.displayAccountNumber || targetUser.accountId,
              name: isValidName(targetUser.name) ? targetUser.name! : (targetUser.displayAccountNumber || 'User'),
              photo: targetUser.photo || targetUser.image || '',
            } as any}
            onClose={() => setShowChat(false)}
            onJoinRoom={onJoinRoom}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

