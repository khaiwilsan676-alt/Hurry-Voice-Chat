'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, ImageIcon, MoreHorizontal, LogIn, Trash2, Flag, Ban, X, Check, Copy } from 'lucide-react';
import socket from '../src/lib/socket';

// ============ IndexedDB Functions for Conversations & Messages ============
const CONVERSATIONS_STORE = 'conversations';
const MESSAGES_STORE = 'messages';

const getConversationsDBName = (userId: string) => `MessagesDB_${userId || 'guest'}`;
const getChatMessagesDBName = (userId: string) => `ChatMessagesDB_${userId || 'guest'}`;

const saveConversationToDB = async (
  currentUserId: string,
  conversation: {
    chatId: string;
    otherUser: { uid: string; name: string; photo: string };
    lastMessage: string;
    lastTimestamp: number;
    unreadCount: number;
  }
) => {
  if (!currentUserId || currentUserId === 'N/A') return;
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(getConversationsDBName(currentUserId), 2);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(CONVERSATIONS_STORE)) {
          database.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'chatId' });
        }
      };
    });
    const transaction = db.transaction([CONVERSATIONS_STORE], 'readwrite');
    const store = transaction.objectStore(CONVERSATIONS_STORE);
    store.put(conversation);
    db.close();
  } catch (error) {
    console.error('Conversation save error:', error);
  }
};

