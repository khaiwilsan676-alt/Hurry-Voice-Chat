'use client';

import React, { useState, useEffect, useRef } from 'react';
import LuckyBag from './luckybag';

interface FourgrideProps {
  onClose: () => void;
  onClearChat: () => void;
  publicMsgOff: boolean;
  onTogglePublicMsg: () => void;
  speaker: boolean;
  onToggleSpeaker: () => void;
  onMusicPlay?: (track: { id: string; name: string; url: string }) => void;
  onOpenStore?: (view: "store" | "bag") => void;
}

// ---------- IndexedDB Helpers (Music Storage) ----------
const DB_NAME = 'HurryMusicDB';
const DB_VERSION = 1;
const STORE_NAME = 'music';
const ENTRY_EFFECT_KEY = 'hurry_entry_effect_enabled';
const GIFT_EFFECT_KEY = 'hurry_gift_effect_enabled';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addMusicToDB(music: { id: string; name: string; blob: Blob }): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(music);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    db.close();
  });
}

async function deleteMusicFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    db.close();
  });
}

async function getAllMusicFromDB(): Promise<{ id: string; name: string; blob: Blob }[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export default function Fourgride({
  onClose,
  onClearChat,
  publicMsgOff,
  onTogglePublicMsg,
  speaker,
  onToggleSpeaker,
  onMusicPlay,
  onOpenStore,
}: FourgrideProps) {
  const [entryEffect, setEntryEffect] = useState(false);
  const [giftEffect, setGiftEffect] = useState(false);

  const [showMusicSheet, setShowMusicSheet] = useState(false);
  const [showLuckyBag, setShowLuckyBag] = useState(false);

  const [musicFiles, setMusicFiles] = useState<{ id: string; name: string; url: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTrackName, setCurrentTrackName] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleEntryEffect = () => {
    setEntryEffect(prev => {
      const next = !prev;
      localStorage.setItem(ENTRY_EFFECT_KEY, String(next));
      window.dispatchEvent(new CustomEvent('hurry_effect_settings_changed', { detail: { entryEffect: next } }));
      return next;
    });
  };
  const toggleGiftEffect = () => {
    setGiftEffect(prev => {
      const next = !prev;
      localStorage.setItem(GIFT_EFFECT_KEY, String(next));
      window.dispatchEvent(new CustomEvent('hurry_effect_settings_changed', { detail: { giftEffect: next } }));
      return next;
    });
  };

  useEffect(() => {
    setEntryEffect(localStorage.getItem(ENTRY_EFFECT_KEY) === 'true');
    setGiftEffect(localStorage.getItem(GIFT_EFFECT_KEY) === 'true');
  }, []);

  const handleClearChat = () => {
    onClearChat();
  };

  useEffect(() => {
    const loadMusic = async () => {
      try {
        const dbMusic = await getAllMusicFromDB();
        const files = dbMusic.map((item) => ({
          id: item.id,
          name: item.name,
          url: URL.createObjectURL(item.blob),
        }));
        setMusicFiles(files);
      } catch (error) {
        console.error('Error loading music:', error);
      }
    };
    loadMusic();
  }, []);

  useEffect(() => {
    return () => {
      musicFiles.forEach((file) => URL.revokeObjectURL(file.url));
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [musicFiles]);

  const handleAddMusic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => file.type.startsWith('audio/'));

    if (validFiles.length === 0) {
      alert('Please select audio files');
      return;
    }

    const newMusicFiles = validFiles.map(file => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      return {
        id,
        name: file.name,
        url: URL.createObjectURL(file),
        blob: file
      };
    });

    setMusicFiles(prev => [...prev, ...newMusicFiles.map(({ blob, ...rest }) => rest)]);

    newMusicFiles.forEach(({ id, name, blob }) => {
      addMusicToDB({ id, name, blob });
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const togglePlay = (id: string, url: string, name: string) => {
    if (currentlyPlaying === id) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = url;
        audioRef.current.volume = volume;
        audioRef.current.play();
      } else {
        const audio = new Audio(url);
        audio.volume = volume;
        audioRef.current = audio;
        audio.play();
      }
      setCurrentlyPlaying(id);
      setCurrentTrackName(name);
      setIsPlaying(true);
    }

    if (onMusicPlay) {
      onMusicPlay({ id, name, url });
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentlyPlaying(null);
      };
    }
  }, [audioRef.current]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleDeleteMusic = async (id: string) => {
    try {
      await deleteMusicFromDB(id);
      setMusicFiles(prev => {
        const fileToDelete = prev.find(f => f.id === id);
        if (fileToDelete) {
          URL.revokeObjectURL(fileToDelete.url);
        }
        return prev.filter(f => f.id !== id);
      });
      if (currentlyPlaying === id) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setCurrentlyPlaying(null);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error deleting music:', error);
    }
  };

  const handleCloseMusicSheet = () => {
    setShowMusicSheet(false);
  };

  const filteredMusic = musicFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* ---------- Lucky Bag Modal ---------- */}
      {showLuckyBag && (
        <LuckyBag 
          onClose={() => {
            setShowLuckyBag(false);
            onClose();
          }} 
        />
      )}

      {/* ---------- Main Tools Sheet (Fourgride) – WHITE ---------- */}
      {!showLuckyBag && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />

          {/* Bottom sheet – WHITE background, small corner curve */}
          <div
            className="relative bg-white w-full max-w-md rounded-t-lg shadow-2xl px-4 pt-4 pb-6 animate-slide-up max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header (no cross icon) */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Tools</h2>
            </div>

            {/* Row 1 – 4 items */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              {/* 1. Clear Chat */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleClearChat}
                  className="transition-transform hover:scale-105"
                >
                  <img src="/IMG_20260814_110525.png" alt="Clear Chat" className="w-12 h-12 object-contain" />
                </button>
                <span className="text-[10px] text-gray-700 mt-1 text-center">Clear-Chat</span>
              </div>

              {/* 2. Public msg Off */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img src="/IMG_20260814_110608.png" alt="Public msg Off" className="w-12 h-12 object-contain" />
                  <button
                    onClick={onTogglePublicMsg}
                    aria-label={publicMsgOff ? "Turn public messages on" : "Turn public messages off"}
                    className={`absolute bottom-0 right-0 w-6 h-4 rounded-full flex items-center transition-colors ${
                      publicMsgOff ? 'bg-gray-300' : 'bg-blue-500'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 bg-white rounded-full transform transition-transform ${
                        publicMsgOff ? 'translate-x-0.5' : 'translate-x-[10px]'
                      }`}
                    />
                  </button>
                </div>
                <span className="text-[10px] text-gray-700 mt-1 whitespace-nowrap">Public msg</span>
              </div>

              {/* 3. Entry Effect */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img src="/IMG_20260814_110709.png" alt="Entry Effect" className="w-12 h-12 object-contain" />
                  <button
                    onClick={toggleEntryEffect}
                    className={`absolute bottom-0 right-0 w-6 h-4 rounded-full flex items-center transition-colors ${
                      entryEffect ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 bg-white rounded-full transform transition-transform ${
                        entryEffect ? 'translate-x-[10px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <span className="text-[10px] text-gray-700 mt-1 whitespace-nowrap">Entry Effect</span>
              </div>

              {/* 4. Gift Effect */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img src="/IMG_20260814_110727.png" alt="Gift Effect" className="w-12 h-12 object-contain" />
                  <button
                    onClick={toggleGiftEffect}
                    className={`absolute bottom-0 right-0 w-6 h-4 rounded-full flex items-center transition-colors ${
                      giftEffect ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 bg-white rounded-full transform transition-transform ${
                        giftEffect ? 'translate-x-[10px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <span className="text-[10px] text-gray-700 mt-1 whitespace-nowrap">Gift Effect</span>
              </div>
            </div>

            {/* Row 2 – 4 items */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              {/* 5. Music */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setShowMusicSheet(true)}
                  className="transition-transform hover:scale-105"
                >
                  <img src="/IMG_20260814_144255.png" alt="Music" className="w-12 h-12 object-contain" />
                </button>
                <span className="text-[10px] text-gray-700 mt-1">Music</span>
              </div>

              {/* 6. Speaker */}
              <div className="flex flex-col items-center">
                <img src="/IMG_20260814_110628.png" alt="Speaker" className="w-12 h-12 object-contain" />
                <button
                  type="button"
                  onClick={onToggleSpeaker}
                  aria-label={speaker ? "Turn speaker off" : "Turn speaker on"}
                  className="flex items-center mt-1 space-x-1"
                >
                  <span className="text-[10px] text-gray-700 whitespace-nowrap">Speaker</span>
                  <span className={`w-6 h-4 rounded-full flex items-center transition-colors ${
                    speaker ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>
                    <span className={`w-3 h-3 bg-white rounded-full transform transition-transform ${
                      speaker ? 'translate-x-[10px]' : 'translate-x-0.5'
                    }`} />
                  </span>
                </button>
              </div>

              {/* 7. Store */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => {
                    if (onOpenStore) onOpenStore("store");
                  }}
                  className="transition-transform hover:scale-105"
                >
                  <img src="/IMG_20260814_110501.png" alt="Store" className="w-12 h-12 object-contain" />
                </button>
                <span className="text-[10px] text-gray-700 mt-1">Store</span>
              </div>

              {/* 8. My-Iteam */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => {
                    if (onOpenStore) onOpenStore("bag");
                  }}
                  className="transition-transform hover:scale-105"
                >
                  <img src="/IMG_20260814_110545.png" alt="My Item" className="w-12 h-12 object-contain" />
                </button>
                <span className="text-[10px] text-gray-700 mt-1">My-Iteam</span>
              </div>
            </div>

            {/* Bottom Section - Play Tools */}
            <div className="mt-2">
              <div className="flex items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-800">Play Tools</h3>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowLuckyBag(true); }}
                    className="transition-transform hover:scale-105"
                  >
                    <img src="/1790602570756~2.jpg" alt="Lucky bag" className="w-12 h-12 object-contain" />
                  </button>
                  <span className="text-[10px] text-gray-700 mt-1">Lucky bag</span>
                </div>

                <div className="flex flex-col items-center">
                  <button
                    onClick={() => console.log('PK Battle')}
                    className="transition-transform hover:scale-105"
                  >
                    <img src="/IMG_20260814_110802.png" alt="Pk Battle" className="w-12 h-12 object-contain" />
                  </button>
                  <span className="text-[10px] text-gray-700 mt-1">Pk Battle</span>
                </div>

                <div className="flex flex-col items-center"></div>
                <div className="flex flex-col items-center"></div>
              </div>
            </div>

            <style jsx>{`
              @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
              .animate-slide-up {
                animation: slideUp 0.3s ease-out;
              }
            `}</style>
          </div>

          {/* ---------- Music Bottom Sheet (BLACK, smaller corner curve) ---------- */}
          {showMusicSheet && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center">
              {/* Backdrop - click closes sheet */}
              <div className="absolute inset-0 bg-black/40" onClick={handleCloseMusicSheet} />
              <div
                className="relative bg-black w-full max-w-md rounded-t-lg shadow-2xl animate-slide-up overflow-hidden"
                style={{ height: '50vh' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header (no cross icon) */}
                <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-white/10">
                  <h2 className="text-lg font-bold text-white">Music</h2>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-1 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-white stroke-[2.5] stroke-linecap-round stroke-linejoin-round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add
                  </button>
                </div>

                {/* Search input */}
                <div className="px-4 pt-3">
                  <input
                    type="text"
                    placeholder="Search music..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/40 outline-none border border-white/10 focus:border-blue-400"
                  />
                </div>

                {/* Music list */}
                <div className="flex-1 overflow-y-auto px-4 py-3" style={{ maxHeight: 'calc(50vh - 120px)' }}>
                  {filteredMusic.length === 0 ? (
                    <p className="text-center text-white/40 text-sm py-8">
                      {musicFiles.length === 0 ? 'No music added yet. Click Add to select multiple files!' : 'No matching music found'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredMusic.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{file.name}</p>
                          </div>

                          {/* Play / Pause button - FULL WHITE */}
                          <button
                            onClick={() => togglePlay(file.id, file.url, file.name)}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                            aria-label={currentlyPlaying === file.id && isPlaying ? 'Pause' : 'Play'}
                          >
                            {currentlyPlaying === file.id && isPlaying ? (
                              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                            )}
                          </button>

                          {/* Cross icon in white/10 circle - removes music on click */}
                          <button
                            onClick={() => handleDeleteMusic(file.id)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Remove music"
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-white stroke-[2.5] stroke-linecap-round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input for music */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleAddMusic}
        className="hidden"
      />
    </>
  );
                                       }
