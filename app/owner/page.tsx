'use client';

import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Gamepad2,
  Timer,
  MoreVertical,
  X,
  Menu,
  ChevronDown // Added this icon for the arrow
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  username?: string;
  hurryId: string;
  emailPhone: string;
  role: 'NORMAL' | 'HOST' | 'AGENCY' | 'ADMIN';
  gender?: string;
  country?: string;
  image?: string;
}

const AVAILABLE_TAGS = [
  { id: 'adminTag', name: 'Admin', image: '/1788021461820~2.jpg', color: 'bg-rose-50 border-rose-200' },
  { id: 'officialTag', name: 'Official', image: '/1788021468845~2.jpg', color: 'bg-blue-50 border-blue-200' },
  { id: 'vipTag', name: 'VIP', image: '/1785469775751.png', color: 'bg-amber-50 border-amber-200' },
  { id: 'premiumTag', name: 'Premium', image: '/1785469784333.png', color: 'bg-purple-50 border-purple-200' }
];

// Extracted SidebarCategory to handle Open/Close logic (Accordion)
const SidebarCategory = ({ icon, title, items, activeItem, setActiveItem, setIsSidebarOpen }: any) => {
  const hasActiveChild = items.some((item: any) => item.id === activeItem);
  const [isExpanded, setIsExpanded] = useState(hasActiveChild || false);

  useEffect(() => {
    if (hasActiveChild) setIsExpanded(true);
  }, [hasActiveChild]);

  return (
    <div className="mb-2">
      <div 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="flex items-center gap-3 px-6 py-2 text-[14px] font-bold text-white hover:bg-white/5 cursor-pointer transition-colors"
      >
        <span className="text-[16px] drop-shadow-md">{icon}</span>
        <span>{title}</span>
        {/* Emoji arrow removed, using Lucide ChevronDown instead */}
        <ChevronDown 
          className={`w-4 h-4 ml-auto opacity-70 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </div>
      
      {/* Dropdown Items */}
      {isExpanded && (
        <div className="flex flex-col mt-1 animate-in slide-in-from-top-2 duration-200">
          {items.map((item: any) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveItem(item.id);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-3 px-6 py-2.5 pl-[52px] text-[13px] font-bold transition-colors w-full text-left
                ${activeItem === item.id ? 'text-white bg-[#8a92ff]/20 border-l-[3px] border-[#8a92ff]' : 'text-gray-300 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'}
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

const getUserFromMongoDB = async (uid: string) => {
  const response = await fetch(
    `/api/users?uid=${encodeURIComponent(uid)}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`MongoDB user fetch failed: ${response.status}`);
  }

  const result = await response.json();
  return result?.user || null;
};

const updateUserToMongoDB = async (userData: any) => {
  const uid = userData.uid || userData.id || userData.appLongId;

  if (!uid) {
    throw new Error("Missing user uid");
  }

  const response = await fetch("/api/users", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...userData,
      uid,
    }),
  });

  if (!response.ok) {
    throw new Error(`MongoDB user update failed: ${response.status}`);
  }

  return response.json();
};

const getRoomsFromMongoDB = async () => {
  const response = await fetch("/api/rooms");

  if (!response.ok) {
    throw new Error(`MongoDB rooms fetch failed: ${response.status}`);
  }

  const result = await response.json();
  return Array.isArray(result?.rooms) ? result.rooms : [];
};

const updateRoomToMongoDB = async (roomData: any) => {
  const roomId = roomData.roomId || roomData.id;

  if (!roomId) {
    throw new Error("Missing roomId");
  }

  const response = await fetch("/api/rooms", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...roomData,
      roomId,
    }),
  });

  if (!response.ok) {
    throw new Error(`MongoDB room update failed: ${response.status}`);
  }

  return response.json();
};

