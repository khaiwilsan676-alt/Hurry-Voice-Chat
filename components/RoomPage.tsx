'use client';
import { apiUrl } from "../src/lib/api";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import EmojiPicker from './Emojipicker';
import CupIcon from './cupicon';
import GiftPicker from './GiftPicker';
import RoomSettingPage, { RoomSettingsData } from './RoomSettingPage';
import MessagePage from './MessagePage';
import RoomProfile from './RoomProfile';
import Fourgride from './Fourgride';
import Wildparty from './Wildparty';
import Fruitparty from './Fruitparty';
import WhiteColorRemovalShader from './WhiteColorRemovalShader';
import Roomtask from './Roomtask';
import StorePage from './StorePage';
import EntryEffect from './EntryEffect';
import LuckyGiftAnimation from './LuckyGiftAnimation';
import { generateStableId } from '../lib/hash';
import socket from "../src/lib/socket";
import { addDiamondsToDB, recordTransaction } from "./Wallet";

import { JitsiMeeting } from "@jitsi/react-sdk";

interface RoomPageProps {
  roomOwner: {
    id?: string;
    uid?: string;
    accountId?: string;
    name: string;
    image: string;
  };
  currentUser: {
    id?: string;
    uid?: string;
    accountId: string;
    name: string;
    image: string;
  };
  onClose?: () => void;
  onBack?: () => void;
  onKeepRoom?: (roomData: { name: string; image: string; accountId: string }) => void;
  onFollowToggle?: (roomId: string, follow: boolean) => void;
}

interface Seat {
  number: number;
  isOccupied: boolean;
  isLocked?: boolean;
  user?: { name: string; image: string; accountId: string };
  isMuted?: boolean;
  isSpeaking?: boolean;
  gif?: {
    src: string;
    timestamp: number;
  };
}

interface Message {
  id: string;
  text: string;
  sender: string;
  senderImage: string;
  senderAccountId?: string;
  timestamp: number;
  type?: 'message' | 'join' | 'leave';
  imageUrl?: string;
  equippedBubble?: string;
  equippedVehicle?: string;
}

interface RoomUser {
  accountId: string;
  name: string;
  image: string;
}

interface MusicTrack {
  id: string;
  name: string;
  url: string;
}

const THEME_BACKGROUNDS: { [key: string]: string } = {
  'forest-night': '/1784875884052~2.jpg',
  'mood-light': '/1784533036732~2.jpg',
};

const ROOM_SETTINGS_DB_NAME = "HurryRoomSettingsDB";
const ROOM_SETTINGS_STORE = "roomSettings";

interface RoomSettingsCache {
  roomId: string;
  roomName: string;
  roomDp: string;
  announcement: string;
  micMode: number;
  theme: string;
  isLocked: boolean;
  roomPassword: string;
  updatedAt: number;
}

const openRoomSettingsDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(ROOM_SETTINGS_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ROOM_SETTINGS_STORE)) {
        db.createObjectStore(ROOM_SETTINGS_STORE, { keyPath: "roomId" });
      }
    };
  });

const saveRoomSettingsToIndexedDB = async (data: RoomSettingsCache) => {
  const db = await openRoomSettingsDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(ROOM_SETTINGS_STORE, "readwrite");
    tx.objectStore(ROOM_SETTINGS_STORE).put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
};

