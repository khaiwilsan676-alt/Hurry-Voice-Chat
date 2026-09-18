'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, MoreVertical, Gamepad2, Timer } from 'lucide-react';

// ==============================================================
// MOCK DATA (No backend needed)
// ==============================================================
const mockUsers = [
  { id: '1', name: 'Robot Gaming Master', username: 'robot_gaming', hurryId: '—', email: 'abhishekumar912004@gmail.com', role: 'NORMAL' },
  { id: '2', name: 'Uuhbh Bhhnn', username: 'uuhbh', hurryId: '—', email: 'bhhhnuuhbh@gmail.com', role: 'HOST' },
  { id: '3', name: 'Riya', username: 'riya_99', hurryId: '—', email: 'riyag3383@gmail.com', role: 'HOST' },
  { id: '4', name: 'Rider', username: 'rider_x', hurryId: '—', email: 'ooosakshe@gmail.com', role: 'HOST' },
  { id: '5', name: 'Samir', username: 'samir_1', hurryId: '—', email: 'mdsamira153@gmail.com', role: 'HOST' },
  { id: '6', name: 'Newbie Fan', username: 'newbie_fan', hurryId: '531006005', email: '—', role: 'NORMAL' },
  { id: '7', name: 'Luna Star', username: 'luna_star', hurryId: '821004571', email: '—', role: 'HOST' },
  { id: '8', name: 'Agent Boss', username: 'agent_boss', hurryId: '320919038', email: '—', role: 'AGENCY' },
  { id: '9', name: 'Marco', username: 'marco_talks', hurryId: '486052034', email: '—', role: 'HOST' },
  { id: '10', name: 'Zara Beats', username: 'zara_beats', hurryId: '927199637', email: '—', role: 'HOST' }, 
];

const AVAILABLE_TAGS = [
  { id: 'adminTag', name: 'Admin', emoji: '🛡️' },
  { id: 'officialTag', name: 'Official', emoji: '✅' },
  { id: 'vipTag', name: 'VIP', emoji: '⭐' },
  { id: 'premiumTag', name: 'Premium', emoji: '💎' },
];

interface MockUser {
  id: string;
  name: string;
  username: string;
  hurryId: string;
  email: string;
  role: string;
}

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

  // Fruit Party Prediction
  const [livePrediction, setLivePrediction] = useState({
    round: 0, winnerImg: '', countdown: 0, phase: 'betting'
  });

  // Wild Party Prediction
  const [wildPrediction, setWildPrediction] = useState({
    round: 0, winnerImg: '', countdown: 0, phase: 'betting'
  });

  // Tag Modal
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedTagUserData, setSelectedTagUserData] = useState<MockUser | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSuccess, setTagSuccess] = useState('');

  // ============================================================
  // Fruit Party Timer
  // ============================================================
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

  // ============================================================
  // Wild Party Timer
  // ============================================================
  useEffect(() => {
    const WILD_IMAGE_MAP: Record<number, string> = {
      0: '/IMG_20260908_192143.png', 1: '/IMG_20260908_192120.png',
      2: '/IMG_20260908_191941.png', 3: '/IMG_20260908_192013.png',
      5: '/IMG_20260908_192050.png', 6: '/IMG_20260908_191930.png',
      7: '/IMG_20260908_191906.png', 8: '/IMG_20260908_192203.png',
      10: '/IMG_20260910_114515.png', 11: '/IMG_20260910_114613.png'
    };

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

      let currentPhase = 'Betting', currentCountdown = 0;
      if (elapsed < 35000) { currentPhase = 'Betting'; currentCountdown = 35 - Math.floor(elapsed / 1000); }
      else if (elapsed < 40000) { currentPhase = 'Spinning'; currentCountdown = 5 - Math.floor((elapsed - 35000) / 1000); }
      else { currentPhase = 'Result'; currentCountdown = 5 - Math.floor((elapsed - 40000) / 1000); }

      setWildPrediction({ round: roundNumber, winnerImg: WILD_IMAGE_MAP[winnerIdx] || '', countdown: currentCountdown, phase: currentPhase });
    }, 100);

    return () => clearInterval(clock);
  }, []);

  // ============================================================
  // Tag Modal Handlers
  // ============================================================
  const openTagModal = (user: MockUser) => {
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

          {/* GAME MANAGEMENT - Now Accordion */}
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
                      <th className="py-4 px-2">Email</th>
                      <th className="py-4 px-2">Role</th>
                      <th className="py-4 pr-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {mockUsers.map((u, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-3 pl-4 pr-2">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg drop-shadow-sm">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
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
                          <span className="text-xs font-semibold text-slate-500">{u.email}</span>
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
        {/* TAB: FRUIT PARTY */}
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
                  Live Fruit Prediction
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2 align-middle">Admin Only</span>
                </h3>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-[#f8f9fa] border border-slate-200 p-8 rounded-2xl">
                <div className="flex flex-col items-center md:items-start gap-2">
                  <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Current Game Round</span>
                  <span className="text-4xl font-black text-slate-800">{livePrediction.round}</span>
                  <div className="flex items-center gap-2 mt-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <Timer className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm font-bold text-indigo-600 uppercase tracking-wide">
                      {livePrediction.phase} - {livePrediction.countdown}s
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <span className="text-xs text-green-600 font-bold uppercase tracking-widest animate-pulse">Predicted Winner</span>
                  <div className="w-32 h-32 bg-white border-4 border-indigo-100 shadow-xl rounded-2xl flex items-center justify-center p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent z-0"></div>
                    <img
                      src={livePrediction.winnerImg}
                      alt="Predicted Winner"
                      className="w-full h-full object-contain relative z-10 drop-shadow-lg scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent && !parent.querySelector('.fallback')) {
                          const span = document.createElement('span');
                          span.className = 'fallback text-6xl relative z-10 drop-shadow-lg scale-110';
                          span.textContent = '🍎';
                          parent.appendChild(span);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: WILD PARTY */}
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
                  Live Wild Prediction
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2 align-middle">Admin Only</span>
                </h3>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-[#f8f9fa] border border-slate-200 p-8 rounded-2xl">
                <div className="flex flex-col items-center md:items-start gap-2">
                  <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Current Game Round</span>
                  <span className="text-4xl font-black text-slate-800">{wildPrediction.round}</span>
                  <div className="flex items-center gap-2 mt-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <Timer className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-bold text-orange-600 uppercase tracking-wide">
                      {wildPrediction.phase} - {wildPrediction.countdown}s
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <span className="text-xs text-green-600 font-bold uppercase tracking-widest animate-pulse">Predicted Winner</span>
                  <div className="w-32 h-32 bg-white border-4 border-orange-100 shadow-xl rounded-2xl flex items-center justify-center p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent z-0"></div>
                    <img
                      src={wildPrediction.winnerImg}
                      alt="Predicted Winner"
                      className="w-full h-full object-contain relative z-10 drop-shadow-lg scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent && !parent.querySelector('.fallback')) {
                          const span = document.createElement('span');
                          span.className = 'fallback text-6xl relative z-10 drop-shadow-lg scale-110';
                          span.textContent = '🦁';
                          parent.appendChild(span);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 'manage_users' && activeTab !== 'game_fruit_party' && activeTab !== 'game_wild_party' && (
          <div className="p-8 max-w-5xl mx-auto w-full">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 capitalize">
                {activeTab.replace(/_/g, ' ')}
              </h2>
              <p className="text-slate-500 mt-2">This section is under construction.</p>
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