export default function OwnerPage() {
  const [activeTab, setActiveTab] = useState('manage_users');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar State

  // Live Game Prediction State
  const [livePrediction, setLivePrediction] = useState({
    round: 0,
    winnerImg: '',
    countdown: 0,
    phase: 'betting'
  });

  // Tag Management States (Modal)
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedTagUserData, setSelectedTagUserData] = useState<any>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagAssigning, setTagAssigning] = useState(false);
  const [tagSuccess, setTagSuccess] = useState('');

  // Fetch Users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const rawRooms = await getRoomsFromMongoDB();
        if (Array.isArray(rawRooms)) {
          const fetchedUsers: UserData[] = rawRooms.map((data: any) => {
            const roomId = String(data.ID || data.id || data.roomId || '');
            const accId = String(data['Room Admin'] || data.accountId || '—');
            let userRole: 'NORMAL' | 'HOST' | 'AGENCY' | 'ADMIN' = 'NORMAL';
            if (data.type === 'admin' || data.isOfficial) userRole = 'ADMIN';
            else if (data.role === 'HOST' || data.type === 'host') userRole = 'HOST';
            else if (data.role === 'AGENCY' || data.type === 'agency') userRole = 'AGENCY';

            return {
              id: roomId,
              name: data['Room Name'] || data.name || 'User',
              username: data.username || `user_${accId.substring(0,4)}`,
              hurryId: accId !== '—' ? accId : Math.floor(Math.random() * 900000000 + 100000000).toString(),
              emailPhone: data.email || data.phone || '—',
              role: userRole,
              gender: data.gender || '',
              country: data.Country || data.country || '🇮🇳',
              image: data['Room dp'] || data.image || ''
            };
          });
          setUsers(fetchedUsers);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Fruit Party Live Predictor Logic
  useEffect(() => {
    const IMAGE_MAP: Record<number, string> = {
      0: '/IMG_20260908_192143.png', 1: '/IMG_20260908_192120.png',
      2: '/IMG_20260908_191941.png', 3: '/IMG_20260908_192013.png',
      5: '/IMG_20260908_192050.png', 6: '/IMG_20260908_191930.png',
      7: '/IMG_20260908_191906.png', 8: '/IMG_20260908_192203.png',
      10: '/IMG_20260910_114515.png', 11: '/IMG_20260910_114613.png'
    };

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

      let currentPhase = 'Betting', currentCountdown = 0;
      if (elapsed < 30000) { currentPhase = 'Betting'; currentCountdown = 30 - Math.floor(elapsed / 1000); }
      else if (elapsed < 35000) { currentPhase = 'Spinning'; currentCountdown = 5 - Math.floor((elapsed - 30000) / 1000); }
      else { currentPhase = 'Result'; currentCountdown = 5 - Math.floor((elapsed - 35000) / 1000); }

      setLivePrediction({ round: roundNumber, winnerImg: IMAGE_MAP[winnerIdx] || '', countdown: currentCountdown, phase: currentPhase });
    }, 100);

    return () => clearInterval(clock);
  }, []);

  const openTagModal = async (user: UserData) => {
    setSelectedTagUserData(user);
    setIsTagModalOpen(true);
    setTagSuccess('');
    try {
      const res = await getUserFromMongoDB(user.id);
      const data = res?.user || res?.data || res;
      const existingTags = [];
      if (data?.adminTag) existingTags.push('adminTag');
      if (data?.officialTag) existingTags.push('officialTag');
      if (data?.vipTag) existingTags.push('vipTag');
      if (data?.premiumTag) existingTags.push('premiumTag');
      setSelectedTags(existingTags);
    } catch (e) { console.error(e); }
  };

  const handleAssignTags = async () => {
    setTagAssigning(true);
    try {
      const tagUpdate = {
        id: selectedTagUserData.id,
        appLongId: selectedTagUserData.id,
        adminTag: selectedTags.includes('adminTag'),
        officialTag: selectedTags.includes('officialTag'),
        vipTag: selectedTags.includes('vipTag'),
        premiumTag: selectedTags.includes('premiumTag'),
      };
      await updateUserToMongoDB(tagUpdate);
        await updateRoomToMongoDB({ roomId: selectedTagUserData.id, ...tagUpdate });
      setTagSuccess('Tags updated successfully!');
      setTimeout(() => setIsTagModalOpen(false), 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setTagAssigning(false);
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      
      {/* ============================================================== */}
      {/* MOBILE OVERLAY (Click outside to close) */}
      {/* ============================================================== */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ============================================================== */}
      {/* SIDEBAR */}
      {/* ============================================================== */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] bg-[#1a1c29] flex flex-col flex-shrink-0 h-full overflow-y-auto border-r border-[#2a2d3e] transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Brand Header */}
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
          <div className="flex items-center gap-3 px-6 py-3 text-[14px] font-bold text-white hover:bg-white/5 cursor-pointer transition-colors">
            <span className="text-[16px] drop-shadow-md">🏠</span>
            <span>Dashboard</span>
          </div>

          <SidebarCategory 
            icon="👥" title="User Center" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[ { id: 'manage_users', label: 'Manage Users', icon: '👤' }, { id: 'host_apps', label: 'Host Apps', icon: '📝' } ]}
          />
          <SidebarCategory 
            icon="🎙️" title="Live Rooms" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[ { id: 'manage_rooms', label: 'Manage Rooms', icon: '📻' } ]}
          />
          <SidebarCategory 
            icon="🛒" title="Store" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[ { id: 'themes', label: 'Themes', icon: '🎨' }, { id: 'special_ids', label: 'Special IDs', icon: '💎' }, { id: 'gift_catalog', label: 'Gift Catalog', icon: '🎁' } ]}
          />
          <SidebarCategory 
            icon="💰" title="Economy" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[ { id: 'wallet', label: 'Master Wallet', icon: '💳' }, { id: 'history', label: 'Send History', icon: '📜' }, { id: 'revenue', label: 'Bean Revenue', icon: '📈' } ]}
          />
          <SidebarCategory 
            icon="📁" title="Content" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[ { id: 'events', label: 'Events', icon: '🎪' }, { id: 'banners', label: 'Banners', icon: '🖼️' } ]}
          />
          <SidebarCategory 
            icon="🛡️" title="Moderation" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[ { id: 'bans', label: 'Reports & Bans', icon: '🚫' }, { id: 'tickets', label: 'Support Tickets', icon: '🎫' } ]}
          />
          <SidebarCategory 
            icon="⚙️" title="Platform" activeItem={activeTab} setActiveItem={setActiveTab} setIsSidebarOpen={setIsSidebarOpen}
            items={[ { id: 'analytics', label: 'Analytics', icon: '📊' }, { id: 'agency', label: 'Agency Mgmt', icon: '🏢' }, { id: 'game_management', label: 'Game Mgmt', icon: '🎮' } ]}
          />
          
          <div className="flex items-center gap-3 px-6 py-3 text-[14px] font-bold text-white hover:bg-white/5 cursor-pointer transition-colors mt-2">
            <span className="text-[16px] drop-shadow-md">🛠️</span>
            <span>System</span>
          </div>
        </nav>
      </aside>

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================== */}
      <main 
        className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-hidden"
        // onClick yaha lagaya hai, jab bhi right side tap hoga sidebar close ho jayega
        onClick={() => { if (isSidebarOpen) setIsSidebarOpen(false); }}
      >
        
        {/* ============================================================== */}
        {/* MOBILE HEADER (3 Lines Hamburger Menu) */}
        {/* ============================================================== */}
        <header className="md:hidden bg-white p-4 border-b border-slate-200 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); // Event bubble na kare
              setIsSidebarOpen(true); 
            }} 
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-slate-800 text-lg tracking-wide">Owner Panel</span>
        </header>

        {/* ============================================================== */}
        {/* TAB: MANAGE USERS */}
        {/* ============================================================== */}
        {activeTab === 'manage_users' && (
          <div className="flex flex-col h-full bg-white">
            <div className="px-8 py-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Users</h2>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4 mb-6">
                <input 
                  type="text" 
                  placeholder="Search by name, phone, email, Hurry ID..." 
                  className="w-full max-w-3xl px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300"
                />
                <div className="flex flex-wrap gap-2">
                  {['All Roles', 'All Status', 'All (mute)', 'Country...'].map(f => (
                    <select key={f} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 outline-none hover:bg-slate-50">
                      <option>{f}</option>
                    </select>
                  ))}
                  <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 font-bold hover:bg-slate-50 ml-auto flex items-center gap-1">
                    ↓ DESC
                  </button>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-4 pl-4 pr-2 w-1/3">User</th>
                      <th className="py-4 px-2">Hurry ID</th>
                      <th className="py-4 px-2">Phone / Email</th>
                      <th className="py-4 px-2">Role</th>
                      <th className="py-4 pr-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></td></tr>
                    ) : users.map((u, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-3 pl-4 pr-2">
                          <div className="flex items-center gap-4">
                            {u.image && u.image !== '/default-avatar.png' ? (
                              <img src={u.image} alt={u.name} className="w-10 h-10 rounded-full object-cover bg-slate-100" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg drop-shadow-sm">
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
                        <td className="py-3 px-2 flex flex-col justify-center">
                          <span className="text-xs font-semibold text-slate-500">{u.emailPhone !== '—' && !u.emailPhone.includes('@') ? u.emailPhone : '—'}</span>
                          <span className="text-xs font-medium text-slate-400">{u.emailPhone.includes('@') ? u.emailPhone : '—'}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold shadow-sm ${
                            u.role === 'HOST' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                            u.role === 'AGENCY' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
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
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: GAME MANAGEMENT (Admin Predictor) */}
        {/* ============================================================== */}
        {activeTab === 'game_management' && (
          <div className="p-8 max-w-4xl mx-auto w-full h-full">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span>🎮</span> Game Management
            </h2>
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <Gamepad2 className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-slate-800">Live Fruit Prediction <span className='text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2 align-middle'>Admin Only</span></h3>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-[#f8f9fa] border border-slate-200 p-8 rounded-2xl">
                <div className="flex flex-col items-center md:items-start gap-2">
                  <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Current Game Round</span>
                  <span className="text-4xl font-black text-slate-800">{livePrediction.round}</span>
                  <div className="flex items-center gap-2 mt-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <Timer className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm font-bold text-indigo-600 uppercase tracking-wide">{livePrediction.phase} - {livePrediction.countdown}s</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <span className="text-xs text-green-600 font-bold uppercase tracking-widest animate-pulse">Predicted Winner</span>
                  <div className="w-32 h-32 bg-white border-4 border-indigo-100 shadow-xl rounded-2xl flex items-center justify-center p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent z-0"></div>
                    {livePrediction.winnerImg ? (
                      <img src={livePrediction.winnerImg} alt="Predicted Winner" className="w-full h-full object-contain relative z-10 drop-shadow-lg scale-110" />
                    ) : (
                      <Loader2 className="w-8 h-8 animate-spin text-slate-300 relative z-10" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* TAG MANAGEMENT MODAL */}
      {/* ============================================================== */}
      {isTagModalOpen && selectedTagUserData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setIsTagModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><span>🏷️</span> Manage Tags for {selectedTagUserData.name}</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <div key={tag.id} onClick={() => setSelectedTags(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id])}
                    className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3 ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200'}`}>
                    <img src={tag.image} alt={tag.name} className="w-8 h-8 object-contain rounded-full bg-slate-100" />
                    <span className="font-bold text-xs text-slate-800">{tag.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setIsTagModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleAssignTags} disabled={tagAssigning} className="px-5 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 flex items-center gap-2 transition-colors">
                {tagAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Tags'}
              </button>
            </div>
            {tagSuccess && <p className="mt-4 text-center text-sm font-bold text-green-600">{tagSuccess}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

