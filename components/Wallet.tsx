'use client'

import { useState, useEffect, useRef } from 'react'

// ==========================================
// IndexedDB Logic for Wallet Sync
// ==========================================
const DB_NAME = 'FruitPartyDB';
const STORE_NAME = 'GameState';

async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject("No window");
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadBalanceFromDB(): Promise<number> {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get('user_data');
      req.onsuccess = () => {
        if (req.result && req.result.balance !== undefined) {
          resolve(req.result.balance);
        } else {
          resolve(82927); // Default balance agar DB me kuch na ho
        }
      };
      req.onerror = () => resolve(82927);
    });
  } catch (e) {
    return 82927;
  }
}

// Ye naya function add kiya hai coins add karne ke liye
async function addCoinsToDB(amountToAdd: number): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('user_data');

      req.onsuccess = () => {
        let data = req.result;
        if (!data) {
          data = { balance: 82927 + amountToAdd };
        } else {
          data.balance = (data.balance || 82927) + amountToAdd;
        }
        const putReq = store.put(data, 'user_data');
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("Failed to add coins to DB", e);
  }
}

export async function deductCoinsFromDB(amountToDeduct: number): Promise<boolean> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('user_data');

      req.onsuccess = () => {
        let data = req.result;
        let currentBalance = data ? (data.balance || 82927) : 82927;

        if (currentBalance >= amountToDeduct) {
            if (!data) {
              data = { balance: currentBalance - amountToDeduct };
            } else {
              data.balance = currentBalance - amountToDeduct;
            }
            const putReq = store.put(data, 'user_data');
            putReq.onsuccess = () => resolve(true);
            putReq.onerror = () => reject(putReq.error);
        } else {
            resolve(false);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("Failed to deduct coins from DB", e);
    return false;
  }
}


