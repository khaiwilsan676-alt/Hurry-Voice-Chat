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
  { id: 101, name: "Kiss", coins: 1999, image: "/IMG_20260906_000443.png", type: "Lucky" },
  { id: 102, name: "Nut", coins: 3999, image: "/IMG_20260906_000508.png", type: "Lucky" },
];

const FRUIT_DETAILS: Record<number, { name: string; emoji: string; img: string; mult: string }> = {
  0: { name: 'Apple', emoji: '🍎', img: '/IMG_20260908_192143.png', mult: '5x' },
  1: { name: 'Orange', emoji: '🍊', img: '/IMG_20260908_192120.png', mult: '10x' },
};

const WILD_DETAILS: Record<number, { name: string; emoji: string; img: string; mult: string }> = {
  0: { name: 'Lion', emoji: '🦁', img: '/IMG_20260908_192143.png', mult: '5x' },
  1: { name: 'Tiger', emoji: '🐯', img: '/IMG_20260908_192120.png', mult: '10x' },
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All Roles');

  const [giftTabFilter, setGiftTabFilter] = useState<'All' | 'Hot' | 'Lucky'>('All');
  const [giftSearchQuery, setGiftSearchQuery] = useState('');
  const [themeSearchQuery, setThemeSearchQuery] = useState('');

  const [livePrediction, setLivePrediction] = useState({ round: 0, winnerIdx: 0, winnerImg: '', wName: 'Apple', wEmoji: '🍎', wMult: '5x', countdown: 0, phase: 'Betting' });
  const [wildPrediction, setWildPrediction] = useState({ round: 0, winnerIdx: 0, winnerImg: '', wName: 'Lion', wEmoji: '🦁', wMult: '5x', countdown: 0, phase: 'Betting' });

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedTagUserData, setSelectedTagUserData] = useState<UserRecord | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSuccess, setTagSuccess] = useState('');

  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState('');
  const [selectedFeedbackTypeFilter, setSelectedFeedbackTypeFilter] = useState('All');

  const [supportChats, setSupportChats] = useState<any[]>([]);
  const [privateMessages, setPrivateMessages] = useState<any[]>([]);
  const [filteredPrivateMessages, setFilteredPrivateMessages] = useState<any[]>([]);
  const [privateMessageSearchQuery, setPrivateMessageSearchQuery] = useState('');
  const [loadingPrivateMessages, setLoadingPrivateMessages] = useState(false);
  const [selectedSupportUserId, setSelectedSupportUserId] = useState<string | null>(null);
  const [selectedPrivateChat, setSelectedPrivateChat] = useState<any | null>(null);
  const [supportSearchQuery, setSupportSearchQuery] = useState('');
  
  const supportChatEndRef = useRef<HTMLDivElement>(null);

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

      socket.on("user_feedback_history", (data) => {
        if (isMounted && data) {
          setFeedbacks(data.sort((a: any, b: any) => b.timestamp - a.timestamp));
        }
      });
      
      socket.on("ai_support_history", (data) => {
        if (isMounted && data) {
          setSupportChats(data.sort((a: any, b: any) => b.timestamp - a.timestamp));
        }
      });
      
      socket.on("official_message_history", (data) => {
        if (isMounted && data) {
          setOfficialHistory(data.sort((a: any, b: any) => b.timestamp - a.timestamp));
        }
      });

      return () => {
        socket.off("user_feedback_history");
        socket.off("ai_support_history");
        socket.off("official_message_history");
      };
    }
  }, []);

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
      } catch (err) {
        console.error('Failed to fetch private messages:', err);
      } finally {
        if (isMounted) setLoadingPrivateMessages(false);
      }
    };
    fetchPrivateMessages();
    const intervalId = setInterval(fetchPrivateMessages, 10000);
    return () => { isMounted = false; clearInterval(intervalId); };
  }, []);

  useEffect(() => {
    if (!privateMessageSearchQuery.trim()) {
      setFilteredPrivateMessages(privateMessages);
      return;
    }
    const query = privateMessageSearchQuery.toLowerCase();
    const filtered = privateMessages.filter((msg) => {
      return (
        (msg.text && msg.text.toLowerCase().includes(query)) ||
        (msg.senderId && msg.senderId.toLowerCase().includes(query)) ||
        (msg.receiverId && msg.receiverId.toLowerCase().includes(query)) ||
        (msg.senderName && msg.senderName.toLowerCase().includes(query))
      );
    });
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
              id: String(u._id || u.id || u.uid || index + 1),
              name: u.name || u.displayName || u.userName || 'User',
              username: u.username || u.userName || `@${(u.name || 'user').toLowerCase().replace(/\s+/g, '')}`,
              hurryId: String(u.accountId || u.displayUserNumber || u.appLongId || u.hurryId || u.id || '—'),
              email: u.email || u.gmail || u.emailPhone || '—',
              role: u.role || 'NORMAL',
              image: u.image || u.photo || u.avatar || u.photoURL || ''
            }));
          }
        } catch (err) {}
        if (isMounted) setUsers(fetchedList);
      } catch (error) {
        if (isMounted) setUsers(fallbackUsers);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    };
    loadRealUsers();
  }, []);

  useEffect(() => {
    const clock = setInterval(() => {
      setLivePrediction({ round: 1, winnerIdx: 0, winnerImg: '', wName: 'Apple', wEmoji: '🍎', wMult: '5x', countdown: 10, phase: 'Betting' });
      setWildPrediction({ round: 1, winnerIdx: 0, winnerImg: '', wName: 'Lion', wEmoji: '🦁', wMult: '5x', countdown: 10, phase: 'Betting' });
    }, 100);
    return () => clearInterval(clock);
  }, []);

  const openTagModal = (user: UserRecord) => {
    setSelectedTagUserData(user);
    setIsTagModalOpen(true);
    setTagSuccess('');
    setSelectedTags([]);
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.hurryId.toLowerCase().includes(q);
    const matchesRole = selectedRoleFilter === 'All Roles' || u.role.toUpperCase() === selectedRoleFilter.toUpperCase();
    return matchesSearch && matchesRole;
  });

  const filteredGifts = ALL_GIFTS.filter(g => {
    if (giftTabFilter === 'All') return g.name.toLowerCase().includes(giftSearchQuery.toLowerCase());
    return g.type === giftTabFilter && g.name.toLowerCase().includes(giftSearchQuery.toLowerCase());
  });

  const filteredThemes = ALL_STORE_THEMES.filter(t => 
    t.name.toLowerCase().includes(themeSearchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      
      {/* DESKTOP & MOBILE OVERLAY - Closes Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/10 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      {isSidebarOpen && (
        <div className="hidden lg:block fixed inset-0 z-30" onClick={() => setIsSidebarOpen(false)} />
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
              { id: 'ai_chats', label: 'Ai Chats', icon: '🤖' },
              { id: 'reports', label: 'Reports', icon: '🚩' },
              { id: 'bans', label: 'Bans', icon: '🚫' },
              { id: 'tickets', label: 'Private Chat', icon: '🎫' },
              { id: 'official_msg', label: 'Official Msg', icon: '📢' }
            ]}
          />
          <SidebarCategory
            icon="⚙️" title="Platform" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[{ id: 'analytics', label: 'Analytics', icon: '📊' }, { id: 'agency', label: 'Agency Mgmt', icon: '🏢' }]}
          />

          <SidebarCategory
            icon="🎮" title="Game Management" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[
              { id: 'game_fruit_party', label: 'Fruit Party', icon: '🍓' },
              { id: 'game_wild_party', label: 'Wild Party', icon: '🦁' }
            ]}
          />
        </nav>
      </aside>

      {/* ============================================================== */}
      {/* MAIN CONTENT */}
      {/* ============================================================== */}
      <main className={`flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[260px]' : 'ml-0'}`}>

        <header className="bg-white p-4 border-b border-slate-200 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-slate-800 text-lg tracking-wide">Hurry Panel</span>
        </header>

        {/* TAB: MANAGE USERS */}
        {activeTab === 'manage_users' && (
          <div className="flex flex-col h-full bg-white">
            <div className="px-8 py-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Users</h2>
                <p className="text-xs text-slate-400 mt-0.5">Real user database records with Firebase Gmail authentication</p>
              </div>
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
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-4 pl-4 pr-2 w-1/3">User Profile & Avatar</th>
                      <th className="py-4 px-2">User ID</th>
                      <th className="py-4 px-2">Email</th>
                      <th className="py-4 px-2">Role</th>
                      <th className="py-4 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-3 pl-4 pr-2">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-base overflow-hidden">
                               {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover"/> : u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-800">{u.name}</span>
                              <span className="text-[11px] text-slate-400 font-medium">{u.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2"><span className="text-sm font-bold text-[#8a92ff]">{u.hurryId}</span></td>
                        <td className="py-3 px-2"><span className="text-xs font-semibold text-slate-600">{u.email}</span></td>
                        <td className="py-3 px-2"><span className="px-2 py-1 rounded-md text-[10px] font-bold shadow-sm bg-blue-50 text-blue-600">{u.role}</span></td>
                        <td className="py-3 pr-4 text-right"><button className="p-1.5 text-slate-400 hover:text-blue-600"><MoreVertical className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: STORE THEMES */}
        {activeTab === 'themes' && (
          <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">All Store Themes</h2>
            
            <div className="mb-6 relative w-full max-w-md">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search themes..." 
                value={themeSearchQuery}
                onChange={(e) => setThemeSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            <div className="w-full bg-transparent">
              <div className="grid grid-cols-5 gap-4 font-bold text-slate-500 border-b border-slate-200 pb-2 mb-2 px-4">
                <span>Name</span>
                <span>Prize</span>
                <span>Star</span>
                <span>Theme</span>
                <span>Days</span>
              </div>
              
              <div className="flex flex-col gap-2">
                {filteredThemes.map(theme => (
                  <div key={theme.id} className="grid grid-cols-5 gap-4 items-center bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                    <span className="font-bold text-slate-800">{theme.name}</span>
                    <span className="font-extrabold text-slate-800">{theme.price}</span>
                    <span className="text-yellow-400 flex items-center gap-1">
                      {Array.from({ length: theme.stars }).map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400" />)}
                    </span>
                    <span className="text-sm text-slate-600">{theme.category}</span>
                    <span className="text-sm font-bold text-slate-600">{theme.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: GIFT CATALOG */}
        {activeTab === 'gift_catalog' && (
          <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">All Gift Catalog</h2>
            
            <div className="mb-6 relative w-full max-w-md">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search gifts..." 
                value={giftSearchQuery}
                onChange={(e) => setGiftSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            <div className="w-full bg-transparent">
              <div className="grid grid-cols-4 gap-4 font-bold text-slate-500 border-b border-slate-200 pb-2 mb-2 px-4">
                <span>Name</span>
                <span>Prize (Coins)</span>
                <span>Type</span>
                <span>Image</span>
              </div>
              
              <div className="flex flex-col gap-2">
                {filteredGifts.map(gift => (
                  <div key={gift.id} className="grid grid-cols-4 gap-4 items-center bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                    <span className="font-bold text-slate-800">{gift.name}</span>
                    <span className="font-extrabold text-amber-500">{gift.coins}</span>
                    <span className="text-sm font-bold text-slate-600">{gift.type}</span>
                    <img src={gift.image} alt={gift.name} className="w-10 h-10 object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: USER FEEDBACK */}
        {activeTab === 'feedback' && (
          <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">User Feedback</h2>
            
            <div className="mb-6 relative w-full max-w-md">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search feedbacks..." 
                value={feedbackSearchQuery}
                onChange={(e) => setFeedbackSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            <div className="w-full bg-transparent">
              <div className="grid grid-cols-5 gap-4 font-bold text-slate-500 border-b border-slate-200 pb-2 mb-2 px-4">
                <span>Avatar</span>
                <span>Name</span>
                <span>ID</span>
                <span>Type</span>
                <span>Date Time</span>
              </div>
              
              <div className="flex flex-col gap-2">
                {[1,2,3].map((f) => (
                  <div key={f} onClick={() => setSelectedFeedback(f)} className="grid grid-cols-5 gap-4 items-center bg-white border border-slate-200 p-4 rounded-lg shadow-sm cursor-pointer hover:bg-slate-50">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">U</div>
                    <span className="font-bold text-slate-800">User {f}</span>
                    <span className="text-sm text-slate-600">ID-00{f}</span>
                    <span className="text-sm text-slate-600">Suggestion</span>
                    <span className="text-sm text-slate-500">{new Date().toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedFeedback && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl max-w-lg w-full">
                  <h3 className="text-lg font-bold mb-4">Feedback Details</h3>
                  <p className="text-slate-600 mb-6">Detailed feedback text goes here...</p>
                  <button onClick={() => setSelectedFeedback(null)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold w-full">Close</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: AI CHATS */}
        {activeTab === 'ai_chats' && (
          <div className="p-8 max-w-6xl mx-auto w-full h-full flex flex-col overflow-hidden">
            {!selectedSupportUserId ? (
              <>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Ai Chats</h2>
                <div className="mb-6 relative w-full max-w-md shrink-0">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Search AI chats..." 
                    value={supportSearchQuery}
                    onChange={(e) => setSupportSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 shadow-sm"
                  />
                </div>
                
                <div className="grid grid-cols-4 gap-4 font-bold text-slate-500 border-b border-slate-200 pb-2 mb-2 px-4 shrink-0">
                  <span>Avatar</span>
                  <span>Name</span>
                  <span>ID</span>
                  <span>Date Time</span>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                  {supportChats.length > 0 ? supportChats.map(chat => (
                    <div 
                      key={chat.userId} 
                      onClick={() => setSelectedSupportUserId(chat.userId)}
                      className="grid grid-cols-4 gap-4 items-center p-3 hover:bg-slate-100 cursor-pointer text-sm"
                    >
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        {chat.userName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="font-bold text-slate-800">{chat.userName || 'Unknown'}</span>
                      <span className="text-slate-600">{chat.userId}</span>
                      <span className="text-slate-500">{new Date(chat.timestamp).toLocaleString()}</span>
                    </div>
                  )) : (
                     <div className="text-slate-400 p-4">No AI chats available.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="p-4 border-b border-slate-200 flex items-center gap-3">
                  <button onClick={() => setSelectedSupportUserId(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-bold text-lg">Ai Chat with {supportChats.find(c => c.userId === selectedSupportUserId)?.userName}</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                   <div className="flex flex-col gap-4">
                     {supportChats.find(c => c.userId === selectedSupportUserId)?.messages?.map((msg: any, i: number) => (
                       <div key={i} className={`flex flex-col max-w-[75%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                         <span className="text-[10px] text-slate-400 font-bold mb-1 mx-1">{msg.sender === 'user' ? 'User' : 'AI Assistant'}</span>
                         <div className={`p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                           {msg.text}
                         </div>
                       </div>
                     ))}
                     <div ref={supportChatEndRef} />
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: PRIVATE CHAT */}
        {activeTab === 'tickets' && (
          <div className="p-8 max-w-6xl mx-auto w-full h-full flex flex-col overflow-hidden">
            {!selectedPrivateChat ? (
              <>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Private Chat</h2>
                
                <div className="mb-6 relative w-full max-w-md shrink-0">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Search private chats..." 
                    value={privateMessageSearchQuery}
                    onChange={(e) => setPrivateMessageSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-4 gap-4 font-bold text-slate-500 border-b border-slate-200 pb-2 mb-2 px-4 shrink-0">
                  <span>Avatar</span>
                  <span>Name</span>
                  <span>ID</span>
                  <span>Date Time</span>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                  {filteredPrivateMessages.length > 0 ? filteredPrivateMessages.map((msg, i) => (
                    <div 
                      key={msg.id || i}
                      onClick={() => setSelectedPrivateChat(msg)}
                      className="grid grid-cols-4 gap-4 items-center p-3 hover:bg-slate-100 cursor-pointer text-sm"
                    >
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold overflow-hidden">
                        {msg.senderPhoto ? <img src={msg.senderPhoto} className="w-full h-full object-cover" /> : msg.senderName?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-800">{msg.senderName || 'Unknown'}</span>
                      <span className="text-slate-600">{msg.senderId}</span>
                      <span className="text-slate-500">{new Date(msg.timestamp || Date.now()).toLocaleString()}</span>
                    </div>
                  )) : (
                     <div className="text-slate-400 p-4">No private messages available.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
                  <button onClick={() => setSelectedPrivateChat(null)} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-bold text-lg">Private Conversation</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex flex-col gap-4">
                   
                   {/* Left Side Sender */}
                   <div className="flex flex-col self-start max-w-[70%]">
                      <span className="text-xs font-bold text-slate-500 mb-1 ml-1">{selectedPrivateChat.senderName} (Sender)</span>
                      <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-200">
                        {selectedPrivateChat.text}
                        {selectedPrivateChat.imageUrl && <img src={selectedPrivateChat.imageUrl} className="mt-2 rounded-lg max-w-xs" />}
                      </div>
                   </div>

                   {/* Right Side Receiver */}
                   <div className="flex flex-col self-end max-w-[70%] items-end">
                      <span className="text-xs font-bold text-slate-500 mb-1 mr-1">Receiver ID: {selectedPrivateChat.receiverId}</span>
                      <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-sm">
                         <span className="italic opacity-80 text-sm">Message received by this user.</span>
                      </div>
                   </div>

                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

