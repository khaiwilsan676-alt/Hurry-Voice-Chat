'use client'

import React, { useEffect, useState, useRef } from 'react';

// WebGL Shader - Image SIDHI dikhegi, sirf white remove hoga
const WhiteColorRemovalShader = ({ 
  imageSrc, 
  className = "",
  style = {},
  threshold = 0.75,
  yOffset = 0.0
}: { 
  imageSrc: string
  className?: string
  style?: React.CSSProperties
  threshold?: number
  yOffset?: number
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { 
      premultipliedAlpha: true,
      alpha: true 
    })
    if (!gl) {
      console.warn('WebGL not supported')
      return
    }

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
      uniform float u_yOffset;
      
      void main() {
        // Y coordinate ko shift karo
        vec2 shiftedCoord = vec2(v_texCoord.x, v_texCoord.y + u_yOffset);
        
        // Check if coordinates are valid
        if (shiftedCoord.y < 0.0 || shiftedCoord.y > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          return;
        }
        
        vec4 color = texture2D(u_texture, shiftedCoord);
        
        float maxChannel = max(color.r, max(color.g, color.b));
        float minChannel = min(color.r, min(color.g, color.b));
        float difference = maxChannel - minChannel;
        
        bool isWhite = (minChannel >= u_threshold) && (difference < 0.15);
        
        if (isWhite) {
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
        console.error('Shader compile error:', gl.getShaderInfoLog(shader))
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

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return
    }

    gl.useProgram(program)

    // Position buffer
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ])
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    // Texture coordinates - CORRECT orientation
    const texCoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    const texCoords = new Float32Array([
      0.0, 0.0,   // Bottom-left
      1.0, 0.0,   // Bottom-right
      0.0, 1.0,   // Top-left
      0.0, 1.0,   // Top-left
      1.0, 0.0,   // Bottom-right
      1.0, 1.0,   // Top-right
    ])
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)

    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord')
    gl.enableVertexAttribArray(texCoordLocation)
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0)

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    
    // Flip image during upload
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

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
      
      const thresholdLocation = gl.getUniformLocation(program, 'u_threshold')
      const yOffsetLocation = gl.getUniformLocation(program, 'u_yOffset')
      
      gl.uniform1f(thresholdLocation, threshold)
      gl.uniform1f(yOffsetLocation, yOffset)
      
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      
      setIsLoaded(true)
    }
    image.onerror = () => {
      console.error('Failed to load image for WebGL processing')
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
  }, [imageSrc, threshold, yOffset])

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

// Rewards data
const SIGN_IN_REWARDS = [
  { day: 1, reward: '+5000', image: 'file_00000000e56882119c217d508b6733dc.png', color: '#FF6B6B' },
  { day: 2, reward: '+5000', image: 'file_00000000e56882119c217d508b6733dc.png', color: '#FFA726' },
  { day: 3, reward: '×2 Days', image: '/file_00000000d808821186c1b7b612eea3fc.png', color: '#66BB6A' },
  { day: 4, reward: '+10,000', image: 'file_00000000e56882119c217d508b6733dc.png', color: '#42A5F5' },
  { day: 5, reward: '+10,000', image: 'file_00000000e56882119c217d508b6733dc.png', color: '#AB47BC' },
  { day: 6, reward: '×2 Days', image: 'file_00000000e56882119c217d508b6733dc.png', color: '#EF5350', special: true },
  { day: 7, reward: '+15,000', image: 'file_00000000e56882119c217d508b6733dc.png', color: '#FFD700' },
];

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDay: number;
  onSignIn: () => void;
}