// --- WebGL Shader to strictly remove White Background & Fix UV Inversion ---
function WhiteColorRemovalShader({
  imageSrc,
  className = '',
  threshold = 0.88,
}: {
  imageSrc: string
  className?: string
  threshold?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true })
    if (!gl) return

    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `

    const fsSource = `
      precision mediump float;
      uniform sampler2D u_image;
      uniform float u_threshold;
      varying vec2 v_texCoord;
      void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        if (color.r > u_threshold && color.g > u_threshold && color.b > u_threshold) {
          discard;
        } else {
          float brightness = (color.r + color.g + color.b) / 3.0;
          if (brightness > u_threshold - 0.08) {
            float alphaFactor = (u_threshold - brightness) / 0.08;
            gl_FragColor = vec4(color.rgb, color.a * clamp(alphaFactor, 0.0, 1.0));
          } else {
            gl_FragColor = color;
          }
        }
      }
    `

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource)
    if (!vs || !fs) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.useProgram(program)

    const posBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    )

    const posAttr = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(posAttr)
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0)

    const texBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0, 1,
        1, 1,
        0, 0,
        0, 0,
        1, 1,
        1, 0,
      ]),
      gl.STATIC_DRAW
    )

    const texAttr = gl.getAttribLocation(program, 'a_texCoord')
    gl.enableVertexAttribArray(texAttr)
    gl.vertexAttribPointer(texAttr, 2, gl.FLOAT, false, 0, 0)

    const thresholdLoc = gl.getUniformLocation(program, 'u_threshold')
    gl.uniform1f(thresholdLoc, threshold)

    const texture = gl.createTexture()
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageSrc
    img.onload = () => {
      if (!canvas) return
      canvas.width = img.width || 120
      canvas.height = img.height || 120
      gl.viewport(0, 0, canvas.width, canvas.height)

      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
  }, [imageSrc, threshold])

  return <canvas ref={canvasRef} className={className} />
}

interface WalletProps {
  onBack: () => void
  initialTab?: 'coins' | 'diamond' | 'wallet' | 'diamonds'
}

export default function Wallet({ onBack, initialTab = 'wallet' }: WalletProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'wallet' | 'diamonds'>(
    initialTab === 'diamond' || initialTab === 'diamonds' ? 'diamonds' : 'wallet'
  )
  const [diamonds, setDiamonds] = useState('')
  const [coins, setCoins] = useState('')
  const [selectedPercentage, setSelectedPercentage] = useState('100%')
  
  // Real-time Balance State
  const [walletBalance, setWalletBalance] = useState<number>(0)

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(id)
  }, [])

  // DB se Real-time balance sync karne ka logic
  useEffect(() => {
    let isMounted = true;
    
    const fetchBalance = async () => {
      const bal = await loadBalanceFromDB();
      if (isMounted) {
        setWalletBalance(bal);
      }
    };

    fetchBalance(); // Pehli baar load hote hi balance update karega

    // Har 1 second me IndexedDB check karega real-time update ke liye
    const intervalId = setInterval(fetchBalance, 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleDiamondChange = (value: string) => {
    setDiamonds(value)
    const diamondNum = parseFloat(value) || 0
    const coinValue = (diamondNum * 33 / 100).toFixed(0)
    setCoins(coinValue)
  }

  const handleCoinChange = (value: string) => {
    setCoins(value)
    const coinNum = parseFloat(value) || 0
    const diamondValue = (coinNum * 100 / 33).toFixed(0)
    setDiamonds(diamondValue)
  }

  const handlePercentageSelect = (pct: string) => {
    setSelectedPercentage(pct)
  }

  // Handle USD 1 Button Click logic
  const handleBuyCoins = async (amount: number) => {
    // UI mein turant update ke liye (Optimistic update)
    setWalletBalance((prev) => prev + amount)
    // DB me background mein update karne ke liye
    await addCoinsToDB(amount)
  }

  return (
    <div
      className="fixed inset-0 h-[100dvh] w-full overflow-hidden flex flex-col pt-[env(safe-area-inset-top,12px)] pb-[env(safe-area-inset-bottom,12px)] transition-all duration-300"
      style={{
        touchAction: 'manipulation',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        background: activeTab === 'wallet' 
          ? 'linear-gradient(180deg, #F3C663 0%, #FFFDF9 35%, #FFFDF9 100%)'
          : 'linear-gradient(180deg, #F97394 0%, #FFFDF9 35%, #FFFDF9 100%)',
      }}
    >
      <style>{`
        * {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
          touch-action: manipulation;
        }
      `}</style>

      {/* TOP HEADER */}
      <div className="w-full relative flex-shrink-0 flex items-center justify-between px-4 z-20 h-12">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center active:scale-90 transition-all text-gray-900"
          aria-label="Back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <h1 className="text-base font-bold text-gray-950 tracking-tight">
          Wallet
        </h1>

        <button
          className="w-8 h-8 flex items-center justify-center active:scale-90 transition-all text-gray-900"
          aria-label="History"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </button>
      </div>

      {/* TABS (Coins / Diamonds) */}
      <div className="flex justify-center gap-12 py-1 flex-shrink-0 z-20">
        <div className="flex flex-col items-center">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`text-sm font-semibold transition-all ${
              activeTab === 'wallet' ? 'text-gray-950 font-bold' : 'text-gray-600'
            }`}
          >
            Coins
          </button>
          {activeTab === 'wallet' && (
            <div className="w-3 h-0.5 bg-gray-950 rounded-full mt-1" />
          )}
        </div>

        <div className="flex flex-col items-center">
          <button
            onClick={() => setActiveTab('diamonds')}
            className={`text-sm font-semibold transition-all ${
              activeTab === 'diamonds' ? 'text-gray-950 font-bold' : 'text-gray-600'
            }`}
          >
            Diamonds
          </button>
          {activeTab === 'diamonds' && (
            <div className="w-3 h-0.5 bg-gray-950 rounded-full mt-1" />
          )}
        </div>
      </div>

      {/* SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 relative">
        {activeTab === 'wallet' ? (
          /* ================= COINS TAB ================= */
          <div className="flex flex-col space-y-4">
            {/* Current Balance Banner */}
            <div
              className="rounded-xl p-5 relative mt-8 flex flex-col justify-center"
              style={{
                background: 'linear-gradient(135deg, #FFD166 0%, #E09F3E 100%)',
                boxShadow: '0 6px 20px rgba(224, 159, 62, 0.35)',
                minHeight: '115px',
              }}
            >
              {/* Larger Half Overflow Coin Image */}
              <div className="absolute -top-9 right-3 w-28 h-28 pointer-events-none z-20 drop-shadow-xl">
                <WhiteColorRemovalShader
                  imageSrc="/file_00000000e56882119c217d508b6733dc.png"
                  className="w-full h-full object-contain"
                  threshold={0.88}
                />
              </div>
              <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider mb-1">
                current balance
              </span>
              <p className="text-3xl font-black text-amber-950 tracking-tight">
                {/* Yahan Real Time Coins Update Honge DB Se */}
                {walletBalance.toLocaleString()}
              </p>
            </div>

            {/* Product Card Container */}
            <div className="pt-1">
              <div
                className="rounded-xl p-3 relative flex flex-col items-center"
                style={{
                  background: '#FFFDF9',
                  border: '1px solid #FDF0D5',
                  width: '145px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                }}
              >
                {/* Top left small bonus tag - Emoji Hatakar Image Laga di gayi */}
                <div className="absolute -top-2 left-2 z-10 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-extrabold rounded shadow-xs flex items-center gap-1">
                  +20,000
                  <div className="w-2.5 h-2.5">
                    <WhiteColorRemovalShader
                      imageSrc="/file_00000000e56882119c217d508b6733dc.png"
                      className="w-full h-full object-contain"
                      threshold={0.88}
                    />
                  </div>
                </div>

                {/* Center Coin Image */}
                <div className="w-12 h-12 my-2 flex items-center justify-center">
                  <WhiteColorRemovalShader
                    imageSrc="/file_00000000e56882119c217d508b6733dc.png"
                    className="w-full h-full object-contain"
                    threshold={0.88}
                  />
                </div>

                {/* First Recharge Tag */}
                <span className="px-2 py-0.5 bg-red-400 text-white text-[9px] font-bold rounded-full mb-2">
                  First Recharge
                </span>

                {/* Coin Value */}
                <span className="text-gray-900 font-extrabold text-sm mb-3">
                  1,000,000
                </span>

                {/* USD Button - OnClick pe function call kiya gaya */}
                <button 
                  onClick={() => handleBuyCoins(1000000)}
                  className="w-full py-2 bg-amber-300 hover:bg-amber-400 font-bold text-amber-950 text-xs rounded-lg shadow-xs active:scale-95 transition-transform"
                >
                  USD 1
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ================= DIAMONDS TAB ================= */
          <div className="flex flex-col justify-between min-h-[calc(100vh-140px)]">
            <div className="space-y-4">
              {/* Current Diamonds Banner */}
              <div
                className="rounded-xl p-5 relative mt-8 flex flex-col justify-center"
                style={{
                  background: 'linear-gradient(135deg, #FF70A6 0%, #D90429 100%)',
                  boxShadow: '0 6px 20px rgba(217, 4, 41, 0.35)',
                  minHeight: '115px',
                }}
              >
                {/* Larger Half Overflow Diamond Image */}
                <div className="absolute -top-10 right-2 w-28 h-28 pointer-events-none z-20 drop-shadow-xl">
                  <WhiteColorRemovalShader
                    imageSrc="/1787321690452.png"
                    className="w-full h-full object-contain"
                    threshold={0.88}
                  />
                </div>
                <span className="text-xs font-extrabold text-white/90 uppercase tracking-wider mb-1">
                  current diamonds
                </span>
                <p className="text-3xl font-black text-white tracking-tight">
                  0
                </p>
              </div>

              {/* Exchange Section Box */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'linear-gradient(180deg, #FFF0F3 0%, #FFFFFF 100%)',
                  border: '1px solid #FFE4E8',
                  boxShadow: '0 2px 10px rgba(255, 182, 193, 0.15)',
                }}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-gray-800">Exchange</h3>
                  <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                    <span>100 =</span>
                    <div className="w-3.5 h-3.5 inline-block align-middle">
                      <WhiteColorRemovalShader
                        imageSrc="/file_00000000e56882119c217d508b6733dc.png"
                        className="w-full h-full object-contain"
                        threshold={0.88}
                      />
                    </div>
                    <span>33</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Left Diamond Input Box */}
                  <div className="flex-1 bg-gray-50/80 rounded-xl p-2.5 flex items-center gap-2 border border-pink-100 shadow-inner">
                    <div className="w-4 h-4 flex-shrink-0">
                      <WhiteColorRemovalShader
                        imageSrc="/1787321690452.png"
                        className="w-full h-full object-contain"
                        threshold={0.88}
                      />
                    </div>
                    <input
                      type="number"
                      value={diamonds}
                      onChange={(e) => handleDiamondChange(e.target.value)}
                      className="bg-transparent outline-none w-full font-medium text-gray-700 text-xs placeholder:text-gray-400"
                      placeholder="Input multiple"
                    />
                    <span className="text-[11px] font-bold text-gray-400">x100</span>
                  </div>

                  <span className="text-gray-300 font-bold">=</span>

                  {/* Right Coin Output Box */}
                  <div className="flex-1 bg-gray-50/80 rounded-xl p-2.5 flex items-center justify-between border border-gray-200 shadow-inner">
                    <input
                      type="number"
                      value={coins}
                      onChange={(e) => handleCoinChange(e.target.value)}
                      className="bg-transparent outline-none w-full font-medium text-gray-700 text-xs text-right placeholder:text-gray-400"
                      placeholder="Coins"
                    />
                    <div className="w-4 h-4 flex-shrink-0 ml-1.5">
                      <WhiteColorRemovalShader
                        imageSrc="/file_00000000e56882119c217d508b6733dc.png"
                        className="w-full h-full object-contain"
                        threshold={0.88}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Exchange Rate Percentages */}
              <div className="space-y-2 pt-1">
                <h4 className="text-[11px] font-bold text-gray-500">exchange rate</h4>
                <div className="grid grid-cols-3 gap-2">
                  {['20%', '40%', '60%', '80%', '100%'].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handlePercentageSelect(pct)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedPercentage === pct
                          ? 'bg-cyan-400 text-white border-cyan-400 shadow-xs'
                          : 'bg-white text-cyan-500 border-cyan-200'
                      }`}
                    >
                      {pct}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Exchange Button */}
            <div className="pt-6 pb-2">
              <button
                className="w-full py-3 rounded-xl font-bold text-white bg-pink-300 text-sm shadow-xs active:scale-95 transition-transform"
              >
                Exchange
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

