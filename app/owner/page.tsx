'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, MoreVertical, Gamepad2, Timer, Search, Shield, CheckCircle, Star, Sparkles, Gift, Palette, MessageSquare, Bot, User, Clock, AlertTriangle, ShieldAlert, RefreshCw, Send, ImageIcon, Megaphone, CheckCircle2, Trash2, Ticket, ArrowLeft } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { socket } from '@/src/lib/socket';

import { apiUrl } from "@/src/lib/api";

// ==============================================================
// INDEXEDDB HELPERS FOR USER FEEDBACKS & AI SUPPORT CHATS
// ==============================================================
const loadAllFeedbacksFromIndexedDB = async (): Promise<any[]> => {
  if (typeof window === 'undefined') return [];
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open("HurryFeedbackDB", 1);
      request.onerror = () => resolve([]);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("userFeedbacks")) {
          db.createObjectStore("userFeedbacks", { keyPath: "id" });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("userFeedbacks")) {
          db.close();
          resolve([]);
          return;
        }
        const transaction = db.transaction(["userFeedbacks"], "readonly");
        const store = transaction.objectStore("userFeedbacks");
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => {
          db.close();
          resolve(getAllReq.result || []);
        };
        getAllReq.onerror = () => {
          db.close();
          resolve([]);
        };
      };
    } catch (err) {
      resolve([]);
    }
  });
};

const saveFeedbackToIndexedDB = async (feedbackData: any) => {
  if (typeof window === 'undefined' || !feedbackData?.id) return;
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("HurryFeedbackDB", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e: any) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains("userFeedbacks")) {
          database.createObjectStore("userFeedbacks", { keyPath: "id" });
        }
      };
    });
    const transaction = db.transaction(["userFeedbacks"], "readwrite");
    const store = transaction.objectStore("userFeedbacks");
    store.put(feedbackData);
    db.close();
  } catch (err) {
    console.error("Error saving user feedback to IndexedDB in Owner panel:", err);
  }
};

const loadAllSupportChatsFromIndexedDB = async (): Promise<any[]> => {
  if (typeof window === 'undefined') return [];
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open("HurrySupportDB", 1);
      request.onerror = () => resolve([]);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("supportChats")) {
          db.createObjectStore("supportChats", { keyPath: "userId" });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("supportChats")) {
          db.close();
          resolve([]);
          return;
        }
        const transaction = db.transaction(["supportChats"], "readonly");
        const store = transaction.objectStore("supportChats");
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => {
          db.close();
          resolve(getAllReq.result || []);
        };
        getAllReq.onerror = () => {
          db.close();
          resolve([]);
        };
      };
    } catch (err) {
      resolve([]);
    }
  });
};

const saveSupportChatToIndexedDB = async (chatData: any) => {
  if (typeof window === 'undefined' || !chatData?.userId) return;
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("HurrySupportDB", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e: any) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains("supportChats")) {
          database.createObjectStore("supportChats", { keyPath: "userId" });
        }
      };
    });
    const transaction = db.transaction(["supportChats"], "readwrite");
    const store = transaction.objectStore("supportChats");
    store.put(chatData);
    db.close();
  } catch (err) {
    console.error("Error saving support chat to IndexedDB in Owner panel:", err);
  }
};

// ==============================================================
// TYPES & DATA STRUCTURES
// ==============================================================
interface UserRecord {
  id: string;
  name: string;
  username: string;
  hurryId: string;
  email: string;
  role: string;
  image?: string;
}

const fallbackUsers: UserRecord[] = [];

const AVAILABLE_TAGS = [
  { id: 'adminTag', name: 'Admin', emoji: '🛡️' },
  { id: 'officialTag', name: 'Official', emoji: '✅' },
  { id: 'vipTag', name: 'VIP', emoji: '⭐' },
  { id: 'premiumTag', name: 'Premium', emoji: '💎' },
];

const ALL_STORE_THEMES = [
  { id: "t1", name: "Seafood Deluxe", image: "/IMG-20260904-WA0004.jpg", category: "Theme", stars: 4, price: "2,700,000", duration: "30D" },
  { id: "t2", name: "Night Sky Aurora", image: "/IMG-20260904-WA0005.jpg", category: "Theme", stars: 5, price: "2,400,000", duration: "30D" },
  { id: "t3", name: "Seafood Coral", image: "/IMG-20260904-WA0006.jpg", category: "Theme", stars: 4, price: "2,700,000", duration: "30D" },
  { id: "t4", name: "Night Sky Galaxy", image: "/IMG-20260904-WA0007.jpg", category: "Theme", stars: 5, price: "2,400,000", duration: "30D" },
  { id: "t5", name: "Seafood Lagoon", image: "/IMG-20260904-WA0040.jpg", category: "Theme", stars: 4, price: "2,700,000", duration: "30D" },
  { id: "t6", name: "Night Sky Midnight", image: "/IMG-20260904-WA0041.jpg", category: "Theme", stars: 5, price: "2,400,000", duration: "30D" },
];

