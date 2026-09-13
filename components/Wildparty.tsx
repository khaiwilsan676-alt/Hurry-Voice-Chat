'use client';

import React, { useState, useEffect, useRef } from 'react';

interface WildpartyProps {
  onClose: () => void;
  onMinimize?: () => void;
}

interface AnimalItem {
  id: number;
  src: string;
  alt: string;
  angle: number;
  distance: number;
  x: number;
  y: number;
  size: number;
  multiplier: number;
}

interface ChipItem {
  label: string;
  value: number;
  src: string;
}

interface RoundHistoryRecord {
  roundNo: number;
  winnerAlt: string;
  timestamp: number;
}

type WinMode = 'single' | 'mix_big' | 'mix_small';

let hasInitialLoaded = false;

// 1. WebGL Shader: White Background remover
function LoadingShaderImage({ src, className }: { src: string; className?: string }) {
  return <img src={src} className={className} alt="" />;
}

// 2. Green Screen Remover
function GreenScreenImage({ src, className }: { src: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const isGreen = g > 65 && g > r * 1.15 && g > b * 1.15;
        if (isGreen) {
          data[i + 3] = 0;
        } else if (g > Math.max(r, b)) {
          data[i + 1] = Math.max(r, b);
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };
  }, [src]);

  return <canvas ref={canvasRef} className={`${className || ''} block bg-transparent`} />;
}

