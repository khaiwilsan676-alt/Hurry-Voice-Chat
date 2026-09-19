'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, MoreVertical, Gamepad2, Timer, Search, Shield, CheckCircle, Star, Sparkles, Gift, Palette, MessageSquare, Bot, User, Clock, AlertTriangle, ShieldAlert, RefreshCw, Send, ImageIcon, Megaphone, CheckCircle2, Trash2 } from 'lucide-react';
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

// Fallback mock users array empty - strictly display real records from DB or Auth
const fallbackUsers: UserRecord[] = [];

const AVAILABLE_TAGS = [
  { id: 'adminTag', name: 'Admin', emoji: '🛡️' },
  { id: 'officialTag', name: 'Official', emoji: '✅' },
  { id: 'vipTag', name: 'VIP', emoji: '⭐' },
  { id: 'premiumTag', name: 'Premium', emoji: '💎' },
];

// All Themes from Store Page
const ALL_STORE_THEMES = [
  { id: "t1", name: "Seafood Deluxe", image: "/IMG-20260904-WA0004.jpg", category: "Theme", stars: 4, price: "2,700,000", duration: "30D" },
  { id: "t2", name: "Night Sky Aurora", image: "/IMG-20260904-WA0005.jpg", category: "Theme", stars: 5, price: "2,400,000", duration: "30D" },
  { id: "t3", name: "Seafood Coral", image: "/IMG-20260904-WA0006.jpg", category: "Theme", stars: 4, price: "2,700,000", duration: "30D" },
  { id: "t4", name: "Night Sky Galaxy", image: "/IMG-20260904-WA0007.jpg", category: "Theme", stars: 5, price: "2,400,000", duration: "30D" },
  { id: "t5", name: "Seafood Lagoon", image: "/IMG-20260904-WA0040.jpg", category: "Theme", stars: 4, price: "2,700,000", duration: "30D" },
  { id: "t6", name: "Night Sky Midnight", image: "/IMG-20260904-WA0041.jpg", category: "Theme", stars: 5, price: "2,400,000", duration: "30D" },
];