const ALL_GIFTS = [
  { id: 1, name: "Rose", coins: 10, image: "/IMG_20260815_103351.jpg", type: "Hot" },
  { id: 2, name: "Heart", coins: 99, image: "/IMG_20260815_103351.jpg", type: "Hot" },
  { id: 3, name: "Car", coins: 500, image: "/IMG_20260815_103351.jpg", type: "Hot" },
  { id: 4, name: "Crown", coins: 1000, image: "/IMG_20260815_103351.jpg", type: "Hot" },
  { id: 5, name: "Rocket", coins: 2000, image: "/IMG_20260815_103351.jpg", type: "Hot" },
  { id: 6, name: "Castle", coins: 5000, image: "/IMG_20260815_103351.jpg", type: "Hot" },
  { id: 7, name: "Diamond", coins: 10000, image: "/IMG_20260815_103351.jpg", type: "Hot" },
  { id: 8, name: "Yacht", coins: 20000, image: "/IMG_20260815_103351.jpg", type: "Hot" },
  { id: 9, name: "Plane", coins: 50000, image: "/IMG_20260815_103351.jpg", type: "Hot" },
  { id: 10, name: "Island", coins: 100000, image: "/IMG_20260815_103351.jpg", type: "Hot" },
  { id: 11, name: "Star", coins: 500000, image: "/IMG_20260815_103351.jpg", type: "Hot" },
  { id: 12, name: "Galaxy", coins: 1000000, image: "/IMG_20260815_103351.jpg", type: "Hot" },
  { id: 101, name: "Kiss", coins: 1999, image: "/IMG_20260906_000443.png", type: "Lucky" },
  { id: 102, name: "Nut", coins: 3999, image: "/IMG_20260906_000508.png", type: "Lucky" },
  { id: 103, name: "Mahjong", coins: 5999, image: "/IMG_20260906_000521.png", type: "Lucky" },
  { id: 104, name: "Clover", coins: 4250, image: "/IMG_20260906_000541.png", type: "Lucky" },
  { id: 105, name: "Charm", coins: 7000, image: "/IMG_20260906_000624.png", type: "Lucky" },
  { id: 106, name: "Bouquet", coins: 10999, image: "/IMG_20260906_000643.png", type: "Lucky" },
  { id: 107, name: "Leaves", coins: 6799, image: "/IMG_20260906_000713.png", type: "Lucky" },
  { id: 108, name: "Crystal", coins: 2999, image: "/IMG_20260906_000756.png", type: "Lucky" },
  { id: 109, name: "Candy", coins: 15499, image: "/IMG_20260906_000814.png", type: "Lucky" },
  { id: 110, name: "Pop", coins: 4000, image: "/IMG_20260906_000832.png", type: "Lucky" },
  { id: 111, name: "Scarecrow", coins: 7500, image: "/IMG_20260906_000850.png", type: "Lucky" },
];

const FRUIT_DETAILS: Record<number, { name: string; emoji: string; img: string; mult: string }> = {
  0: { name: 'Apple', emoji: '🍎', img: '/IMG_20260908_192143.png', mult: '5x' },
  1: { name: 'Orange', emoji: '🍊', img: '/IMG_20260908_192120.png', mult: '10x' },
  2: { name: 'Grapes', emoji: '🍇', img: '/IMG_20260908_191941.png', mult: '5x' },
  3: { name: 'Watermelon', emoji: '🍉', img: '/IMG_20260908_192013.png', mult: '10x' },
  5: { name: 'Strawberry', emoji: '🍓', img: '/IMG_20260908_192050.png', mult: '15x' },
  6: { name: 'Banana', emoji: '🍌', img: '/IMG_20260908_191930.png', mult: '5x' },
  7: { name: 'Peach', emoji: '🍑', img: '/IMG_20260908_191906.png', mult: '15x' },
  8: { name: 'Pineapple', emoji: '🍍', img: '/IMG_20260908_192203.png', mult: '5x' },
  10: { name: 'BAR 100x', emoji: '🎰', img: '/IMG_20260910_114515.png', mult: '100x' },
  11: { name: 'BAR 50x', emoji: '💎', img: '/IMG_20260910_114613.png', mult: '50x' },
};

const WILD_DETAILS: Record<number, { name: string; emoji: string; img: string; mult: string }> = {
  0: { name: 'Lion', emoji: '🦁', img: '/IMG_20260908_192143.png', mult: '5x' },
  1: { name: 'Tiger', emoji: '🐯', img: '/IMG_20260908_192120.png', mult: '10x' },
  2: { name: 'Bear', emoji: '🐻', img: '/IMG_20260908_191941.png', mult: '5x' },
  3: { name: 'Wolf', emoji: '🐺', img: '/IMG_20260908_192013.png', mult: '10x' },
  5: { name: 'Elephant', emoji: '🐘', img: '/IMG_20260908_192050.png', mult: '15x' },
  6: { name: 'Eagle', emoji: '🦅', img: '/IMG_20260908_191930.png', mult: '5x' },
  7: { name: 'Rhino', emoji: '🦏', img: '/IMG_20260908_191906.png', mult: '15x' },
  8: { name: 'Leopard', emoji: '🐆', img: '/IMG_20260908_192203.png', mult: '5x' },
  10: { name: 'Golden Dragon', emoji: '🐉', img: '/IMG_20260910_114515.png', mult: '100x' },
  11: { name: 'Phoenix', emoji: '🔥', img: '/IMG_20260910_114613.png', mult: '50x' },
};

