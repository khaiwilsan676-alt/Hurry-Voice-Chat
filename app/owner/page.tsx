'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, MoreVertical, Gamepad2, Timer, Search, Shield, CheckCircle, Star, Sparkles, Gift, Palette } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { apiUrl } from "@/src/lib/api";
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

        // 3. Read local logged-in user from localStorage or IndexedDB cache
        if (typeof window !== 'undefined') {
          const localUserData = localStorage.getItem('userData') || localStorage.getItem('user');
          if (localUserData) {
            try {
              const parsed = JSON.parse(localUserData);
              if (parsed.email && !currentUserEmail) currentUserEmail = parsed.email;
              if (parsed.name && !currentUserName) currentUserName = parsed.name;
              if (parsed.image && !currentUserPhoto) currentUserPhoto = parsed.image;
              if (parsed.accountId || parsed.uid) currentUserId = String(parsed.accountId || parsed.uid);
            } catch (e) {
              // ignore parse errors
            }
          }
        }

        // 4. Merge Firebase / local current user if missing in list
        if (currentUserEmail || currentUserId) {
          const exists = fetchedList.some(u => u.email === currentUserEmail || u.hurryId === currentUserId || u.id === currentUserId);
          if (!exists) {
            fetchedList.unshift({
              id: currentUserId || 'auth-current-user',
              name: currentUserName || 'Verified User',
              username: currentUserName ? `@${currentUserName.toLowerCase().replace(/\s+/g, '')}` : '@active_user',
              hurryId: currentUserId || '88100293',
              email: currentUserEmail || 'user@gmail.com',
              role: 'NORMAL',
              image: currentUserPhoto || ''
            });
          } else {
            // Update email in fetched record if email was missing
            fetchedList = fetchedList.map(u => {
              if ((u.id === currentUserId || u.hurryId === currentUserId) && u.email === '—' && currentUserEmail) {
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
            items={[{ id: 'bans', label: 'Reports & Bans', icon: '🚫' }, { id: 'tickets', label: 'Support Tickets', icon: '🎫' }]}
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

        {/* Placeholder for other tabs */}
        {activeTab !== 'manage_users' && activeTab !== 'game_fruit_party' && activeTab !== 'game_wild_party' && activeTab !== 'themes' && activeTab !== 'gift_catalog' && (
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
