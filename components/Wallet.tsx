'use client'

import { useState, useEffect, useRef } from 'react'

// ==========================================
// Shared Wallet DB (Same as GiftPicker / WildParty / Store / SellerCenter)
// ==========================================
const DB_NAME = 'FruitPartyDB';
const STORE_NAME = 'GameState';
const DEFAULT_BALANCE = 0;

// Single cached connection — avoids leaking an IndexedDB connection on every poll
let dbPromise: Promise<IDBDatabase> | null = null;

async function initDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); dbPromise = null; };
      db.onclose = () => { dbPromise = null; };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

async function loadBalanceFromDB(): Promise<number> {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get('user_data');
      req.onsuccess = () => {
        if (req.result && typeof req.result.balance === 'number') {
          resolve(req.result.balance);
        } else {
          resolve(DEFAULT_BALANCE);
        }
      };
      req.onerror = () => resolve(DEFAULT_BALANCE);
    });
  } catch {
    return DEFAULT_BALANCE;
  }
}

export async function addDiamondsToDB(amountToAdd: number): Promise<void> {
  if (!Number.isFinite(amountToAdd) || amountToAdd <= 0) return;
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('user_data');
      req.onsuccess = () => {
        const data = req.result || {};
        const current = Number(data.diamonds) || 0;
        const putReq = store.put({ ...data, diamonds: Math.max(0, current + amountToAdd) }, 'user_data');
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Failed to update diamonds in DB', e);
  }
}

