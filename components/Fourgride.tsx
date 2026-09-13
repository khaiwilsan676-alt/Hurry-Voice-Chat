'use client';

import React, { useState, useEffect, useRef } from 'react';

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
  // Toggle states (except publicMsgOff, which is controlled)
  const [entryEffect, setEntryEffect] = useState(false);
  const [giftEffect, setGiftEffect] = useState(false);

  // Music sheet state
  const [showMusicSheet, setShowMusicSheet] = useState(false);
  const [musicFiles, setMusicFiles] = useState<{ id: string; name: string; url: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteCard, setShowDeleteCard] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [currentTrackName, setCurrentTrackName] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toggle handlers
  const toggleEntryEffect = () => setEntryEffect(!entryEffect);
  const toggleGiftEffect = () => setGiftEffect(!giftEffect);

  // Clear chat handler
  const handleClearChat = () => {
    onClearChat();
  };

  // Load music files from IndexedDB on mount
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

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      musicFiles.forEach((file) => URL.revokeObjectURL(file.url));
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [musicFiles]);

  // Handle music file selection - supports multiple files
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

    // Save all files to IndexedDB
    newMusicFiles.forEach(({ id, name, blob }) => {
      addMusicToDB({ id, name, blob });
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Play/pause handler
  const togglePlay = (id: string, url: string, name: string) => {
    if (currentlyPlaying === id) {
      // Same track - toggle play/pause
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
      // Different track - stop current and play new
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

    // Notify parent component about music playback
    if (onMusicPlay) {
      onMusicPlay({ id, name, url });
    }
  };

  // Handle audio ended
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentlyPlaying(null);
      };
    }
  }, [audioRef.current]);

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Delete music handler
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
      setShowDeleteCard(null);
    } catch (error) {
      console.error('Error deleting music:', error);
    }
  };

  // Close music sheet but keep playing
  const handleCloseMusicSheet = () => {
    setShowMusicSheet(false);
  };

  // Filter music by search query
  const filteredMusic = musicFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* ---------- Main Tools Sheet (Fourgride) ---------- */}
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />

        {/* Bottom sheet */}
        <div
          className="relative bg-white w-full max-w-md rounded-t-3xl shadow-2xl px-4 pt-4 pb-6 animate-slide-up max-h-[70vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Tools</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-gray-700 stroke-[2.5]">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
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

            {/* 2. Public msg Off with toggle overlay */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <img src="/IMG_20260814_110608.png" alt="Public msg Off" className="w-12 h-12 object-contain" />
                <button
                  onClick={onTogglePublicMsg}
                  className={`absolute bottom-0 right-0 w-6 h-4 rounded-full flex items-center transition-colors ${
                    publicMsgOff ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-3 h-3 bg-white rounded-full transform transition-transform ${
                      publicMsgOff ? 'translate-x-[10px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <span className="text-[10px] text-gray-700 mt-1 whitespace-nowrap">Public msg</span>
            </div>

            {/* 3. Entry Effect with toggle overlay */}
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

            {/* 4. Gift Effect with toggle overlay */}
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
            {/* 5. Music - opens music sheet */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setShowMusicSheet(true)}
                className="transition-transform hover:scale-105"
              >
                <img src="/IMG_20260814_144255.png" alt="Music" className="w-12 h-12 object-contain" />
              </button>
              <span className="text-[10px] text-gray-700 mt-1">Music</span>
            </div>

            {/* 6. Speaker - OFF state (no toggle) */}
            <div className="flex flex-col items-center">
              <img src="/IMG_20260814_110628.png" alt="Speaker" className="w-12 h-12 object-contain" />
              <div className="flex items-center mt-1 space-x-1">
                <span className="text-[10px] text-gray-700 whitespace-nowrap">Speaker</span>
                <div className="w-6 h-4 rounded-full bg-gray-300 flex items-center">
                  <div className="w-3 h-3 bg-white rounded-full transform translate-x-0.5" />
                </div>
              </div>
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

          {/* Bottom Section - Play Tools with Lucky Bag and PK Battle */}
          <div className="mt-2">
            <div className="flex items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-800">Play Tools</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {/* Lucky Bag - Column 1 */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => console.log('Lucky Bag')}
                  className="transition-transform hover:scale-105"
                >
                  <img src="/IMG_20260814_110743.png" alt="Lucky bag" className="w-12 h-12 object-contain" />
                </button>
                <span className="text-[10px] text-gray-700 mt-1">Lucky bag</span>
              </div>

              {/* PK Battle - Column 2 */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => console.log('PK Battle')}
                  className="transition-transform hover:scale-105"
                >
                  <img src="/IMG_20260814_110802.png" alt="Pk Battle" className="w-12 h-12 object-contain" />
                </button>
                <span className="text-[10px] text-gray-700 mt-1">Pk Battle</span>
              </div>

              {/* Empty columns 3 and 4 */}
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

        {/* ---------- Music Bottom Sheet ---------- */}
        {showMusicSheet && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={handleCloseMusicSheet} />
            <div
              className="relative bg-white w-full max-w-md rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden"
              style={{ height: '50vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">Music</h2>
                <div className="flex items-center gap-2">
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
                  <button
                    onClick={handleCloseMusicSheet}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-gray-700 stroke-[2.5]">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="px-4 pt-3">
                <input
                  type="text"
                  placeholder="Search music..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-700 outline-none border border-gray-200 focus:border-blue-400"
                />
              </div>

              {/* Music list */}
              <div className="flex-1 overflow-y-auto px-4 py-3" style={{ maxHeight: 'calc(50vh - 120px)' }}>
                {filteredMusic.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">
                    {musicFiles.length === 0 ? 'No music added yet. Click Add to select multiple files!' : 'No matching music found'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredMusic.map((file) => (
                      <div key={file.id} className="relative">
                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                          </div>
                          <button
                            onClick={() => togglePlay(file.id, file.url, file.name)}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                            aria-label={currentlyPlaying === file.id && isPlaying ? 'Pause' : 'Play'}
                          >
                            {currentlyPlaying === file.id && isPlaying ? (
                              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-gray-700 stroke-[2] stroke-linecap-round stroke-linejoin-round">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-gray-700 stroke-[2] stroke-linecap-round stroke-linejoin-round">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => setShowDeleteCard(showDeleteCard === file.id ? null : file.id)}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                            aria-label="More options"
                          >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-gray-600">
                              <circle cx="12" cy="5" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="12" cy="19" r="2" />
                            </svg>
                          </button>
                        </div>

                        {/* Delete Card */}
                        {showDeleteCard === file.id && (
                          <div className="absolute right-0 top-full mt-1 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                            <button
                              onClick={() => handleDeleteMusic(file.id)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer w-full"
                            >
                              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-red-600 stroke-[2] stroke-linecap-round stroke-linejoin-round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input for music - supports multiple files */}
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