const openMessagesDB = (userId: string): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(getChatMessagesDBName(userId), 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const store = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
        store.createIndex('chatId', 'chatId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// Messages save karo IndexedDB mein
const saveMessagesToDB = async (currentUserId: string, chatId: string, messages: Message[]) => {
  if (!currentUserId || currentUserId === 'N/A') return;
  try {
    const db = await openMessagesDB(currentUserId);
    const transaction = db.transaction([MESSAGES_STORE], 'readwrite');
    const store = transaction.objectStore(MESSAGES_STORE);

    const index = store.index('chatId');
    const oldMessages = await new Promise<any[]>((resolve, reject) => {
      const request = index.getAll(chatId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    oldMessages.forEach(msg => {
      store.delete(msg.id);
    });

    messages.forEach(msg => {
      store.put({
        ...msg,
        chatId: chatId,
      });
    });

    db.close();
  } catch (error) {
    console.error('Messages save error:', error);
  }
};

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

const loadMessagesFromDB = async (currentUserId: string, chatId: string): Promise<Message[]> => {
  if (!currentUserId || currentUserId === 'N/A') return [];
  try {
    const db = await openMessagesDB(currentUserId);
    const transaction = db.transaction([MESSAGES_STORE], 'readonly');
    const store = transaction.objectStore(MESSAGES_STORE);
    const index = store.index('chatId');

    const messages = await new Promise<Message[]>((resolve, reject) => {
      const request = index.getAll(chatId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return messages;
  } catch (error) {
    console.error('Messages load error:', error);
    return [];
  }
};

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: number;
  type?: 'message' | 'room_invite' | 'image';
  imageUrl?: string;
  roomData?: {
    roomId: string;
    roomName: string;
    roomImage: string;
  };
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  } | null;
}

interface ChatScreenProps {
  currentUser: { uid: string; name: string; photo: string };
  targetUser: { uid: string; name: string; photo: string };
  onClose: () => void;
  onJoinRoom?: (roomId: string) => void;
  sharedRoomData?: {
    roomId: string;
    roomName: string;
    roomImage: string;
  } | null;
}

const FIXED_CHAT_UIDS = ['hurry_team_official', 'hurry_system_official'];

export default function ChatScreen({
  currentUser,
  targetUser,
  onClose,
  onJoinRoom,
  sharedRoomData,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [online, setOnline] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [longPressMsg, setLongPressMsg] = useState<Message | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeMsgId, setSwipeMsgId] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  
  const [isBlocked, setIsBlocked] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSentInviteRoomIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFixedChat = FIXED_CHAT_UIDS.includes(targetUser.uid);
  const chatId = [currentUser.uid, targetUser.uid].sort().join('_');

  // ========== Toast notification helper ==========
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  // ========== Online status ==========
  useEffect(() => {
    if (isFixedChat) {
      setOnline(true);
      return;
    }

    const handlePresence = (data: { userId: string; online: boolean }) => {
      if (data.userId === targetUser.uid) {
        setOnline(data.online);
      }
    };

    socket.on('presence_status', handlePresence);
    socket.emit('check_presence', targetUser.uid);

    return () => {
      socket.off('presence_status', handlePresence);
    };
  }, [targetUser.uid, isFixedChat]);

  // ========== Load private chat history from backend ==========
  useEffect(() => {
    setMessages([]);
    setIsLoadingMessages(true);

    if (!currentUser.uid || !targetUser.uid) {
      setIsLoadingMessages(false);
      return;
    }

    loadMessagesFromDB(currentUser.uid, chatId)
      .then(async (localMessages) => {
        const sorted = [...localMessages].sort(
          (a, b) => a.timestamp - b.timestamp
        );
        setMessages(sorted);

        let hasUnread = false;
        localMessages.forEach((m: any) => {
          if (m.isUnread) hasUnread = true;
        });

        if (hasUnread) {
          try {
            const db = await openMessagesDB(currentUser.uid);
            const tx = db.transaction([MESSAGES_STORE], 'readwrite');
            const store = tx.objectStore(MESSAGES_STORE);
            localMessages.forEach((m: any) => {
              if (m.isUnread) {
                store.put({ ...m, isUnread: false });
              }
            });
            tx.oncomplete = () => {
              db.close();
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('unread_count_updated'));
              }
            };
            tx.onerror = () => db.close();
          } catch (e) {
            console.error('Error clearing unread status:', e);
          }
        }
      })
      .catch((error) => {
        console.error('Local message history load error:', error);
        setMessages([]);
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });
  }, [chatId, currentUser.uid, targetUser.uid]);

  // ========== Socket.IO private messages ==========
  useEffect(() => {
    socket.connect();

    const registerUser = () => {
      const accNum = typeof window !== 'undefined' ? localStorage.getItem('accountNumber') || '' : '';
      socket.emit('register', {
        userId: currentUser.uid,
        accountId: accNum
      });
      socket.emit('check_presence', targetUser.uid);
      if (isFixedChat) {
        socket.emit('official_message_history_request');
      }
    };

    const handleOfficialBroadcast = async (data: any) => {
      if (!data?.senderId || data.senderId !== targetUser.uid) return;

      const message: Message = {
        id: String(data.id || `official_${data.timestamp || Date.now()}`),
        text: data.text || '',
        sender: 'other',
        timestamp: Number(data.timestamp || Date.now()),
        type: data.type || 'message',
        imageUrl: data.imageUrl || undefined,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;

        const updated = [...prev, message].sort(
          (a, b) => a.timestamp - b.timestamp
        );

        saveMessagesToDB(currentUser.uid, chatId, updated);
        saveConversationToDB(currentUser.uid, {
          chatId,
          otherUser: { uid: targetUser.uid, name: targetUser.name, photo: targetUser.photo },
          lastMessage: message.type === 'image' ? '📷 Image' : message.text,
          lastTimestamp: message.timestamp,
          unreadCount: 0,
        });
        return updated;
      });
    };

    const handlePrivateMessage = async (data: any) => {
      if (data?.senderId !== targetUser.uid || data?.receiverId !== currentUser.uid) return;

      const message: Message = {
        id: String(data.id || `${data.senderId}_${data.timestamp || Date.now()}`),
        text: data.text || '',
        sender: 'other',
        timestamp: Number(data.timestamp || Date.now()),
        type: data.type || 'message',
        imageUrl: data.imageUrl || undefined,
        roomData: data.roomData || undefined,
        replyTo: data.replyTo || null,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;

        const updated = [...prev, message].sort((a, b) => a.timestamp - b.timestamp);

        saveMessagesToDB(currentUser.uid, chatId, updated);
        saveConversationToDB(currentUser.uid, {
          chatId,
          otherUser: { uid: targetUser.uid, name: targetUser.name, photo: targetUser.photo },
          lastMessage: message.type === 'image' ? '📷 Image' : message.text,
          lastTimestamp: message.timestamp,
          unreadCount: 0,
        });
        return updated;
      });
      setConnected(true);
    };

    const handleConnect = () => {
      setConnected(true);
      registerUser();
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', () => setConnected(false));
    socket.on('private_message', handlePrivateMessage);
    socket.on('official_broadcast_message', handleOfficialBroadcast);

    if (socket.connected) registerUser();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect');
      socket.off('private_message', handlePrivateMessage);
      socket.off('official_broadcast_message', handleOfficialBroadcast);
    };
  }, [chatId, currentUser.uid, targetUser.uid, isFixedChat]);

  // ========== Send message helpers ==========
  const handleSend = async () => {
    if (!newMessage.trim() || isBlocked) return;
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const messageId = `${currentUser.uid}_${Date.now()}`;
      const outgoing = {
        id: messageId,
        senderId: currentUser.uid,
        receiverId: targetUser.uid,
        senderName: currentUser.name || 'User',
        senderPhoto: currentUser.photo || '/default-avatar.png',
        receiverName: targetUser.name || 'User',
        receiverPhoto: targetUser.photo || '/default-avatar.png',
        text: messageText,
        type: 'message',
        timestamp: Date.now(),
        replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, senderName: replyTo.sender === 'me' ? currentUser.name : targetUser.name } : null,
      };

      socket.emit('private_message', outgoing);

      const localMessage: any = {
        ...outgoing,
        sender: 'me',
        targetUserName: targetUser.name,
        targetUserPhoto: targetUser.photo,
      };

      setMessages((prev) => {
        const updated = [...prev, localMessage];
        saveMessagesToDB(currentUser.uid, chatId, updated);
        return updated;
      });
      setReplyTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isBlocked) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const base64 = await compressImage(file, 1200, 1200, 0.85);
      const messageId = `${currentUser.uid}_${Date.now()}`;
      const outgoing = {
        id: messageId,
        senderId: currentUser.uid,
        receiverId: targetUser.uid,
        senderName: currentUser.name || 'User',
        senderPhoto: currentUser.photo || '/default-avatar.png',
        receiverName: targetUser.name || 'User',
        receiverPhoto: targetUser.photo || '/default-avatar.png',
        text: '',
        type: 'image',
        imageUrl: base64,
        timestamp: Date.now(),
        replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, senderName: replyTo.sender === 'me' ? currentUser.name : targetUser.name } : null,
      };

      socket.emit('private_message', outgoing);

      const localMessage: any = {
        ...outgoing,
        sender: 'me',
      };

      setMessages((prev) => {
        const updated = [...prev, localMessage];
        saveMessagesToDB(currentUser.uid, chatId, updated);
        return updated;
      });
      setReplyTo(null);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ========== Block / Unblock Toggle ==========
  const handleToggleBlock = async () => {
    try {
      const action = isBlocked ? 'unblock' : 'block';
      const endpoint = isBlocked ? '/api/users/unblock' : '/api/users/block';

      // Yaha par aapka actual backend call chalega
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockedBy: currentUser.uid,
          blockedUser: targetUser.uid,
        }),
      });

      if (isBlocked) {
        setIsBlocked(false);
        showToast("Unblocked User");
      } else {
        setIsBlocked(true);
        showToast("You blocked this user");
      }
      
      setShowOptions(false);
    } catch (error) {
      console.error(`Error ${isBlocked ? 'unblocking' : 'blocking'} user:`, error);
      // Agar API fail bhi ho to UI handle karne ke liye (remove in production if needed)
      setIsBlocked(!isBlocked);
      showToast(isBlocked ? "Unblocked User" : "You blocked this user");
      setShowOptions(false);
    }
  };

  // ========== Actions ==========
  const handleClearChat = async () => {
    try {
      socket.emit('private_message_clear', { userId: currentUser.uid, otherUserId: targetUser.uid, chatId });
      const db = await openMessagesDB(currentUser.uid);
      const transaction = db.transaction([MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);
      const index = store.index('chatId');
      const request = index.getAll(chatId);

      request.onsuccess = () => {
        request.result.forEach((msg: any) => store.delete(msg.id));
        db.close();
      };

      setMessages([]);
      setShowOptions(false);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const handleDeleteSelectedMessages = async () => {
    try {
      const db = await openMessagesDB(currentUser.uid);
      const transaction = db.transaction([MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);
      selectedMessages.forEach((msgId) => store.delete(msgId));
      db.close();

      setMessages((prev) => prev.filter((m) => !selectedMessages.has(m.id)));
      setDeleteMode(false);
      setSelectedMessages(new Set());
      setShowDeleteSelectedConfirm(false);
      setShowOptions(false);
    } catch (error) {
      console.error('Error deleting messages:', error);
    }
  };

  const toggleMessageSelection = (msgId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(msgId)) newSelected.delete(msgId);
    else newSelected.add(msgId);
    setSelectedMessages(newSelected);
  };

  // ========== Auto-scroll ==========
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatDateHeader = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    else if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    else return date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ========================= RENDER =========================
  return (
    <div className="fixed inset-0 z-50 bg-[#f0f2f5] flex flex-col">
      {/* ----- Header ----- */}
      <div
        className="px-4 pb-3 flex items-center gap-3 sticky top-0 z-10"
        style={{
          background: 'linear-gradient(to bottom, #3b82f6 0%, #f0f2f5 100%)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        }}
      >
        <button onClick={onClose} className="flex-shrink-0 hover:bg-white/30 rounded-full p-1">
          <ArrowLeft size={24} className="text-gray-800" />
        </button>

        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          <img src={targetUser.photo || '/default-avatar.png'} alt={targetUser.name} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-800 truncate">{targetUser.name}</h2>
          {!isFixedChat && (
            <span className={`text-xs ${online ? 'text-green-500' : 'text-gray-600'}`}>
              {online ? 'Online' : 'Offline'}
            </span>
          )}
        </div>

        {deleteMode ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{selectedMessages.size} selected</span>
            <button
              onClick={() => setShowDeleteSelectedConfirm(true)}
              disabled={selectedMessages.size === 0}
              className="px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium disabled:opacity-50"
            >
              Delete
            </button>
            <button
              onClick={() => { setDeleteMode(false); setSelectedMessages(new Set()); }}
              className="p-1.5 hover:bg-white/30 rounded-full"
            >
              <X size={20} className="text-gray-800" />
            </button>
          </div>
        ) : (
          !isFixedChat && (
            <div className="relative">
              <button onClick={() => setShowOptions(!showOptions)} className="flex-shrink-0 hover:bg-white/30 rounded-full p-1">
                <MoreHorizontal size={24} className="text-gray-800" />
              </button>
            </div>
          )
        )}
      </div>

      {/* ----- Bottom Sheet Options Menu ----- */}
      {showOptions && !isFixedChat && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/50 transition-opacity" onClick={() => setShowOptions(false)} />
          <div className="fixed bottom-0 left-0 right-0 h-[35vh] bg-black rounded-t-2xl z-[70] flex flex-col py-4 shadow-2xl animate-in slide-in-from-bottom duration-200 px-4">
            
            {/* Direct options in black sheet without inner card/lines */}
            <div className="flex-1 flex flex-col justify-evenly">
              <button
                onClick={() => { setShowOptions(false); setShowReportConfirm(true); }}
                className="w-full py-3 text-center text-white font-medium hover:bg-white/10 rounded-lg transition-colors"
              >
                Report
              </button>
              <button
                onClick={handleClearChat}
                className="w-full py-3 text-center text-white font-medium hover:bg-white/10 rounded-lg transition-colors"
              >
                Clear Chat
              </button>
              <button
                onClick={() => { setShowOptions(false); setDeleteMode(true); }}
                className="w-full py-3 text-center text-white font-medium hover:bg-white/10 rounded-lg transition-colors"
              >
                Delete Messages
              </button>
              <button
                onClick={handleToggleBlock}
                className="w-full py-3 text-center text-white font-medium hover:bg-white/10 rounded-lg transition-colors"
              >
                {isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>

            <button
              onClick={() => setShowOptions(false)}
              className="w-full py-3.5 bg-blue-500 text-white font-bold rounded-xl transition-colors mt-2"
            >
              Cancel
            </button>

          </div>
        </>
      )}

      {/* ----- Toast Notification (Block/Unblock) ----- */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/80 text-white px-5 py-2.5 rounded-full text-sm font-medium z-[100] shadow-lg animate-in fade-in zoom-in duration-200">
          {toastMsg}
        </div>
      )}

      {/* ----- Messages area ----- */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-transparent">
        {isLoadingMessages && messages.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {(() => {
          let lastDateString = '';

          return messages.map((msg) => {
            const isMine = msg.sender === 'me';
            const isSelected = selectedMessages.has(msg.id);

            const msgDate = new Date(msg.timestamp).toDateString();
            const showDateHeader = msgDate !== lastDateString;
            lastDateString = msgDate;

            // Checkbox for Delete Mode
            const CheckboxRender = () => (
              <div 
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer ${
                  isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400 bg-white'
                }`}
              >
                {isSelected && <Check size={12} className="text-white" />}
              </div>
            );

            return (
              <React.Fragment key={msg.id}>
                
                {/* Date Header */}
                {showDateHeader && (
                  <div className="flex justify-center my-4">
                    <span className="bg-gray-300/50 text-gray-600 font-medium text-[11px] px-3 py-1 rounded-lg">
                      {formatDateHeader(msg.timestamp)}
                    </span>
                  </div>
                )}

                <div 
                  className={`flex items-center gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                  onClick={() => deleteMode && toggleMessageSelection(msg.id)}
                >
                  {/* Left Checkbox for Other User */}
                  {deleteMode && !isMine && <CheckboxRender />}

                  <div className={`flex items-end ${isMine ? 'justify-end' : 'justify-start'} max-w-[85%]`}>
                    
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mr-2 mb-1">
                        <img src={targetUser.photo || '/default-avatar.png'} alt={targetUser.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    
                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      
                      {msg.type === 'image' && msg.imageUrl ? (
                        <div className={`rounded-2xl overflow-hidden relative ${isMine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                          <img
                            src={msg.imageUrl}
                            alt="Shared"
                            className="max-w-full h-auto max-h-64 object-cover cursor-pointer"
                            onClick={() => !deleteMode && setSelectedImageModal(msg.imageUrl || null)}
                          />
                        </div>
                      ) : (
                        <div className={`px-3 py-2 rounded-2xl break-words relative ${
                            isMine ? 'bg-[#374151] text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md'
                          }`}
                        >
                          {msg.replyTo && (
                            <div className="border-l-4 border-blue-400 pl-2 mb-1 bg-black/10 rounded p-1">
                              <p className="text-[10px] font-semibold text-blue-400">{msg.replyTo.senderName}</p>
                              <p className={`text-[11px] truncate ${isMine ? 'text-gray-300' : 'text-gray-600'}`}>{msg.replyTo.text}</p>
                            </div>
                          )}
                          <p className="text-sm">{msg.text}</p>
                        </div>
                      )}

                    </div>

                    {isMine && (
                      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ml-2 mb-1">
                        <img src={currentUser.photo || '/default-avatar.png'} alt={currentUser.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Right Checkbox for My User */}
                  {deleteMode && isMine && <CheckboxRender />}
                </div>
              </React.Fragment>
            );
          });
        })()}
        
        <div ref={messagesEndRef} />
      </div>

      {/* ----- Image Modal ----- */}
      {selectedImageModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImageModal(null)}>
          <button className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full hover:bg-black/70">
            <X size={24} />
          </button>
          <img src={selectedImageModal} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}

      {/* ----- Input Area ----- */}
      {isFixedChat ? (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center pb-5">
          <p className="text-xs text-gray-400">This is an official account. You cannot reply here.</p>
        </div>
      ) : !deleteMode && (
        <div className="px-4 py-3 bg-white flex items-center gap-2 pb-5">
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" disabled={isBlocked} />
          <button
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={imageUploading || isBlocked}
          >
            {imageUploading ? <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /> : <ImageIcon size={24} />}
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder={isBlocked ? "Cannot send messages" : "Type a message..."}
            disabled={isBlocked}
            className="flex-1 bg-gray-100 text-black rounded-full px-4 py-2.5 text-sm outline-none disabled:opacity-70"
          />
          <button onClick={handleSend} disabled={!newMessage.trim() || isBlocked} className="text-blue-500 disabled:text-gray-300">
            <Send size={24} />
          </button>
        </div>
      )}

    </div>
  );
}

