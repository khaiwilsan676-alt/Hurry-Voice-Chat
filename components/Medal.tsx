'use client'
 
import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Plus, Star, X, HelpCircle } from 'lucide-react'

interface MedalProps {
  onBack?: () => void
}

interface MedalItem {
  id: string
  name: string
  image: string
  stars: number
  category: 'achievement' | 'gift' | 'activity'
}

// 1. WebGL Background Shader (Deep Ultra Dark Base)
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

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
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

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
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

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />
}

// 2. Green Screen Removal Canvas
function ChromaKeyImage({ src, alt, isColorless = false }: { src: string; alt: string; isColorless?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = src

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imgData.data

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        if (g > 75 && g > r * 1.3 && g > b * 1.3) {
          data[i + 3] = 0
        }
      }

      ctx.putImageData(imgData, 0, 0)
    }
  }, [src])

  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      className={`w-full h-full object-contain pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)] transition-all ${
        isColorless ? 'grayscale brightness-110 contrast-125' : ''
      }`}
    />
  )
}

// 3. Ultra Sparkle Overlay
function GoldenSparklesOverlay() {
  const sparkles = [
    { top: '10%', left: '20%', size: 30, delay: '0s' },
    { top: '15%', left: '78%', size: 36, delay: '0.4s' },
    { top: '24%', left: '42%', size: 22, delay: '0.8s' },
    { top: '35%', left: '12%', size: 28, delay: '1.2s' },
    { top: '32%', left: '88%', size: 32, delay: '0.2s' },
    { top: '48%', left: '26%', size: 38, delay: '1.6s' },
    { top: '46%', left: '75%', size: 26, delay: '0.6s' },
    { top: '60%', left: '14%', size: 34, delay: '1.4s' },
    { top: '58%', left: '84%', size: 30, delay: '2.0s' },
    { top: '72%', left: '28%', size: 24, delay: '1.0s' },
    { top: '75%', left: '70%', size: 36, delay: '1.8s' },
    { top: '86%', left: '48%', size: 28, delay: '0.3s' },
    { top: '20%', left: '60%', size: 18, delay: '1.5s' },
    { top: '68%', left: '45%', size: 20, delay: '2.3s' },
    { top: '82%', left: '20%', size: 22, delay: '0.7s' },
    { top: '84%', left: '80%', size: 26, delay: '2.5s' },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
      {sparkles.map((sp, idx) => (
        <div
          key={idx}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-sparkle-twinkle"
          style={{
            top: sp.top,
            left: sp.left,
            animationDelay: sp.delay,
            animationDuration: '3s',
          }}
        >
          <svg
            width={sp.size}
            height={sp.size}
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-[0_0_12px_rgba(255,255,255,0.95)]"
          >
            <path
              d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z"
              fill="url(#sparkleGrad)"
            />
            <circle cx="12" cy="12" r="2.5" fill="#ffffff" />
            <defs>
              <linearGradient id="sparkleGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="0.45" stopColor="#FFF4B8" />
                <stop offset="1" stopColor="#FBBF24" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ))}
    </div>
  )
}