async function subtractDiamondsFromDB(amount: number): Promise<boolean> {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('user_data');
      req.onsuccess = () => {
        const data = req.result || {};
        const current = Number(data.diamonds) || 0;
        if (current < amount) return resolve(false);
        const putReq = store.put({ ...data, diamonds: current - amount }, 'user_data');
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => resolve(false);
      };
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

async function loadDiamondBalanceFromDB(): Promise<number> {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get('user_data');
      req.onsuccess = () => resolve(Math.max(0, Number(req.result?.diamonds) || 0));
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

async function addCoinsToDB(amountToAdd: number): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('user_data');

      req.onsuccess = () => {
        const data = req.result;
        const current = data?.balance ?? DEFAULT_BALANCE;
        const next = Math.max(0, current + amountToAdd);
        const putReq = store.put({ ...(data || {}), balance: next }, 'user_data');
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Failed to update coins in DB', e);
  }
}

// type: 'coin' | 'diamond'
export async function recordTransaction(
  title: string,
  amount: number,
  type: 'coin' | 'diamond' = 'coin'
): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');

      const now = new Date();
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const record = { title, amount, date: dateStr, timestamp: now.getTime(), type };

      const putReq = store.add(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (e) {
    console.error('Failed to record transaction in DB', e);
  }
}

// ==========================================
// Shared single-context WebGL white-removal processor
// ==========================================
const processedCache = new Map<string, Promise<string>>()

let glCanvas: HTMLCanvasElement | null = null
let glCtx: WebGLRenderingContext | null = null
let glTex: WebGLTexture | null = null
let glThresholdLoc: WebGLUniformLocation | null = null

const VS = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}`

const FS = `
precision mediump float;
uniform sampler2D u_image;
uniform float u_threshold;
varying vec2 v_texCoord;
void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  if (color.r > u_threshold && color.g > u_threshold && color.b > u_threshold) {
    discard;
  }
  float brightness = (color.r + color.g + color.b) / 3.0;
  float a = color.a;
  if (brightness > u_threshold - 0.08) {
    a *= clamp((u_threshold - brightness) / 0.08, 0.0, 1.0);
  }
  gl_FragColor = vec4(color.rgb * a, a);
}`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  return s
}

function ensureGL(): WebGLRenderingContext | null {
  if (glCtx) return glCtx
  if (typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl', {
    premultipliedAlpha: true,
    alpha: true,
    preserveDrawingBuffer: true,
    antialias: false,
  }) as WebGLRenderingContext | null
  if (!gl) return null

  const program = gl.createProgram()!
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VS))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FS))
  gl.linkProgram(program)
  gl.useProgram(program)

  const posBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  )
  const posLoc = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(posLoc)
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

  const texBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuf)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]),
    gl.STATIC_DRAW,
  )
  const texLoc = gl.getAttribLocation(program, 'a_texCoord')
  gl.enableVertexAttribArray(texLoc)
  gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0)

  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)

  glCanvas = canvas
  glCtx = gl
  glTex = tex
  glThresholdLoc = gl.getUniformLocation(program, 'u_threshold')
  return gl
}

function processImage(src: string, threshold: number): Promise<string> {
  const key = `${src}|${threshold}`
  const hit = processedCache.get(key)
  if (hit) return hit

  const p = new Promise<string>((resolve, reject) => {
    const gl = ensureGL()
    if (!gl || !glCanvas) return reject(new Error('no webgl'))

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        glCanvas!.width = img.width || 120
        glCanvas!.height = img.height || 120
        gl.viewport(0, 0, glCanvas!.width, glCanvas!.height)

        gl.bindTexture(gl.TEXTURE_2D, glTex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        gl.uniform1f(glThresholdLoc, threshold)

        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        resolve(glCanvas!.toDataURL('image/png'))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = reject
    img.src = src
  })

  processedCache.set(key, p)
  return p
}

function WhiteColorRemovalShader({
  imageSrc,
  className = '',
  threshold = 0.88,
  alt = '',
}: {
  imageSrc: string
  className?: string
  threshold?: number
  alt?: string
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    processImage(imageSrc, threshold)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(imageSrc))
    return () => {
      alive = false
    }
  }, [imageSrc, threshold])

  if (!url) return <div className={className} aria-hidden />
  return <img src={url} alt={alt} className={className} draggable={false} />
}

// ==========================================
// Details Page — split by type (Coins / Diamonds)
// ==========================================
function DetailsPage({
  onBack,
  type,
}: {
  onBack: () => void;
  type: 'coin' | 'diamond';
}) {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchTransactions = async () => {
      try {
        const db = await initDB();
        const tx = db.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        const req = store.getAll();
        req.onsuccess = () => {
          if (isMounted) {
            const data = (req.result || [])
              .filter((t: any) => (t.type ?? 'coin') === type)
              .sort((a: any, b: any) => b.timestamp - a.timestamp);
            setTransactions(data);
          }
        };
      } catch (e) {
        console.error('Failed to load transactions', e);
      }
    };
    fetchTransactions();
    return () => { isMounted = false; };
  }, [type]);

  const valueColor = type === 'diamond' ? 'text-blue-500' : 'text-amber-500';

  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden flex flex-col bg-white pt-[calc(env(safe-area-inset-top,0px)+24px)] pb-[env(safe-area-inset-bottom,12px)]">
      <div className="w-full relative flex-shrink-0 flex items-center justify-between pl-1 pr-4 z-20 h-12 bg-white">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center active:scale-90 transition-all text-gray-900 -ml-1"
          aria-label="Back"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-950 tracking-tight absolute left-1/2 -translate-x-1/2">
          Details
        </h1>
        <div className="w-10 h-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6">
        <div className="flex flex-col">
          {transactions.map((tx, index) => (
            <div
              key={tx.id}
              className={`flex justify-between items-start py-4 ${
                index !== transactions.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[15px] font-semibold text-gray-900">{tx.title}</span>
                <span className="text-[13px] text-gray-400">{tx.date}</span>
              </div>
              <span className={`text-[15px] font-bold ${valueColor}`}>
                {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Recharge Data Array as per Image
const rechargeOptions = [
  { coins: 6000, price: '₹100.00' },
  { coins: 18000, price: '₹300.00' },
  { coins: 30000, price: '₹500.00' },
  { coins: 60000, price: '₹1,000.00' },
  { coins: 120000, price: '₹2,050.00' },
];

// ==========================================
// Main Wallet Component
// ==========================================
type TabType = 'wallet' | 'diamonds' | 'offline';
type SubTabType = 'normal' | 'service';

interface WalletProps {
  onBack: () => void
  initialTab?: TabType
}

export default function Wallet({ onBack, initialTab = 'wallet' }: WalletProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('normal') // New Sub-Tab state
  
  const [diamonds, setDiamonds] = useState('')
  const [coins, setCoins] = useState('')
  const [selectedPercentage, setSelectedPercentage] = useState('100%')
  const [showDetails, setShowDetails] = useState<'coin' | 'diamond' | null>(null)

  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [diamondBalance, setDiamondBalance] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchBalance = async () => {
      const bal = await loadBalanceFromDB()
      const diamondBal = await loadDiamondBalanceFromDB()
      if (isMounted) {
        setWalletBalance(bal)
        setDiamondBalance(diamondBal)
      }
    }

    fetchBalance()
    const intervalId = setInterval(fetchBalance, 1000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  const handleDiamondChange = (value: string) => {
    setDiamonds(value)
    const diamondNum = parseFloat(value) || 0
    const coinValue = ((diamondNum * 33) / 100).toFixed(0)
    setCoins(coinValue)
  }

  const handleCoinChange = (value: string) => {
    setCoins(value)
    const coinNum = parseFloat(value) || 0
    const diamondValue = ((coinNum * 100) / 33).toFixed(0)
    setDiamonds(diamondValue)
  }

  const handlePercentageSelect = (pct: string) => {
    setSelectedPercentage(pct)
    const percentage = parseFloat(pct) || 0
    const availableDiamonds = diamondBalance ?? 0
    const selectedDiamonds = Math.floor((availableDiamonds * percentage) / 100)
    const selectedCoins = Math.floor((selectedDiamonds * 33) / 100)

    setDiamonds(selectedDiamonds > 0 ? String(selectedDiamonds) : '')
    setCoins(selectedCoins > 0 ? String(selectedCoins) : '')
  }

  const handleBuyCoins = async (amount: number) => {
    setWalletBalance((prev) => (prev ?? 0) + amount)
    await addCoinsToDB(amount)
    await recordTransaction('Buy Coins', amount, 'coin')
    setWalletBalance(await loadBalanceFromDB())
  }

  const handleExchange = async () => {
    const diamondNum = parseFloat(diamonds) || 0
    const coinNum = parseFloat(coins) || 0
    if (diamondNum <= 0 || coinNum <= 0) return

    const availableDiamonds = await loadDiamondBalanceFromDB()
    if (diamondNum > availableDiamonds) return

    const removed = await subtractDiamondsFromDB(diamondNum)
    if (!removed) return

    await recordTransaction('Diamond Exchange', -diamondNum, 'diamond')
    await addCoinsToDB(coinNum)

    setDiamonds('')
    setCoins('')
    setWalletBalance(await loadBalanceFromDB())
    setDiamondBalance(await loadDiamondBalanceFromDB())
  }

  if (showDetails) {
    return <DetailsPage type={showDetails} onBack={() => setShowDetails(null)} />
  }

  return (
    <div
      className="fixed inset-0 h-[100dvh] w-full overflow-hidden flex flex-col pt-[calc(env(safe-area-inset-top,0px)+24px)] pb-[env(safe-area-inset-bottom,12px)] transition-all duration-300"
      style={{
        touchAction: 'manipulation',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        // Exact background match with screenshot (Light Green/Yellow fading to Grey)
        background: 'linear-gradient(180deg, #E8F5E9 0%, #FFFDE7 15%, #F5F5F5 35%, #F5F5F5 100%)',
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
      <div className="w-full relative flex-shrink-0 flex items-center justify-between pl-1 pr-4 z-20 h-12">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center active:scale-90 transition-all text-gray-900 -ml-1"
          aria-label="Back"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        <h1 className="text-[17px] font-bold text-gray-950 tracking-tight">
          Recharge
        </h1>

        {/* Updated List Icon as per screenshot */}
        <button
          onClick={() => setShowDetails(activeTab === 'wallet' ? 'coin' : 'diamond')}
          className="w-10 h-10 flex items-center justify-center active:scale-90 transition-all text-gray-900"
          aria-label="History"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
      </div>

      {/* 3 TABS BAR */}
      <div className="flex justify-around items-center px-2 py-2 flex-shrink-0 z-20">
        {[
          { id: 'wallet', label: 'Coins' },
          { id: 'diamonds', label: 'Diamonds' },
          { id: 'offline', label: 'Offline Recharge' }
        ].map((tab) => (
          <div key={tab.id} className="flex flex-col items-center">
            <button
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`text-[15px] transition-all whitespace-nowrap px-2 ${
                activeTab === tab.id ? 'text-gray-950 font-bold' : 'text-gray-500 font-semibold'
              }`}
            >
              {tab.label}
            </button>
            {activeTab === tab.id && (
              <div className="w-4 h-[3px] bg-gray-950 rounded-full mt-1.5" />
            )}
          </div>
        ))}
      </div>

      {/* SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto px-4 pt-1 pb-6 relative">
        {activeTab === 'wallet' && (
          /* ================= COINS TAB ================= */
          <div className="flex flex-col">
            
            {/* Coins Banner with Direct Background Image */}
            <div className="relative w-full rounded-xl overflow-hidden mt-2 min-h-[140px] px-6 py-5 flex flex-col justify-start">
              <img
                src="/public/file_00000000f3d88211964f0057da4bc797.png"
                alt="Coins Banner Background"
                className="absolute inset-0 w-full h-full object-cover z-0"
                draggable={false}
              />
              <div className="relative z-10 flex flex-col gap-1 mt-1">
                <span className="text-gray-200 font-medium text-sm">
                  My Coins
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[28px] font-bold text-yellow-400 tracking-tight drop-shadow-sm">
                    {walletBalance === null ? '—' : walletBalance.toLocaleString()}
                  </span>
                  <img
                    src="/file_00000000e56882119c217d508b6733dc.png"
                    className="w-6 h-6 object-contain drop-shadow-sm"
                    alt="coin icon"
                    draggable={false}
                  />
                </div>
              </div>
            </div>

            {/* Pill Toggle (Normal vs Service) */}
            <div className="bg-gray-200/80 p-1 mt-5 rounded-full flex relative items-center">
              <button
                onClick={() => setActiveSubTab('normal')}
                className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeSubTab === 'normal' 
                    ? 'bg-white text-gray-950 shadow-sm' 
                    : 'text-gray-500'
                }`}
              >
                Normal Recharge
              </button>
              
              <button
                onClick={() => setActiveSubTab('service')}
                className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all relative ${
                  activeSubTab === 'service' 
                    ? 'bg-white text-gray-950 shadow-sm' 
                    : 'text-gray-500'
                }`}
              >
                Recharge Service
                {/* Floating Extra 30% Badge */}
                <span className="absolute -top-3 right-0 bg-[#00B761] text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold shadow-sm tracking-wide">
                  Extra 30%
                </span>
              </button>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              {rechargeOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleBuyCoins(opt.coins)}
                  className="bg-white rounded-[16px] py-4 flex flex-col items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-95 transition-transform"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <img
                      src="/file_00000000e56882119c217d508b6733dc.png"
                      className="w-5 h-5 object-contain"
                      alt="coin"
                      draggable={false}
                    />
                    <span className="text-gray-900 font-semibold text-lg">
                      {opt.coins.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-gray-500 font-medium text-[13px]">
                    {opt.price}
                  </span>
                </button>
              ))}
            </div>

          </div>
        )}

        {activeTab === 'diamonds' && (
          /* ================= DIAMONDS TAB ================= */
          <div className="flex flex-col justify-between min-h-[calc(100vh-140px)]">
            <div className="space-y-4">
              
              {/* Diamonds Banner */}
              <div className="relative w-full rounded-xl overflow-hidden mt-2 min-h-[140px] px-6 py-5 flex flex-col justify-start">
                 <img
                  src="/public/file_000000004ec482088add2cf9e002cade.png"
                  alt="Diamonds Banner Background"
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  draggable={false}
                />
                <div className="relative z-10 flex flex-col gap-1 mt-1">
                  <span className="text-gray-200 font-medium text-sm">
                    My Diamonds
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[28px] font-bold text-yellow-400 tracking-tight drop-shadow-sm">
                      {diamondBalance === null ? '—' : diamondBalance.toLocaleString()}
                    </span>
                    <img
                      src="/1787321690452.png"
                      className="w-6 h-6 object-contain"
                      alt="diamond icon"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>

              {/* Exchange Section Box */}
              <div
                className="rounded-xl p-4 mt-2"
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
                      <img
                        src="/file_00000000e56882119c217d508b6733dc.png"
                        className="w-full h-full object-contain"
                        alt=""
                        draggable={false}
                      />
                    </div>
                    <span>33</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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

                  <div className="flex-1 bg-gray-50/80 rounded-xl p-2.5 flex items-center justify-between border border-gray-200 shadow-inner">
                    <input
                      type="number"
                      value={coins}
                      onChange={(e) => handleCoinChange(e.target.value)}
                      className="bg-transparent outline-none w-full font-medium text-gray-700 text-xs text-right placeholder:text-gray-400"
                      placeholder="Coins"
                    />
                    <div className="w-4 h-4 flex-shrink-0 ml-1.5">
                      <img
                        src="/file_00000000e56882119c217d508b6733dc.png"
                        className="w-full h-full object-contain"
                        alt=""
                        draggable={false}
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
                onClick={handleExchange}
                className="w-full py-3 rounded-xl font-bold text-white bg-pink-400 hover:bg-pink-500 text-sm shadow-xs active:scale-95 transition-transform"
              >
                Exchange
              </button>
            </div>
          </div>
        )}

        {activeTab === 'offline' && (
          /* ================= OFFLINE RECHARGE TAB ================= */
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            {/* Aap isme baad me apna offline recharge ka code daal lena */}
            <p className="font-semibold text-sm">Offline Recharge Options Available Soon</p>
          </div>
        )}
      </div>

      {/* Static Floating Image (50% Off Ad) like screenshot */}
      <div className="absolute bottom-6 right-4 pointer-events-none z-30 opacity-90 drop-shadow-lg">
        {/* Replace with your exact image path if you have it */}
        <div className="w-[50px] h-[50px] rounded-full border-2 border-yellow-400 bg-black overflow-hidden flex items-center justify-center">
          <span className="text-yellow-400 text-[10px] font-black uppercase text-center leading-tight">50%<br/>Off</span>
        </div>
      </div>
    </div>
  )
}