export default function DailyCheckInModal({
  isOpen,
  onClose,
  currentDay,
  onSignIn,
}: DailyCheckInModalProps) {
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const setHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setViewportHeight(window.innerHeight);
    };
    setHeight();
    window.addEventListener('resize', setHeight);
    window.addEventListener('orientationchange', setHeight);
    return () => {
      window.removeEventListener('resize', setHeight);
      window.removeEventListener('orientationchange', setHeight);
    };
  }, []);

  if (!isOpen) return null;

  const renderIcon = (imageSrc: string, size: string = 'w-8 h-8') => {
    return (
      <img 
        src={imageSrc} 
        alt="reward" 
        className={`${size} mx-auto object-contain`} 
      />
    );
  };

  const renderDay5Special = () => {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <div className="flex flex-col items-center">
          {renderIcon('file_00000000e56882119c217d508b6733dc.png', 'w-6 h-6')}
          <span className="text-[9px] font-bold text-gray-700 mt-0.5 whitespace-nowrap">+10,000</span>
        </div>
        <div className="flex flex-col items-center">
          {renderIcon('/IMG_20260903_141944.png', 'w-6 h-6')}
          <span className="text-[9px] font-bold text-gray-700 mt-0.5 whitespace-nowrap">×1 Day</span>
        </div>
      </div>
    );
  };

  const renderDay6Special = () => {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <div className="flex flex-col items-center">
          {renderIcon('file_00000000e56882119c217d508b6733dc.png', 'w-6 h-6')}
          <span className="text-[9px] font-bold text-gray-700 mt-0.5 whitespace-nowrap">+10,000</span>
        </div>
        <div className="flex flex-col items-center">
          {renderIcon('/IMG-20260903-WA0076.jpg', 'w-6 h-6')}
          <span className="text-[9px] font-bold text-gray-700 mt-0.5 whitespace-nowrap">×2 Days</span>
        </div>
      </div>
    );
  };

  const renderDay7Special = () => {
    return (
      <div className="flex items-center justify-center gap-3">
        <div className="flex flex-col items-center">
          {renderIcon('file_00000000e56882119c217d508b6733dc.png', 'w-8 h-8')}
          <span className="text-[10px] font-bold text-gray-700 mt-0.5 whitespace-nowrap">+15,000</span>
        </div>
        <div className="flex flex-col items-center">
          {renderIcon('/file_0000000044388211996656afc9ce9c03.png', 'w-8 h-8')}
          <span className="text-[10px] font-bold text-gray-700 mt-0.5 whitespace-nowrap">×3 days</span>
        </div>
        <div className="flex flex-col items-center">
          {renderIcon('/IMG-20260903-WA0077.jpg', 'w-8 h-8')}
          <span className="text-[10px] font-bold text-gray-700 mt-0.5 whitespace-nowrap">×3 days</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4"
      style={{
        animation: 'modalOverlayIn 0.3s ease-out',
        height: viewportHeight ? `calc(var(--vh, 1vh) * 100)` : '100vh',
        paddingTop: '60px',
      }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />

      {/* Header image - SIDHI with white removed, overlapping white box */}
      <div className="relative w-full max-w-xl" style={{ 
        marginBottom: '-50px',
        zIndex: 20
      }}>
        <WhiteColorRemovalShader
          imageSrc="IMG_20260817_121025.png"
          threshold={0.75}
          yOffset={0.0}
          className="w-full h-auto"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </div>

      {/* White box with rewards */}
      <div
        className="relative bg-white rounded-3xl w-full max-w-xl overflow-hidden mb-4 border-2 border-blue-500"
        style={{
          animation: 'modalFadeIn 0.3s ease-out',
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          paddingTop: '50px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Rewards grid */}
        <div className="px-6 pt-2 pb-5">
          {/* Days 1-4 (Row 1) */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {SIGN_IN_REWARDS.slice(0, 4).map((item, index) => (
              <div
                key={item.day}
                className={`relative rounded-lg aspect-square flex flex-col items-center justify-center p-2 transition-all bg-white ${
                  index + 1 < currentDay
                    ? 'border-2 border-green-400'
                    : index + 1 === currentDay
                    ? 'border-2 border-blue-500 animate-pulse'
                    : 'border-2 border-gray-200'
                }`}
              >
                <span className="absolute top-0 left-0 w-6 h-5 bg-blue-500 rounded-tl-lg rounded-br-lg flex items-center justify-center text-white text-[10px] font-bold">
                  {item.day}
                </span>
                <div className="mb-1 mt-2">{renderIcon(item.image, 'w-8 h-8')}</div>
                <div className="text-[10px] font-semibold text-gray-700 whitespace-nowrap">{item.reward}</div>
                {index + 1 < currentDay && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Days 5-6 (Row 2) */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* Day 5 */}
            <div
              className={`relative rounded-lg flex flex-col items-center justify-center p-2 transition-all bg-white ${
                5 < currentDay
                  ? 'border-2 border-green-400'
                  : 5 === currentDay
                  ? 'border-2 border-blue-500 animate-pulse'
                  : 'border-2 border-gray-200'
              }`}
              style={{ height: '80px' }}
            >
              <span className="absolute top-0 left-0 w-6 h-5 bg-blue-500 rounded-tl-lg rounded-br-lg flex items-center justify-center text-white text-[10px] font-bold">
                5
              </span>
              <div className="mt-2">{renderDay5Special()}</div>
              {5 < currentDay && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>

            {/* Day 6 */}
            <div
              className={`relative rounded-lg flex flex-col items-center justify-center p-2 transition-all bg-white ${
                6 < currentDay
                  ? 'border-2 border-green-400'
                  : 6 === currentDay
                  ? 'border-2 border-blue-500 animate-pulse'
                  : 'border-2 border-gray-200'
              }`}
              style={{ height: '80px' }}
            >
              <span className="absolute top-0 left-0 w-6 h-5 bg-blue-500 rounded-tl-lg rounded-br-lg flex items-center justify-center text-white text-[10px] font-bold">
                6
              </span>
              <div className="mt-2">{renderDay6Special()}</div>
              {6 < currentDay && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Day 7 */}
          <div className="mb-5">
            <div
              className={`relative rounded-lg p-4 text-center transition-all bg-white ${
                7 < currentDay
                  ? 'border-2 border-green-400'
                  : 7 === currentDay
                  ? 'border-2 border-blue-500 animate-pulse'
                  : 'border-2 border-gray-200'
              }`}
            >
              <span className="absolute top-0 left-0 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-tl-lg rounded-br-lg text-white text-[10px] font-bold whitespace-nowrap">
                7 Days Big Rewards
              </span>
              <div className="mb-1.5 mt-3">{renderDay7Special()}</div>
              {7 < currentDay && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Sign-in button */}
          <button
            onClick={onSignIn}
            disabled={currentDay > 7}
            className={`w-full py-3.5 rounded-xl font-bold text-white text-base transition-all transform active:scale-95 ${
              currentDay > 7
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50'
            }`}
          >
            {currentDay > 7 ? 'All Rewards Claimed!' : 'Sign In'}
          </button>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="relative z-10 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-all"
        style={{
          animation: 'modalFadeIn 0.3s ease-out',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Global keyframes */}
      <style>{`
        @keyframes modalOverlayIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes modalFadeIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
        }
        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