// ==============================================================
// SIDEBAR ACCORDION COMPONENT
// ==============================================================
const SidebarCategory = ({ icon, title, items, activeItem, setActiveItem, setIsSidebarOpen }: any) => {
  const hasActiveChild = items.some((item: any) => item.id === activeItem);
  const [isExpanded, setIsExpanded] = useState(hasActiveChild);

  return (
    <div className="mb-2">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 px-6 py-2 text-[14px] font-bold text-white hover:bg-white/5 cursor-pointer transition-colors"
      >
        <span className="text-[16px] drop-shadow-md">{icon}</span>
        <span>{title}</span>
        <ChevronDown className={`w-4 h-4 ml-auto opacity-70 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </div>

      {isExpanded && (
        <div className="flex flex-col mt-1">
          {items.map((item: any) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveItem(item.id);
                setIsSidebarOpen(false); 
              }}
              className={`flex items-center gap-3 px-6 py-2.5 pl-[52px] text-[13px] font-bold transition-colors w-full text-left
                ${activeItem === item.id
                  ? 'text-white bg-[#8a92ff]/20 border-l-[3px] border-[#8a92ff]'
                  : 'text-gray-300 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'}
              `}
            >
              <span className="text-[14px] drop-shadow-sm">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ==============================================================
// MAIN PAGE
// ==============================================================
export default function StaffPanel() {
  const [activeTab, setActiveTab] = useState('manage_users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Real Users State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All Roles');

  // Gift Tab Filter
  const [giftTabFilter, setGiftTabFilter] = useState<'All' | 'Hot' | 'Lucky'>('All');
  const [giftSearchQuery, setGiftSearchQuery] = useState('');
  const [themeSearchQuery, setThemeSearchQuery] = useState('');

  // Predictions
  const [livePrediction, setLivePrediction] = useState({ round: 0, winnerIdx: 0, winnerImg: '', wName: 'Apple', wEmoji: '🍎', wMult: '5x', countdown: 0, phase: 'Betting' });
  const [wildPrediction, setWildPrediction] = useState({ round: 0, winnerIdx: 0, winnerImg: '', wName: 'Lion', wEmoji: '🦁', wMult: '5x', countdown: 0, phase: 'Betting' });

  // Modals
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedTagUserData, setSelectedTagUserData] = useState<UserRecord | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSuccess, setTagSuccess] = useState('');

  // Feedbacks
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState('');

  // AI Support Live Chats
  const [supportChats, setSupportChats] = useState<any[]>([]);
  const [supportSearchQuery, setSupportSearchQuery] = useState('');
  const [selectedSupportUserId, setSelectedSupportUserId] = useState<string | null>(null);
  const supportChatEndRef = useRef<HTMLDivElement>(null);

  // Private Messages
  const [privateMessages, setPrivateMessages] = useState<any[]>([]);
  const [filteredPrivateMessages, setFilteredPrivateMessages] = useState<any[]>([]);
  const [privateMessageSearchQuery, setPrivateMessageSearchQuery] = useState('');
  const [loadingPrivateMessages, setLoadingPrivateMessages] = useState(false);
  const [selectedPrivateMessage, setSelectedPrivateMessage] = useState<any | null>(null);

  // Official Msg
  const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width; let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) { height = Math.round((height * maxWidth) / width); width = maxWidth; } 
            else { width = Math.round((width * maxHeight) / height); height = maxHeight; }
          }
          const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(e.target?.result as string); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject; img.src = e.target?.result as string;
      };
      reader.onerror = reject; reader.readAsDataURL(file);
    });
  };

  const [officialSender, setOfficialSender] = useState<'hurry_team_official' | 'hurry_system_official'>('hurry_team_official');
  const [officialText, setOfficialText] = useState('');
  const [officialImage, setOfficialImage] = useState('');
  const [officialSending, setOfficialSending] = useState(false);
  const [officialSuccess, setOfficialSuccess] = useState('');
  const [officialHistory, setOfficialHistory] = useState<any[]>([]);
  const officialFileInputRef = useRef<HTMLInputElement>(null);

  // Init Sockets & Data
  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      const localFeedbacks = await loadAllFeedbacksFromIndexedDB();
      if (isMounted && localFeedbacks.length > 0) setFeedbacks(localFeedbacks.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      const localChats = await loadAllSupportChatsFromIndexedDB();
      if (isMounted && localChats.length > 0) setSupportChats(localChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    };
    initData();

    if (typeof window !== 'undefined') {
      if (!socket.connected) socket.connect();
      socket.emit("user_feedback_history_request");
      socket.emit("ai_support_history_request");
      socket.emit("official_message_history_request");

      socket.on("user_feedback_history_response", (data: any) => {
        if (!isMounted || !Array.isArray(data?.feedbacks)) return;
        setFeedbacks(prev => {
          const map = new Map<string, any>();
          prev.forEach(item => map.set(item.id, item));
          data.feedbacks.forEach((item: any) => { if (item.id) { map.set(item.id, { ...map.get(item.id), ...item }); saveFeedbackToIndexedDB(item); } });
          return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        });
      });

      socket.on("user_feedback", (data: any) => {
        if (!isMounted || !data?.id) return;
        setFeedbacks(prev => {
          const map = new Map<string, any>();
          prev.forEach(item => map.set(item.id, item));
          map.set(data.id, data); saveFeedbackToIndexedDB(data);
          return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        });
      });

      socket.on("ai_support_history_response", (data: any) => {
        if (!isMounted || !Array.isArray(data?.chats)) return;
        setSupportChats(prev => {
          const map = new Map<string, any>();
          prev.forEach(item => map.set(item.userId, item));
          data.chats.forEach((item: any) => { if (item.userId) { map.set(item.userId, { ...map.get(item.userId), ...item }); saveSupportChatToIndexedDB(item); } });
          return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        });
      });

      socket.on("ai_support_message", (data: any) => {
        if (!isMounted || !data?.userId) return;
        setSupportChats(prev => {
          const map = new Map<string, any>();
          prev.forEach(item => map.set(item.userId, item));
          map.set(data.userId, data); saveSupportChatToIndexedDB(data);
          return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        });
      });

      socket.on("official_message_history_response", (data: any) => {
        if (!isMounted || !Array.isArray(data?.messages)) return;
        setOfficialHistory(data.messages.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0)));
      });

      socket.on("official_broadcast_message", (data: any) => {
        if (!isMounted || !data?.id) return;
        setOfficialHistory(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [data, ...prev].sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
        });
      });
    }
  }, []);

  useEffect(() => { if (selectedSupportUserId) supportChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [supportChats, selectedSupportUserId]);

  useEffect(() => {
    let isMounted = true;
    const fetchPrivateMessages = async () => {
      try {
        setLoadingPrivateMessages(true);
        const res = await fetch(apiUrl('/api/privateMessages'));
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setPrivateMessages(data.messages || []);
        }
      } catch (err) { } 
      finally { if (isMounted) setLoadingPrivateMessages(false); }
    };
    fetchPrivateMessages();
    const intervalId = setInterval(fetchPrivateMessages, 10000);
    return () => { isMounted = false; clearInterval(intervalId); };
  }, []);

  useEffect(() => {
    if (!privateMessageSearchQuery.trim()) { setFilteredPrivateMessages(privateMessages); return; }
    const query = privateMessageSearchQuery.toLowerCase();
    const filtered = privateMessages.filter((msg) => (msg.text?.toLowerCase().includes(query) || msg.senderId?.toLowerCase().includes(query) || msg.receiverId?.toLowerCase().includes(query) || msg.senderName?.toLowerCase().includes(query)));
    setFilteredPrivateMessages(filtered);
  }, [privateMessages, privateMessageSearchQuery]);

  useEffect(() => {
    let isMounted = true;
    const loadRealUsers = async () => {
      try {
        setLoadingUsers(true);
        let fetchedList: UserRecord[] = [];
        try {
          const res = await fetch(apiUrl('/api/users'));
          if (res.ok) {
            const data = await res.json();
            const rawUsers = Array.isArray(data) ? data : (data?.users || []);
            fetchedList = rawUsers.map((u: any, index: number) => ({
              id: String(u._id || u.id || u.uid || index + 1), name: u.name || u.displayName || u.userName || 'User', username: u.username || u.userName || `@${(u.name || 'user').toLowerCase().replace(/\s+/g, '')}`, hurryId: String(u.accountId || u.displayUserNumber || u.appLongId || u.hurryId || u.id || '—'), email: u.email || u.gmail || u.emailPhone || '—', role: u.role || 'NORMAL', image: u.image || u.photo || u.avatar || u.photoURL || ''
            }));
          }
        } catch (err) { }
        if (isMounted) setUsers(fetchedList);
      } catch (error) { if (isMounted) setUsers(fallbackUsers); } 
      finally { if (isMounted) setLoadingUsers(false); }
    };
    loadRealUsers();
  }, []);

  useEffect(() => {
    const clock = setInterval(() => {
      const CYCLE_MS = 40000; const now = Date.now();
      const roundNumber = (Math.floor(now / CYCLE_MS) % 10000) + 1000;
      const elapsed = now % CYCLE_MS;
      const seed = Math.sin(roundNumber) * 10000; const randomVal = seed - Math.floor(seed);
      let winnerIdx = 0;
      if (randomVal < 0.04) winnerIdx = 10; else if (randomVal < 0.06) winnerIdx = 11;
      else if (randomVal < 0.80) winnerIdx = [0, 2, 8, 6][Math.floor(randomVal * 100) % 4];
      else winnerIdx = [1, 5, 7, 3][Math.floor(randomVal * 100) % 4];
      const details = FRUIT_DETAILS[winnerIdx] || FRUIT_DETAILS[0];
      let currentPhase = 'Betting', currentCountdown = 0;
      if (elapsed < 30000) { currentPhase = 'Betting Phase'; currentCountdown = 30 - Math.floor(elapsed / 1000); }
      else if (elapsed < 35000) { currentPhase = 'Spinning Phase'; currentCountdown = 5 - Math.floor((elapsed - 30000) / 1000); }
      else { currentPhase = 'Result Phase'; currentCountdown = 5 - Math.floor((elapsed - 35000) / 1000); }
      setLivePrediction({ round: roundNumber, winnerIdx, winnerImg: details.img, wName: details.name, wEmoji: details.emoji, wMult: details.mult, countdown: currentCountdown, phase: currentPhase });
    }, 100);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    const clock = setInterval(() => {
      const CYCLE_MS = 45000; const now = Date.now();
      const roundNumber = (Math.floor(now / CYCLE_MS) % 10000) + 5000;
      const elapsed = now % CYCLE_MS;
      const seed = Math.cos(roundNumber) * 10000; const randomVal = seed - Math.floor(seed);
      let winnerIdx = 0;
      if (randomVal < 0.05) winnerIdx = 10; else if (randomVal < 0.08) winnerIdx = 11;
      else if (randomVal < 0.75) winnerIdx = [1, 3, 6, 8][Math.floor(randomVal * 100) % 4];
      else winnerIdx = [0, 2, 5, 7][Math.floor(randomVal * 100) % 4];
      const details = WILD_DETAILS[winnerIdx] || WILD_DETAILS[0];
      let currentPhase = 'Betting', currentCountdown = 0;
      if (elapsed < 35000) { currentPhase = 'Betting Phase'; currentCountdown = 35 - Math.floor(elapsed / 1000); }
      else if (elapsed < 40000) { currentPhase = 'Spinning Phase'; currentCountdown = 5 - Math.floor((elapsed - 35000) / 1000); }
      else { currentPhase = 'Result Phase'; currentCountdown = 5 - Math.floor((elapsed - 40000) / 1000); }
      setWildPrediction({ round: roundNumber, winnerIdx, winnerImg: details.img, wName: details.name, wEmoji: details.emoji, wMult: details.mult, countdown: currentCountdown, phase: currentPhase });
    }, 100);
    return () => clearInterval(clock);
  }, []);

  const openTagModal = (user: UserRecord) => { setSelectedTagUserData(user); setIsTagModalOpen(true); setTagSuccess(''); setSelectedTags([]); };
  const handleAssignTags = () => { setTagSuccess('Tags updated successfully!'); setTimeout(() => setIsTagModalOpen(false), 1500); };
  const toggleTag = (tagId: string) => { setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]); };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.hurryId.toLowerCase().includes(q);
    const matchesRole = selectedRoleFilter === 'All Roles' || u.role.toUpperCase() === selectedRoleFilter.toUpperCase();
    return matchesSearch && matchesRole;
  });

  const filteredGifts = ALL_GIFTS.filter(g => {
    if (giftTabFilter === 'All') return true;
    return g.type === giftTabFilter;
  }).filter(g => g.name.toLowerCase().includes(giftSearchQuery.toLowerCase()));

  const filteredThemes = ALL_STORE_THEMES.filter(t => t.name.toLowerCase().includes(themeSearchQuery.toLowerCase()));

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ============================================================== */}
      {/* SIDEBAR */}
      {/* ============================================================== */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#1a1c29] flex flex-col flex-shrink-0 h-full overflow-y-auto border-r border-[#2a2d3e] transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-white text-[19px] font-extrabold tracking-wide drop-shadow-md">Hurry</h1>
            <p className="text-[10px] text-gray-300 font-bold tracking-widest mt-0.5">STAFF CONTROL PANEL</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 mt-2 space-y-1 pb-6">
          <div className="flex items-center gap-3 px-6 py-3 text-[14px] font-bold text-white hover:bg-white/5 cursor-pointer transition-colors" onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}>
            <span className="text-[16px] drop-shadow-md">🏠</span>
            <span>Dashboard</span>
          </div>
          <SidebarCategory icon="👥" title="User Center" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} items={[{ id: 'manage_users', label: 'Manage Users', icon: '👤' }, { id: 'host_apps', label: 'Host Applications', icon: '📝' }]} />
          <SidebarCategory icon="🎙️" title="Live Rooms" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} items={[{ id: 'manage_rooms', label: 'Manage Rooms', icon: '📻' }]} />
          <SidebarCategory icon="🛒" title="Store" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} items={[{ id: 'themes', label: 'Themes', icon: '🎨' }, { id: 'special_ids', label: 'Special IDs', icon: '💎' }, { id: 'gift_catalog', label: 'Gift Catalog', icon: '🎁' }]} />
          <SidebarCategory icon="💰" title="Economy" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} items={[{ id: 'wallet', label: 'Master Wallet', icon: '💳' }, { id: 'history', label: 'Send History', icon: '📜' }, { id: 'revenue', label: 'Bean Revenue', icon: '📈' }]} />
          <SidebarCategory icon="📁" title="Content" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} items={[{ id: 'events', label: 'Events', icon: '🎪' }, { id: 'banners', label: 'Banners', icon: '🖼️' }]} />
          
          <SidebarCategory icon="🛡️" title="Moderation" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} items={[
            { id: 'feedback', label: 'User Feedback', icon: '💬' },
            { id: 'ai_chats', label: 'Ai Chats', icon: '🤖' },
            { id: 'reports', label: 'Reports', icon: '🚩' },
            { id: 'bans', label: 'Bans', icon: '🚫' },
            { id: 'private_chat', label: 'Private Chat', icon: '🎫' },
            { id: 'official_msg', label: 'Official Msg', icon: '📢' }
          ]} />
          
          <SidebarCategory icon="⚙️" title="Platform" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} items={[{ id: 'analytics', label: 'Analytics', icon: '📊' }, { id: 'agency', label: 'Agency Mgmt', icon: '🏢' }]} />
          <SidebarCategory icon="🎮" title="Game Management" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} items={[{ id: 'game_fruit_party', label: 'Fruit Party', icon: '🍓' }, { id: 'game_wild_party', label: 'Wild Party', icon: '🦁' }]} />
          <div className="flex items-center gap-3 px-6 py-3 text-[14px] font-bold text-white hover:bg-white/5 cursor-pointer transition-colors mt-2" onClick={() => { setActiveTab('system'); setIsSidebarOpen(false); }}>
            <span className="text-[16px] drop-shadow-md">🛠️</span>
            <span>System</span>
          </div>
        </nav>
      </aside>

      {/* ============================================================== */}
      {/* MAIN CONTENT */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
        
        {/* HEADER - No Border, No Shadow */}
        <header className="bg-white p-4 flex items-center gap-4 sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-slate-800 text-lg tracking-wide">Hurry Panel</span>
        </header>

        {/* MANAGE USERS */}
        {activeTab === 'manage_users' && (
          <div className="flex flex-col h-full bg-white">
            <div className="px-8 py-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div><h2 className="text-xl font-bold text-slate-800">Users</h2></div>
              <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-full">Total: {users.length}</span>
            </div>
            <div className="p-8 flex-1 overflow-y-auto">
              <div className="relative w-full max-w-3xl mb-4">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="text-slate-900 bg-white placeholder-slate-400 w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none" />
              </div>
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead><tr className="border-b text-[10px] text-slate-400 uppercase tracking-wider"><th className="py-4">User</th><th className="py-4">ID</th><th className="py-4">Email</th><th className="py-4">Role</th><th className="py-4">Action</th></tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="border-b border-slate-50">
                      <td className="py-3 flex gap-3 items-center"><div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">{u.name.charAt(0)}</div> <span className="text-sm font-bold text-slate-800">{u.name}</span></td>
                      <td className="py-3 text-sm font-bold text-[#8a92ff]">{u.hurryId}</td>
                      <td className="py-3 text-xs text-slate-600">{u.email}</td>
                      <td className="py-3 text-xs font-bold text-slate-500">{u.role}</td>
                      <td className="py-3"><button onClick={() => openTagModal(u)} className="p-1.5"><MoreVertical className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STORE THEMES - Simple Text Rows */}
        {activeTab === 'themes' && (
          <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Themes</h2>
            
            <input 
              type="text" 
              value={themeSearchQuery}
              onChange={(e) => setThemeSearchQuery(e.target.value)}
              placeholder="Search Themes..." 
              className="text-slate-900 bg-white placeholder-slate-400 w-full p-3 border border-slate-200 rounded-xl mb-6 shadow-sm focus:outline-none" 
            />

            <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4 border-b border-slate-200 pb-2">
              <div className="w-10">S.No</div>
              <div className="flex-[2]">Name</div>
              <div className="flex-1">Prize</div>
              <div className="flex-1">Star</div>
              <div className="flex-1">Theme</div>
              <div className="flex-1">Days</div>
            </div>
            
            <div className="flex flex-col">
              {filteredThemes.map((theme, idx) => (
                <div key={theme.id} className="flex items-center border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors">
                  <div className="w-10 text-slate-400">{idx + 1}</div>
                  <div className="flex-[2] flex items-center gap-3">
                    <img src={theme.image} alt={theme.name} className="w-10 h-10 object-cover rounded-lg border border-slate-100" onError={(e) => { (e.target as HTMLImageElement).src = '/default-theme.png'; }} />
                    <span>{theme.name}</span>
                  </div>
                  <div className="flex-1 text-amber-500">{theme.price}</div>
                  <div className="flex-1 text-slate-600">{theme.stars}</div>
                  <div className="flex-1 text-slate-600">{theme.category}</div>
                  <div className="flex-1 text-slate-600">{theme.duration}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GIFT CATALOG */}
        {activeTab === 'gift_catalog' && (
          <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Gift Catalog</h2>
            
            <input 
              type="text" 
              value={giftSearchQuery}
              onChange={(e) => setGiftSearchQuery(e.target.value)}
              placeholder="Search Gifts..." 
              className="text-slate-900 bg-white placeholder-slate-400 w-full p-3 border border-slate-200 rounded-xl mb-6 shadow-sm focus:outline-none" 
            />

            <div className="flex gap-2 mb-6">
              {(['All', 'Hot', 'Lucky'] as const).map((tab) => (
                <button key={tab} onClick={() => setGiftTabFilter(tab)} className={`px-4 py-2 rounded-lg text-xs font-bold ${giftTabFilter === tab ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredGifts.map((gift) => (
                <div key={gift.id} className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col items-center shadow-sm">
                  <span className={`absolute top-2 left-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${ gift.type === 'Hot' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600' }`}>{gift.type}</span>
                  <img src={gift.image} alt={gift.name} className="w-16 h-16 my-2 object-contain" />
                  <span className="font-bold text-slate-800 text-xs text-center">{gift.name}</span>
                  <div className="text-xs font-extrabold text-amber-500">🪙 {gift.coins.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USER FEEDBACK - Simple Text Rows */}
        {activeTab === 'feedback' && (
          <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            <div className="px-8 py-6 pb-4 bg-white border-b border-slate-200 shrink-0 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-800 mb-4">User Feedback</h2>
              <input type="text" value={feedbackSearchQuery} onChange={(e) => setFeedbackSearchQuery(e.target.value)} placeholder="Search feedback..." className="text-slate-900 bg-white placeholder-slate-400 w-full p-3 border border-slate-200 rounded-xl focus:outline-none shadow-sm" />
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
              <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4 border-b border-slate-200 pb-2">
                <div className="w-10">S.No</div>
                <div className="flex-1">Avtar & Name</div>
                <div className="flex-1">ID</div>
                <div className="flex-1">Type</div>
                <div className="flex-[2]">Description</div>
                <div className="flex-1 text-right">Date Time</div>
              </div>

              <div className="flex flex-col">
                {feedbacks.filter(fb => fb.userName?.toLowerCase().includes(feedbackSearchQuery.toLowerCase()) || fb.userId?.toLowerCase().includes(feedbackSearchQuery.toLowerCase())).map((fb, idx) => (
                  <div key={fb.id} onClick={() => setSelectedFeedback(fb)} className="flex items-center border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-800 cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="w-10 text-slate-400">{idx + 1}</div>
                    <div className="flex-1 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center overflow-hidden">
                        {fb.userPhoto ? <img src={fb.userPhoto} className="w-full h-full object-cover" /> : fb.userName?.charAt(0)}
                      </div>
                      <span>{fb.userName || 'User'}</span>
                    </div>
                    <div className="flex-1 text-slate-600">{fb.userAccountId || fb.userId}</div>
                    <div className="flex-1 text-slate-600">{fb.typeLabel || fb.type}</div>
                    <div className="flex-[2] text-slate-500 font-normal truncate">{fb.description}</div>
                    <div className="flex-1 text-right text-slate-400 font-normal text-xs">{fb.timestamp ? new Date(fb.timestamp).toLocaleString() : ''}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* FEEDBACK MODAL */}
            {selectedFeedback && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
                  <button onClick={() => setSelectedFeedback(null)} className="absolute top-4 right-4 text-slate-400 p-1"><X className="w-5 h-5" /></button>
                  <div className="flex items-center gap-3 mb-5 border-b pb-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center text-lg overflow-hidden shrink-0">
                      {selectedFeedback.userPhoto ? <img src={selectedFeedback.userPhoto} className="w-full h-full object-cover" /> : selectedFeedback.userName?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{selectedFeedback.userName || 'User'}</h3>
                      <span className="text-xs font-semibold text-slate-500">ID: {selectedFeedback.userAccountId || selectedFeedback.userId}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Issue Category</span>
                      <span className="text-xs font-bold">{selectedFeedback.typeLabel || selectedFeedback.type}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Feedback Description</span>
                      <div className="bg-slate-50 p-4 rounded-xl text-xs font-medium text-slate-800 max-h-60 overflow-y-auto">{selectedFeedback.description}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI CHATS - Simple Text Rows */}
        {activeTab === 'ai_chats' && (
          <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {!selectedSupportUserId ? (
              <>
                <div className="px-8 py-6 pb-4 bg-white border-b border-slate-200 shrink-0 shadow-sm">
                  <h2 className="text-xl font-extrabold text-slate-800 mb-4">Ai Chats</h2>
                  <input type="text" value={supportSearchQuery} onChange={(e) => setSupportSearchQuery(e.target.value)} placeholder="Search AI chats..." className="text-slate-900 bg-white placeholder-slate-400 w-full p-3 border border-slate-200 rounded-xl focus:outline-none shadow-sm" />
                </div>
                <div className="p-8 flex-1 overflow-y-auto">
                  <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4 border-b border-slate-200 pb-2">
                    <div className="w-10">S.No</div>
                    <div className="flex-[1.5]">Avtar & Name</div>
                    <div className="flex-1">ID</div>
                    <div className="flex-[2]">Last Message</div>
                    <div className="flex-1 text-right">Date Time</div>
                  </div>
                  <div className="flex flex-col">
                    {supportChats.filter(chat => (chat.userName || '').toLowerCase().includes(supportSearchQuery.toLowerCase()) || (chat.userId || '').toLowerCase().includes(supportSearchQuery.toLowerCase())).map((chat, idx) => (
                      <div key={chat.userId} onClick={() => setSelectedSupportUserId(chat.userId)} className="flex items-center border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-800 cursor-pointer hover:bg-slate-50 transition-colors">
                        <div className="w-10 text-slate-400">{idx + 1}</div>
                        <div className="flex-[1.5] flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center overflow-hidden">
                            {chat.userPhoto ? <img src={chat.userPhoto} className="w-full h-full object-cover" /> : chat.userName?.charAt(0) || 'U'}
                          </div>
                          <span>{chat.userName || 'User'}</span>
                        </div>
                        <div className="flex-1 text-slate-600">{chat.userAccountId || chat.userId}</div>
                        <div className="flex-[2] text-slate-500 font-normal truncate">{(typeof chat.lastMessage === 'object' ? chat.lastMessage?.text : chat.lastMessage) || 'Active session...'}</div>
                        <div className="flex-1 text-right text-slate-400 font-normal text-xs">{chat.timestamp ? new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* SEPARATE PAGE UI FOR ACTIVE CHAT */
              <div className="flex flex-col h-full bg-white">
                <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-slate-50">
                  <button onClick={() => setSelectedSupportUserId(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
                  <h3 className="font-bold text-lg text-slate-800">Ai Chat Conversation</h3>
                </div>
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#f8fafc]">
                  {(() => {
                    const activeChat = supportChats.find(c => c.userId === selectedSupportUserId);
                    if (!activeChat) return null;
                    const msgs = Array.isArray(activeChat.messages) ? activeChat.messages : [];
                    return msgs.map((msg: any, idx: number) => (
                      <div key={idx} className={`flex flex-col ${msg.isBot ? 'items-start' : 'items-end'}`}>
                        <div className="text-[10px] font-bold text-slate-400 mb-1">{msg.isBot ? '🤖 Daisy AI' : `👤 ${activeChat.userName}`}</div>
                        <div className={`p-3 rounded-2xl max-w-[70%] shadow-sm ${msg.isBot ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                          {msg.text && <p className="text-sm whitespace-pre-line">{msg.text}</p>}
                        </div>
                      </div>
                    ));
                  })()}
                  <div ref={supportChatEndRef} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* REPORTS SEPARATE TAB */}
        {activeTab === 'reports' && (
          <div className="p-8 max-w-5xl mx-auto w-full">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Reports</h2>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center text-slate-500">No reports found.</div>
          </div>
        )}

        {/* BANS SEPARATE TAB */}
        {activeTab === 'bans' && (
          <div className="p-8 max-w-5xl mx-auto w-full">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Bans</h2>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center text-slate-500">No banned accounts.</div>
          </div>
        )}

        {/* PRIVATE CHAT - Text rows, double avatars, full chat history */}
        {activeTab === 'private_chat' && (
          <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {!selectedPrivateMessage ? (
              <>
                <div className="px-8 py-6 pb-4 bg-white border-b border-slate-200 shrink-0 shadow-sm">
                  <h2 className="text-xl font-extrabold text-slate-800 mb-4">Private Chat</h2>
                  <input type="text" value={privateMessageSearchQuery} onChange={(e) => setPrivateMessageSearchQuery(e.target.value)} placeholder="Search Private Chats..." className="text-slate-900 bg-white placeholder-slate-400 w-full p-3 border border-slate-200 rounded-xl focus:outline-none shadow-sm" />
                </div>
                
                <div className="p-8 flex-1 overflow-y-auto">
                  <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4 border-b border-slate-200 pb-2">
                    <div className="w-10">S.No</div>
                    <div className="flex-[1.5]">Sender & Receiver</div>
                    <div className="flex-1">ID</div>
                    <div className="flex-[2]">Last Text</div>
                    <div className="flex-1 text-right">Date Time</div>
                  </div>
                  
                  <div className="flex flex-col">
                    {filteredPrivateMessages.map((msg, idx) => (
                      <div key={idx} onClick={() => setSelectedPrivateMessage(msg)} className="flex items-center border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-800 cursor-pointer hover:bg-slate-50 transition-colors">
                        <div className="w-10 text-slate-400">{idx + 1}</div>
                        <div className="flex-[1.5] flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden relative z-10"><img src={msg.senderPhoto || '/default-avatar.png'} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }} /></div>
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px] relative z-0">R</div>
                          </div>
                          <span className="truncate">{msg.senderName || 'User'} & {msg.receiverId}</span>
                        </div>
                        <div className="flex-1 text-slate-600">{msg.senderId}</div>
                        <div className="flex-[2] text-slate-500 font-normal truncate">{msg.text || (msg.imageUrl ? 'Image' : '')}</div>
                        <div className="flex-1 text-right text-slate-400 font-normal text-xs">{new Date(msg.timestamp || Date.now()).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* SEPARATE PAGE UI FOR FULL PRIVATE CHAT THREAD */
              <div className="flex flex-col h-full bg-white">
                <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-slate-50">
                  <button onClick={() => setSelectedPrivateMessage(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
                  <h3 className="font-bold text-lg text-slate-800">Private Chat Thread</h3>
                </div>
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#f8fafc]">
                  {privateMessages
                    .filter(m => 
                      (m.senderId === selectedPrivateMessage.senderId && m.receiverId === selectedPrivateMessage.receiverId) ||
                      (m.senderId === selectedPrivateMessage.receiverId && m.receiverId === selectedPrivateMessage.senderId)
                    )
                    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
                    .map((chatMsg, i) => {
                      const isSender = chatMsg.senderId === selectedPrivateMessage.senderId;
                      return (
                        <div key={i} className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
                          <div className="text-[10px] font-bold text-slate-400 mb-1">
                             {isSender ? (chatMsg.senderName || 'Sender') : 'Receiver'} (ID: {chatMsg.senderId})
                          </div>
                          <div className={`p-3 rounded-2xl max-w-[70%] shadow-sm ${!isSender ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                            {chatMsg.text && <p className="text-sm whitespace-pre-line">{chatMsg.text}</p>}
                            {chatMsg.imageUrl && <img src={chatMsg.imageUrl} className="max-w-xs rounded-lg mt-2" />}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* GAMES TAB PLACEHOLDERS */}
        {activeTab === 'game_fruit_party' && (
          <div className="p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto"><h2 className="text-2xl font-bold mb-6">🍓 Fruit Party Prediction</h2><p>Running round: {livePrediction.round}</p></div>
        )}
        {activeTab === 'game_wild_party' && (
          <div className="p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto"><h2 className="text-2xl font-bold mb-6">🦁 Wild Party Prediction</h2><p>Running round: {wildPrediction.round}</p></div>
        )}

      </main>
      
    </div>
  );
}

