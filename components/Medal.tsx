'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Plus, HelpCircle } from 'lucide-react'

interface MedalProps {
  onBack?: () => void
}

interface MedalItem {
  id: string
  name: string
  video: string
  stars: number
  category: 'achievement' | 'gift' | 'activity'
  variant?: 'black' | 'green'

  cardVideoSize: string
  cardVideoTop: string

  sheetVideoSize: string
  sheetVideoTop: string

  /** group key — same group shares the 1/2/3 tier tabs */
  tierGroup?: string

  /** per-video gift text (shown under the name in the sheet) */
  giftText: string
}

const MedalFilters = () => (
  <svg
    style={{ width: 0, height: 0, position: 'absolute' }}
    aria-hidden="true"
  >
    <filter id="remove-black" colorInterpolationFilters="sRGB">
      <feColorMatrix
        type="matrix"
        values="
          1 0 0 0 0
          0 1 0 0 0
          0 0 1 0 0
          4 4 4 0 -0.8
        "
      />
    </filter>

    <filter id="remove-green" colorInterpolationFilters="sRGB">
      <feColorMatrix
        type="matrix"
        values="
          1 0 0 0 0
          0 1 0 0 0
          0 0 1 0 0
          1.5 -2.5 1.5 1 0
        "
      />
    </filter>
  </svg>
)

function MedalVideo({
  src,
  variant = 'black',
  className = '',
  style = {},
  autoPlay = true,
  isColorless = false,
}: {
  src: string
  variant?: 'black' | 'green'
  className?: string
  style?: React.CSSProperties
  autoPlay?: boolean
  isColorless?: boolean
}) {
  const isGreen = variant === 'green'
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      if (autoPlay) {
        videoRef.current.play().catch(() => {})
      } else {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
    }
  }, [autoPlay, src])

  const baseFilter = isGreen ? 'url(#remove-green)' : 'url(#remove-black)'
  const finalFilter = isColorless ? `${baseFilter} grayscale(100%)` : baseFilter

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay={autoPlay}
      muted
      loop
      playsInline
      controls={false}
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      className={className}
      style={{
        backgroundColor: 'transparent',
        filter: finalFilter,
        pointerEvents: 'none',
        ...style,
      }}
    />
  )
}

function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl')
    if (!gl) return

    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `

    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= u_resolution.x / u_resolution.y;

        float len = length(p);
        
        vec3 baseDark = vec3(0.005, 0.008, 0.02);
        vec3 faintGlow = vec3(0.01, 0.02, 0.06) * (0.4 / (len + 0.5));
        vec3 softStars = vec3(0.02, 0.04, 0.1) * sin(uv.y * 3.0 + u_time * 0.2);

        vec3 finalColor = baseDark + faintGlow + softStars * 0.1;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `

    const createShader = (
      gl: WebGLRenderingContext,
      type: number,
      source: string
    ) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    const vertices = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ])
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const posAttr = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(posAttr)
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0)

    const resUniform = gl.getUniformLocation(program, 'u_resolution')
    const timeUniform = gl.getUniformLocation(program, 'u_time')

    let animationFrameId: number
    const render = (time: number) => {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(resUniform, canvas.width, canvas.height)
      gl.uniform1f(timeUniform, time * 0.001)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}

const TIER_TAB_IMAGES = [
  '/IMG_20260924_132022.png',
  '/IMG_20260924_132038.png',
  '/IMG_20260924_132051.png',
]

