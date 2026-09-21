const fs = require('fs');

const path = 'components/HomePage.tsx';
let data = fs.readFileSync(path, 'utf8');

// 1. Target the specific element rendering the unread badge directly via replace string
const originalBadgeHTML = `
                {totalUnreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-white shadow-sm animate-pulse">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </div>
                )}
`;

const updatedBadgeHTML = `
                {totalUnreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </div>
                )}
`;

data = data.replace(originalBadgeHTML, updatedBadgeHTML);

// 2. Add appNotifications check and audio logic in handleIncomingPrivateMsg
const incomingPrivMsgCode = `
      if (senderId !== userUID) {
        const notifsEnabled = localStorage.getItem('appNotifications') !== 'false';
        if (notifsEnabled) {
          setTopNotification({
            id: String(data.id || Date.now()),
            senderName: data.senderName || 'User',
            senderPhoto: data.senderPhoto || '/default-avatar.png',
            text: data.type === 'image' ? '📷 Image' : String(data.text || ''),
            senderId,
          });

          // Play sound
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.error("Error playing sound:", e));

          if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
          notificationTimerRef.current = setTimeout(() => {
            setTopNotification(null);
          }, 3800);
        }
      }
    };
`;

data = data.replace(
  `      if (senderId !== userUID) {
        setTopNotification({
          id: String(data.id || Date.now()),
          senderName: data.senderName || 'User',
          senderPhoto: data.senderPhoto || '/default-avatar.png',
          text: data.type === 'image' ? '📷 Image' : String(data.text || ''),
          senderId,
        });

        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = setTimeout(() => {
          setTopNotification(null);
        }, 3800);
      }
    };`,
  incomingPrivMsgCode
);

fs.writeFileSync(path, data);
