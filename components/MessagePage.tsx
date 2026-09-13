'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getMessages, getUser } from '../src/lib/googleSheets';

import ChatScreen from './ChatScreen';

// ============ Simple IndexedDB Functions ============
const DB_NAME = 'MessagesDB';
const STORE_NAME = 'conversations';

// IndexedDB kholo
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'chatId' });
      }
    };
  });
};

// IndexedDB mein save karo
const saveToDB = async (conversations: ChatPreview[]) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Purana data clear karo
    store.clear();

    // Naya data save karo
    conversations.forEach(chat => {
      store.put(chat);
    });

    db.close();
    console.log('IndexedDB mein save ho gaya:', conversations.length);
  } catch (error) {
    console.error('Save error:', error);
  }
};

// IndexedDB se load karo
const loadFromDB = async (): Promise<ChatPreview[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const chats = await new Promise<ChatPreview[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return chats;
  } catch (error) {
    console.error('Load error:', error);
    return [];
  }
};

// ============ Types ============
interface ChatPreview {
  chatId: string;
  otherUser: {
    uid: string;
    name: string;
    photo: string;
  };
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
}

interface FixedChat {
  id: string;
  name: string;
  image: string;
  uid: string;
  isFixed: boolean;
}

interface MessagePageProps {
  onChatOpen?: (open: boolean) => void;
  onJoinRoom?: (roomId: string) => void;
  sharedRoomData?: {
    roomId: string;
    roomName: string;
    roomImage: string;
  } | null;
}

export default function MessagePage({ onChatOpen, onJoinRoom, sharedRoomData }: MessagePageProps) {
  const [fixedChats] = useState<FixedChat[]>([
    { id: 'hawa-team', name: 'Hurry Team', image: '/logo.png', uid: 'hurry_team_official', isFixed: true },
    { id: 'hawa-system', name: 'Hurry System', image: '/file_00000000a66881f8aa9e15d2fe2b9a0c.png', uid: 'hurry_system_official', isFixed: true }
  ]);

  const [dynamicChats, setDynamicChats] = useState<ChatPreview[]>([]);
  const [activeChat, setActiveChat] = useState<{ uid: string; name: string; photo: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentUserData = () => {
    const uid = typeof window !== 'undefined' ? localStorage.getItem('userUID') || localStorage.getItem('userPhone') || 'N/A' : 'N/A';
    const name = typeof window !== 'undefined' ? localStorage.getItem('userName') || 'Me' : 'Me';
    const photo = typeof window !== 'undefined' ? localStorage.getItem('userPhoto') || '' : '';
    return { uid, name, photo };
  };

  const currentUserUid = getCurrentUserData().uid;

  // Sirf IndexedDB se load karo
  useEffect(() => {
    const loadData = async () => {
      if (currentUserUid === 'N/A') {
        setIsLoading(false);
        return;
      }

      // IndexedDB se data load karo
      const cachedChats = await loadFromDB();
      
      if (cachedChats.length > 0) {
        setDynamicChats(cachedChats);
        console.log('IndexedDB se data load hua:', cachedChats.length);
      }
      
      setIsLoading(false);
    };

    loadData();
  }, [currentUserUid]);

  // Google Sheets fetching
  useEffect(() => {
    if (!currentUserUid || currentUserUid === 'N/A') return;

    let isMounted = true;

    const fetchConversations = async () => {
      try {
        const msgs = await getMessages(currentUserUid);
        if (!isMounted || !Array.isArray(msgs)) return;

        const convoMap = new Map<string, ChatPreview>();

        for (const msg of msgs) {
          const senderId = msg.senderId || msg.USER_A_ID || msg.userAId;
          const receiverId = msg.receiverId || msg.USER_B_ID || msg.userBId;
          const text = msg.chat || msg.text || '';
          const time = Number(msg.createdAt || msg.timestamp || Date.now());

          const otherUid = senderId === currentUserUid ? receiverId : senderId;
          if (!otherUid || otherUid === currentUserUid) continue;

          const ids = [currentUserUid, otherUid].sort();
          const chatId = `${ids[0]}_${ids[1]}`;

          const existing = convoMap.get(chatId);
          if (!existing || time > existing.lastTimestamp) {
            let otherName = msg.name || msg.senderName || 'User';
            let otherDp = msg.dp || msg.avatar || '/default-avatar.png';

            convoMap.set(chatId, {
              chatId,
              otherUser: {
                uid: otherUid,
                name: otherName,
                photo: otherDp
              },
              lastMessage: text,
              lastTimestamp: time,
              unreadCount: 0
            });
          }
        }

        const chats = Array.from(convoMap.values());
        chats.sort((a, b) => b.lastTimestamp - a.lastTimestamp);

        if (isMounted) {
          setDynamicChats(chats);
          await saveToDB(chats);
        }
      } catch (error) {
        console.error('Error fetching conversations from Google Sheets:', error);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUserUid]);

  // ---------- Helpers ----------
  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const handleOpenFixedChat = (chat: FixedChat) => {
    setActiveChat({ uid: chat.uid, name: chat.name, photo: chat.image });
  };

  const handleOpenDynamicChat = async (chat: ChatPreview) => {
    setActiveChat({ uid: chat.otherUser.uid, name: chat.otherUser.name, photo: chat.otherUser.photo });
    try {
      // @ts-ignore
      const convoRef = doc(db, 'conversations', chat.chatId);
      // @ts-ignore
      await updateDoc(convoRef, {
        [`unreadCounts.${currentUserUid}`]: 0,
      });
    } catch (error) {
      console.error('Failed to reset unread count:', error);
    }
  };

  const handleCloseChat = () => {
    setActiveChat(null);
  };

  // ---------- Notify parent about chat open state ----------
  useEffect(() => {
    if (onChatOpen) onChatOpen(!!activeChat);
  }, [activeChat, onChatOpen]);

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Header */}
      <div
        className="px-4 pb-4 flex items-center justify-between sticky top-0 z-10 safe-top"
        style={{
          background: 'linear-gradient(to bottom, #3b82f6 0%, #eff6ff 70%, #ffffff 100%)',
          paddingTop: 'max(env(safe-area-inset-top, 0px), var(--status-bar-height, 0px), 24px)'
        }}
      >
        <h1 className="text-3xl font-bold text-gray-800">Message</h1>
      </div>

      {/* Main content: Chats only */}
      <div className="pt-4 pb-24 flex flex-col gap-1">
        {/* Fixed chats */}
        {fixedChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleOpenFixedChat(chat)}
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer active:opacity-60 transition-opacity"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Image src={chat.image} alt={chat.name} width={56} height={56} className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 text-base">{chat.name}</h3>
            </div>
          </div>
        ))}

        {/* Dynamic chats from IndexedDB */}
        {dynamicChats.map((chat) => (
          <div
            key={chat.chatId}
            onClick={() => handleOpenDynamicChat(chat)}
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer active:opacity-60 transition-opacity"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Image
                src={chat.otherUser.photo || '/default-avatar.png'}
                alt={chat.otherUser.name}
                width={56}
                height={56}
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 text-base">{chat.otherUser.name}</h3>
              <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-gray-400">{formatTime(chat.lastTimestamp)}</span>
              {chat.unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5">
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {!isLoading && dynamicChats.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm"></p>
          </div>
        )}
      </div>

      {/* Chat Screen Overlay */}
      {activeChat && (
        <ChatScreen
          currentUser={getCurrentUserData()}
          targetUser={activeChat}
          onClose={handleCloseChat}
          onJoinRoom={onJoinRoom}
          sharedRoomData={sharedRoomData}
        />
      )}
    </div>
  );
}