export default function Wildparty({ onClose, onMinimize }: WildpartyProps) {
  const [loading, setLoading] = useState(!hasInitialLoaded);
  const [progress, setProgress] = useState(hasInitialLoaded ? 100 : 0);
  const [isMuted, setIsMuted] = useState(false);

  // Global Engine States
  const [currentRoundNo, setCurrentRoundNo] = useState<number>(1);
  const [gamePhase, setGamePhase] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [countdown, setCountdown] = useState<number>(30);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number | null>(null);

  // Sheets
  const [showHistorySheet, setShowHistorySheet] = useState<boolean>(false);
  const [showRulesSheet, setShowRulesSheet] = useState<boolean>(false);
  const [showWinnerSheet, setShowWinnerSheet] = useState<boolean>(false);
  const [winnerCountdown, setWinnerCountdown] = useState<number>(5);

  // Results
  const [winMode, setWinMode] = useState<WinMode>('single');
  const [roundHistory, setRoundHistory] = useState<RoundHistoryRecord[]>([]);
  const [winnerAnimal, setWinnerAnimal] = useState<AnimalItem | null>(null);
  const [roundWinningAmount, setRoundWinningAmount] = useState<number>(0);
  const [roundBetAmount, setRoundBetAmount] = useState<number>(0);

  // Balance & Betting
  const [balance, setBalance] = useState<number>(0);
  const [bets, setBets] = useState<{ [key: string]: number }>({});
  const [lastBets, setLastBets] = useState<{ [key: string]: number }>({});
  const [selectedChip, setSelectedChip] = useState<ChipItem>({
    label: '10K',
    value: 10000,
    src: '/IMG_20260822_143032.png',
  });

  const chips: ChipItem[] = [
    { label: '1K', value: 1000, src: '/1787389350745~2.jpg' },
    { label: '10K', value: 10000, src: '/IMG_20260822_143032.png' },
    { label: '50k', value: 50000, src: '/IMG_20260822_143348.png' },
    { label: '500k', value: 500000, src: '/IMG_20260822_143408.png' },
    { label: '5M', value: 5000000, src: '/IMG_20260822_143422~2.jpg' },
  ];

  const animals: AnimalItem[] = [
    { id: 0, src: '/IMG_20260822_011134.png', alt: 'Deer', angle: 270, distance: 130, x: 0, y: -13, size: 71, multiplier: 5 },
    { id: 1, src: '/IMG_20260822_011118.png', alt: 'Dog', angle: 315, distance: 130, x: -4, y: -9, size: 55, multiplier: 5 },
    { id: 2, src: '/IMG_20260822_011103.png', alt: 'Zebra', angle: 0, distance: 130, x: -8, y: -19, size: 68, multiplier: 5 },
    { id: 3, src: '/IMG_20260822_011041.png', alt: 'Fox', angle: 45, distance: 130, x: -6, y: -18, size: 52, multiplier: 5 },
    { id: 4, src: '/IMG_20260822_011151.png', alt: 'Eagle', angle: 90, distance: 130, x: 0, y: -18, size: 61, multiplier: 10 },
    { id: 5, src: '/IMG_20260822_011205.png', alt: 'Bear', angle: 135, distance: 130, x: 5, y: -15, size: 60, multiplier: 15 },
    { id: 6, src: '/IMG_20260822_011218.png', alt: 'Tiger', angle: 180, distance: 130, x: 7, y: -8, size: 63, multiplier: 25 },
    { id: 7, src: '/IMG_20260822_011028.png', alt: 'Lion', angle: 225, distance: 130, x: 5, y: -5, size: 65, multiplier: 45 },
  ];

  // ============================
  // WEB AUDIO API (Mast Spin Sound Engine)
  // ============================
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  useEffect(() => {
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setTargetAtTime(isMuted ? 0 : 0.15, audioCtxRef.current.currentTime, 0.1);
    }
  }, [isMuted]);
  // ============================

  const initIndexedDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WildPartyGameDB', 3);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('userState')) {
          db.createObjectStore('userState', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('roundHistory')) {
          db.createObjectStore('roundHistory', { keyPath: 'roundNo' });
        }
      };
      request.onsuccess = (e: any) => resolve(e.target.result);
      request.onerror = (e) => reject(e);
    });
  };

  const get5AMResetBoundary = () => {
    const now = new Date();
    const resetTime = new Date(now);
    if (now.getHours() < 5) {
      resetTime.setDate(now.getDate() - 1);
    }
    resetTime.setHours(5, 0, 0, 0);
    return resetTime.getTime();
  };

  const saveBalanceToDB = async (val: number) => {
    try {
      const db = await initIndexedDB();
      const tx = db.transaction('userState', 'readwrite');
      tx.objectStore('userState').put({ id: 'current_balance', value: val });
    } catch (err) {
      console.error('IndexedDB Save Balance Error:', err);
    }
  };

  const saveRoundToDB = async (record: RoundHistoryRecord) => {
    try {
      const db = await initIndexedDB();
      const tx = db.transaction('roundHistory', 'readwrite');
      tx.objectStore('roundHistory').put(record);
    } catch (err) {
      console.error('IndexedDB Save Round Error:', err);
    }
  };

  const loadDataFromDB = async () => {
    try {
      const db = await initIndexedDB();
      const resetBoundary = get5AMResetBoundary();

      const txUser = db.transaction('userState', 'readonly');
      const balReq = txUser.objectStore('userState').get('current_balance');
      balReq.onsuccess = () => {
        if (balReq.result && typeof balReq.result.value === 'number') {
          setBalance(balReq.result.value);
        } else {
          saveBalanceToDB(0);
          setBalance(0);
        }
      };

      const txHistory = db.transaction('roundHistory', 'readwrite');
      const historyStore = txHistory.objectStore('roundHistory');
      const histReq = historyStore.getAll();
      histReq.onsuccess = () => {
        const records: RoundHistoryRecord[] = histReq.result || [];
        const validRecords = records.filter((r) => r.timestamp >= resetBoundary);

        records.forEach((r) => {
          if (r.timestamp < resetBoundary) {
            historyStore.delete(r.roundNo);
          }
        });

        validRecords.sort((a, b) => a.roundNo - b.roundNo);
        setRoundHistory(validRecords);
      };
    } catch (err) {
      console.error('IndexedDB Load Error:', err);
    }
  };

  useEffect(() => {
    loadDataFromDB();
  }, []);

  useEffect(() => {
    if (hasInitialLoaded) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setProgress(0);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          hasInitialLoaded = true;
          setLoading(false);
          return 100;
        }
        return prev + 4;
      });
    }, 30);
    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    hasInitialLoaded = false;
    onClose();
  };

  const handleMinimize = () => {
    hasInitialLoaded = true;
    if (onMinimize) {
      onMinimize();
    }
  };

  const determineRoundOutcome = (roundNo: number): { mode: WinMode; winnerIndex: number } => {
    const seed = Math.sin(roundNo * 127.1 + 311.7) * 43758.5453123;
    const pseudoRand = seed - Math.floor(seed);
    const roll = pseudoRand * 100;

    if (roll < 0.8) {
      return { mode: 'mix_big', winnerIndex: 6 };
    }
    if (roll < 2.3) {
      return { mode: 'mix_small', winnerIndex: 1 };
    }
    if (roll < 3.3) {
      return { mode: 'single', winnerIndex: 7 };
    }
    if (roll < 4.8) {
      return { mode: 'single', winnerIndex: 6 };
    }
    if (roll < 6.5) {
      return { mode: 'single', winnerIndex: 5 };
    }
    if (roll < 9.0) {
      return { mode: 'single', winnerIndex: 4 };
    }

    const lowPool = [0, 1, 2, 3];
    const subIdx = Math.floor(((roll - 9.0) / 91.0) * lowPool.length) % lowPool.length;
    return {
      mode: 'single',
      winnerIndex: lowPool[Math.max(0, subIdx)],
    };
  };

  const targetOutcomeRef = useRef<{ mode: WinMode; winnerIndex: number }>({
    mode: 'single',
    winnerIndex: 1,
  });

  useEffect(() => {
    if (loading) return;

    // Total Duration set to 47 seconds per cycle (30 Bet + 10 Spin + 7 Result/Hold)
    const roundDuration = 47; 
    const resetBoundary = get5AMResetBoundary();

    const syncTick = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - resetBoundary) / 1000);
      const calculatedRoundNo = Math.floor(elapsedSeconds / roundDuration) + 1;
      const secondInCycle = elapsedSeconds % roundDuration;

      setCurrentRoundNo(calculatedRoundNo);
      targetOutcomeRef.current = determineRoundOutcome(calculatedRoundNo);

      if (secondInCycle < 30) {
        // 30 seconds ki betting
        setGamePhase('betting');
        setCountdown(30 - secondInCycle);
        setWinnerAnimal(null);
        setShowWinnerSheet(false); // Ensure winner page closes properly yahan aake
      } else if (secondInCycle < 40) {
        // 10 seconds ka spinning
        setGamePhase('spinning');
        setCountdown(40 - secondInCycle);
        setShowWinnerSheet(false);
      } else {
        // Baki 7 seconds ka Result phase
        setGamePhase('result');
        setCountdown(47 - secondInCycle);

        const outcome = targetOutcomeRef.current;
        setWinMode(outcome.mode);
        const winAnimal = animals[outcome.winnerIndex];
        setWinnerAnimal(winAnimal);
        setActiveHighlightIndex(outcome.winnerIndex);
      }
    };

    syncTick();
    const interval = setInterval(syncTick, 250);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (gamePhase !== 'spinning') {
      if (gamePhase === 'betting') {
        setActiveHighlightIndex(null);
      }
      
      if (oscRef.current && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        if (gainRef.current) {
          gainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        }
        const osc = oscRef.current;
        setTimeout(() => {
          try { osc.stop(); } catch (e) {}
        }, 100);
        oscRef.current = null;
      }
      return;
    }

    initAudioCtx();

    if (!oscRef.current && audioCtxRef.current && !isMuted) {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(600, ctx.currentTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1500, ctx.currentTime);
      filter.Q.value = 10;

      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      oscRef.current = osc;
      filterRef.current = filter;
      gainRef.current = gain;
    }

    const resetBoundary = get5AMResetBoundary();
    const roundDuration = 47; // Update round duration here as well
    const targetIdx = targetOutcomeRef.current.winnerIndex;

    const animFrame = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - resetBoundary;
      const cycleMs = elapsedMs % (roundDuration * 1000);
      const spinTimeMs = cycleMs - 30000; 

      if (spinTimeMs < 0) return;

      // 10000ms (10s) ka hi spin ab chalega pehle ke 15s ke comparison me
      if (spinTimeMs >= 10000) {
        setActiveHighlightIndex(targetIdx);
        if (oscRef.current && audioCtxRef.current) {
          const ctx = audioCtxRef.current;
          gainRef.current?.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
          const osc = oscRef.current;
          setTimeout(() => {
             try { osc.stop(); } catch(e){}
          }, 100);
          oscRef.current = null;
        }
      } else {
        const progress = spinTimeMs / 10000; 
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const finalStepsCount = 120 + targetIdx; // Changed from 160 to make it slightly smoother for 10s timeframe
        const currentStep = Math.floor(easeOut * finalStepsCount);
        
        setActiveHighlightIndex(currentStep % 8);

        if (oscRef.current && filterRef.current && gainRef.current && audioCtxRef.current) {
          const ctx = audioCtxRef.current;
          const newFreq = 600 - (500 * easeOut); 
          const newFilterFreq = 1500 - (1000 * easeOut); 
          const newVol = 0.15 - (0.15 * easeOut); 
          
          if(!isMuted) {
             oscRef.current.frequency.setTargetAtTime(newFreq, ctx.currentTime, 0.1);
             filterRef.current.frequency.setTargetAtTime(newFilterFreq, ctx.currentTime, 0.1);
             gainRef.current.gain.setTargetAtTime(newVol, ctx.currentTime, 0.1);
          }
        }
      }
    }, 30);

    return () => clearInterval(animFrame);
  }, [gamePhase]);

  const processedRoundsRef = useRef<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (gamePhase === 'result' && winnerAnimal && !processedRoundsRef.current[currentRoundNo]) {
      processedRoundsRef.current[currentRoundNo] = true;

      const outcome = targetOutcomeRef.current;
      const historyAlt =
        outcome.mode === 'mix_big'
          ? 'Mix Big'
          : outcome.mode === 'mix_small'
          ? 'Mix Small'
          : winnerAnimal.alt;

      const record: RoundHistoryRecord = {
        roundNo: currentRoundNo,
        winnerAlt: historyAlt,
        timestamp: Date.now(),
      };

      setRoundHistory((prev) => [...prev.slice(-49), record]);
      saveRoundToDB(record);

      const totalPlaced = Object.values(bets).reduce((a, b) => a + b, 0);
      setRoundBetAmount(totalPlaced);

      let totalWinnings = 0;
      if (outcome.mode === 'mix_big') {
        const bigAnimals = ['Eagle', 'Bear', 'Tiger', 'Lion'];
        bigAnimals.forEach((name) => {
          const placed = bets[name] || 0;
          const aObj = animals.find((a) => a.alt === name);
          if (placed > 0 && aObj) {
            totalWinnings += placed * aObj.multiplier;
          }
        });
      } else if (outcome.mode === 'mix_small') {
        const smallAnimals = ['Deer', 'Dog', 'Zebra', 'Fox'];
        smallAnimals.forEach((name) => {
          const placed = bets[name] || 0;
          if (placed > 0) {
            totalWinnings += placed * 5;
          }
        });
      } else {
        const betOnWinner = bets[winnerAnimal.alt] || 0;
        if (betOnWinner > 0) {
          totalWinnings = betOnWinner * winnerAnimal.multiplier;
        }
      }

      setRoundWinningAmount(totalWinnings);

      // Yahan 1.5 Second (1500ms) ka perfect delay (hold) before Winner Sheet
      setTimeout(() => {
        if (totalWinnings > 0) {
          setBalance((prevBal) => {
            const newBal = prevBal + totalWinnings;
            saveBalanceToDB(newBal);
            return newBal;
          });
        }
        setWinnerCountdown(5);
        setShowWinnerSheet(true);
      }, 1500);

    } else if (gamePhase === 'betting') {
      if (Object.keys(bets).length > 0) {
        setLastBets(bets);
        setBets({});
      }
    }
  }, [gamePhase, winnerAnimal, currentRoundNo]);

  useEffect(() => {
    if (!showWinnerSheet) return;

    // Timer strictly set to 1000ms tak ki ye precise 5 sec tak hi show ho
    const timer = setInterval(() => {
      setWinnerCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowWinnerSheet(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000); 

    return () => clearInterval(timer);
  }, [showWinnerSheet]);

  const handleAnimalBet = (animalAlt: string) => {
    initAudioCtx(); 
    if (gamePhase !== 'betting') return;
    if (balance < selectedChip.value) return;

    const newBalance = balance - selectedChip.value;
    setBalance(newBalance);
    saveBalanceToDB(newBalance);

    setBets((prev) => ({
      ...prev,
      [animalAlt]: (prev[animalAlt] || 0) + selectedChip.value,
    }));
  };

  const handleRepeatBet = () => {
    initAudioCtx(); 
    if (gamePhase !== 'betting') return;
    const totalRepeatCost = Object.values(lastBets).reduce((acc, curr) => acc + curr, 0);
    if (totalRepeatCost === 0 || balance < totalRepeatCost) return;

    const newBalance = balance - totalRepeatCost;
    setBalance(newBalance);
    saveBalanceToDB(newBalance);

    setBets((prev) => {
      const updated = { ...prev };
      Object.entries(lastBets).forEach(([alt, val]) => {
        updated[alt] = (updated[alt] || 0) + val;
      });
      return updated;
    });
  };

  const formatBetAmount = (amt: number) => {
    if (amt >= 1000000) return `${(amt / 1000000).toFixed(1).replace('.0', '')}M`;
    if (amt >= 1000) return `${(amt / 1000).toFixed(0)}K`;
    return amt.toString();
  };

  const isBigGroupActive = gamePhase === 'result' && winMode === 'mix_big';
  const isSmallGroupActive = gamePhase === 'result' && winMode === 'mix_small';

  const getFakeUsers = (roundNo: number) => {
    const seed1 = (roundNo * 11) % 50 + 1;
    const seed2 = (roundNo * 17) % 50 + 1;
    const seed3 = (roundNo * 23) % 50 + 1;
    return [
        { name: "Rahul", avatar: `https://i.pravatar.cc/150?img=${seed1}`, win: 500000 + (seed1 * 1000) },
        { name: "Aman", avatar: `https://i.pravatar.cc/150?img=${seed2}`, win: 200000 + (seed2 * 1000) },
        { name: "Neha", avatar: `https://i.pravatar.cc/150?img=${seed3}`, win: 100000 + (seed3 * 1000) }
    ];
  };

  const fakePodiumUsers = getFakeUsers(currentRoundNo);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center select-none overflow-hidden touch-none">
      <div className="absolute inset-0 bg-black/20" onClick={handleClose} />

      <div
        className="relative bg-transparent w-full max-w-md rounded-none shadow-2xl overflow-hidden"
        style={{ height: '65vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src="/1787337855180~2.jpg"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {!loading && (
          <img
            src="/IMG_20260822_011000.png"
            alt="Bottom decoration"
            className="absolute bottom-0 left-0 w-full h-auto object-contain rounded-md z-10 pointer-events-none"
          />
        )}

        {!loading && (
          <img
            src="/file_00000000993c8208ae462545f9ccb0ba.png"
            alt="Bottom Left Decor"
            className="absolute bottom-15 left-2 w-[40px] h-[55px] object-contain z-40 pointer-events-none"
          />
        )}

        {/* Top Left Multiplier Group */}
        {!loading && (
          <div
            className={`absolute top-[88px] left-1 w-[65px] h-[65px] z-30 pointer-events-none flex items-center justify-center transition-all duration-300 ${
              isBigGroupActive ? 'drop-shadow-[0_0_20px_rgba(255,215,0,1)] scale-110' : ''
            }`}
          >
            <img
              src="/file_00000000330c8211b80be136b631b3e0.png"
              alt="High Multipliers Bg"
              className="absolute inset-0 w-full h-full object-contain drop-shadow-md"
            />
            <div className="absolute -top-1 left-1.5 w-8 h-8 -rotate-[10deg] z-10">
              <GreenScreenImage src="/IMG_20260822_011151.png" className="w-full h-full object-cover drop-shadow-sm" />
            </div>
            <div className="absolute -top-1 right-1.5 w-8 h-8 rotate-[10deg] z-10">
              <GreenScreenImage src="/IMG_20260822_011205.png" className="w-full h-full object-cover drop-shadow-sm" />
            </div>
            <div className="absolute bottom-2 left-1 w-[34px] h-[34px] -rotate-[15deg] z-30">
              <GreenScreenImage src="/IMG_20260822_011218.png" className="w-full h-full object-cover drop-shadow-sm" />
            </div>
            <div className="absolute bottom-2 right-0.5 w-[34px] h-[34px] rotate-[10deg] z-30">
              <GreenScreenImage src="/IMG_20260822_011028.png" className="w-full h-full object-cover drop-shadow-sm" />
            </div>
          </div>
        )}

        {/* Top Right Multiplier Group */}
        {!loading && (
          <div
            className={`absolute top-[88px] right-1 w-[65px] h-[65px] z-30 pointer-events-none flex items-center justify-center transition-all duration-300 ${
              isSmallGroupActive ? 'drop-shadow-[0_0_20px_rgba(255,215,0,1)] scale-110' : ''
            }`}
          >
            <img
              src="/file_00000000330c8211b80be136b631b3e0.png"
              alt="Low Multipliers Bg"
              className="absolute inset-0 w-full h-full object-contain drop-shadow-md"
            />
            <div className="absolute -top-1 left-1.5 w-8 h-8 -rotate-[7deg] z-10">
              <GreenScreenImage src="/IMG_20260822_011118.png" className="w-full h-full object-cover drop-shadow-sm" />
            </div>
            <div className="absolute -top-1 right-1 w-10 h-10 rotate-[8deg] z-10">
              <GreenScreenImage src="/IMG_20260822_011134.png" className="w-full h-full object-cover drop-shadow-sm" />
            </div>
            <div className="absolute bottom-2 left-1 w-[34px] h-[34px] -rotate-[10deg] z-30">
              <GreenScreenImage src="/IMG_20260822_011103.png" className="w-full h-full object-cover drop-shadow-sm" />
            </div>
            <div className="absolute bottom-2 right-0.5 w-[34px] h-[34px] rotate-12 z-30">
              <GreenScreenImage src="/IMG_20260822_011041.png" className="w-full h-full object-cover drop-shadow-sm" />
            </div>
          </div>
        )}

        {/* Top Header Bar */}
        {!loading && (
          <>
            <div className="absolute top-2 left-2 z-30 flex items-center gap-1">
              <button
                onClick={() => {
                  initAudioCtx(); 
                  setIsMuted(!isMuted);
                }}
                aria-label="Sound Toggle"
                className="w-6 h-6 rounded-md flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)] active:scale-95 transition-all duration-150"
              >
                {isMuted ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" fill="currentColor">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => setShowRulesSheet(true)}
                aria-label="Help Rules"
                className="w-6 h-6 rounded-md flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)] active:scale-95 transition-all duration-150"
              >
                <span className="text-white font-extrabold text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                  ?
                </span>
              </button>
            </div>

            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <span className="italic font-black text-lg tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] select-none">
                Wild Party
              </span>
            </div>

            <div className="absolute top-2 right-2 z-30 flex items-center gap-1">
              <button
                onClick={() => setShowHistorySheet(true)}
                aria-label="History Menu"
                className="w-6 h-6 rounded-md flex flex-col items-center justify-center gap-[2px] bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)] active:scale-95 transition-all duration-150"
              >
                <span className="w-4 h-[2.5px] bg-white rounded-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
                <span className="w-4 h-[2.5px] bg-white rounded-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
                <div className="flex items-center gap-1 w-4">
                  <span className="w-2.5 h-[2.5px] bg-white rounded-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
                  <span className="w-[3px] h-[2.5px] bg-white rounded-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
                </div>
              </button>

              <button
                onClick={handleMinimize}
                aria-label="Minimize Game"
                className="w-6 h-6 rounded-md flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)] active:scale-95 transition-all duration-150"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" fill="currentColor">
                  <path d="M6.34 8.5h11.32c.79 0 1.25.9 0.77 1.54l-5.66 7.55c-.38.51-1.16.51-1.54 0L5.57 10.04c-.48-.64-.02-1.54.77-1.54z" />
                </svg>
              </button>

              <button
                onClick={handleClose}
                aria-label="Close"
                className="w-6 h-6 rounded-md flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)] active:scale-95 transition-all duration-150"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Top Transparent Patti */}
            <div className="absolute top-11 left-2 right-2 z-30 flex items-center gap-1.5 px-2.5 py-1 bg-black/25 rounded-full border border-white/20 shadow-sm overflow-x-auto no-scrollbar pointer-events-none min-h-[28px]">
              {roundHistory.length === 0 ? (
                <span className="text-[10px] text-white/50 italic px-1 select-none">History</span>
              ) : (
                roundHistory.slice(-9).map((record, idx) => {
                  const isMixBig = record.winnerAlt.includes('Mix Big');
                  const isMixSmall = record.winnerAlt.includes('Mix Small');

                  if (isMixBig) {
                    return (
                      <div
                        key={`${record.roundNo}-${idx}`}
                        className="relative w-6 h-6 flex-shrink-0 flex items-center justify-center"
                      >
                        <img
                          src="/file_00000000330c8211b80be136b631b3e0.png"
                          alt="Left Circle Icon"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute -top-0.5 left-0 w-3 h-3">
                          <GreenScreenImage src="/IMG_20260822_011151.png" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -top-0.5 right-0 w-3 h-3">
                          <GreenScreenImage src="/IMG_20260822_011205.png" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 z-10">
                          <GreenScreenImage src="/IMG_20260822_011218.png" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 z-10">
                          <GreenScreenImage src="/IMG_20260822_011028.png" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    );
                  }

                  if (isMixSmall) {
                    return (
                      <div
                        key={`${record.roundNo}-${idx}`}
                        className="relative w-6 h-6 flex-shrink-0 flex items-center justify-center"
                      >
                        <img
                          src="/file_00000000330c8211b80be136b631b3e0.png"
                          alt="Right Circle Icon"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute -top-0.5 left-0 w-3 h-3">
                          <GreenScreenImage src="/IMG_20260822_011118.png" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -top-0.5 right-0 w-3.5 h-3.5">
                          <GreenScreenImage src="/IMG_20260822_011134.png" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 z-10">
                          <GreenScreenImage src="/IMG_20260822_011103.png" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 z-10">
                          <GreenScreenImage src="/IMG_20260822_011041.png" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    );
                  }

                  const matchedAnimal = animals.find((a) => a.alt === record.winnerAlt);
                  return (
                    <div
                      key={`${record.roundNo}-${idx}`}
                      className="w-6 h-6 flex-shrink-0 flex items-center justify-center"
                    >
                      {matchedAnimal && (
                        <GreenScreenImage src={matchedAnimal.src} className="w-full h-full object-contain" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center">
              <LoadingShaderImage
                src="/file_000000009d808211b8ffb7c2183b4ef5.png"
                className="w-24 h-24 object-contain mb-6 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
              />
              <div className="w-64 bg-white/30 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-50 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="relative w-80 h-80 flex items-center justify-center pointer-events-auto">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <GreenScreenImage
                  src="/1787344138649~2.jpg"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="absolute z-30 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                {gamePhase === 'betting' && (
                  <>
                    <span className="text-[#5c2e0b] font-black text-[10px] leading-tight tracking-wide drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] select-none">
                      Select your
                    </span>
                    <span className="text-[#5c2e0b] font-black text-[10px] leading-tight tracking-wide drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] select-none">
                      Animal
                    </span>
                    <span className="text-[#78350f] font-black text-2xl mt-0.5 tracking-wider drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                      {countdown}s
                    </span>
                  </>
                )}

                {gamePhase === 'spinning' && (
                  <>
                    <span className="text-[#5c2e0b] font-black text-xs leading-tight tracking-wide drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] select-none animate-pulse">
                      Spinning...
                    </span>
                    <span className="text-[#78350f] font-black text-2xl mt-0.5 tracking-wider drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                      {countdown}s
                    </span>
                  </>
                )}

                {gamePhase === 'result' && (
                  <>
                    <span className="text-[#5c2e0b] font-black text-xs leading-tight tracking-wide drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] select-none">
                      Winner!
                    </span>
                    <span className="text-yellow-600 font-black text-base mt-0.5 tracking-wide drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                      {winMode === 'mix_big'
                        ? 'MIX BIG (10-45x)'
                        : winMode === 'mix_small'
                        ? 'MIX SMALL (5x)'
                        : `${winnerAnimal?.alt} (${winnerAnimal?.multiplier}x)`}
                    </span>
                  </>
                )}
              </div>

              {animals.map((animal, index) => {
                const animalSize = animal.size || 64;
                const halfSize = animalSize / 2;

                const isSpinning = gamePhase === 'spinning';
                const isCurrentHighlighted = activeHighlightIndex === index;

                let isWinner = false;
                if (gamePhase === 'result') {
                  if (winMode === 'single') {
                    isWinner = winnerAnimal?.alt === animal.alt;
                  } else if (winMode === 'mix_big') {
                    isWinner = [4, 5, 6, 7].includes(index);
                  } else if (winMode === 'mix_small') {
                    isWinner = [0, 1, 2, 3].includes(index);
                  }
                }

                const isColorless = isSpinning ? !isCurrentHighlighted : false;
                const isGoldenShining = (isSpinning && isCurrentHighlighted) || isWinner;
                const currentBet = bets[animal.alt] || 0;

                return (
                  <div
                    key={animal.src}
                    onClick={() => handleAnimalBet(animal.alt)}
                    className="absolute cursor-pointer select-none"
                    style={{
                      width: `${animalSize}px`,
                      height: `${animalSize}px`,
                      left: '50%',
                      top: '50%',
                      marginLeft: `${-halfSize + (animal.x || 0)}px`,
                      marginTop: `${-halfSize + (animal.y || 0)}px`,
                      transform: `rotate(${animal.angle}deg) translate(${animal.distance}px) rotate(-${animal.angle}deg)`,
                    }}
                  >
                    <div
                      className={`w-full h-full overflow-hidden transition-[filter] duration-75 ${
                        isColorless ? 'grayscale' : 'grayscale-0'
                      } ${isGoldenShining ? 'drop-shadow-[0_0_15px_rgba(255,215,0,0.95)] scale-105' : ''}`}
                    >
                      <GreenScreenImage src={animal.src} className="w-full h-full object-cover" />
                    </div>

                    {currentBet > 0 && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-30 px-1.5 py-[0.5px] rounded-full bg-[#f6d7b0] border border-[#d49c6b] shadow-[0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none min-w-[28px]">
                        <span className="text-[#65330e] font-black text-[9px] leading-none tracking-tight">
                          {formatBetAmount(currentBet)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Left: Live Golden Balance */}
        {!loading && (
          <div className="absolute bottom-4 left-2.5 z-30 flex items-center gap-1.5 pointer-events-auto select-none">
            <LoadingShaderImage
              src="/file_00000000e56882119c217d508b6733dc.png"
              className="w-5 h-5 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
            />
            <span className="text-yellow-400 font-black text-xs sm:text-sm tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {balance.toLocaleString()}
            </span>
          </div>
        )}

        {/* Bottom Right: Repeat & Chips */}
        {!loading && (
          <div className="absolute bottom-2.5 right-2.5 z-30 flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={handleRepeatBet}
              aria-label="Repeat Bet"
              className="h-6 px-1 rounded-md flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)] active:scale-95 transition-all duration-150"
            >
              <span className="text-white font-extrabold text-[8px] tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                Repeat
              </span>
            </button>

            <div className="flex items-center gap-1">
              {chips.map((chip) => {
                const isSelected = selectedChip.label === chip.label;
                return (
                  <button
                    key={chip.label}
                    onClick={() => setSelectedChip(chip)}
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 outline-none ${
                      isSelected
                        ? '-translate-y-2 rotate-6 scale-105 ring-2 ring-yellow-400 drop-shadow-[0_4px_8px_rgba(250,204,21,0.8)]'
                        : 'hover:scale-95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
                    }`}
                  >
                    <GreenScreenImage
                      src={chip.src}
                      className="w-full h-full object-contain rounded-full"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 48vh Winner Bottom Sheet with User Specific Details */}
        {showWinnerSheet && (
          <div className="absolute inset-x-0 bottom-0 h-[48vh] bg-[#0c0c0e]/95 backdrop-blur-xl rounded-t-xl shadow-[0_-10px_30px_rgba(0,0,0,0.95)] z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            
            <div className="w-full flex items-start justify-between px-3 pt-4">
              <div className="flex items-center gap-5 mt-3"> 
                
                <div className="flex-shrink-0 flex items-center justify-center">
                  {winMode === 'single' && winnerAnimal && (
                    <div className="w-24 h-24 flex items-center justify-center scale-110 drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]">
                      <GreenScreenImage src={winnerAnimal.src} className="w-20 h-20 object-contain" />
                    </div>
                  )}
                  {winMode === 'mix_big' && (
                    <div className="grid grid-cols-2 gap-1.5 w-24 h-24 p-0.5 drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]">
                      {animals.slice(4, 8).map((a) => (
                        <div key={a.alt} className="w-10 h-10">
                          <GreenScreenImage src={a.src} className="w-20 h-20 object-contain" />
                        </div>
                      ))}
                    </div>
                  )}
                  {winMode === 'mix_small' && (
                    <div className="grid grid-cols-2 gap-1.5 w-24 h-24 p-0.5 drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]">
                      {animals.slice(0, 4).map((a) => (
                        <div key={a.alt} className="w-10 h-10">
                          <GreenScreenImage src={a.src} className="w-20 h-20 object-contain" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-[auto_auto] gap-x-2 gap-y-1.5 items-center">
                  <span className="text-[10px] text-white/70 uppercase font-bold text-left">Winning Amount</span>
                  <div className="flex items-center gap-1">
                    <LoadingShaderImage src="/file_00000000e56882119c217d508b6733dc.png" className="w-4 h-4 object-contain" />
                    <span className="text-yellow-400 font-black text-sm tracking-wide leading-none">
                      {roundWinningAmount.toLocaleString()}
                    </span>
                  </div>

                  <span className="text-[10px] text-white/70 uppercase font-bold text-left">Bet Amount</span>
                  <div className="flex items-center gap-1">
                    <LoadingShaderImage src="/file_00000000e56882119c217d508b6733dc.png" className="w-4 h-4 object-contain opacity-80" />
                    <span className="text-white font-bold text-[12px] tracking-wide leading-none">
                      {roundBetAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pr-1 pt-2">
                <span className="text-white font-black text-xs tracking-tight">
                  {winnerCountdown}s
                </span>
              </div>
            </div>

            <div className="w-full flex-1 flex flex-col items-center justify-end pb-10">
              
              <img src="/IMG_20260913_000423.png" alt="Heading" className="w-[80%] h-auto object-cover mb-8- drop-shadow-md" />
              
              <div className="flex items-end justify-center gap-2 w-full px-1">
                
                {/* Top 2 (Left) */}
                <div className="flex flex-col items-center mb-14">
                  <div className="relative w-22 h-22 flex items-center justify-center mb-1">
                    <img src={fakePodiumUsers[1].avatar} className="w-15 h-15 rounded-full object-cover" />
                    <img src="/IMG_20260912_235156.png" className="absolute inset-0 w-full h-full object-contain z-10 scale-110" />
                  </div>
                  <span className="text-white font-bold text-[10px] drop-shadow-md">{fakePodiumUsers[1].name}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <LoadingShaderImage src="/file_00000000e56882119c217d508b6733dc.png" className="w-3.5 h-3.5 object-contain" />
                    <span className="text-yellow-400 font-bold text-[10px]">{fakePodiumUsers[1].win.toLocaleString()}</span>
                  </div>
                </div>

                {/* Top 1 (Center) */}
                <div className="flex flex-col items-center mb-15">
                  <div className="relative w-22 h-22 flex items-center justify-center mb-1">
                    <img src={fakePodiumUsers[0].avatar} className="w-18 h-18 rounded-full object-cover" />
                    <img src="/IMG_20260912_235215.png" className="absolute inset-0 w-full h-full object-contain z-10 scale-110" />
                  </div>
                  <span className="text-white font-bold text-xs drop-shadow-md">{fakePodiumUsers[0].name}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <LoadingShaderImage src="/file_00000000e56882119c217d508b6733dc.png" className="w-4 h-4 object-contain" />
                    <span className="text-yellow-400 font-black text-xs">{fakePodiumUsers[0].win.toLocaleString()}</span>
                  </div>
                </div>

                {/* Top 3 (Right) */}
                <div className="flex flex-col items-center mb-14">
                  <div className="relative w-22 h-22 flex items-center justify-center mb-1">
                    <img src={fakePodiumUsers[2].avatar} className="w-15 h-15 rounded-full object-cover" />
                    <img src="/IMG_20260912_235230.png" className="absolute inset-0 w-full h-full object-contain z-10 scale-110" />
                  </div>
                  <span className="text-white font-bold text-[10px] drop-shadow-md">{fakePodiumUsers[2].name}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <LoadingShaderImage src="/file_00000000e56882119c217d508b6733dc.png" className="w-3.5 h-3.5 object-contain" />
                    <span className="text-yellow-400 font-bold text-[10px]">{fakePodiumUsers[2].win.toLocaleString()}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* History Sheet */}
        {showHistorySheet && (
          <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-[#0c0c0e]/95 backdrop-blur-xl border-t border-white/20 rounded-md shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="relative flex items-center justify-center px-4 py-3 border-b border-white/10">
              <button
                onClick={() => setShowHistorySheet(false)}
                aria-label="Back"
                className="absolute left-4 p-1.5 rounded-full bg-white/10 active:scale-90 transition-transform"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <h2 className="text-white font-black text-base tracking-wide">History</h2>
            </div>

            <div className="grid grid-cols-9 items-center gap-1 px-3 py-2 bg-white/5 border-b border-white/10">
              <span className="text-[10px] font-black text-yellow-400 text-center uppercase tracking-tighter">
                Round
              </span>
              {animals.map((animal) => (
                <div key={animal.src} className="w-6 h-6 mx-auto flex items-center justify-center">
                  <GreenScreenImage src={animal.src} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 divide-y divide-white/5 no-scrollbar">
              {roundHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-white/40 italic">
                  No rounds recorded yet today
                </div>
              ) : (
                [...roundHistory].reverse().map((record) => (
                  <div key={record.roundNo} className="grid grid-cols-9 items-center gap-1 py-1.5">
                    <span className="text-[10px] font-bold text-white/70 text-center">
                      #{record.roundNo}
                    </span>
                    {animals.map((animal) => {
                      const isWinner =
                        record.winnerAlt === animal.alt ||
                        (record.winnerAlt.includes('Mix Big') && [4, 5, 6, 7].includes(animal.id)) ||
                        (record.winnerAlt.includes('Mix Small') && [0, 1, 2, 3].includes(animal.id));
                      return (
                        <div key={animal.alt} className="flex items-center justify-center">
                          {isWinner ? (
                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shadow-[0_0_6px_rgba(16,185,129,0.5)]">
                              ✓
                            </span>
                          ) : (
                            <span className="text-rose-500/40 font-bold text-[11px]">✕</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Rules Sheet */}
        {showRulesSheet && (
          <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-[#0c0c0e]/95 backdrop-blur-xl border-t border-white/20 rounded-md shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="relative flex items-center justify-center px-4 py-3 border-b border-white/10">
              <button
                onClick={() => setShowRulesSheet(false)}
                aria-label="Back"
                className="absolute left-4 p-1.5 rounded-full bg-white/10 active:scale-90 transition-transform"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <h2 className="text-white font-black text-base tracking-wide">Rules</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 text-white/90 no-scrollbar">
              <div className="flex items-start gap-2.5">
                <span className="text-yellow-400 text-lg leading-none mt-0.5">•</span>
                <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                  Select your Chip and Choose the animals.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-yellow-400 text-lg leading-none mt-0.5">•</span>
                <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                  If Lion wins you will receive 45 times × your Bet.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-yellow-400 text-lg leading-none mt-0.5">•</span>
                <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                  For placing bet click on the Animals.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-yellow-400 text-lg leading-none mt-0.5">•</span>
                <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                  All 5 time gives 5 × your bet.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-yellow-400 text-lg leading-none mt-0.5">•</span>
                <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                  45, 25, 15, 10 TIME gives you × your bet.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-yellow-400 text-lg leading-none mt-0.5">•</span>
                <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                  Mix Big gives rewards on Eagle, Bear, Tiger, Lion. Mix Small rewards Deer, Dog, Zebra, Fox.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