const loadRoomSettingsFromIndexedDB = async (roomId: string): Promise<RoomSettingsCache | null> => {
  if (!roomId) return null;
  const db = await openRoomSettingsDB();
  const result = await new Promise<RoomSettingsCache | null>((resolve, reject) => {
    const tx = db.transaction(ROOM_SETTINGS_STORE, "readonly");
    const request = tx.objectStore(ROOM_SETTINGS_STORE).get(roomId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
};

const ROOM_MESSAGES_DB_NAME = "RoomMessagesDB";
const ROOM_MESSAGES_STORE = "messages";

const openRoomMessagesDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(ROOM_MESSAGES_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ROOM_MESSAGES_STORE)) {
        const store = db.createObjectStore(ROOM_MESSAGES_STORE, { keyPath: "id" });
        store.createIndex("roomId", "roomId", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });

export default function RoomPage({ roomOwner, currentUser, onClose, onBack, onKeepRoom, onFollowToggle }: RoomPageProps) {
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const roomId = roomOwner.id || roomOwner.accountId || 'default-room';
  const userAccountId = currentUser.accountId || currentUser.uid || currentUser.id || "guest";

  useEffect(() => {
    const handleCoinTransferReceived = async (data: any = {}) => {
      const recipients = Array.isArray(data.recipientIds) ? data.recipientIds.map(String) : [];
      const diamondAmount = Number(data.diamondAmount);
      if (!recipients.includes(String(userAccountId)) || !Number.isFinite(diamondAmount) || diamondAmount <= 0) return;

      await addDiamondsToDB(diamondAmount);
      const giftLabel = data.giftName ? " — " + String(data.giftName) : "";
      await recordTransaction("Diamonds received" + giftLabel, diamondAmount, "diamond");
    };

    socket.on("coin_transfer_received", handleCoinTransferReceived);
    return () => {
      socket.off("coin_transfer_received", handleCoinTransferReceived);
    };
  }, [userAccountId]);

  return (
    <RoomVoiceJitsi
      roomId={roomId}
      userAccountId={userAccountId}
      userName={currentUser.name}
      userEmail={undefined}
      onApiReady={setJitsiApi}
    >
      <RoomContent
        roomOwner={roomOwner}
        currentUser={currentUser}
        onClose={onClose}
        onBack={onBack}
        onKeepRoom={onKeepRoom}
        onFollowToggle={onFollowToggle}
        jitsiApi={jitsiApi}
      />
    </RoomVoiceJitsi>
  );
}

function RoomVoiceJitsi({
  roomId,
  userAccountId,
  userName,
  userEmail,
  children,
  onApiReady,
}: {
  roomId: string;
  userAccountId: string;
  userName: string;
  userEmail?: string;
  children: React.ReactNode;
  onApiReady: (api: any) => void;
}) {
  return (
    <>
      <div
        className="fixed"
        style={{
          width: "1px",
          height: "1px",
          left: "-10px",
          top: "-10px",
          opacity: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={`HurryVoice-${roomId}`}
          configOverwrite={{
            startAudioOnly: true,
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            prejoinConfig: { enabled: false },
          }}
          interfaceConfigOverwrite={{ TOOLBAR_BUTTONS: [] }}
          userInfo={{ displayName: userName, email: userEmail || "" }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.width = "1px";
            iframeRef.style.height = "1px";
          }}
          onApiReady={(externalApi) => { onApiReady(externalApi); }}
        />
      </div>
      {children}
    </>
  );
}
function RoomContent({
  roomOwner,
  currentUser,
  onClose,
  onBack,
  onKeepRoom,
  onFollowToggle,
  jitsiApi,
}: RoomPageProps & { jitsiApi?: any }) {
  const isKeepingRef = useRef(false);

  const [showExitMenu, setShowExitMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showMessageSheet, setShowMessageSheet] = useState(false);
  const [showSettingPage, setShowSettingPage] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [showActiveUsers, setShowActiveUsers] = useState(false);
  const [showFourGride, setShowFourGride] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localUser, setLocalUser] = useState<{ name: string; image: string; accountId: string }>({ name: 'User', image: '/default-avatar.png', accountId: '' });

  const [showGameSheet, setShowGameSheet] = useState(false);
  const [showWildParty, setShowWildParty] = useState<boolean | 'minimized'>(false);
  const [showFruitParty, setShowFruitParty] = useState<boolean | 'minimized'>(false);
  const [showRoomTask, setShowRoomTask] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [storeInitialView, setStoreInitialView] = useState<"store" | "bag">("store");
  const [showCupIcon, setShowCupIcon] = useState(false);
  const [cupCount, setCupCount] = useState(0);

  const [musicControllerState, setMusicControllerState] = useState<'hidden' | 'full' | 'minimized'>('hidden');
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(1);
  const [musicPlaylist, setMusicPlaylist] = useState<MusicTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [musicCurrentTime, setMusicCurrentTime] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  const [miniPos, setMiniPos] = useState({ x: 20, y: 150 });
  const isDraggingMiniRef = useRef(false);
  const miniDragOffset = useRef({ x: 0, y: 0 });

  const [publicMsgOff, setPublicMsgOff] = useState(false);
  const [showPublicMsgModal, setShowPublicMsgModal] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'User';
    const image = localStorage.getItem('userPhoto') || '/default-avatar.png';
    const storedAccNum = localStorage.getItem('accountNumber') || '';
    setLocalUser({ name, image, accountId: storedAccNum });
  }, []);

  const formatCupCount = (n: number): string => {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
    return String(n);
  };

  const [showUserProfile, setShowUserProfile] = useState(false);
  const [profileUser, setProfileUser] = useState<{
    name: string;
    image: string;
    accountId: string;
    isInSeat?: boolean;
  } | null>(null);

  const userAccountId = currentUser.accountId || currentUser.uid || currentUser.id || "guest";
  const roomOwnerId = roomOwner.accountId || roomOwner.uid || roomOwner.id || "";
  const isRoomOwner = userAccountId === roomOwnerId;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [fullImageModal, setFullImageModal] = useState<string | null>(null);

  const [roomName, setRoomName] = useState<string>(roomOwner.name || "Room");
  const [roomAnnouncement, setRoomAnnouncement] = useState<string>("");
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [roomPassword, setRoomPassword] = useState<string>("");
  const [roomDp, setRoomDp] = useState<string>(roomOwner.image || "/default-avatar.png");
  const [micMode, setMicMode] = useState<number>(15);
  const [roomInfoTab, setRoomInfoTab] = useState<'profile' | 'members'>('profile');
  const [backgroundImage, setBackgroundImage] = useState<string>("/1784533036732~2.jpg");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const [showChatInput, setShowChatInput] = useState(false);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);

  useEffect(() => {
    localStorage.setItem('cupCount', String(cupCount));
  }, [cupCount]);

  const getInitialSeats = (mode: number): Seat[] => {
    const seats: Seat[] = [];
    for (let i = 1; i <= mode; i++) {
      seats.push({ number: i, isOccupied: false, isLocked: false, isMuted: false, isSpeaking: false });
    }
    return seats;
  };

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [showSeatSheet, setShowSeatSheet] = useState(false);

  useEffect(() => {
    const handleHardwareBack = (e: Event) => {
      e.preventDefault();
      if (showSettingPage) {
        setShowSettingPage(false);
      } else if (showSeatSheet) {
        setShowSeatSheet(false);
        setSelectedSeat(null);
      } else if (showEmojiPicker) {
        setShowEmojiPicker(false);
      } else if (showGiftPicker) {
        setShowGiftPicker(false);
      } else if (showFourGride) {
        setShowFourGride(false);
      } else if (showActiveUsers) {
        setShowActiveUsers(false);
      } else if (showRoomInfo) {
        setShowRoomInfo(false);
      } else if (showGameSheet) {
        setShowGameSheet(false);
      } else if (showStore) {
        setShowStore(false);
      } else if (showRoomTask) {
        setShowRoomTask(false);
      } else if (showUserProfile) {
        setShowUserProfile(false);
      } else if (showMessageSheet) {
        setShowMessageSheet(false);
      } else {
        setShowExitMenu(true);
      }
    };
    window.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => {
      window.removeEventListener('hardwareBackPress', handleHardwareBack);
    };
  }, [showSettingPage, showSeatSheet, showEmojiPicker, showGiftPicker, showFourGride, showActiveUsers, showRoomInfo, showGameSheet, showStore, showRoomTask, showUserProfile, showMessageSheet]);

  const hasSeat = seats.some(s => s.isOccupied && s.user?.accountId === userAccountId);
  const currentUserSeat = seats.find(s => s.isOccupied && s.user?.accountId === userAccountId);

  const roomId = roomOwner.id || roomOwner.accountId || 'default-room';

  const displayRoomName = roomName
    ? (roomName.length > 6 ? roomName.substring(0, 6) + '...' : roomName)
    : 'Room';

  const openProfile = (user: { name: string; image: string; accountId: string }) => {
    const userInSeat = seats.some(s => s.isOccupied && s.user?.accountId === user.accountId);
    setProfileUser({
      name: user.name,
      image: user.image,
      accountId: user.accountId,
      isInSeat: userInSeat
    });
    setShowUserProfile(true);
  };

  const desiredAudioStateRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!jitsiApi) return;
    const isMuted = currentUserSeat?.isMuted ?? true;
    const isInSeat = hasSeat;
    const desiredState = isInSeat && !isMuted;
    if (desiredAudioStateRef.current !== desiredState || desiredAudioStateRef.current === null) {
      desiredAudioStateRef.current = desiredState;
      try {
        console.log("Synchronizing Jitsi microphone state:", desiredState ? "unmuted" : "muted");
        jitsiApi.executeCommand("setAudioMute", !desiredState);
      } catch (e) {
        console.error("Failed to sync Jitsi audio state:", e);
      }
    }
  }, [currentUserSeat?.isMuted, hasSeat, jitsiApi]);

  useEffect(() => {
    let mounted = true;

    const loadRoomSettings = async () => {
      if (!roomId) return;

      try {
        const cached = await loadRoomSettingsFromIndexedDB(String(roomId));
        if (!mounted) return;
        if (cached) {
          if (cached.roomName && cached.roomName !== "Room") setRoomName(cached.roomName);
          if (cached.roomDp && cached.roomDp !== "/default-avatar.png") setRoomDp(cached.roomDp);
          if (cached.announcement) setRoomAnnouncement(cached.announcement);
          if (cached.micMode) setMicMode(Number(cached.micMode));
          if (cached.theme && THEME_BACKGROUNDS[cached.theme]) {
            setBackgroundImage(THEME_BACKGROUNDS[cached.theme]);
          }
          if (cached.isLocked !== undefined) setIsLocked(Boolean(cached.isLocked));
          if (cached.roomPassword) setRoomPassword(cached.roomPassword);
        } else {
          setRoomName(roomOwner.name || "Room");
          setRoomDp(roomOwner.image || "/default-avatar.png");
        }
      } catch (err) {
        console.error("Room settings IndexedDB load error:", err);
      }

      try {
        const response = await fetch(apiUrl(`/api/rooms?roomId=${encodeURIComponent(String(roomOwner.accountId || roomOwner.id || roomId))}`));
        if (response.ok) {
          const result = await response.json();
          const dbRoom = result?.room;
          if (dbRoom && mounted) {
            const realName = dbRoom['Room Name'] || dbRoom.roomName || dbRoom.name;
            const realDp = dbRoom.dp || dbRoom['Room dp'] || dbRoom.roomDp || dbRoom.image;

            if (realName && realName !== "My Room" && realName !== "My room" && realName !== "User") {
              setRoomName(realName);
            }
            if (realDp && realDp !== 'undefined' && realDp !== 'null' && realDp !== "/default-avatar.png") {
              setRoomDp(realDp);
            }
            if (dbRoom.announcement) setRoomAnnouncement(dbRoom.announcement);
            if (dbRoom.micMode) setMicMode(Number(dbRoom.micMode));
            if (dbRoom.theme && THEME_BACKGROUNDS[dbRoom.theme]) setBackgroundImage(THEME_BACKGROUNDS[dbRoom.theme]);
            if (dbRoom.isLocked !== undefined) setIsLocked(Boolean(dbRoom.isLocked));
            if (dbRoom.roomPassword) setRoomPassword(dbRoom.roomPassword);

            await saveRoomSettingsToIndexedDB({
              roomId: String(roomId),
              roomName: realName || roomName,
              roomDp: realDp || roomDp,
              announcement: dbRoom.announcement || "",
              micMode: Number(dbRoom.micMode || 15),
              theme: dbRoom.theme || "mood-light",
              isLocked: Boolean(dbRoom.isLocked),
              roomPassword: dbRoom.roomPassword || "",
              updatedAt: Date.now()
            });
          }
        }
      } catch (e) {
        console.warn("Failed to fetch fresh room settings from MongoDB", e);
      }
    };

    loadRoomSettings();

    return () => {
      mounted = false;
    };
  }, [roomId, roomOwner.name, roomOwner.image]);

  useEffect(() => {
    setSeats(prev => {
      const newSeats = getInitialSeats(micMode);
      return newSeats.map(newSeat => {
        const oldSeat = prev.find(s => s.number === newSeat.number);
        if (oldSeat && oldSeat.isOccupied) {
          return {
            ...newSeat,
            isOccupied: oldSeat.isOccupied,
            user: oldSeat.user,
            isMuted: oldSeat.isMuted,
            isSpeaking: oldSeat.isSpeaking,
            isLocked: oldSeat.isLocked,
            gif: oldSeat.gif,
          };
        }
        return newSeat;
      });
    });
  }, [micMode]);

  useEffect(() => {
    setMessages([]);
    joinMessageSentRef.current = false;
    joinedAtRef.current = Date.now();
    clearedAtRef.current = null;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    const loadMessages = async () => {
      if (cancelled) return;
      setMessages([]);
    };
    loadMessages();

    return () => { cancelled = true; };
  }, [roomId]);

  useEffect(() => {
    if (!roomId || userAccountId === "guest") return;

    const currentRoomUser: RoomUser = {
      accountId: String(userAccountId),
      name: currentUser.name || "User",
      image: currentUser.image || "/default-avatar.png",
    };

    const handleRoomPresence = (data: any) => {
      if (!data || String(data.roomId) !== String(roomId)) return;
      if (!Array.isArray(data.users)) return;

      const users: RoomUser[] = data.users
        .map((user: any) => ({
          accountId: String(user?.accountId || user?.userId || user?.id || ""),
          name: user?.name || "User",
          image: user?.image || user?.dp || "/default-avatar.png",
        }))
        .filter((user: RoomUser) => Boolean(user.accountId));

      setRoomUsers(users);
    };

    const handleRoomUserOnline = (data: any) => {
      if (!data || String(data.roomId) !== String(roomId) || !data.userId) return;
      const userId = String(data.userId);

      setRoomUsers(prev => {
        const existing = prev.find(user => String(user.accountId) === userId);
        if (existing) {
          return prev.map(user =>
            String(user.accountId) === userId
              ? {
                  ...user,
                  name: data.user?.name || user.name || "User",
                  image: data.user?.image || user.image || "/default-avatar.png",
                }
              : user
          );
        }
        return [
          ...prev,
          {
            accountId: userId,
            name: data.user?.name || "User",
            image: data.user?.image || "/default-avatar.png",
          },
        ];
      });
    };

    const handleRoomUserOffline = (data: any) => {
      if (!data || String(data.roomId) !== String(roomId) || !data.userId) return;
      const userId = String(data.userId);
      setRoomUsers(prev => prev.filter(user => String(user.accountId) !== userId));
    };

    const handleRoomMessage = async (data: any) => {
      if (!data || String(data.roomId) !== String(roomId)) return;

      const incoming: Message = {
        id: String(data.id || `${data.senderId || "user"}-${data.createdAt || Date.now()}`),
        text: data.text || "",
        sender: data.senderName || "Unknown",
        senderImage: data.senderAvatar || "/default-avatar.png",
        senderAccountId: data.senderAccountId || data.senderId || "",
        timestamp: Number(data.createdAt || Date.now()),
        type: data.type || "message",
        imageUrl: data.imageUrl || undefined,
        equippedBubble: data.equippedBubble || undefined,
        equippedVehicle: data.equippedVehicle || undefined,
      };

      setMessages(prev => {
        if (prev.some(msg => msg.id === incoming.id)) return prev;
        return [...prev, incoming];
      });

      try {
        const db = await openRoomMessagesDB();
        const transaction = db.transaction([ROOM_MESSAGES_STORE], "readwrite");
        const store = transaction.objectStore(ROOM_MESSAGES_STORE);
        store.put({ ...incoming, roomId });
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => db.close();
      } catch (err) {
        console.error("IndexedDB room message save error:", err);
      }
    };

    const handleRoomChatCleared = async (data: any) => {
      if (!data || String(data.roomId) !== String(roomId)) return;
      const clearTime = Number(data.timestamp || Date.now());
      clearedAtRef.current = clearTime;
      setMessages([]);

      try {
        const db = await openRoomMessagesDB();
        const transaction = db.transaction([ROOM_MESSAGES_STORE], "readwrite");
        const store = transaction.objectStore(ROOM_MESSAGES_STORE);
        const index = store.index("roomId");
        const request = index.openCursor(roomId);
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) { cursor.delete(); cursor.continue(); } else { db.close(); }
        };
        request.onerror = () => { db.close(); };
      } catch (err) {
        console.error("Room chat cleared socket error:", err);
      }
    };

    const joinRoom = () => {
      socket.emit("room_join", {
        roomId,
        userId: currentUser.uid || currentUser.id || userAccountId,
        accountId: userAccountId,
        name: currentRoomUser.name,
        dp: currentRoomUser.image,
        email: (currentUser as any)?.email || (currentUser as any)?.emailPhone || "",
      });
      socket.emit("room_seats_request", { roomId });
    };

    socket.emit("room_presence_request", { roomId });

    socket.on("room_settings_updated", async (data: any) => {
      if (!data || String(data.roomId) !== String(roomId)) return;
      if (data.roomName) setRoomName(data.roomName);
      if (data.roomDp) setRoomDp(data.roomDp);
      if (data.announcement !== undefined) setRoomAnnouncement(data.announcement);
      if (data.micMode !== undefined) setMicMode(Number(data.micMode));
      if (data.theme && THEME_BACKGROUNDS[data.theme]) {
        setBackgroundImage(THEME_BACKGROUNDS[data.theme]);
      }
      if (data.isLocked !== undefined) setIsLocked(Boolean(data.isLocked));
      if (data.roomPassword !== undefined) setRoomPassword(data.roomPassword || "");

      try {
        await saveRoomSettingsToIndexedDB({
          roomId: String(roomId),
          roomName: data.roomName || roomName,
          roomDp: data.roomDp || roomDp,
          announcement: data.announcement || "",
          micMode: Number(data.micMode || 15),
          theme: data.theme || "mood-light",
          isLocked: Boolean(data.isLocked),
          roomPassword: data.roomPassword || "",
          updatedAt: Number(data.updatedAt || Date.now()),
        });
      } catch (err) {
        console.error("Realtime room settings IndexedDB save error:", err);
      }
    });

    socket.on("room_seats", (data: any) => {
      if (!data || String(data.roomId) !== String(roomId) || !Array.isArray(data.seats)) return;

      setSeats(() => {
        const base = getInitialSeats(micMode);
        const byNumber = new Map(base.map(seat => [seat.number, seat]));

        for (const incoming of data.seats) {
          const number = Number(incoming?.number);
          if (!Number.isFinite(number)) continue;
          const existing = byNumber.get(number);
          byNumber.set(number, {
            ...(existing || {
              number,
              isOccupied: false,
              isLocked: false,
              isMuted: false,
              isSpeaking: false,
            }),
            ...incoming,
            number,
          });
        }

        return Array.from(byNumber.values()).sort((a, b) => a.number - b.number);
      });
    });

    socket.on("room_presence", handleRoomPresence);
    socket.on("room_user_online", handleRoomUserOnline);
    socket.on("room_user_offline", handleRoomUserOffline);
    socket.on("room_message", handleRoomMessage);
    socket.on("room_chat_cleared", handleRoomChatCleared);

    setRoomUsers(prev => {
      const exists = prev.some(user => String(user.accountId) === String(userAccountId));
      if (exists) return prev;
      return [...prev, currentRoomUser];
    });

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
      socket.connect();
    }

    return () => {
      socket.off("connect", joinRoom);
      socket.off("room_presence", handleRoomPresence);
      socket.off("room_user_online", handleRoomUserOnline);
      socket.off("room_user_offline", handleRoomUserOffline);
      socket.off("room_message", handleRoomMessage);
      socket.off("room_chat_cleared", handleRoomChatCleared);

      if (!isKeepingRef.current) {
        socket.emit("room_leave", {
          roomId,
          userId: userAccountId,
        });
      }
    };
  }, [roomId, userAccountId, currentUser.name, currentUser.image]);

  const sendMessageToSocket = async (
    text: string,
    imageUrl?: string,
    type: "message" | "join" | "leave" = "message"
  ) => {
    if (!roomId || userAccountId === "guest") return;

    const bubbleExpiry = Number(localStorage.getItem('equipped_Chat Bubble_expiresAt') || 0);
    const bubbleExpired = bubbleExpiry > 0 && bubbleExpiry <= Date.now();
    if (bubbleExpired) {
      localStorage.removeItem('equipped_Chat Bubble');
      localStorage.removeItem('equipped_Chat Bubble_expiresAt');
    }
    const equippedBubble = bubbleExpired
      ? undefined
      : (localStorage.getItem('equipped_Chat Bubble') || undefined);
    const equippedVehicle = localStorage.getItem('equipped_Vehicle') || undefined;

    const message = {
      id: `${userAccountId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      roomId,
      senderId: userAccountId,
      senderAccountId: userAccountId,
      senderName: currentUser.name || "User",
      senderAvatar: currentUser.image || "/default-avatar.png",
      text,
      type,
      imageUrl: imageUrl || null,
      equippedBubble: type === 'message' ? equippedBubble : undefined,
      equippedVehicle: type === 'join' ? equippedVehicle : undefined,
      createdAt: Date.now(),
    };

    if (!socket.connected) socket.connect();

    if (socket.connected) {
      socket.emit("room_message", message);
      return;
    }

    const sendAfterConnect = () => {
      socket.emit("room_message", message);
      socket.off("connect", sendAfterConnect);
    };
    socket.once("connect", sendAfterConnect);
  };

  const joinMessageSentRef = useRef(false);
  const joinedAtRef = useRef(Date.now());
  const clearedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (joinMessageSentRef.current || userAccountId === "guest") return;
    joinMessageSentRef.current = true;
    sendMessageToSocket('Enter the Room', undefined, 'join');
  }, [userAccountId, currentUser.name, roomId]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (showChatInput && inputRef.current) {
      const timer = setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 100);
      return () => clearTimeout(timer);
    }
  }, [showChatInput]);

  useEffect(() => {
    if (!showChatInput) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (inputContainerRef.current && !inputContainerRef.current.contains(e.target as Node)) {
        setShowChatInput(false);
        setMessage("");
      }
    };
    const handleTouchOutside = (e: TouchEvent) => {
      if (inputContainerRef.current && !inputContainerRef.current.contains(e.target as Node)) {
        setShowChatInput(false);
        setMessage("");
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleTouchOutside);
    }, 300);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [showChatInput]);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(roomOwner.accountId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image size should be less than 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      sendMessageToSocket('', imageUrl);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSeatClick = (seatNumber: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSeat(seatNumber);
    setShowSeatSheet(true);
  };

  const handleSeatAvatarClick = (seat: Seat) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (seat.isOccupied && seat.user) {
      openProfile({
        name: seat.user.name,
        image: seat.user.image,
        accountId: seat.user.accountId
      });
    }
  };

  const emitSeatAction = (
    action: "take" | "leave" | "mute" | "lock" | "emoji",
    seatNumber: number,
    extra: Record<string, any> = {}
  ) => {
    if (!roomId || userAccountId === "guest") return;
    const send = () => {
      socket.emit("room_seat_action", {
        roomId,
        userId: userAccountId,
        action,
        seatNumber,
        user: {
          name: currentUser.name || "User",
          image: currentUser.image || "/default-avatar.png",
          accountId: userAccountId,
        },
        ...extra,
      });
    };
    if (socket.connected) send();
    else { socket.once("connect", send); socket.connect(); }
  };

  const handleTakeSeat = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (selectedSeat === null) return;

    try {
      const targetSeat = seats.find(s => s.number === selectedSeat);
      if (targetSeat?.isLocked && !targetSeat.isOccupied) { alert("This seat is locked!"); return; }
      if (targetSeat?.isOccupied && targetSeat.user?.accountId !== userAccountId) { alert("This seat is already taken!"); return; }

      const updatedSeats = seats.map(s => {
        if (s.isOccupied && s.user?.accountId === userAccountId && s.number !== selectedSeat) {
          return { ...s, isOccupied: false, user: undefined, isSpeaking: false, isMuted: false, gif: undefined };
        }
        if (s.number === selectedSeat) {
          return {
            ...s,
            isOccupied: true,
            user: { name: currentUser.name, image: currentUser.image, accountId: userAccountId },
            isMuted: false,
            isSpeaking: false,
            gif: undefined
          };
        }
        return s;
      });

      setSeats(updatedSeats);
      emitSeatAction("take", selectedSeat, {
        user: {
          name: currentUser.name || "User",
          image: currentUser.image || "/default-avatar.png",
          accountId: userAccountId,
        },
      });
      setShowSeatSheet(false);
      setSelectedSeat(null);
    } catch (err) {
      console.error("Error taking seat:", err);
    }
  };

  const handleLeaveSeat = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (selectedSeat === null) return;

    try {
      const updatedSeats = seats.map(s => {
        if (s.number === selectedSeat && s.user?.accountId === userAccountId) {
          return { ...s, isOccupied: false, user: undefined, isSpeaking: false, isMuted: false, gif: undefined };
        }
        return s;
      });
      setSeats(updatedSeats);
      emitSeatAction("leave", selectedSeat);
      setShowSeatSheet(false);
      setSelectedSeat(null);
    } catch (err) {
      console.error("Error leaving seat:", err);
    }
  };

  const handleLeaveUserSeat = async (accountId: string) => {
    const targetSeat = seats.find(s => s.isOccupied && s.user?.accountId === accountId);
    if (!targetSeat) return;
    const updatedSeats = seats.map(seat =>
      seat.number === targetSeat.number
        ? { ...seat, isOccupied: false, user: undefined, isSpeaking: false, isMuted: false, gif: undefined }
        : seat
    );
    setSeats(updatedSeats);
  };

  const handleBottomMicToggle = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUserSeat) return;
    const newMuteState = !currentUserSeat.isMuted;
    const updatedSeats = seats.map(seat =>
      seat.number === currentUserSeat.number
        ? { ...seat, isMuted: newMuteState }
        : seat
    );
    setSeats(updatedSeats);
    emitSeatAction("mute", currentUserSeat.number, { isMuted: newMuteState });
  };

  const handleToggleMute = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (selectedSeat === null) return;
    const target = seats.find(s => s.number === selectedSeat);
    if (!target) return;

    const newMuteState = !target.isMuted;
    const updatedSeats = seats.map(s => s.number === selectedSeat ? { ...s, isMuted: newMuteState } : s);
    setSeats(updatedSeats);
    emitSeatAction("mute", target.number, { isMuted: newMuteState });
    setShowSeatSheet(false);
    setSelectedSeat(null);
  };

  const handleToggleLock = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (selectedSeat === null) return;
    const target = seats.find(s => s.number === selectedSeat);
    if (!target) return;

    const newLockState = !target.isLocked;
    const updatedSeats = seats.map(s => s.number === selectedSeat ? { ...s, isLocked: newLockState } : s);
    setSeats(updatedSeats);
    emitSeatAction("lock", target.number, { isLocked: newLockState });
    setShowSeatSheet(false);
    setSelectedSeat(null);
  };

  const handleInvite = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (selectedSeat === null) return;
    alert(`Invite sent to join seat ${selectedSeat}!`);
    setShowSeatSheet(false);
    setSelectedSeat(null);
  };

  const isCurrentUsersSeat = (seat?: Seat) => Boolean(seat && seat.isOccupied && seat.user?.accountId === userAccountId);

  const showPublicMsgOffAlert = () => { setShowPublicMsgModal(true); };

  const handleSendMessage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (publicMsgOff && !isRoomOwner) { showPublicMsgOffAlert(); return; }
    if (!message.trim()) return;
    sendMessageToSocket(message.trim());
    setMessage("");
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); }
  };

  const handleInputFocus = () => setShowChatInput(true);

  const openChatInput = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (publicMsgOff && !isRoomOwner) { showPublicMsgOffAlert(); return; }
    setShowChatInput(true);
    setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 100);
  };

  const closeBottomSheet = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowSeatSheet(false);
    setSelectedSeat(null);
  };

  const closeExitMenu = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowExitMenu(false);
  };

  const openExitMenu = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowExitMenu(true);
  };

  const openSettings = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowSettingPage(true);
  };

  const closeSettings = () => setShowSettingPage(false);
    const handleSaveSettings = async (
    data: Partial<RoomSettingsData>
  ) => {
    const nextRoomName =
      data.roomName !== undefined
        ? data.roomName
        : roomName;

    const nextRoomDp =
      data.roomDp !== undefined
        ? data.roomDp
        : roomDp;

    const nextAnnouncement =
      data.announcement !== undefined
        ? data.announcement
        : roomAnnouncement;

    const nextMicMode =
      data.micMode !== undefined
        ? data.micMode
        : micMode;

    const nextTheme =
      data.theme !== undefined
        ? data.theme
        : Object.keys(THEME_BACKGROUNDS).find(
            key => THEME_BACKGROUNDS[key] === backgroundImage
          );

    const nextLocked =
      data.isLocked !== undefined
        ? data.isLocked
        : isLocked;

    const nextPassword =
      data.roomPassword !== undefined
        ? data.roomPassword
        : roomPassword;

    setRoomName(nextRoomName);
    setRoomAnnouncement(nextAnnouncement);
    setRoomDp(nextRoomDp);
    setMicMode(nextMicMode);

    if (nextTheme && THEME_BACKGROUNDS[nextTheme]) {
      setBackgroundImage(THEME_BACKGROUNDS[nextTheme]);
    }

    setIsLocked(nextLocked);
    setRoomPassword(nextPassword);

    if (!roomId) return;

    const roomSettings: RoomSettingsCache = {
      roomId: String(roomId),
      roomName: nextRoomName || "Room",
      roomDp: nextRoomDp || "/default-avatar.png",
      announcement: nextAnnouncement || "",
      micMode: Number(nextMicMode || 0),
      theme: nextTheme || "mood-light",
      isLocked: Boolean(nextLocked),
      roomPassword: nextPassword || "",
      updatedAt: Date.now(),
    };

    await saveRoomSettingsToIndexedDB(roomSettings);

    const isOwnerOfRoom =
      String(roomId) === String(currentUser.id) ||
      String(roomId) === String(currentUser.accountId) ||
      String(roomOwner.id) === String(currentUser.id) ||
      String(roomOwner.accountId) === String(currentUser.accountId);

    try {
      const dbRoomData = {
        accountId: roomOwner.accountId || roomId,
        id: roomOwner.accountId || roomId,
        roomId: roomOwner.accountId || roomId,
        name: roomSettings.roomName,
        roomName: roomSettings.roomName,
        'Room Name': roomSettings.roomName,
        image: roomSettings.roomDp,
        roomDp: roomSettings.roomDp,
        'Room dp': roomSettings.roomDp,
        country: localStorage.getItem('userCountry') || '🇮🇳',
        message: roomSettings.announcement,
        announcement: roomSettings.announcement,
        theme: roomSettings.theme,
        micMode: roomSettings.micMode,
        isLocked: roomSettings.isLocked,
        roomPassword: roomSettings.roomPassword,
      };

      const res = await fetch(apiUrl('/api/rooms'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbRoomData),
      });

      if (!res.ok) {
        console.warn('Room settings save failed:', res.status);
      }
    } catch (error) {
      console.error("Failed to save room settings to MongoDB", error);
    }

    if (isOwnerOfRoom) {
      let existingMyRoom: any = {};
      try {
        const rawMyRoom = localStorage.getItem('myRoom');
        if (rawMyRoom) {
          existingMyRoom = JSON.parse(rawMyRoom);
        }
      } catch (e) {
        console.error("Error parsing myRoom", e);
      }

      const updatedMyRoomCard = {
        ...existingMyRoom,
        id: currentUser.id || roomId,
        accountId: currentUser.accountId || roomOwner.accountId,
        name: roomSettings.roomName,
        image: roomSettings.roomDp,
        country: localStorage.getItem('userCountry') || existingMyRoom.country || '🇮🇳'
      };
      localStorage.setItem('myRoom', JSON.stringify(updatedMyRoomCard));
      window.dispatchEvent(new Event('storage'));
    }

    socket.emit(
      "room_settings_updated",
      {
        roomId: roomOwner.accountId || roomId,
        roomName: roomSettings.roomName,
        roomDp: roomSettings.roomDp,
        announcement: roomSettings.announcement,
        micMode: roomSettings.micMode,
        theme: roomSettings.theme,
        isLocked: roomSettings.isLocked,
        roomPassword: roomSettings.roomPassword,
        updatedAt: Date.now(),
      }
    );
  };

  const handleExit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    isKeepingRef.current = false;
    setShowExitMenu(false);
    localStorage.removeItem('keptRoom');
    setMessages([]);
    if (onBack) onBack();
    if (onClose) onClose();
  };

  const handleKeep = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    isKeepingRef.current = true;
    const keptAccId = roomOwner.accountId || (roomId ? generateStableId(roomId) : "");
    const roomData = {
      name: roomName || "Room",
      image: roomDp || "/default-avatar.png",
      accountId: keptAccId,
      id: roomId,
      roomId,
    };
    localStorage.setItem('keptRoom', JSON.stringify(roomData));
    setShowExitMenu(false);
    if (onKeepRoom) onKeepRoom(roomData);
    if (onBack) onBack();
  };

  const handleSeatEmoji = async (emojiData: any) => {
    if (!hasSeat || !currentUserSeat) return;

    const sendTimestamp = Date.now();
    const seatNum = currentUserSeat.number;

    setSeats(prev => prev.map(s => s.number === seatNum ? {
      ...s,
      gif: { src: emojiData.src, timestamp: sendTimestamp }
    } : s));

    emitSeatAction("emoji", seatNum, {
      src: emojiData.src,
      timestamp: sendTimestamp,
    });

    setTimeout(() => {
      setSeats(prev => prev.map(s => s.number === seatNum ? { ...s, gif: undefined } : s));
    }, 5000);
  };

  const liveUserCount = roomUsers.length;
  const selectedSeatData = selectedSeat !== null ? seats.find(s => s.number === selectedSeat) : null;
  const isSelectedSeatMySeat = selectedSeatData ? isCurrentUsersSeat(selectedSeatData) : false;
  const isSelectedSeatTakenByOther = selectedSeatData ? (selectedSeatData.isOccupied && !isSelectedSeatMySeat) : false;

  const renderSeats = () => {
    const renderSeatItems = (seatNumbers: number[]) => {
      return seatNumbers.map(num => {
        const seat = seats.find(s => s.number === num);
        return (
          <SeatItem
            key={num}
            seatNumber={num}
            seatData={seat}
            onClick={handleSeatClick(num)}
            onAvatarClick={handleSeatAvatarClick(seat!)}
            accountId={userAccountId}
            roomOwnerId={roomOwnerId}
          />
        );
      });
    };

    if (micMode === 5) {
      return (
        <div className="flex flex-col gap-2.5 w-full px-0 -mt-4" style={{ '--seat-size': '85px' } as React.CSSProperties}>
          <div className="flex justify-center">{renderSeatItems([1])}</div>
          <div className="flex justify-around items-center w-full px-0">{renderSeatItems([2, 3, 4, 5])}</div>
        </div>
      );
    }
    if (micMode === 10) {
      return (
        <div className="flex flex-col gap-2.5 w-full px-0">
          <div className="grid grid-cols-5 justify-items-center w-full px-0">{renderSeatItems([1, 2, 3, 4, 5])}</div>
          <div className="grid grid-cols-5 justify-items-center w-full px-0">{renderSeatItems([6, 7, 8, 9, 10])}</div>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2.5 w-full px-0">
        <div className="grid grid-cols-5 justify-items-center w-full px-0">{renderSeatItems([1, 2, 3, 4, 5])}</div>
        <div className="grid grid-cols-5 justify-items-center w-full px-0">{renderSeatItems([6, 7, 8, 9, 10])}</div>
        <div className="grid grid-cols-5 justify-items-center w-full px-0">{renderSeatItems([11, 12, 13, 14, 15])}</div>
      </div>
    );
  };

  const handlePlayMusic = (track: MusicTrack, playlist?: MusicTrack[]) => {
    if (playlist && playlist.length > 0) {
      setMusicPlaylist(playlist);
      const index = playlist.findIndex(t => t.id === track.id);
      setCurrentTrackIndex(index >= 0 ? index : 0);
    } else {
      setMusicPlaylist([track]);
      setCurrentTrackIndex(0);
    }

    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.src = track.url;
      musicAudioRef.current.volume = musicVolume;
      musicAudioRef.current.play();
    } else {
      const audio = new Audio(track.url);
      audio.volume = musicVolume;
      musicAudioRef.current = audio;
      audio.play();

      audio.addEventListener('timeupdate', () => { setMusicCurrentTime(audio.currentTime); });
      audio.addEventListener('loadedmetadata', () => { setMusicDuration(audio.duration); });
      audio.addEventListener('ended', () => { handleNextTrack(); });
    }

    setCurrentTrack(track);
    setIsMusicPlaying(true);
    setMusicControllerState('full');
    setMusicCurrentTime(0);
    setMusicDuration(0);
  };

  const handleToggleMusicPlay = () => {
    if (!musicAudioRef.current || !currentTrack) return;
    if (isMusicPlaying) {
      musicAudioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      musicAudioRef.current.play();
      setIsMusicPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setMusicVolume(newVolume);
    if (musicAudioRef.current) musicAudioRef.current.volume = newVolume;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setMusicCurrentTime(newTime);
    if (musicAudioRef.current) musicAudioRef.current.currentTime = newTime;
  };

  const handleNextTrack = () => {
    if (musicPlaylist.length === 0) return;
    const nextIndex = (currentTrackIndex + 1) % musicPlaylist.length;
    const nextTrack = musicPlaylist[nextIndex];

    if (musicAudioRef.current) {
      musicAudioRef.current.src = nextTrack.url;
      musicAudioRef.current.volume = musicVolume;
      musicAudioRef.current.play();
    }
    setCurrentTrackIndex(nextIndex);
    setCurrentTrack(nextTrack);
    setIsMusicPlaying(true);
    setMusicCurrentTime(0);
    setMusicDuration(0);
  };

  const handlePrevTrack = () => {
    if (musicPlaylist.length === 0) return;
    const prevIndex = (currentTrackIndex - 1 + musicPlaylist.length) % musicPlaylist.length;
    const prevTrack = musicPlaylist[prevIndex];

    if (musicAudioRef.current) {
      musicAudioRef.current.src = prevTrack.url;
      musicAudioRef.current.volume = musicVolume;
      musicAudioRef.current.play();
    }
    setCurrentTrackIndex(prevIndex);
    setCurrentTrack(prevTrack);
    setIsMusicPlaying(true);
    setMusicCurrentTime(0);
    setMusicDuration(0);
  };

  const handleCloseMusicController = () => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }
    setMusicControllerState('hidden');
    setCurrentTrack(null);
    setIsMusicPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (musicAudioRef.current) musicAudioRef.current.volume = musicVolume;
  }, [musicVolume]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTouchStartMini = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    isDraggingMiniRef.current = true;
    miniDragOffset.current = {
      x: touch.clientX - miniPos.x,
      y: touch.clientY - miniPos.y,
    };
  };

  const handleTouchMoveMini = (e: React.TouchEvent) => {
    if (!isDraggingMiniRef.current) return;
    const touch = e.touches[0];
    setMiniPos({
      x: Math.max(10, Math.min(window.innerWidth - 50, touch.clientX - miniDragOffset.current.x)),
      y: Math.max(50, Math.min(window.innerHeight - 80, touch.clientY - miniDragOffset.current.y)),
    });
  };

  const handleTouchEndMini = () => { isDraggingMiniRef.current = false; };

  const handleMouseDownMini = (e: React.MouseEvent) => {
    isDraggingMiniRef.current = true;
    miniDragOffset.current = {
      x: e.clientX - miniPos.x,
      y: e.clientY - miniPos.y,
    };

    const handleMouseMove = (me: MouseEvent) => {
      if (!isDraggingMiniRef.current) return;
      setMiniPos({
        x: Math.max(10, Math.min(window.innerWidth - 50, me.clientX - miniDragOffset.current.x)),
        y: Math.max(50, Math.min(window.innerHeight - 80, me.clientY - miniDragOffset.current.y)),
      });
    };

    const handleMouseUp = () => {
      isDraggingMiniRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (showStore) {
    return <StorePage onBack={() => setShowStore(false)} initialView={storeInitialView} />;
  }

  if (showSettingPage) {
    return (
      <RoomSettingPage
        onBack={closeSettings}
        roomOwnerId={roomOwnerId}
        roomData={{ roomName, roomDp, announcement: roomAnnouncement, micMode, isLocked, roomPassword, theme: Object.keys(THEME_BACKGROUNDS).find(key => THEME_BACKGROUNDS[key] === backgroundImage) || 'mood-light' }}
        onSave={handleSaveSettings}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      style={{ height: '100dvh', maxHeight: '100dvh', paddingBottom: 'env(safe-area-inset-bottom, 0px)', boxSizing: 'border-box' }}
    >
      <img
        src={backgroundImage}
        alt="Room Background"
        className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        draggable={false}
      />

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" aria-label="Upload image" />

      <div className="relative z-10 flex flex-col flex-1 min-h-0 px-1 sm:px-2" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4px)', paddingBottom: '8px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>

        {/* Top Header */}
        <div className="flex justify-between items-center text-white flex-shrink-0 px-2">
          <div className="flex items-center gap-2 sm:gap-3 bg-black/30 rounded-r-full pr-4 py-0.5 pl-1 border border-none shadow-sm border-l-0 -ml-3 sm:-ml-4">
            <button
              onClick={() => { setRoomInfoTab('profile'); setShowRoomInfo(true); }}
              className="rounded-full overflow-hidden flex-shrink-0 cursor-pointer"
              style={{ width: 'var(--header-room-img-size)', height: 'var(--header-room-img-size)' }}
            >
              <img
                src={roomDp && roomDp !== "undefined" && roomDp !== "null" ? roomDp : "/default-avatar.png"}
                onError={(e) => { (e.target as HTMLImageElement).src = "/default-avatar.png"; }}
                alt="Room Cover"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
            <div className="text-left py-0.5">
              <div className="flex items-center gap-1 sm:gap-2">
                <h2 className="font-bold leading-tight" style={{ fontSize: 'var(--header-room-name-size)' }}>{displayRoomName}</h2>
                {!isRoomOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newFollow = !isFollowed;
                      setIsFollowed(newFollow);
                      if (onFollowToggle) onFollowToggle(roomId, newFollow);
                    }}
                    className="rounded-full flex items-center justify-center transition-all cursor-pointer bg-blue-500 shadow-md hover:bg-blue-600"
                    style={{ width: 'var(--header-follow-btn-size)', height: 'var(--header-follow-btn-size)', border: 'none' }}
                    title={isFollowed ? 'Unfollow Room' : 'Follow Room'}
                  >
                    <svg viewBox="0 0 24 24" className="fill-white" style={{ width: 'var(--header-follow-icon-size)', height: 'var(--header-follow-icon-size)' }}>
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-gray-300 opacity-90 leading-tight mt-0.5" style={{ fontSize: 'var(--header-id-size)' }}>
                ID:{roomOwner.accountId || ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <button onClick={(e) => { e.stopPropagation(); setShowActiveUsers(true); }} className="flex items-center gap-1 bg-black/30 rounded-full border-none hover:bg-black/30 transition-colors cursor-pointer shadow-sm" style={{ height: 'var(--header-btn-size)', padding: 'var(--header-btn-padding)' }}>
              <svg viewBox="0 0 24 24" className="fill-none stroke-white stroke-[2] stroke-linecap-round stroke-linejoin-round" style={{ width: 'var(--header-icon-size)', height: 'var(--header-icon-size)' }}>
                <circle cx="9" cy="7" r="4" />
                <path d="M 2 20 C 2 15 5 13 9 13 C 13 13 16 15 16 20" />
                <line x1="18" y1="8" x2="21" y2="8" /><line x1="18" y1="12" x2="21" y2="12" /><line x1="18" y1="16" x2="20" y2="16" />
              </svg>
              <span className="text-white font-semibold leading-none" style={{ fontSize: 'var(--header-count-size)' }}>{liveUserCount}</span>
            </button>

            {isRoomOwner && (
              <button onClick={openSettings} aria-label="Settings" className="bg-black/30 rounded-full border-none hover:bg-black/30 transition-colors cursor-pointer flex items-center justify-center shadow-sm" style={{ width: 'var(--header-btn-size)', height: 'var(--header-btn-size)' }}>
                <svg viewBox="0 0 24 24" className="fill-none stroke-white stroke-[2.2] stroke-linecap-round stroke-linejoin-round" style={{ width: 'var(--header-icon-size)', height: 'var(--header-icon-size)' }}>
                  <polygon points="12 2.5 20.2 7.25 20.2 16.75 12 21.5 3.8 16.75 3.8 7.25" />
                  <circle cx="12" cy="12" r="2.8" />
                </svg>
              </button>
            )}

            <button onClick={(e) => { e.stopPropagation(); setShowMessageSheet(true); }} aria-label="Share" className="bg-black/30 rounded-full border-none hover:bg-black/30 transition-colors cursor-pointer flex items-center justify-center shadow-sm" style={{ width: 'var(--header-btn-size)', height: 'var(--header-btn-size)' }}>
              <svg viewBox="0 0 24 24" className="fill-none stroke-white stroke-[2.2] stroke-linecap-round stroke-linejoin-round" style={{ width: 'var(--header-icon-size)', height: 'var(--header-icon-size)' }}>
                <path d="M4 14.5C4.5 10 8 7 14 7V3L21 10.5L14 18V14C9.5 14 6 15.5 4 19.5C4 18 4 16 4 14.5Z" />
              </svg>
            </button>

            <button onClick={openExitMenu} aria-label="Power" className="bg-black/30 rounded-full border-none hover:bg-black/30 transition-colors flex items-center justify-center cursor-pointer shadow-sm" style={{ width: 'var(--header-btn-size)', height: 'var(--header-btn-size)' }}>
              <svg viewBox="0 0 24 24" className="fill-none stroke-white stroke-[2.5] stroke-linecap-round stroke-linejoin-round" style={{ width: 'var(--header-icon-size)', height: 'var(--header-icon-size)' }}>
                <path d="M12 4v8" /><path d="M18.36 6.64a9 9 0 1 1-12.72 0" />
              </svg>
            </button>
          </div>
        </div>

        {/* Trophy Card UI */}
        <div className="h-0 w-full relative z-20">
          <div className="absolute top-2 left-0 -ml-1 sm:-ml-2">
            <button
              onClick={() => setShowCupIcon(true)}
              className="bg-gradient-to-r from-[#242b35]/90 via-[#242b35]/60 to-transparent flex items-center pr-3 pl-3 py-1 cursor-pointer border-none"
            >
              <div className="w-4 h-4 flex items-center justify-center shrink-0 relative overflow-visible mr-1.5">
                <GreenColorRemovalShader
                  imageSrc="/1788258883971~2.jpg"
                  threshold={0.5}
                  className="w-full h-full"
                  style={{ width: '115%', height: '115%', objectFit: 'contain', maxWidth: 'none', maxHeight: 'none', pointerEvents: 'none' }}
                />
              </div>
              <span className="font-bold text-[13px] leading-none tracking-tight" style={{ color: '#eef3a3' }}>
                {formatCupCount(cupCount)}
              </span>
              <svg viewBox="0 0 24 24" className="fill-none stroke-[3] ml-1 opacity-90" stroke="#eef3a3" style={{ width: '10px', height: '10px' }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Middle Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 flex flex-col gap-5 pt-12 sm:pt-10 w-full">
            {renderSeats()}
          </div>

          <div ref={messagesContainerRef} className="mx-1 mt-4 flex-1 overflow-y-auto scrollbar-none">
            <div className="mx-1 mb-3 flex justify-start">
              <div className="max-w-[75%] bg-black/30 border border-none shadow-sm" style={{ padding: '12px 14px', borderRadius: '8px' }}>
                <p className="leading-snug font-medium" style={{ fontSize: 'var(--announcement-text-size)', color: '#e2c67d' }}>
                  Official announcement: Welcome to Hurry Any Content Realted to porn,Froud,Fake Official will Ban!
                </p>
                {roomAnnouncement && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="leading-snug font-medium" style={{ fontSize: 'var(--announcement-text-size)', color: '#e2c67d' }}>
                      <span className="font-bold mr-1">ANNOUNCEMENT: </span>
                      {roomAnnouncement}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-0.5">
              {messages.map((msg) => (
                <div key={msg.id} className="leading-[1.8rem]">
                  {msg.type === 'join' ? (
                    <>
                      {msg.equippedVehicle && (
                        <EntryEffect vehicleUrl={msg.equippedVehicle} userName={msg.sender} />
                      )}
                      <div className="flex items-start gap-1.5 px-1 max-w-[75%]">
                        <div
                          className="rounded-full overflow-hidden flex-shrink-0 mt-0.5 cursor-pointer border border-black/10"
                          style={{ width: 'var(--msg-avatar-size)', height: 'var(--msg-avatar-size)' }}
                          onClick={() => openProfile({ name: msg.sender, image: msg.senderImage, accountId: msg.senderAccountId || generateStableId(msg.sender) })}
                        >
                          <img src={msg.senderImage || "/default-avatar.png"} alt={msg.sender} className="w-full h-full object-cover" draggable={false} onError={(e) => { (e.target as HTMLImageElement).src = "/default-avatar.png" }} />
                        </div>
                        <div className="flex flex-col bg-black/30 rounded-md px-2 py-0.5 border border-black/10 shadow-sm">
                          <span className="font-semibold text-white/90 leading-tight" style={{ fontSize: 'var(--msg-name-size)' }}>{msg.sender}</span>
                          <span className="text-white/70 leading-tight mt-0.5" style={{ fontSize: 'var(--msg-jointime-size)' }}>Enter the Room</span>
                        </div>
                      </div>
                    </>
                  ) : msg.imageUrl ? (
                    <div className="flex items-start gap-2 max-w-[75%]" style={{ height: 'calc(4 * 1.8rem)' }}>
                      <div className="rounded-full overflow-hidden flex-shrink-0 mt-0.5 cursor-pointer border border-black/10" style={{ width: 'var(--msg-avatar-size)', height: 'var(--msg-avatar-size)' }} onClick={() => openProfile({ name: msg.sender, image: msg.senderImage, accountId: msg.senderAccountId || generateStableId(msg.sender) })}>
                        <img src={msg.senderImage || "/default-avatar.png"} alt={msg.sender} className="w-full h-full object-cover" draggable={false} onError={(e) => { (e.target as HTMLImageElement).src = "/default-avatar.png" }} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-white/90 leading-tight drop-shadow-sm" style={{ fontSize: 'var(--msg-name-size)' }}>{msg.sender}</span>
                        <div onClick={() => setFullImageModal(msg.imageUrl || null)} className="rounded-xl overflow-hidden border border-black/10 cursor-pointer hover:opacity-90 transition-opacity bg-black/40 flex items-center justify-center mt-0.5 shadow-sm" style={{ height: 'calc(3.5 * 1.8rem)', width: 'calc(3.5 * 1.8rem)' }}>
                          <img src={msg.imageUrl} alt="Shared image" className="w-full h-full object-cover" draggable={false} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 max-w-[75%]">
                      <div className="rounded-full overflow-hidden flex-shrink-0 mt-0.5 cursor-pointer border border-white/10" style={{ width: 'var(--msg-avatar-size)', height: 'var(--msg-avatar-size)' }} onClick={() => openProfile({ name: msg.sender, image: msg.senderImage, accountId: msg.senderAccountId || generateStableId(msg.sender) })}>
                        <img src={msg.senderImage || "/default-avatar.png"} alt={msg.sender} className="w-full h-full object-cover" draggable={false} onError={(e) => { (e.target as HTMLImageElement).src = "/default-avatar.png" }} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-white/90 leading-tight drop-shadow-sm" style={{ fontSize: 'var(--msg-name-size)' }}>{msg.sender}</span>
                        {msg.equippedBubble ? (
                          <div className="px-3 py-2 mt-0.5 inline-flex w-fit max-w-full items-center justify-center relative" style={{ backgroundImage: `url(${msg.equippedBubble})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', minHeight: '40px' }}>
                            <p className="break-words leading-tight text-white relative z-10" style={{ fontSize: 'var(--msg-text-size)' }}>{msg.text}</p>
                          </div>
                        ) : (
                          <div className="px-2 py-1.5 rounded-xl bg-black/30 text-white rounded-tl-sm mt-0.5 border border-black/10 shadow-sm">
                            <p className="break-words leading-tight" style={{ fontSize: 'var(--msg-text-size)' }}>{msg.text}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className={`flex-shrink-0 pt-2 px-2 ${showChatInput ? 'hidden' : ''}`}>
          <div className="flex items-center justify-between gap-1 ">
            <button
              onClick={openChatInput}
              aria-label="Say Hi Chat"
              className="bg-black/30 rounded-full border-none hover:bg-black/30 transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
              style={{ width: 'var(--footer-btn-size)', height: 'var(--footer-btn-size)' }}
            >
              <svg viewBox="0 0 24 24" className="fill-white" style={{ width: 'calc(var(--footer-icon-size) + 4px)', height: 'calc(var(--footer-icon-size) + 4px)' }}>
                <path d="M12 2C6.48 2 2 5.92 2 10.75c0 2.8 1.5 5.29 3.82 6.84l-1.4 3.7c-.12.33.22.64.53.5l4-1.63c1 .3 2 .46 3.05.46 5.52 0 10-3.92 10-8.75S17.52 2 12 2zm-4 11.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
              </svg>
            </button>

            <div className="flex items-center gap-1.5">
              {hasSeat && (
                <button
                  onClick={handleBottomMicToggle}
                  className="bg-black/30 rounded-full border-none hover:bg-black/30 transition-all shrink-0 flex items-center justify-center cursor-pointer shadow-sm p-0 overflow-visible"
                  style={{ width: 'var(--footer-btn-size)', height: 'var(--footer-btn-size)' }}
                >
                  {currentUserSeat?.isMuted ? (
                    <svg viewBox="-2 -2 28 28" className="fill-white overflow-visible" style={{ width: '32px', height: '32px' }}>
                      <defs>
                        <mask id="mic-cut-muted">
                          <rect x="-2" y="-2" width="32" height="32" fill="white" />
                          <rect x="9" y="6" width="6" height="2" rx="1" fill="black" />
                        </mask>
                      </defs>
                      <rect x="7.5" y="1" width="9" height="14" rx="4.5" fill="#ffffff" mask="url(#mic-cut-muted)" />
                      <path d="M4 11 a8 8 0 0 0 16 0 h-3 a5 5 0 0 1 -10 0 Z" fill="#ffffff" />
                      <rect x="10.5" y="18" width="3" height="5" fill="#ffffff" />
                      <line x1="1" y1="1" x2="23" y2="23" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                      <line x1="1" y1="1" x2="23" y2="23" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="-2 -2 28 28" className="fill-white overflow-visible" style={{ width: '32px', height: '32px' }}>
                      <defs>
                        <mask id="mic-cut-unmuted">
                          <rect x="-2" y="-2" width="32" height="32" fill="white" />
                          <rect x="9" y="6" width="6" height="2" rx="1" fill="black" />
                        </mask>
                      </defs>
                      <rect x="7.5" y="1" width="9" height="14" rx="4.5" fill="#ffffff" mask="url(#mic-cut-unmuted)" />
                      <path d="M4 11 a8 8 0 0 0 16 0 h-3 a5 5 0 0 1 -10 0 Z" fill="#ffffff" />
                      <rect x="10.5" y="18" width="3" height="5" fill="#ffffff" />
                    </svg>
                  )}
                </button>
              )}

              {hasSeat && (
                <button onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(true); }} className="bg-black/30 rounded-full border-none hover:bg-black/30 transition-colors shrink-0 flex items-center justify-center cursor-pointer shadow-sm" style={{ width: 'var(--footer-btn-size)', height: 'var(--footer-btn-size)' }}>
                  <svg viewBox="0 0 24 24" className="fill-white" style={{ width: 'var(--footer-icon-size)', height: 'var(--footer-icon-size)' }}>
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM8.5 7.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM7 14h10c0 3-2.5 5-5 5s-5-2-5-5z" />
                  </svg>
                </button>
              )}

              <button onClick={(e) => { e.stopPropagation(); setShowMessageSheet(true); }}
                aria-label="Message Box Menu"
                className="bg-black/30 rounded-full border-none hover:bg-black/30 transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
                style={{ width: 'var(--footer-btn-size)', height: 'var(--footer-btn-size)' }}
              >
                <svg viewBox="0 0 24 24" className="fill-none stroke-white stroke-[2] stroke-linecap-round stroke-linejoin-round" style={{ width: 'calc(var(--footer-icon-size) + 4px)', height: 'calc(var(--footer-icon-size) + 4px)' }}>
                  <rect x="3" y="5" width="18" height="14" rx="3" ry="3" />
                  <path d="M3 7l7.53 5.54a3 3 0 0 0 2.94 0L21 7" />
                </svg>
              </button>

              <button onClick={(e) => { e.stopPropagation(); setShowGiftPicker(true); }} aria-label="Gift" className="bg-white/10 backdrop-blur-md rounded-full border-none hover:bg-white/20 transition-colors flex items-center justify-center shrink-0 overflow-hidden cursor-pointer shadow-sm p-0" style={{ width: 'var(--footer-btn-size)', height: 'var(--footer-btn-size)' }}>
                <img src="/file_000000008e508208b1353ae33e2abef9.png" alt="Gift" className="w-full h-full object-cover rounded-full" draggable={false} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setShowFourGride(true); }}
                aria-label="Apps Menu"
                className="bg-black/30 rounded-full border-none hover:bg-black/30 transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
                style={{ width: 'var(--footer-btn-size)', height: 'var(--footer-btn-size)' }}
              >