// All Gifts from GiftPicker Component
const ALL_GIFTS = [
  // Hot Gifts
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

  // Lucky Gifts
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

// Fruit Details Map
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

// Wild Animal Details Map
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
                if (window.innerWidth < 768) setIsSidebarOpen(false);
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

  // Fruit Party Prediction
  const [livePrediction, setLivePrediction] = useState({
    round: 0,
    winnerIdx: 0,
    winnerImg: '',
    wName: 'Apple',
    wEmoji: '🍎',
    wMult: '5x',
    countdown: 0,
    phase: 'Betting'
  });

  // Wild Party Prediction
  const [wildPrediction, setWildPrediction] = useState({
    round: 0,
    winnerIdx: 0,
    winnerImg: '',
    wName: 'Lion',
    wEmoji: '🦁',
    wMult: '5x',
    countdown: 0,
    phase: 'Betting'
  });

  // Tag Modal
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedTagUserData, setSelectedTagUserData] = useState<UserRecord | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSuccess, setTagSuccess] = useState('');

  // User Feedbacks State
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState('');
  const [selectedFeedbackTypeFilter, setSelectedFeedbackTypeFilter] = useState('All');

  // AI Support Live Chats State (Reports & Bans tab)
  const [supportChats, setSupportChats] = useState<any[]>([]);
  const [selectedSupportUserId, setSelectedSupportUserId] = useState<string | null>(null);
  const [supportSearchQuery, setSupportSearchQuery] = useState('');
  const [supportSubTab, setSupportSubTab] = useState<'ai_chats' | 'reports'>('ai_chats');
  const supportChatEndRef = useRef<HTMLDivElement>(null);

  // Official Msg State
  // Helper to compress image files before broadcast
  const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const [officialSender, setOfficialSender] = useState<'hurry_team_official' | 'hurry_system_official'>('hurry_team_official');
  const [officialText, setOfficialText] = useState('');
  const [officialImage, setOfficialImage] = useState('');
  const [officialSending, setOfficialSending] = useState(false);
  const [officialSuccess, setOfficialSuccess] = useState('');
  const [officialHistory, setOfficialHistory] = useState<any[]>([]);
  const officialFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize User Feedbacks & Support Chats from IndexedDB & Socket.IO
  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      const localFeedbacks = await loadAllFeedbacksFromIndexedDB();
      if (isMounted && localFeedbacks.length > 0) {
        setFeedbacks(localFeedbacks.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      }

      const localChats = await loadAllSupportChatsFromIndexedDB();
      if (isMounted && localChats.length > 0) {
        setSupportChats(localChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      }
    };

    initData();

    if (typeof window !== 'undefined') {
      if (!socket.connected) {
        socket.connect();
      }

      socket.emit("user_feedback_history_request");
      socket.emit("ai_support_history_request");
      socket.emit("official_message_history_request");

      const handleFeedbackHistoryResponse = (data: any) => {
        if (!isMounted || !Array.isArray(data?.feedbacks)) return;
        setFeedbacks(prev => {
          const map = new Map<string, any>();
          prev.forEach(item => map.set(item.id, item));
          data.feedbacks.forEach((item: any) => {
            if (item.id) {
              map.set(item.id, { ...map.get(item.id), ...item });
              saveFeedbackToIndexedDB(item);
            }
          });
          return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        });
      };

      const handleUserFeedback = (data: any) => {
        if (!isMounted || !data?.id) return;
        setFeedbacks(prev => {
          const map = new Map<string, any>();
          prev.forEach(item => map.set(item.id, item));
          map.set(data.id, data);
          saveFeedbackToIndexedDB(data);
          return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        });
      };

      const handleHistoryResponse = (data: any) => {
        if (!isMounted || !Array.isArray(data?.chats)) return;
        setSupportChats(prev => {
          const map = new Map<string, any>();
          prev.forEach(item => map.set(item.userId, item));
          data.chats.forEach((item: any) => {
            if (item.userId) {
              map.set(item.userId, { ...map.get(item.userId), ...item });
              saveSupportChatToIndexedDB(item);
            }
          });
          return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        });
      };

      const handleAiSupportMessage = (data: any) => {
        if (!isMounted || !data?.userId) return;
        setSupportChats(prev => {
          const map = new Map<string, any>();
          prev.forEach(item => map.set(item.userId, item));
          map.set(data.userId, data);
          saveSupportChatToIndexedDB(data);
          return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        });
      };

      socket.on("user_feedback_history_response", handleFeedbackHistoryResponse);
      socket.on("user_feedback", handleUserFeedback);
      socket.on("ai_support_history_response", handleHistoryResponse);
      socket.on("ai_support_message", handleAiSupportMessage);

      const handleOfficialHistoryResponse = (data: any) => {
        if (!isMounted || !Array.isArray(data?.messages)) return;
        setOfficialHistory(data.messages.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0)));
      };

      const handleOfficialBroadcast = (data: any) => {
        if (!isMounted || !data?.id) return;
        setOfficialHistory(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [data, ...prev].sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
        });
      };

      socket.on("official_message_history_response", handleOfficialHistoryResponse);
      socket.on("official_broadcast_message", handleOfficialBroadcast);

      return () => {
        isMounted = false;
        socket.off("user_feedback_history_response", handleFeedbackHistoryResponse);
        socket.off("user_feedback", handleUserFeedback);
        socket.off("ai_support_history_response", handleHistoryResponse);
        socket.off("ai_support_message", handleAiSupportMessage);
        socket.off("official_message_history_response", handleOfficialHistoryResponse);
        socket.off("official_broadcast_message", handleOfficialBroadcast);
      };
    }
  }, []);

  // Auto-scroll selected AI support chat
  useEffect(() => {
    if (selectedSupportUserId) {
      supportChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [supportChats, selectedSupportUserId]);

  // ============================================================
  // Fetch Real Users from /api/users & Firebase Auth
  // ============================================================
  useEffect(() => {
    let isMounted = true;

    const loadRealUsers = async () => {
      try {
        setLoadingUsers(true);
        let fetchedList: UserRecord[] = [];

        // 1. Fetch users from API endpoint
        try {
          const res = await fetch(apiUrl('/api/users'));
          if (res.ok) {
            const data = await res.json();
            const rawUsers = Array.isArray(data) ? data : (data?.users || []);
            fetchedList = rawUsers.map((u: any, index: number) => ({
              id: String(u._id || u.id || u.uid || index + 1),
              name: u.name || u.displayName || u.userName || 'User',
              username: u.username || u.userName || `@${(u.name || 'user').toLowerCase().replace(/\s+/g, '')}`,
              hurryId: String(u.accountId || u.displayUserNumber || u.appLongId || u.hurryId || u.id || '—'),
              email: u.email || u.gmail || u.emailPhone || '—',
              role: u.role || 'NORMAL',
              image: u.image || u.photo || u.avatar || u.photoURL || ''
            }));
          }
        } catch (err) {
          console.warn('API users fetch fallback:', err);
        }

        // 2. Fetch current Firebase Auth user if present
        let currentUserEmail = '';
        let currentUserId = '';
        let currentUserName = '';
        let currentUserPhoto = '';

        if (auth?.currentUser) {
          currentUserEmail = auth.currentUser.email || '';
          currentUserId = auth.currentUser.uid;
          currentUserName = auth.currentUser.displayName || '';
          currentUserPhoto = auth.currentUser.photoURL || '';
        }

        // 3. Read local logged-in user from localStorage
        if (typeof window !== 'undefined') {
          const storedEmail = localStorage.getItem('userEmail');
          if (storedEmail && !currentUserEmail) currentUserEmail = storedEmail;

          const localUserData = localStorage.getItem('userData') || localStorage.getItem('user');
          if (localUserData) {
            try {
              const parsed = JSON.parse(localUserData);
              if (parsed.email && !currentUserEmail) currentUserEmail = parsed.email;
              if (parsed.gmail && !currentUserEmail) currentUserEmail = parsed.gmail;
              if (parsed.name && !currentUserName) currentUserName = parsed.name;
              if (parsed.image && !currentUserPhoto) currentUserPhoto = parsed.image;
              if (parsed.accountId || parsed.uid) currentUserId = String(parsed.accountId || parsed.uid);
            } catch (e) {
              // ignore parse errors
            }
          }
        }

        // 4. Merge Firebase / local current user if missing in list or update placeholder email
        if (currentUserEmail || currentUserId) {
          const exists = fetchedList.some(u =>
            (currentUserEmail && u.email === currentUserEmail) ||
            u.hurryId === currentUserId ||
            u.id === currentUserId
          );
          if (!exists) {
            fetchedList.unshift({
              id: currentUserId || 'auth-current-user',
              name: currentUserName || 'Verified User',
              username: currentUserName ? `@${currentUserName.toLowerCase().replace(/\s+/g, '')}` : '@active_user',
              hurryId: currentUserId || '88100293',
              email: currentUserEmail || '—',
              role: 'NORMAL',
              image: currentUserPhoto || ''
            });
          } else {
            // Update email in fetched record if email was missing or placeholder/dummy
            fetchedList = fetchedList.map(u => {
              if (
                (u.id === currentUserId || u.hurryId === currentUserId) &&
                currentUserEmail &&
                (!u.email || u.email === '—' || u.email.endsWith('@hurry.app') || u.email === 'user@gmail.com')
              ) {
                return { ...u, email: currentUserEmail };
              }
              return u;
            });
          }
        }


        if (isMounted) {
          setUsers(fetchedList);
        }
      } catch (error) {
        console.error('Error loading users:', error);
        if (isMounted) {
          setUsers(fallbackUsers);
        }
      } finally {
        if (isMounted) {
          setLoadingUsers(false);
        }
      }
    };

    loadRealUsers();

    // Listen to Firebase auth changes to update email dynamically
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser?.email) {
        setUsers(prev => prev.map(u => {
          if (u.id === authUser.uid || u.hurryId === authUser.uid) {
            return { ...u, email: authUser.email || u.email };
          }
          return u;
        }));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // ============================================================
  // Fruit Party Timer & Real-time Prediction
  // ============================================================
  useEffect(() => {
    const clock = setInterval(() => {
      const CYCLE_MS = 40000;
      const now = Date.now();
      const roundNumber = (Math.floor(now / CYCLE_MS) % 10000) + 1000;
      const elapsed = now % CYCLE_MS;
      const seed = Math.sin(roundNumber) * 10000;
      const randomVal = seed - Math.floor(seed);

      let winnerIdx = 0;
      if (randomVal < 0.04) winnerIdx = 10;
      else if (randomVal < 0.06) winnerIdx = 11;
      else if (randomVal < 0.80) winnerIdx = [0, 2, 8, 6][Math.floor(randomVal * 100) % 4];
      else winnerIdx = [1, 5, 7, 3][Math.floor(randomVal * 100) % 4];

      const details = FRUIT_DETAILS[winnerIdx] || FRUIT_DETAILS[0];

      let currentPhase = 'Betting', currentCountdown = 0;
      if (elapsed < 30000) { currentPhase = 'Betting Phase'; currentCountdown = 30 - Math.floor(elapsed / 1000); }
      else if (elapsed < 35000) { currentPhase = 'Spinning Phase'; currentCountdown = 5 - Math.floor((elapsed - 30000) / 1000); }
      else { currentPhase = 'Result Phase'; currentCountdown = 5 - Math.floor((elapsed - 35000) / 1000); }

      setLivePrediction({
        round: roundNumber,
        winnerIdx,
        winnerImg: details.img,
        wName: details.name,
        wEmoji: details.emoji,
        wMult: details.mult,
        countdown: currentCountdown,
        phase: currentPhase
      });
    }, 100);

    return () => clearInterval(clock);
  }, []);

  // ============================================================
  // Wild Party Timer & Real-time Prediction
  // ============================================================
  useEffect(() => {
    const clock = setInterval(() => {
      const CYCLE_MS = 45000;
      const now = Date.now();
      const roundNumber = (Math.floor(now / CYCLE_MS) % 10000) + 5000;
      const elapsed = now % CYCLE_MS;
      const seed = Math.cos(roundNumber) * 10000;
      const randomVal = seed - Math.floor(seed);

      let winnerIdx = 0;
      if (randomVal < 0.05) winnerIdx = 10;
      else if (randomVal < 0.08) winnerIdx = 11;
      else if (randomVal < 0.75) winnerIdx = [1, 3, 6, 8][Math.floor(randomVal * 100) % 4];
      else winnerIdx = [0, 2, 5, 7][Math.floor(randomVal * 100) % 4];

      const details = WILD_DETAILS[winnerIdx] || WILD_DETAILS[0];

      let currentPhase = 'Betting', currentCountdown = 0;
      if (elapsed < 35000) { currentPhase = 'Betting Phase'; currentCountdown = 35 - Math.floor(elapsed / 1000); }
      else if (elapsed < 40000) { currentPhase = 'Spinning Phase'; currentCountdown = 5 - Math.floor((elapsed - 35000) / 1000); }
      else { currentPhase = 'Result Phase'; currentCountdown = 5 - Math.floor((elapsed - 40000) / 1000); }

      setWildPrediction({
        round: roundNumber,
        winnerIdx,
        winnerImg: details.img,
        wName: details.name,
        wEmoji: details.emoji,
        wMult: details.mult,
        countdown: currentCountdown,
        phase: currentPhase
      });
    }, 100);

    return () => clearInterval(clock);
  }, []);

  // Tag Modal Handlers
  const openTagModal = (user: UserRecord) => {
    setSelectedTagUserData(user);
    setIsTagModalOpen(true);
    setTagSuccess('');
    setSelectedTags([]);
  };

  const handleAssignTags = () => {
    setTagSuccess('Tags updated successfully!');
    setTimeout(() => setIsTagModalOpen(false), 1500);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  // Filter Users
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.hurryId.toLowerCase().includes(q);

    const matchesRole =
      selectedRoleFilter === 'All Roles' ||
      u.role.toUpperCase() === selectedRoleFilter.toUpperCase();

    return matchesSearch && matchesRole;
  });

  // Filter Gifts
  const filteredGifts = ALL_GIFTS.filter(g => {
    if (giftTabFilter === 'All') return true;
    return g.type === giftTabFilter;
  });

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ============================================================== */}
      {/* SIDEBAR */}
      {/* ============================================================== */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] bg-[#1a1c29] flex flex-col flex-shrink-0 h-full overflow-y-auto border-r border-[#2a2d3e] transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        <div className="p-6 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-white text-[19px] font-extrabold tracking-wide drop-shadow-md">Hurry</h1>
            <p className="text-[10px] text-gray-300 font-bold tracking-widest mt-0.5">STAFF CONTROL PANEL</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 mt-2 space-y-1 pb-6">
          <div className="flex items-center gap-3 px-6 py-3 text-[14px] font-bold text-white hover:bg-white/5 cursor-pointer transition-colors" onClick={() => setActiveTab('dashboard')}>
            <span className="text-[16px] drop-shadow-md">🏠</span>
            <span>Dashboard</span>
          </div>

          <SidebarCategory
            icon="👥" title="User Center" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[{ id: 'manage_users', label: 'Manage Users', icon: '👤' }, { id: 'host_apps', label: 'Host Applications', icon: '📝' }]}
          />
          <SidebarCategory
            icon="🎙️" title="Live Rooms" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[{ id: 'manage_rooms', label: 'Manage Rooms', icon: '📻' }]}
          />
          <SidebarCategory
            icon="🛒" title="Store" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[{ id: 'themes', label: 'Themes', icon: '🎨' }, { id: 'special_ids', label: 'Special IDs', icon: '💎' }, { id: 'gift_catalog', label: 'Gift Catalog', icon: '🎁' }]}
          />
          <SidebarCategory
            icon="💰" title="Economy" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[{ id: 'wallet', label: 'Master Wallet', icon: '💳' }, { id: 'history', label: 'Send History', icon: '📜' }, { id: 'revenue', label: 'Bean Revenue', icon: '📈' }]}
          />
          <SidebarCategory
            icon="📁" title="Content" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[{ id: 'events', label: 'Events', icon: '🎪' }, { id: 'banners', label: 'Banners', icon: '🖼️' }]}
          />
          <SidebarCategory
            icon="🛡️" title="Moderation" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[
              { id: 'feedback', label: 'User Feedback', icon: '💬' },
              { id: 'bans', label: 'Reports & Bans', icon: '🚫' },
              { id: 'tickets', label: 'Support Tickets', icon: '🎫' },
              { id: 'official_msg', label: 'Official Msg', icon: '📢' }
            ]}
          />
          <SidebarCategory
            icon="⚙️" title="Platform" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[{ id: 'analytics', label: 'Analytics', icon: '📊' }, { id: 'agency', label: 'Agency Mgmt', icon: '🏢' }]}
          />

          {/* GAME MANAGEMENT */}
          <SidebarCategory
            icon="🎮" title="Game Management" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[
              { id: 'game_fruit_party', label: 'Fruit Party', icon: '🍓' },
              { id: 'game_wild_party', label: 'Wild Party', icon: '🦁' }
            ]}
          />

          <div className="flex items-center gap-3 px-6 py-3 text-[14px] font-bold text-white hover:bg-white/5 cursor-pointer transition-colors mt-2" onClick={() => setActiveTab('system')}>
            <span className="text-[16px] drop-shadow-md">🛠️</span>
            <span>System</span>
          </div>
        </nav>
      </aside>

      {/* ============================================================== */}
      {/* MAIN CONTENT */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-hidden">

        <header className="md:hidden bg-white p-4 border-b border-slate-200 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-slate-800 text-lg tracking-wide">Hurry Panel</span>
        </header>

        {/* ============================================================== */}
        {/* TAB: MANAGE USERS */}
        {/* ============================================================== */}
        {activeTab === 'manage_users' && (
          <div className="flex flex-col h-full bg-white">
            <div className="px-8 py-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Users</h2>
                <p className="text-xs text-slate-400 mt-0.5">Real user database records with Firebase Gmail authentication</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
                Total Users: {users.length}
              </span>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4 mb-6">
                <div className="relative w-full max-w-3xl">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by real name, email, Hurry ID, username..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 font-medium"
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 outline-none hover:bg-slate-50 cursor-pointer"
                  >
                    <option>All Roles</option>
                    <option>NORMAL</option>
                    <option>HOST</option>
                    <option>AGENCY</option>
                    <option>ADMIN</option>
                  </select>

                  <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 font-bold hover:bg-slate-50 ml-auto flex items-center gap-1">
                    ↓ DESC
                  </button>
                </div>
              </div>

              {loadingUsers ? (
                <div className="py-12 text-center text-slate-400 font-medium text-sm">
                  Loading real user database...
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 pl-4 pr-2 w-1/3">User Profile & Avatar</th>
                        <th className="py-4 px-2">User ID (MongoDB)</th>
                        <th className="py-4 px-2">Email (Firebase Gmail)</th>
                        <th className="py-4 px-2">Role</th>
                        <th className="py-4 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="py-3 pl-4 pr-2">
                            <div className="flex items-center gap-3.5">
                              {u.image ? (
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                                  <img
                                    src={u.image}
                                    alt={u.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fallback to initials if image link breaks
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      const parent = (e.target as HTMLImageElement).parentElement;
                                      if (parent && !parent.querySelector('.avatar-fallback')) {
                                        const div = document.createElement('div');
                                        div.className = 'avatar-fallback w-full h-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-base';
                                        div.textContent = u.name.charAt(0).toUpperCase();
                                        parent.appendChild(div);
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-base drop-shadow-sm shrink-0">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800">{u.name}</span>
                                <span className="text-[11px] text-slate-400 font-medium">{u.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-sm font-bold text-[#8a92ff] tracking-wide">{u.hurryId}</span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md inline-block">
                              {u.email}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold shadow-sm ${
                              u.role === 'HOST' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                              u.role === 'AGENCY' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                              u.role === 'ADMIN' ? 'bg-red-50 text-red-600 border border-red-100' :
                              'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right">
                            <button onClick={() => openTagModal(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-medium text-sm">
                            No users found matching query
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: FRUIT PARTY PREDICTION */}
        {/* ============================================================== */}
        {activeTab === 'game_fruit_party' && (
          <div className="p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span>🍓</span> Fruit Party Prediction
            </h2>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <Gamepad2 className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-slate-800">
                  Live Real-Time Winner Prediction
                  <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2.5 py-0.5 rounded-full ml-2 align-middle">Owner Advance View</span>
                </h3>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-[#f8f9fa] border border-slate-200 p-8 rounded-2xl">
                <div className="flex flex-col items-center md:items-start gap-3">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Current Round ID</span>
                  <span className="text-4xl font-black text-slate-800">#{livePrediction.round}</span>
                  <div className="flex items-center gap-2 mt-1 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl">
                    <Timer className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-bold text-indigo-700 uppercase tracking-wide">
                      {livePrediction.phase} - {livePrediction.countdown}s
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium max-w-xs mt-1">
                    ⚡ Predicted winner is generated BEFORE winner reveal so the owner knows the exact outcome during betting phase.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-extrabold text-xs tracking-wider animate-pulse border border-emerald-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>PREDICTED WINNER BEFORE RESULT</span>
                  </div>

                  <div className="w-40 h-40 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
                    <div className="w-full h-full bg-white rounded-[22px] flex flex-col items-center justify-center p-3 relative">
                      {livePrediction.winnerImg ? (
                        <img
                          src={livePrediction.winnerImg}
                          alt={livePrediction.wName}
                          className="w-16 h-16 object-contain drop-shadow-md mb-1"
                        />
                      ) : (
                        <span className="text-5xl drop-shadow-md mb-1">{livePrediction.wEmoji}</span>
                      )}
                      <span className="font-black text-slate-800 text-base">{livePrediction.wName}</span>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-1">
                        Multiplier: {livePrediction.wMult}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: WILD PARTY PREDICTION */}
        {/* ============================================================== */}
        {activeTab === 'game_wild_party' && (
          <div className="p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span>🦁</span> Wild Party Prediction
            </h2>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <Gamepad2 className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl font-bold text-slate-800">
                  Live Real-Time Winner Prediction
                  <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2.5 py-0.5 rounded-full ml-2 align-middle">Owner Advance View</span>
                </h3>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-[#f8f9fa] border border-slate-200 p-8 rounded-2xl">
                <div className="flex flex-col items-center md:items-start gap-3">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Current Round ID</span>
                  <span className="text-4xl font-black text-slate-800">#{wildPrediction.round}</span>
                  <div className="flex items-center gap-2 mt-1 bg-orange-50 border border-orange-200 px-4 py-2 rounded-xl">
                    <Timer className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-bold text-orange-700 uppercase tracking-wide">
                      {wildPrediction.phase} - {wildPrediction.countdown}s
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium max-w-xs mt-1">
                    ⚡ Predicted winner is generated BEFORE winner reveal so the owner knows the exact outcome during betting phase.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-extrabold text-xs tracking-wider animate-pulse border border-emerald-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>PREDICTED WINNER BEFORE RESULT</span>
                  </div>

                  <div className="w-40 h-40 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-1 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
                    <div className="w-full h-full bg-white rounded-[22px] flex flex-col items-center justify-center p-3 relative">
                      {wildPrediction.winnerImg ? (
                        <img
                          src={wildPrediction.winnerImg}
                          alt={wildPrediction.wName}
                          className="w-16 h-16 object-contain drop-shadow-md mb-1"
                        />
                      ) : (
                        <span className="text-5xl drop-shadow-md mb-1">{wildPrediction.wEmoji}</span>
                      )}
                      <span className="font-black text-slate-800 text-base">{wildPrediction.wName}</span>
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md mt-1">
                        Multiplier: {wildPrediction.wMult}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: STORE THEMES */}
        {/* ============================================================== */}
        {activeTab === 'themes' && (
          <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <Palette className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-slate-800">All Store Themes</h2>
              </div>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                {ALL_STORE_THEMES.length} Themes Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {ALL_STORE_THEMES.map((theme) => (
                <div key={theme.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  <div className="relative h-48 w-full bg-slate-900">
                    <img
                      src={theme.image}
                      alt={theme.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-theme.png';
                      }}
                    />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {theme.duration}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-base">{theme.name}</h3>
                        <div className="flex items-center gap-0.5 text-yellow-400 text-sm">
                          {Array.from({ length: theme.stars }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Room Environment & Audio Shader</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🪙</span>
                        <span className="font-extrabold text-slate-800 text-sm">{theme.price}</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                          Try
                        </button>
                        <button className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm transition-colors">
                          Buy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: GIFT CATALOG */}
        {/* ============================================================== */}
        {activeTab === 'gift_catalog' && (
          <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-pink-600" />
                <h2 className="text-2xl font-bold text-slate-800">All Gift Catalog</h2>
              </div>
              <div className="flex items-center gap-2">
                {(['All', 'Hot', 'Lucky'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setGiftTabFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      giftTabFilter === tab
                        ? 'bg-pink-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab} Gifts
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredGifts.map((gift) => (
                <div key={gift.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col items-center hover:shadow-md transition-shadow relative group">
                  <span className={`absolute top-2 left-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                    gift.type === 'Hot' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {gift.type}
                  </span>

                  <div className="w-16 h-16 my-2 relative flex items-center justify-center">
                    <img
                      src={gift.image}
                      alt={gift.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-avatar.png';
                      }}
                    />
                  </div>

                  <span className="font-bold text-slate-800 text-xs text-center">{gift.name}</span>
                  <div className="flex items-center gap-1 mt-1 text-xs font-extrabold text-amber-500">
                    <span>🪙</span>
                    <span>{gift.coins.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: REPORTS & BANS / AI SUPPORT LIVE CHATS */}
        {/* ============================================================== */}
        {activeTab === 'bans' && (
          <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* SUB-HEADER & NAVIGATION */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  <h2 className="text-xl font-black text-slate-800">Reports, Bans & Customer Support</h2>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time Socket.IO live AI support chats & moderation panel</p>
              </div>

              {/* SUB TABS */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setSupportSubTab('ai_chats')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    supportSubTab === 'ai_chats'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  <span>AI Support Chats</span>
                  {supportChats.length > 0 && (
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${
                      supportSubTab === 'ai_chats' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {supportChats.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setSupportSubTab('reports')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    supportSubTab === 'reports'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Flagged Reports & Bans</span>
                </button>
              </div>
            </div>

            {/* AI CHATS SUBTAB CONTENT */}
            {supportSubTab === 'ai_chats' && (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4">
                {/* CHAT THREADS LIST (LEFT PANEL) */}
                <div className="w-full md:w-80 lg:w-96 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm shrink-0">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={supportSearchQuery}
                        onChange={(e) => setSupportSearchQuery(e.target.value)}
                        placeholder="Search AI chats by user name, ID, email..."
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {supportChats
                      .filter((chat) => {
                        const q = supportSearchQuery.toLowerCase();
                        return (
                          (chat.userName || '').toLowerCase().includes(q) ||
                          (chat.userId || '').toLowerCase().includes(q) ||
                          (chat.userAccountId || '').toLowerCase().includes(q) ||
                          (chat.userEmail || '').toLowerCase().includes(q)
                        );
                      })
                      .map((chat) => {
                        const isSelected = selectedSupportUserId === chat.userId;
                        const lastMsgObj = chat.lastMessage || (Array.isArray(chat.messages) && chat.messages[chat.messages.length - 1]);
                        const lastMsgText = typeof lastMsgObj === 'object' ? (lastMsgObj.text || 'Image attachment') : (lastMsgObj || 'New conversation');
                        const timeString = chat.timestamp ? new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                        return (
                          <div
                            key={chat.userId}
                            onClick={() => setSelectedSupportUserId(chat.userId)}
                            className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative ${
                              isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-bold flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                              {chat.userPhoto ? (
                                <img src={chat.userPhoto} alt={chat.userName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{(chat.userName || 'U').charAt(0).toUpperCase()}</span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="font-bold text-xs text-slate-800 truncate">{chat.userName || 'User'}</span>
                                <span className="text-[10px] text-slate-400 font-medium shrink-0">{timeString}</span>
                              </div>

                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-1">
                                <span className="text-blue-600">ID: {chat.userAccountId || chat.userId}</span>
                                {chat.userEmail && <span className="truncate">| {chat.userEmail}</span>}
                              </div>

                              <p className="text-xs text-slate-500 font-medium truncate leading-tight">
                                {lastMsgObj?.isBot ? '🤖 Daisy: ' : '👤 User: '}{lastMsgText}
                              </p>
                            </div>

                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute top-3 right-3" />
                          </div>
                        );
                      })}

                    {supportChats.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-xs font-medium flex flex-col items-center gap-2">
                        <Bot className="w-8 h-8 text-slate-300" />
                        <span>No AI support chat sessions recorded yet.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTIVE CHAT THREAD VIEW (RIGHT PANEL) */}
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
                  {selectedSupportUserId ? (() => {
                    const activeChat = supportChats.find(c => c.userId === selectedSupportUserId);
                    if (!activeChat) return null;
                    const msgs = Array.isArray(activeChat.messages) ? activeChat.messages : [];

                    return (
                      <>
                        {/* CHAT HEADER */}
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-bold flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                              {activeChat.userPhoto ? (
                                <img src={activeChat.userPhoto} alt={activeChat.userName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{(activeChat.userName || 'U').charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-slate-800">{activeChat.userName || 'User'}</h3>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  Socket Live
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
                                <span>Account ID: <strong className="text-blue-600">{activeChat.userAccountId || activeChat.userId}</strong></span>
                                {activeChat.userEmail && <span>Email: {activeChat.userEmail}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 block">Total Messages</span>
                            <span className="text-sm font-black text-slate-800">{msgs.length}</span>
                          </div>
                        </div>

                        {/* MESSAGES SCROLL AREA */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
                          {msgs.map((msg: any, idx: number) => {
                            const isBot = msg.isBot;
                            return (
                              <div key={idx} className={`flex items-start gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden border ${
                                  isBot ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white border-pink-200' : 'bg-blue-600 text-white border-blue-400'
                                }`}>
                                  {isBot ? (
                                    <img src="/1785612362650~2.jpg" alt="Daisy AI" className="w-full h-full object-cover" />
                                  ) : activeChat.userPhoto ? (
                                    <img src={activeChat.userPhoto} alt="User" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-bold">{(activeChat.userName || 'U').charAt(0).toUpperCase()}</span>
                                  )}
                                </div>

                                <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                                  isBot
                                    ? 'bg-white rounded-tl-none border border-slate-200 text-slate-800'
                                    : 'bg-blue-600 rounded-tr-none text-white'
                                }`}>
                                  <div className="flex items-center justify-between gap-3 mb-1">
                                    <span className={`text-[10px] font-extrabold ${isBot ? 'text-purple-600' : 'text-blue-200'}`}>
                                      {isBot ? '🤖 Daisy AI Assistant' : `👤 ${activeChat.userName || 'User'}`}
                                    </span>
                                    {msg.timestamp && (
                                      <span className={`text-[9px] font-medium ${isBot ? 'text-slate-400' : 'text-blue-100'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </div>

                                  {msg.text && (
                                    <p className="text-xs whitespace-pre-line leading-relaxed">
                                      {msg.text}
                                    </p>
                                  )}

                                  {msg.image && (
                                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                      <img src={msg.image} alt="Attachment" className="max-h-60 object-contain bg-slate-100" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          <div ref={supportChatEndRef} />
                        </div>

                        {/* FOOTER BANNER */}
                        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          <span>Real-time Socket.IO AI Support Monitor. All messages are synced and stored in IndexedDB.</span>
                        </div>
                      </>
                    );
                  })() : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                      <Bot className="w-12 h-12 text-slate-300 mb-3 animate-bounce" />
                      <h4 className="font-bold text-slate-700 text-base">Select an AI Support Session</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        Click on any user from the left list to view their complete real-time conversation history with Daisy AI Support.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* REPORTS & BANS SUBTAB CONTENT */}
            {supportSubTab === 'reports' && (
              <div className="p-8 max-w-5xl mx-auto w-full overflow-y-auto">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                    <ShieldAlert className="w-6 h-6 text-red-600" />
                    <h3 className="text-xl font-bold text-slate-800">Flagged User Reports & Banned Accounts</h3>
                  </div>

                  <div className="py-12 text-center text-slate-400 text-sm font-medium">
                    No active ban violations or user reports pending review. All users operating within community guidelines.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: USER FEEDBACK (REAL-TIME SOCKET.IO) */}
        {/* ============================================================== */}
        {activeTab === 'feedback' && (
          <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            <div className="px-8 py-6 pb-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-extrabold text-slate-800">User Feedback</h2>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ml-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Socket.IO Real-Time
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Live feedback submitted from user Me page & Help section</p>
              </div>

              <span className="text-xs font-bold px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                Total Submissions: {feedbacks.length}
              </span>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
              <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between">
                <div className="relative w-full max-w-xl">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={feedbackSearchQuery}
                    onChange={(e) => setFeedbackSearchQuery(e.target.value)}
                    placeholder="Search feedback by user name, ID, contact info or description..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 shadow-sm"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
                  {['All', 'bug', 'account', 'recharge', 'other'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedFeedbackTypeFilter(type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                        selectedFeedbackTypeFilter === type
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'All' ? 'All Types' : (type === 'bug' ? 'Bug' : type === 'account' ? 'Account Issue' : type === 'recharge' ? 'Recharge' : 'Other Suggestion')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {feedbacks
                  .filter((fb) => {
                    const q = feedbackSearchQuery.toLowerCase();
                    const matchesSearch =
                      (fb.userName || '').toLowerCase().includes(q) ||
                      (fb.userAccountId || '').toLowerCase().includes(q) ||
                      (fb.userId || '').toLowerCase().includes(q) ||
                      (fb.contactInfo || '').toLowerCase().includes(q) ||
                      (fb.description || '').toLowerCase().includes(q) ||
                      (fb.typeLabel || '').toLowerCase().includes(q);

                    const matchesType =
                      selectedFeedbackTypeFilter === 'All' ||
                      fb.type === selectedFeedbackTypeFilter;

                    return matchesSearch && matchesType;
                  })
                  .map((fb) => (
                    <div
                      key={fb.id}
                      onClick={() => setSelectedFeedback(fb)}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm overflow-hidden border border-indigo-100">
                              {fb.userPhoto ? (
                                <img src={fb.userPhoto} alt={fb.userName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm">{(fb.userName || 'U').charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-slate-800 leading-snug">{fb.userName || 'User'}</h3>
                              <span className="text-xs text-indigo-600 font-bold">
                                ID: {fb.userAccountId || fb.userId || 'N/A'}
                              </span>
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shrink-0 ${
                            fb.type === 'bug' ? 'bg-red-50 text-red-600 border-red-100' :
                            fb.type === 'account' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            fb.type === 'recharge' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {fb.typeLabel || fb.type || 'Feedback'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 font-medium line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed mb-3">
                          "{fb.description}"
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span className="truncate">Contact: {fb.contactInfo || 'Not provided'}</span>
                        <span className="shrink-0">
                          {fb.timestamp ? new Date(fb.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                  ))}

                {feedbacks.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-400 text-sm font-medium bg-white rounded-2xl border border-slate-200">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-pulse" />
                    <p className="font-bold text-slate-700">No user feedback submitted yet</p>
                    <p className="text-xs text-slate-400 mt-1">Feedback submitted by users in the app will appear here in real time via Socket.IO.</p>
                  </div>
                )}
              </div>
            </div>

            {/* FEEDBACK DETAIL MODAL */}
            {selectedFeedback && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => setSelectedFeedback(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-lg shadow-md overflow-hidden shrink-0">
                      {selectedFeedback.userPhoto ? (
                        <img src={selectedFeedback.userPhoto} alt={selectedFeedback.userName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(selectedFeedback.userName || 'U').charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-800">{selectedFeedback.userName || 'User'}</h3>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-0.5">
                        <span>User ID / Account ID: <strong className="text-indigo-600">{selectedFeedback.userAccountId || selectedFeedback.userId}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Issue Category</span>
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${
                        selectedFeedback.type === 'bug' ? 'bg-red-50 text-red-600 border-red-100' :
                        selectedFeedback.type === 'account' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        selectedFeedback.type === 'recharge' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {selectedFeedback.typeLabel || selectedFeedback.type}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Feedback Description</span>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
                        {selectedFeedback.description}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Contact Info</span>
                        <span className="text-xs font-bold text-slate-700 break-all">{selectedFeedback.contactInfo || 'N/A'}</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Submitted At</span>
                        <span className="text-xs font-bold text-slate-700">
                          {selectedFeedback.timestamp ? new Date(selectedFeedback.timestamp).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setSelectedFeedback(null)}
                      className="px-6 py-2.5 text-xs font-bold bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-colors"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: OFFICIAL MSG (REAL-TIME BROADCAST TO HURRY TEAM / SYSTEM) */}
        {/* ============================================================== */}
        {activeTab === 'official_msg' && (
          <div className="flex flex-col h-full bg-slate-50 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto w-full space-y-6">

              {/* HEADER */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                  <Megaphone className="w-64 h-64" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-white/20 backdrop-blur-md p-2 rounded-2xl">
                    <Megaphone className="w-6 h-6 text-white" />
                  </span>
                  <h2 className="text-2xl font-black tracking-wide">Official Message Broadcast</h2>
                </div>
                <p className="text-blue-100 text-xs md:text-sm font-medium max-w-xl">
                  Send real-time official announcements, updates or images directly to all users. Messages will strictly appear inside the <strong>Hurry Team</strong> or <strong>Hurry System</strong> chat threads on every user's Message page.
                </p>
              </div>

              {/* SUCCESS BANNER */}
              {officialSuccess && (
                <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-md flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                    <span className="font-bold text-sm">{officialSuccess}</span>
                  </div>
                  <button onClick={() => setOfficialSuccess('')} className="p-1 hover:bg-white/20 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* BROADCAST FORM CARD */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">

                {/* 1. SELECT OFFICIAL SENDER IDENTITY */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">
                    1. Select Official Sender Account (ID) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* HURRY TEAM OPTION */}
                    <div
                      onClick={() => setOfficialSender('hurry_team_official')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                        officialSender === 'hurry_team_official'
                          ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-white p-1">
                        <img src="/logo.png" alt="Hurry Team" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-800 text-sm">Hurry Team</h4>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            officialSender === 'hurry_team_official' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                          }`}>
                            {officialSender === 'hurry_team_official' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </span>
                        </div>
                        <span className="text-[11px] text-blue-600 font-bold block mt-0.5">ID: hurry_team_official</span>
                        <p className="text-[10px] text-slate-400 font-medium">Official team chat on Message page</p>
                      </div>
                    </div>

                    {/* HURRY SYSTEM OPTION */}
                    <div
                      onClick={() => setOfficialSender('hurry_system_official')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                        officialSender === 'hurry_system_official'
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-white p-1">
                        <img src="/file_00000000a66881f8aa9e15d2fe2b9a0c.png" alt="Hurry System" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-800 text-sm">Hurry System</h4>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            officialSender === 'hurry_system_official' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                          }`}>
                            {officialSender === 'hurry_system_official' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </span>
                        </div>
                        <span className="text-[11px] text-indigo-600 font-bold block mt-0.5">ID: hurry_system_official</span>
                        <p className="text-[10px] text-slate-400 font-medium">System notification chat on Message page</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 2. MESSAGE CONTENT & ATTACHMENT */}
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      2. Write Announcement Message
                    </label>
                    <textarea
                      rows={4}
                      value={officialText}
                      onChange={(e) => setOfficialText(e.target.value)}
                      placeholder="Type your official announcement or message here..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      Attach Image (Optional)
                    </label>

                    <input
                      type="file"
                      ref={officialFileInputRef}
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const base64 = await compressImage(file, 1200, 1200, 0.85);
                          setOfficialImage(base64);
                        } catch (err) {
                          console.error('Image compression error:', err);
                        }
                      }}
                      className="hidden"
                    />

                    {officialImage ? (
                      <div className="relative inline-block border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-900 shadow-sm max-w-xs">
                        <img src={officialImage} alt="Attachment" className="max-h-48 object-contain" />
                        <button
                          onClick={() => {
                            setOfficialImage('');
                            if (officialFileInputRef.current) officialFileInputRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => officialFileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4 text-slate-500" />
                        <span>Select Image File</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. REAL-TIME LIVE PREVIEW */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-3">
                    📱 User Live Chat Preview
                  </span>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 max-w-md shadow-sm space-y-2">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                      <img
                        src={officialSender === 'hurry_team_official' ? '/logo.png' : '/file_00000000a66881f8aa9e15d2fe2b9a0c.png'}
                        alt="Sender"
                        className="w-8 h-8 rounded-full object-cover border"
                      />
                      <div>
                        <h5 className="font-bold text-xs text-slate-800">
                          {officialSender === 'hurry_team_official' ? 'Hurry Team' : 'Hurry System'}
                        </h5>
                        <span className="text-[9px] text-emerald-600 font-extrabold">Verified Official Account</span>
                      </div>
                    </div>

                    {officialText ? (
                      <p className="text-xs text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                        {officialText}
                      </p>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Message content will appear here...</span>
                    )}

                    {officialImage && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 mt-2 max-h-40">
                        <img src={officialImage} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* SUBMIT BROADCAST BUTTON */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      if (!officialText.trim() && !officialImage) {
                        alert('Please enter text or select an image to broadcast.');
                        return;
                      }

                      setOfficialSending(true);

                      const senderName = officialSender === 'hurry_team_official' ? 'Hurry Team' : 'Hurry System';
                      const senderPhoto = officialSender === 'hurry_team_official' ? '/logo.png' : '/file_00000000a66881f8aa9e15d2fe2b9a0c.png';

                      const payload = {
                        id: `official_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                        senderId: officialSender,
                        senderName,
                        senderPhoto,
                        text: officialText.trim(),
                        type: officialImage ? 'image' : 'message',
                        imageUrl: officialImage || undefined,
                        timestamp: Date.now()
                      };

                      socket.emit('send_official_message', payload);

                      setOfficialSuccess(`Message broadcasted successfully in real-time under ${senderName}!`);
                      setOfficialText('');
                      setOfficialImage('');
                      if (officialFileInputRef.current) officialFileInputRef.current.value = '';
                      setOfficialSending(false);

                      setTimeout(() => {
                        setOfficialSuccess('');
                      }, 4000);
                    }}
                    disabled={officialSending || (!officialText.trim() && !officialImage)}
                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-extrabold rounded-2xl shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{officialSending ? 'Broadcasting...' : 'Send Official Message'}</span>
                  </button>
                </div>

              </div>

              {/* SENT BROADCAST HISTORY */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-slate-800 text-base">Broadcast History</h3>
                  </div>
                  <span className="text-xs font-extrabold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                    {officialHistory.length} Sent
                  </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {officialHistory.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                      <img
                        src={item.senderPhoto || (item.senderId === 'hurry_team_official' ? '/logo.png' : '/file_00000000a66881f8aa9e15d2fe2b9a0c.png')}
                        alt="Sender"
                        className="w-10 h-10 rounded-full object-cover border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-extrabold text-xs text-slate-800">{item.senderName || (item.senderId === 'hurry_team_official' ? 'Hurry Team' : 'Hurry System')}</span>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
                          </span>
                        </div>
                        {item.text && <p className="text-xs text-slate-700 font-medium whitespace-pre-line leading-relaxed mb-1">{item.text}</p>}
                        {item.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-slate-200 max-w-xs mt-1">
                            <img src={item.imageUrl} alt="Attached image" className="max-h-32 object-contain bg-slate-900" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {officialHistory.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-xs font-medium">
                      No official broadcast messages sent yet.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 'manage_users' && activeTab !== 'game_fruit_party' && activeTab !== 'game_wild_party' && activeTab !== 'themes' && activeTab !== 'gift_catalog' && activeTab !== 'bans' && activeTab !== 'feedback' && activeTab !== 'official_msg' && (
          <div className="p-8 max-w-5xl mx-auto w-full">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 capitalize">
                {activeTab.replace(/_/g, ' ')}
              </h2>
              <p className="text-slate-500 mt-2">This section is active and ready for configuration.</p>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* TAG MODAL */}
      {/* ============================================================== */}
      {isTagModalOpen && selectedTagUserData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setIsTagModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>🏷️</span> Manage Tags for <span className="text-blue-600">{selectedTagUserData.name}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <div
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3 ${
                      isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200'
                    }`}
                  >
                    <span className="text-2xl">{tag.emoji}</span>
                    <span className="font-bold text-xs text-slate-800">{tag.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setIsTagModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleAssignTags} className="px-5 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-colors">
                Save Tags
              </button>
            </div>
            {tagSuccess && <p className="mt-4 text-center text-sm font-bold text-green-600">{tagSuccess}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