export default function Medal({ onBack }: MedalProps) {
  const [activeTab, setActiveTab] = useState<
    'achievement' | 'activity' | 'gift'
  >('achievement')
  const [selectedMedal, setSelectedMedal] = useState<MedalItem | null>(null)
  const [activeTier, setActiveTier] = useState(0)

  const medals: MedalItem[] = [
    // ================= RICH GROUP (1 / 2 / 3) =================
    {
      id: '1',
      name: 'Rich',
      video: '/VID_20260924_124439.mp4',
      stars: 5,
      category: 'achievement',
      variant: 'green',
      cardVideoSize: '500px',
      cardVideoTop: '50%',
      sheetVideoSize: '700px',
      sheetVideoTop: '120%',
      tierGroup: 'rich',
      giftText: '0/5000000000000 Coins Of gifts Send',
    },
    {
      id: '2',
      name: 'Rich',
      video: '/1000200509-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '500px',
      cardVideoTop: '50%',
      sheetVideoSize: '700px',
      sheetVideoTop: '120%',
      tierGroup: 'rich',
      giftText: '0/400000000000 Coins Of gifts Send',
    },
    {
      id: '3',
      name: 'Rich',
      video: '/1000200510-background.mp4',
      stars: 5,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '500px',
      cardVideoTop: '50%',
      sheetVideoSize: '700px',
      sheetVideoTop: '120%',
      tierGroup: 'rich',
      giftText: '0/30000000000  Coins Of gifts Send',
    },
    // ================= SUPER GAMER (no tier tabs) =================
    {
      id: 'new-1',
      name: 'Super Gamer',
      video: '/1000201032-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '400px',
      cardVideoTop: '50%',
      sheetVideoSize: '660px',
      sheetVideoTop: '120%',
      // no tierGroup → tabs hidden
      giftText: '0/1000000000000 Coins You won from game',
    },
    // ================= MILLIONAIRE GROUP (5 / 6 / 7) =================
    {
      id: 'new-2',
      name: 'Millionaire',
      video: '/1000200518-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '500px',
      cardVideoTop: '78%',
      sheetVideoSize: '700px',
      sheetVideoTop: '140%',
      tierGroup: 'millionaire',
      giftText: '0/1000000 Online Recharge',
    },
    {
      id: 'new-3',
      name: 'Millionaire',
      video: '/1000200521-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '500px',
      cardVideoTop: '78%',
      sheetVideoSize: '700px',
      sheetVideoTop: '137%',
      tierGroup: 'millionaire',
      giftText: '0/50000000 Online Recharge',
    },
    {
      id: 'new-4',
      name: 'Millionaire',
      video: '/1000200522-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '440px',
      cardVideoTop: '78%',
      sheetVideoSize: '700px',
      sheetVideoTop: '137%',
      tierGroup: 'millionaire',
      giftText: '0/100000000 Online Recharge',
    },
    // ================= ROOM TOP GROUP (8 / 9 / 10) =================
    {
      id: 'new-5',
      name: 'Room Top 1',
      video: '/1000200514-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '300px',
      cardVideoTop: '50%',
      sheetVideoSize: '500px',
      sheetVideoTop: '120%',
      tierGroup: 'roomtop',
      giftText: 'Event Based',
    },
    {
      id: 'new-6',
      name: 'Room Top 2',
      video: '/1000200515-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '300px',
      cardVideoTop: '50%',
      sheetVideoSize: '500px',
      sheetVideoTop: '120%',
      tierGroup: 'roomtop',
      giftText: 'Event Based',
    },
    {
      id: 'new-7',
      name: 'Room Top 3',
      video: '/1000200516-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '300px',
      cardVideoTop: '55%',
      sheetVideoSize: '500px',
      sheetVideoTop: '120%',
      tierGroup: 'roomtop',
      giftText: 'Event Based',
    },
    // ================= MEDAL 11 / 12 / 13 GROUP =================
    {
      id: 'new-8',
      name: 'Medal 13',
      video: '/1000200511-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '400px',
      cardVideoTop: '80%',
      sheetVideoSize: '700px',
      sheetVideoTop: '150%',
      tierGroup: 'medal111213',
      giftText: '0/50000 Coins Of gifts Send',
    },
    {
      id: 'new-9',
      name: 'Medal 12',
      video: '/1000200512-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '400px',
      cardVideoTop: '80%',
      sheetVideoSize: '700px',
      sheetVideoTop: '150%',
      tierGroup: 'medal111213',
      giftText: '0/50000 Coins Of gifts Send',
    },
    {
      id: 'new-10',
      name: 'Medal 11',
      video: '/1000200513-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '400px',
      cardVideoTop: '80%',
      sheetVideoSize: '700px',
      sheetVideoTop: '150%',
      tierGroup: 'medal111213',
      giftText: '0/50000 Coins Of gifts Send',
    },
    // ================= VIP GROUP (VIP2 / VIP1 / Pure Love) =================
    {
      id: '4',
      name: 'VIP2',
      video: '/1000200505-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '500px',
      cardVideoTop: '50%',
      sheetVideoSize: '700px',
      sheetVideoTop: '120%',
      tierGroup: 'vip',
      giftText: '0/50000 Coins Of gifts Send',
    },
    {
      id: '5',
      name: 'VIP1',
      video: '/1000200506-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '500px',
      cardVideoTop: '50%',
      sheetVideoSize: '700px',
      sheetVideoTop: '120%',
      tierGroup: 'vip',
      giftText: '0/50000 Coins Of gifts Send',
    },
    {
      id: '6',
      name: 'Pure Love',
      video: '/1000200507-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      cardVideoSize: '500px',
      cardVideoTop: '50%',
      sheetVideoSize: '700px',
      sheetVideoTop: '120%',
      tierGroup: 'vip',
      giftText: '0/50000 Coins Of gifts Send',
    },
  ]

  const filteredMedals = medals.filter((m) => m.category === activeTab)

  // ---- tier helpers ----
  const getTierMedals = (medal: MedalItem | null): MedalItem[] => {
    if (!medal) return []
    if (!medal.tierGroup) return [medal]
    return medals.filter((m) => m.tierGroup === medal.tierGroup)
  }

  const openSheet = (medal: MedalItem) => {
    const group = getTierMedals(medal)
    const idx = group.findIndex((m) => m.id === medal.id)
    setActiveTier(idx >= 0 ? idx : 0)
    setSelectedMedal(medal)
  }

  const closeSheet = () => {
    setSelectedMedal(null)
    setActiveTier(0)
  }

  const tierMedals = getTierMedals(selectedMedal)
  const displayMedal = tierMedals[activeTier] ?? selectedMedal
  const showTabs = !!selectedMedal?.tierGroup && tierMedals.length > 0

  // group ki common top position (pehla medal ka top anchor)
  const groupTop = tierMedals[0]?.sheetVideoTop ?? selectedMedal?.sheetVideoTop
  const groupSize = tierMedals[0]?.sheetVideoSize ?? selectedMedal?.sheetVideoSize

  return (
    <div className="h-screen w-full text-white flex flex-col font-sans select-none relative overflow-hidden bg-[#02050e] touch-pan-y">
      <MedalFilters />
      <WebGLBackground />

      <div
        className="fixed top-0 left-0 right-0 h-[48vh] pointer-events-none z-[1] bg-top bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url('/file_00000000f1dc821196bf96f688c3b2f6.png')`,
          maskImage:
            'linear-gradient(to bottom, black 0%, black 95%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black 0%, black 95%, transparent 100%)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#02050e]/30 to-[#02050e]" />
      </div>

      <div
        className="relative z-10 flex-none w-full max-w-md mx-auto px-3 pb-2"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        <div className="relative flex items-center justify-between pb-4">
          <button
            onClick={onBack}
            className="p-1 pl-1 text-gray-200 hover:text-white transition-colors cursor-pointer z-10"
          >
            <ArrowLeft size={28} />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-white tracking-wide drop-shadow-md">
            Medal
          </h1>
          <button className="p-1 text-gray-200 hover:text-white transition-colors cursor-pointer z-10">
            <HelpCircle size={22} className="opacity-80" />
          </button>
        </div>

        <div className="pt-2 pb-1 relative">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-[1px] bg-[#a89bbf] relative opacity-60">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 bg-[#d4cce6]"></div>
            </div>
            <span className="text-[15px] text-gray-100 tracking-wide font-medium mx-1">
              The Medal I Wear
            </span>
            <div className="w-10 h-[1px] bg-[#a89bbf] relative opacity-60">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 bg-[#d4cce6]"></div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-[6px] px-1">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square rounded-md border border-white bg-[#281b54]/60 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm shadow-inner"
              >
                <Plus size={22} className="text-[#e2d5ff]" strokeWidth={2.5} />
              </div>
            ))}
          </div>

          <div className="relative mt-6 flex flex-col items-center">
            <div className="flex items-center justify-center text-[15px] font-medium text-gray-200 mb-2 z-10">
              Obtained Medal(s): <span className="text-[#facc15] ml-1">3</span>
              <button className="text-[#facc15] cursor-pointer ml-1 hover:text-yellow-400 transition-colors">
                Check&gt;
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 pb-1 text-sm pt-4">
          {[
            { key: 'achievement', label: 'Achievements' },
            { key: 'activity', label: 'Activities' },
            { key: 'gift', label: 'gift' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`relative font-semibold transition-colors flex flex-col items-center cursor-pointer w-1/3 text-center ${
                activeTab === tab.key
                  ? 'text-white text-[15px]'
                  : 'text-[#8b79b5] hover:text-gray-300 text-[15px]'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="w-2 h-[2px] bg-[#facc15] rounded-full mt-2 absolute -bottom-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8 relative z-10 w-full max-w-md mx-auto scrollbar-thin scrollbar-thumb-blue-900/40 mt-3">
        <div className="grid grid-cols-2 gap-4">
          {filteredMedals.map((medal) => (
            <div
              key={medal.id}
              onClick={() => openSheet(medal)}
              className="relative bg-gradient-to-b from-[#1a1230] to-[#0d0820] rounded-md p-3 flex flex-col items-center justify-center text-center hover:opacity-90 active:scale-95 transition-all duration-200 cursor-pointer h-[190px] overflow-hidden"
            >
              <div className="relative w-full flex-1 flex items-center justify-center pointer-events-none">
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    top: medal.cardVideoTop,
                    transform: 'translateY(-50%)',
                  }}
                >
                  <MedalVideo
                    src={medal.video}
                    variant={medal.variant ?? 'black'}
                    autoPlay={false}
                    isColorless={true}
                    className="max-w-none max-h-none object-contain"
                    style={{
                      width: medal.cardVideoSize,
                      height: medal.cardVideoSize,
                    }}
                  />
                </div>
              </div>

              {/* Card name (stars hata diye, black & white theme) */}
              <div className="mt-auto w-full flex flex-col items-center pb-1 z-10">
                <span className="text-[13px] font-medium text-gray-200 tracking-wide">
                  {medal.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedMedal && displayMedal && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto overflow-x-hidden animate-fade-in">
          <div className="relative w-full h-[30vh]">
            <img
              src="/IMG_20260924_132006.png"
              alt=""
              className="absolute inset-0 w-full h-full object-contain object-top block pointer-events-none select-none"
            />

            <button
              onClick={closeSheet}
              className="absolute left-0 top-0 z-50 p-1 pl-2 text-white hover:text-gray-300 transition-colors cursor-pointer active:scale-95"
              style={{ top: 'max(env(safe-area-inset-top), 0px)' }}
            >
              <ArrowLeft size={28} />
            </button>

            {/* --- SLIDING VIDEO TRACK --- */}
            <div
              className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none overflow-hidden"
              style={{
                top: groupTop,
                transform: 'translateY(-50%)',
                width: groupSize,
                height: groupSize,
              }}
            >
              <div
                className="flex h-full transition-transform duration-500 ease-out will-change-transform"
                style={{
                  width: `${tierMedals.length * 100}%`,
                  transform: `translateX(-${
                    (activeTier * 100) / tierMedals.length
                  }%)`,
                }}
              >
                {tierMedals.map((m) => (
                  <div
                    key={m.id}
                    className="h-full flex items-center justify-center shrink-0"
                    style={{ width: `${100 / tierMedals.length}%` }}
                  >
                    <MedalVideo
                      src={m.video}
                      variant={m.variant ?? 'black'}
                      autoPlay={true}
                      isColorless={false}
                      className="w-full h-full max-w-none max-h-none object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-20 flex flex-col items-center w-full max-w-md mx-auto px-6 pb-16">
            <img
              src="/IMG_20260924_132112.png"
              alt="frame"
              className="w-72 h-72 object-contain pointer-events-none mt-14"
            />

            {/* --- UPDATED TEXT SECTION (AS PER IMAGE 2) --- */}
            <div className="flex flex-col items-center justify-center mt-2 relative z-10">
              {/* Stars */}
              <div className="flex items-center justify-center gap-1 text-[#facc15] text-[20px] drop-shadow-md">
                {Array.from({ length: displayMedal.stars }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>

              {/* Name */}
              <h3 className="mt-1 text-[20px] font-bold text-white tracking-wide text-center">
                {displayMedal.name}
              </h3>

              {/* Subtitle (Reach Level 1 to obtain) */}
              <p className="text-[#facc15] text-[15px] font-medium mt-1 text-center">
                Reach Level 1 to obtain
              </p>
            </div>

            {/* ================= NAYA SECTION: 1/1 Progress aur Medal Thumbnail ================= */}
            <div className="w-full flex flex-col items-center mt-6 relative z-10">
              
              {/* 1. Progress Bar Line */}
              <div className="w-full max-w-[340px] h-[6px] bg-[#3b2b5c] rounded-full mb-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-full bg-[#8b5cf6] rounded-full"></div>
              </div>

              {/* 2. Progress Text (1/1) */}
              <span className="text-white text-[15px] font-bold mb-6">
                1/1
              </span>

              {/* 3. Niche wala Medal Box */}
              <div className="flex items-center justify-center gap-4">
                {/* Selected/Active Medal Box */}
                <div className="w-[86px] h-[86px] rounded-xl border border-[#8b5cf6] bg-[#1a1230]/80 flex items-center justify-center p-1 relative shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <MedalVideo
                    src={displayMedal.video}
                    variant={displayMedal.variant ?? 'black'}
                    autoPlay={false}
                    isColorless={true}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
            {/* ================= NAYA SECTION END ================= */}

            {/* --- Tier Tabs (1/2/3) --- */}
            {showTabs && (
              <div className="flex items-center justify-center gap-3 mt-8 relative z-10">
                {tierMedals.map((_, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <span className="text-white text-lg font-bold">&gt;</span>
                    )}
                    <img
                      src={TIER_TAB_IMAGES[i]}
                      alt={`${i + 1}`}
                      onClick={() => setActiveTier(i)}
                      draggable={false}
                      className={`w-12 h-12 object-contain cursor-pointer transition-all duration-200 ${
                        activeTier === i ? 'opacity-100' : 'opacity-50'
                      }`}
                    />
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* --- Bottom Obtained Button --- */}
            <button className="mt-8 w-full max-w-[300px] bg-gradient-to-b from-[#facc15] to-[#f59e0b] text-[#3e2723] font-bold text-[17px] py-3 rounded-full shadow-lg active:scale-95 transition-transform cursor-pointer border-none outline-none">
              obtained
            </button>
          </div>

          <style jsx global>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            .animate-fade-in {
              animation: fadeIn 0.3s ease-out forwards;
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