export default function Medal({ onBack }: MedalProps) {
  const [activeTab, setActiveTab] = useState<'achievement' | 'activity' | 'gift'>('achievement')
  const [selectedMedal, setSelectedMedal] = useState<MedalItem | null>(null)

  const medals: MedalItem[] = [
    { id: '1', name: 'CP-TOP1', image: '/IMG_20260828_003941.png', stars: 5, category: 'achievement' },
    { id: '2', name: 'CP-TOP2', image: '/IMG_20260828_003922.png', stars: 5, category: 'achievement' },
    { id: '3', name: 'CP-TOP 3', image: '/IMG_20260828_003958.png', stars: 4, category: 'achievement' },
    { id: '4', name: 'Pure Love', image: '/IMG_20260828_003941.png', stars: 4, category: 'achievement' },
    { id: '5', name: 'VIP1', image: '/IMG_20260828_003922.png', stars: 4, category: 'activity' },
    { id: '6', name: 'VIP2', image: '/IMG_20260828_003958.png', stars: 4, category: 'activity' },
    { id: '7', name: 'VIP3', image: '/IMG_20260828_003941.png', stars: 4, category: 'activity' },
    { id: '8', name: 'Huna', image: '/IMG_20260828_003922.png', stars: 3, category: 'activity' },
    { id: '9', name: 'I LOVE YOU', image: '/IMG_20260828_003958.png', stars: 1, category: 'activity' },
  ]

  const filteredMedals = medals.filter((m) => m.category === activeTab)

  return (
    <div className="h-screen w-full text-white flex flex-col font-sans select-none relative overflow-hidden bg-[#02050e]">
      {/* 1. Base Dark WebGL Canvas */}
      <WebGLBackground />

      {/* 2. Top Background Image */}
      <div 
        className="fixed top-0 left-0 right-0 h-[48vh] pointer-events-none z-[1] bg-top bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url('/file_00000000f1dc821196bf96f688c3b2f6.png')`,
          maskImage: 'linear-gradient(to bottom, black 0%, black 95%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 95%, transparent 100%)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#02050e]/30 to-[#02050e]" />
      </div>

      {/* 3. FIXED TOP AREA */}
      <div 
        className="relative z-10 flex-none w-full max-w-md mx-auto px-3 pb-2" // Changed px-4 to px-3
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        
        {/* Header Bar */}
        <div className="relative flex items-center justify-between pb-4">
          <button
            onClick={onBack}
            className="p-1 pl-1 text-gray-200 hover:text-white transition-colors cursor-pointer z-10" // Added pl-1
          >
            <ArrowLeft size={28} /> {/* Changed ChevronLeft to ArrowLeft */}
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-white tracking-wide drop-shadow-md">Medal</h1>
          <button className="p-1 text-gray-200 hover:text-white transition-colors cursor-pointer z-10">
            <HelpCircle size={22} className="opacity-80" />
          </button>
        </div>

        {/* Current Medal Section */}
        <div className="pt-2 pb-1 relative">
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-[1px] bg-[#a89bbf] relative opacity-60">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 bg-[#d4cce6]"></div>
            </div>
            <span className="text-[15px] text-gray-100 tracking-wide font-medium mx-1">The Medal I Wear</span>
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

        {/* 3 Tabs */}
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

      {/* 4. SCROLLABLE AREA */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 relative z-10 w-full max-w-md mx-auto scrollbar-thin scrollbar-thumb-blue-900/40 mt-3">
        <div className="grid grid-cols-2 gap-4">
          {filteredMedals.map((medal) => (
            <div
              key={medal.id}
              onClick={() => setSelectedMedal(medal)}
              className="relative bg-gradient-to-b from-[#312061] to-[#181036] rounded-md p-3 flex flex-col items-center justify-between text-center hover:opacity-90 active:scale-95 transition-all duration-200 cursor-pointer h-[190px]"
            >
              <div className="w-24 h-24 my-auto flex items-center justify-center relative">
                <ChromaKeyImage src={medal.image} alt={medal.name} isColorless={true} />
              </div>

              <div className="mt-auto w-full flex flex-col items-center pb-1">
                {medal.stars > 0 && (
                  <div className="flex items-center justify-center gap-[2px] mt-2 mb-1.5">
                    {Array.from({ length: medal.stars }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className="fill-yellow-500 text-yellow-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                      />
                    ))}
                  </div>
                )}

                <h3 className="text-[14px] font-semibold text-white tracking-wide line-clamp-1 drop-shadow-sm">
                  {medal.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MEDAL DETAIL MODAL (EXACTLY AS SCREENSHOT) --- */}
      {selectedMedal && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#0d061f] overflow-hidden animate-fade-in"
        >
          {/* Top Bar with Back Button */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-12 z-50">
            <button 
              onClick={() => setSelectedMedal(null)}
              className="p-2 text-white hover:text-gray-300 transition-colors cursor-pointer"
            >
              <ArrowLeft size={28} />
            </button>
            <h2 className="text-xl font-bold text-white absolute left-1/2 -translate-x-1/2">Medal</h2>
            <button className="p-2 text-white hover:text-gray-300 transition-colors cursor-pointer">
              <HelpCircle size={24} />
            </button>
          </div>

          {/* Background Spotlight Effect */}
          <div className="absolute top-0 left-0 right-0 h-[70vh] bg-gradient-to-b from-[#4c2b8a]/40 via-transparent to-transparent pointer-events-none" />
          
          {/* Main Content */}
          <div className="relative z-10 flex flex-col items-center w-full max-w-sm mt-16">
            
            {/* Big Medal Image */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-2">
              {/* Podium Base */}
              <div className="absolute bottom-[-10px] w-48 h-12 bg-gradient-to-t from-[#1f123b] to-[#3a2566] rounded-[50%] shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-[#5d4a8e]/30" />
              
              <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center drop-shadow-[0_0_30px_rgba(120,80,255,0.6)]">
                <ChromaKeyImage src={selectedMedal.image} alt={selectedMedal.name} isColorless={false} />
              </div>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1 mt-4 mb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Star
                  key={i}
                  size={22}
                  className="fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]"
                />
              ))}
            </div>

            {/* Text */}
            <h2 className="text-[18px] font-bold text-white tracking-wide mt-1">CP Level Badge</h2>
            <p className="text-[14px] text-[#facc15] font-medium mt-1">Reach Level 1 to obtain</p>

            {/* Progress Bar */}
            <div className="w-full px-8 mt-6 mb-4">
              <div className="w-full h-2.5 bg-[#2a1b4d] rounded-full overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-[#7c5cff] to-[#b18cff] rounded-full shadow-[0_0_10px_rgba(124,92,255,0.8)]" />
              </div>
              <p className="text-center text-xs text-gray-300 mt-1.5 font-medium">1/1</p>
            </div>

            {/* Slider / Thumbnails */}
            <div className="flex items-center justify-center gap-6 mt-2 w-full px-6">
              {/* Left Thumbnail (Highlighted) */}
              <div className="w-20 h-20 rounded-xl border-2 border-[#7c5cff] bg-[#1e113a] flex items-center justify-center shadow-[0_0_20px_rgba(124,92,255,0.5)]">
                <ChromaKeyImage src={selectedMedal.image} alt={selectedMedal.name} isColorless={false} />
              </div>
              {/* Right Thumbnail */}
              <div className="w-20 h-20 rounded-xl border border-[#3a2566] bg-[#1e113a]/50 flex items-center justify-center opacity-50">
                <ChromaKeyImage src={selectedMedal.image} alt={selectedMedal.name} isColorless={true} />
              </div>
            </div>

            {/* Obtained Button */}
            <button 
              onClick={() => setSelectedMedal(null)}
              className="mt-8 w-full max-w-[280px] py-3.5 rounded-full bg-gradient-to-b from-[#fcd34d] to-[#d97706] text-[#3e1e00] font-bold text-lg shadow-[0_4px_15px_rgba(217,119,6,0.5)] active:scale-95 transition-transform"
            >
              obtained
            </button>
          </div>

          {/* Global Modal Styles */}
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
