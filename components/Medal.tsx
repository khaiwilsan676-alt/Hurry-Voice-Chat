'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Plus, Star, HelpCircle } from 'lucide-react'

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
  // HAR SINGLE VIDEO KA APNA SEPARATE SIZE AUR TOP (UP/DOWN)
  listWidth: string
  listHeight: string
  listTop: string
  modalWidth: string
  modalHeight: string
  modalTop: string
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
}: {
  src: string
  variant?: 'black' | 'green'
  className?: string
  style?: React.CSSProperties
}) {
  const isGreen = variant === 'green'

  return (
    <video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      controls={false}
      disablePictureInPicture
      disableRemotePlayback
      className={className}
      style={{
        backgroundColor: 'transparent',
        filter: isGreen ? 'url(#remove-green)' : 'url(#remove-black)',
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

export default function Medal({ onBack }: MedalProps) {
  const [activeTab, setActiveTab] = useState<
    'achievement' | 'activity' | 'gift'
  >('achievement')
  const [selectedMedal, setSelectedMedal] = useState<MedalItem | null>(null)

  // 👇 YAHAN DEKH BHAI: Har ek Medal ka apna ekdum ALAG Size aur ALAG Top hai.
  // Ek video ki value change karne se kisi aur video par asar nahi padega.
  const medals: MedalItem[] = [
    {
      id: '1',
      name: 'CP-TOP1',
      video: '/VID_20260924_124439.mp4',
      stars: 5,
      category: 'achievement',
      variant: 'green',
      listWidth: '150px',
      listHeight: '150px',
      listTop: '50%',
      modalWidth: '700px',    // Iska apna Sheet me size
      modalHeight: '700px',
      modalTop: '30%',        // Iska apna Sheet me Up/Down
    },
    {
      id: '2',
      name: 'CP-TOP2',
      video: '/1000200510-background.mp4',
      stars: 5,
      category: 'achievement',
      variant: 'black',
      listWidth: '130px',
      listHeight: '130px',
      listTop: '50%',
      modalWidth: '700px',    // Iska apna alag Sheet size
      modalHeight: '700px',
      modalTop: '30%',        // Iska apna alag Up/Down
    },
    {
      id: '3',
      name: 'CP-TOP 3',
      video: '/1000200509-background.mp4',
      stars: 4,
      category: 'achievement',
      variant: 'black',
      listWidth: '140px',
      listHeight: '140px',
      listTop: '50%',
      modalWidth: '700px',
      modalHeight: '700px',
      modalTop: '30%',
    },
    {
      id: '4',
      name: 'Pure Love',
      video: '/1000200507-background.mp4',
      stars: 4,
      category: 'activity',
      variant: 'black',
      listWidth: '120px',
      listHeight: '120px',
      listTop: '45%',
      modalWidth: '700px',
      modalHeight: '700px',
      modalTop: '30%',
    },
    {
      id: '5',
      name: 'VIP1',
      video: '/1000200506-background.mp4',
      stars: 4,
      category: 'activity',
      variant: 'black',
      listWidth: '160px',
      listHeight: '160px',
      listTop: '50%',
      modalWidth: '700px',
      modalHeight: '700px',
      modalTop: '30%',
    },
    {
      id: '6',
      name: 'VIP2',
      video: '/1000200505-background.mp4',
      stars: 4,
      category: 'gift',
      variant: 'black',
      listWidth: '180px',
      listHeight: '180px',
      listTop: '55%',
      modalWidth: '700px',
      modalHeight: '700px',
      modalTop: '30%',
    },
  ]

  const filteredMedals = medals.filter((m) => m.category === activeTab)

  return (
    <div className="h-screen w-full text-white flex flex-col font-sans select-none relative overflow-hidden bg-[#02050e]">
      <MedalFilters />
      <WebGLBackground />

      {/* Top Background Image (main page) */}
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

      {/* FIXED TOP AREA */}
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
                className="aspect-square rounded-xl border border-[#5d4a8e] bg-[#281b54]/60 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm shadow-inner"
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
                <span className="w-[14px] h-[3px] bg-[#facc15] rounded-full mt-2 absolute -bottom-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SCROLLABLE GRID */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 relative z-10 w-full max-w-md mx-auto scrollbar-thin scrollbar-thumb-blue-900/40 mt-3">
        <div className="grid grid-cols-2 gap-4">
          {filteredMedals.map((medal) => (
            <div
              key={medal.id}
              onClick={() => setSelectedMedal(medal)}
              className="relative bg-gradient-to-b from-[#1a1230] to-[#0d0820] rounded-md p-3 flex flex-col items-center justify-center text-center hover:opacity-90 active:scale-95 transition-all duration-200 cursor-pointer h-[190px] overflow-hidden"
            >
              
              {/* CHOTE DABBE (GRID) me custom listWidth/listHeight yaha apply ho rahi hai */}
              <div className="relative w-full flex-1 flex items-center justify-center pointer-events-none">
                <div 
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ top: medal.listTop, transform: 'translateY(-50%)' }}
                >
                  <MedalVideo
                    src={medal.video}
                    variant={medal.variant ?? 'black'}
                    className="max-w-none max-h-none object-contain"
                    style={{
                      width: medal.listWidth,
                      height: medal.listHeight,
                    }}
                  />
                </div>
              </div>

              <div className="mt-auto w-full flex flex-col items-center pb-1 z-10">
                {medal.stars > 0 && (
                  <div className="flex items-center justify-center gap-[2px] mt-2">
                    {Array.from({ length: medal.stars }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className="fill-yellow-500 text-yellow-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================
          MEDAL DETAIL (Sheet View)
          ============================================================ */}
      {selectedMedal && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto animate-fade-in">
          {/* ✅ TOP BG */}
          <div className="relative w-full h-[30vh]">
            <img
              src="/IMG_20260924_132006.png"
              alt=""
              className="absolute inset-0 w-full h-full object-contain object-top block pointer-events-none select-none"
            />

            <button
              onClick={() => setSelectedMedal(null)}
              className="absolute left-0 top-0 z-50 p-1 pl-2 text-white hover:text-gray-300 transition-colors cursor-pointer active:scale-95"
              style={{ top: 'max(env(safe-area-inset-top), 0px)' }}
            >
              <ArrowLeft size={28} />
            </button>

            {/* ✅ SHEET WALI VIDEO KA STRICT CONTROL (modalWidth, modalHeight, modalTop) */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              style={{ top: selectedMedal.modalTop, transform: 'translateY(-50%)' }}
            >
              <MedalVideo
                src={selectedMedal.video}
                variant={selectedMedal.variant ?? 'black'}
                className="max-w-none max-h-none object-contain"
                style={{ 
                  width: selectedMedal.modalWidth, 
                  height: selectedMedal.modalHeight 
                }}
              />
            </div>
          </div>

          {/* ✅ CONTENT */}
          <div className="relative z-20 flex flex-col items-center w-full max-w-md mx-auto px-6 pb-16">
            <img
              src="/IMG_20260924_132112.png"
              alt="frame"
              className="w-72 h-72 object-contain pointer-events-none mt-10"
            />

            <h3 className="-mt-8 text-[22px] font-bold text-white tracking-wide drop-shadow-md relative z-10">
              {selectedMedal.name}
            </h3>

            <p className="text-gray-500 text-[15px] -mt-2 relative z-10">
              0/50000 Coins Of gifts Send
            </p>

            <div className="flex items-center justify-center gap-3 mt-5 relative z-10">
              <img
                src="/IMG_20260924_132022.png"
                alt="1"
                className="w-12 h-12 object-contain"
              />
              <span className="text-white text-lg font-bold">&gt;</span>
              <img
                src="/IMG_20260924_132038.png"
                alt="2"
                className="w-12 h-12 object-contain"
              />
              <span className="text-white text-lg font-bold">&gt;</span>
              <img
                src="/IMG_20260924_132051.png"
                alt="3"
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>

          <style jsx global>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
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

