1. **Add Notification Sound**
    - Download a simple notification sound and save it as `public/notification.mp3`.
2. **Implement Block Backend (`backend/server.js`)**
    - Add `POST /api/users/block` endpoint to add a block relationship (`blockerId`, `blockedId`) to a `blocks` collection.
    - Add `POST /api/users/unblock` endpoint to remove the block relationship.
    - In `socket.on("private_message")`, before emitting the message to the receiver, query the `blocks` collection. If the receiver has blocked the sender, block the message from being sent to the receiver.
3. **Fix Notifications settings UI (`components/settingpage.tsx`)**
    - Persist the `isNotificationsEnabled` state to `localStorage` under the key `'appNotifications'`.
    - Retrieve the initial value from `localStorage` on component mount.
4. **Fix HomePage UI and logic (`components/HomePage.tsx`)**
    - Remove the `animate-pulse` and `border-2 border-white` classes from the unread message badge (around line 3866).
    - In `handleIncomingPrivateMsg`, check `localStorage.getItem('appNotifications')`. If it's `'false'`, do not show the `topNotification`.
    - If notifications are enabled, play the `notification.mp3` sound when showing the `topNotification` slider.
5. **Fix Profile Data in Chat (`components/ChatScreen.tsx`)**
    - When emitting a new message, strictly pass `targetUserName: targetUser.name` and `targetUserPhoto: targetUser.photo` inside the `outgoing` object (not just `localMessage`) or directly pass them as `receiverName`/`receiverPhoto` as already present. We must ensure `components/MessagePage.tsx` correctly gets this info. Wait, `outgoing` already has `receiverName` and `receiverPhoto`. Let's verify `MessagePage.tsx`.
6. **Fix Message Page profile updates (`components/MessagePage.tsx`)**
    - Currently, `MessagePage` skips updating the avatar and name if `existing` chat preview already has them set (or checks if it is `User`/`default-avatar.png`).
    - The bug: if we message a user, the receiver info is set correctly. But maybe it's not being parsed correctly for `isMe` = true. I will update `MessagePage.tsx` to always use the latest `receiverName`/`receiverPhoto` if they are valid.
7. **Complete pre-commit steps**
    - Run `pre_commit_instructions` tool to perform required tests and verifications.
8. **Submit**
    - Submit the changes using the `submit` tool.
