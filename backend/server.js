require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { MongoClient } = require("mongodb");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 2 * 1024 * 1024,
});

const mongoClient = process.env.MONGODB_URI
  ? new MongoClient(process.env.MONGODB_URI)
  : null;

let db = null;

const onlineUsers = new Map();

/*
 * roomId -> Map(userId -> socket count)
 */
const roomUsers = new Map();

/*
 * roomId -> Map(seatNumber -> seat state)
 * Seat state is kept in memory because it only represents the
 * currently active room session.
 */
const roomSeats = new Map();

function getRoomSeats(roomId) {
  const room = roomSeats.get(String(roomId));
  if (!room) return [];

  return Array.from(room.values()).sort(
    (a, b) => Number(a.number) - Number(b.number)
  );
}

function emitRoomSeats(roomId) {
  const room = String(roomId);
  io.to(`room:${room}`).emit("room_seats", {
    roomId: room,
    seats: getRoomSeats(room),
  });
}

const pendingSeatDisconnects = new Map();

function cancelPendingSeatDisconnect(roomId, userId) {
  const key = `${String(roomId)}:${String(userId)}`;
  const timer = pendingSeatDisconnects.get(key);
  if (timer) {
    clearTimeout(timer);
    pendingSeatDisconnects.delete(key);
  }
}

function clearUserSeat(roomId, userId) {
  const room = roomSeats.get(String(roomId));
  if (!room) return false;

  let changed = false;

  for (const [number, seat] of room.entries()) {
    if (
      seat?.isOccupied &&
      (String(seat?.user?.accountId) === String(userId) ||
       String(seat?.user?.userId) === String(userId))
    ) {
      room.set(number, {
        ...seat,
        isOccupied: false,
        user: undefined,
        isMuted: false,
        isSpeaking: false,
        gif: undefined,
      });
      changed = true;
    }
  }

  if (room.size === 0) {
    roomSeats.delete(String(roomId));
  }

  return changed;
}

function clearUserSeatGracefully(roomId, userId, delayMs = 5000) {
  const room = String(roomId);
  const id = String(userId);
  const key = `${room}:${id}`;

  cancelPendingSeatDisconnect(room, id);

  if (delayMs <= 0) {
    if (clearUserSeat(room, id)) {
      emitRoomSeats(room);
    }
    return;
  }

  const timer = setTimeout(() => {
    pendingSeatDisconnects.delete(key);
    if (clearUserSeat(room, id)) {
      emitRoomSeats(room);
    }
  }, delayMs);

  pendingSeatDisconnects.set(key, timer);
}


function getRoomUsers(roomId) {
  const users = roomUsers.get(String(roomId));
  if (!users) return [];

  return Array.from(users.entries()).map(([userId, data]) => ({
    accountId: String(data?.accountId || userId),
    userId: String(data?.userId || userId),
    name: data?.name || "User",
    image: data?.image || "/default-avatar.png",
    email: data?.email || "",
  }));
}

function addUserToRoom(roomId, userId, userData = {}) {
  if (!roomId || !userId) return;

  const room = String(roomId);
  const id = String(userId);

  if (!roomUsers.has(room)) {
    roomUsers.set(room, new Map());
  }

  const users = roomUsers.get(room);
  const existing = users.get(id);

  if (existing) {
    existing.count += 1;
    existing.name = userData.name || existing.name || "User";
    existing.image =
      userData.image ||
      existing.image ||
      "/default-avatar.png";
    existing.email = userData.email || existing.email || "";
  } else {
    users.set(id, {
      count: 1,
      userId: id,
      accountId: id,
      name: userData.name || "User",
      image: userData.image || "/default-avatar.png",
      email: userData.email || "",
    });
  }
}

function removeUserFromRoom(roomId, userId) {
  if (!roomId || !userId) return;

  const room = String(roomId);
  const id = String(userId);

  const users = roomUsers.get(room);
  if (!users) return;

  const existing = users.get(id);
  if (!existing) return;

  if (Number(existing.count || 0) <= 1) {
    users.delete(id);
  } else {
    existing.count -= 1;
    users.set(id, existing);
  }

  if (users.size === 0) {
    roomUsers.delete(room);
  }
}

function emitRoomPresence(roomId) {
  if (!roomId) return;

  const room = String(roomId);
  const users = getRoomUsers(room);

  io.to(`room:${room}`).emit("room_presence", {
    roomId: room,
    users,
    activeUserCount: users.length,
  });
}

function emitGlobalRoomPresence() {
  const rooms = getGlobalRoomPresence();

  io.emit("global_room_presence", {
    rooms,
  });
}

function markUserOnline(userId, socket, accountId = null) {
  if (!userId) return;

  const id = String(userId);
  const account = accountId ? String(accountId) : null;

  if (
    socket.userId === id &&
    socket.accountId === account &&
    socket.isPresenceRegistered
  ) {
    return;
  }

  socket.userId = id;
  socket.accountId = account;
  socket.isPresenceRegistered = true;

  socket.presenceIds = new Set([id]);

  if (account) {
    socket.presenceIds.add(account);
  }

  socket.presenceIds.forEach((presenceId) => {
    socket.join(`user:${presenceId}`);

    const count = onlineUsers.get(presenceId) || 0;
    onlineUsers.set(presenceId, count + 1);

    if (count === 0) {
      socket.broadcast.emit("user_online", presenceId);
    }
  });

  socket.emit("presence_status", {
    userId: id,
    accountId: account,
    online: true,
  });
}

function markUserOffline(socket) {
  if (!socket.isPresenceRegistered) {
    return;
  }

  socket.isPresenceRegistered = false;

  const presenceIds =
    socket.presenceIds ||
    new Set(
      [
        socket.userId,
        socket.accountId,
      ].filter(Boolean)
    );

  presenceIds.forEach((presenceId) => {
    const id = String(presenceId);
    const count = onlineUsers.get(id) || 0;

    if (count <= 1) {
      onlineUsers.delete(id);
      socket.broadcast.emit("user_offline", id);
    } else {
      onlineUsers.set(id, count - 1);
    }
  });

  socket.presenceIds = new Set();
}

function getGlobalRoomPresence() {
  return Array.from(roomUsers.entries()).map(
    ([roomId, users]) => ({
      roomId: String(roomId),
      users: getRoomUsers(roomId),
      activeUserCount: users.size,
    })
  );
}


// ==================== USERS API ====================

app.get("/api/users", async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        error: "MongoDB is not connected",
      });
    }

    const uid = String(req.query.uid || "").trim();
    const accountId = String(req.query.accountId || "").trim();

    const users = db.collection("users");

    // No query = return all registered users.
    // Used by the Owner Panel.
    if (!uid && !accountId) {
      const allUsers = await users
        .find({})
        .sort({ createdAt: -1 })
        .limit(1000)
        .toArray();

      const normalizedUsers = allUsers.map((user) => {
        const numberId = String(
          user.accountId ||
          user.accountNumber ||
          user["Account Number"] ||
          user.displayUserNumber ||
          ""
        );

        return {
          ...user,
          id: String(
            user.id ||
            user.uid ||
            user.appLongId ||
            user._id ||
            ""
          ),
          uid: String(
            user.uid ||
            user.id ||
            user.appLongId ||
            ""
          ),
          appLongId: String(
            user.appLongId ||
            user.id ||
            user.uid ||
            ""
          ),
          accountId: numberId,
          accountNumber: numberId,
          displayUserNumber: numberId,
          name:
            user.name ||
            user.displayName ||
            user.userName ||
            "User",
          image:
            user.image ||
            user.photo ||
            user.photoURL ||
            user.avatar ||
            "/default-avatar.png",
          country:
            user.country ||
            "🇮🇳",
        };
      });

      return res.json({
        users: normalizedUsers,
      });
    }

    let user = null;

    if (uid) {
      user = await users.findOne({
        $or: [
          { uid },
          { id: uid },
          { appLongId: uid },
        ],
      });
    }

    if (!user && accountId) {
      user = await users.findOne({
        $or: [
          { accountId },
          { accountNumber: accountId },
          { "Account Number": accountId },
          { displayUserNumber: accountId },
        ],
      });
    }

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const numberId = String(
      user.accountId ||
      user.accountNumber ||
      user["Account Number"] ||
      user.displayUserNumber ||
      ""
    );

    return res.json({
      user: {
        ...user,
        id: String(
          user.id ||
          user.uid ||
          user.appLongId ||
          user._id ||
          ""
        ),
        uid: String(
          user.uid ||
          user.id ||
          user.appLongId ||
          ""
        ),
        appLongId: String(
          user.appLongId ||
          user.id ||
          user.uid ||
          ""
        ),
        accountId: numberId,
        accountNumber: numberId,
        displayUserNumber: numberId,
        name:
          user.name ||
          user.displayName ||
          user.userName ||
          "User",
        image:
          user.image ||
          user.photo ||
          user.photoURL ||
          user.avatar ||
          "/default-avatar.png",
        country:
          user.country ||
          "🇮🇳",
      },
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return res.status(500).json({
      error: "Failed to fetch user",
    });
  }
});

app.put("/api/users", async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        error: "MongoDB is not connected",
      });
    }

    const data = req.body || {};

    const uid = String(
      data.uid ||
      data.id ||
      data.appLongId ||
      ""
    ).trim();

    if (!uid) {
      return res.status(400).json({
        error: "Missing user uid",
      });
    }

    const accountId = String(
      data.accountId ||
      data.accountNumber ||
      data["Account Number"] ||
      data.displayUserNumber ||
      ""
    ).trim();

    const users = db.collection("users");

    const userData = {
      ...data,
      id: String(data.id || uid),
      uid,
      appLongId: String(data.appLongId || uid),
      accountId,
      accountNumber: accountId,
      displayUserNumber: accountId,
      updatedAt: Date.now(),
    };

    await users.updateOne(
      {
        $or: [
          { uid },
          { id: uid },
          { appLongId: uid },
        ],
      },
      {
        $set: userData,
        $setOnInsert: {
          createdAt: Date.now(),
        },
      },
      { upsert: true }
    );

    return res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("PUT /api/users error:", error);
    return res.status(500).json({
      error: "Failed to save user",
    });
  }
});

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "Hurry Backend",
    socket: "ready",
    database: db
      ? "mongodb-connected"
      : "mongodb-connecting",
    onlineUsers: onlineUsers.size,
    activeRooms: roomUsers.size,
  });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (payload) => {
    const userId =
      typeof payload === "object"
        ? payload.userId || payload.uid || payload.id
        : payload;

    const accountId =
      typeof payload === "object"
        ? payload.accountId
        : null;

    if (!userId) return;

    markUserOnline(
      String(userId),
      socket,
      accountId ? String(accountId) : null
    );

    socket.emit("global_room_presence", {
      rooms: getGlobalRoomPresence(),
    });
  });

  socket.on("presence_online", (userId) => {
    if (!userId) return;

    markUserOnline(String(userId), socket);
  });

  socket.on("check_presence", (userId) => {
    if (!userId) return;

    const id = String(userId);

    socket.emit("presence_status", {
      userId: id,
      online: onlineUsers.has(id),
    });
  });

  socket.on(
    "room_presence_request",
    ({ roomId } = {}) => {
      if (!roomId) return;

      const room = String(roomId);
      const users = getRoomUsers(room);

      socket.emit("room_presence", {
        roomId: room,
        users,
        activeUserCount: users.length,
      });
    }
  );

  socket.on(
    "global_room_presence_request",
    () => {
      socket.emit("global_room_presence", {
        rooms: getGlobalRoomPresence(),
      });
    }
  );

  socket.on(
    "room_join",
    ({ roomId, userId, accountId, name, dp, email } = {}) => {
      if (!roomId || !userId) return;

      const room = String(roomId);
      const id = String(userId);
      const accId = accountId ? String(accountId) : id;

      cancelPendingSeatDisconnect(room, id);
      cancelPendingSeatDisconnect(room, accId);

      // Prevent duplicate joins from increasing the live count.
      if (
        socket.roomId === room &&
        socket.roomUserId === id
      ) {
        const users = getRoomUsers(room);

        socket.emit("room_presence", {
          roomId: room,
          users,
          activeUserCount: users.length,
        });

        socket.emit("room_seats", {
          roomId: room,
          seats: getRoomSeats(room),
        });

        return;
      }

      if (socket.roomId) {
        const oldRoom = String(socket.roomId);
        const oldUser =
          socket.roomUserId ||
          socket.userId;

        if (oldRoom !== room) {
          socket.leave(`room:${oldRoom}`);

          clearUserSeatGracefully(oldRoom, oldUser, 0);

          removeUserFromRoom(
            oldRoom,
            oldUser
          );

          socket
            .to(`room:${oldRoom}`)
            .emit("room_user_offline", {
              roomId: oldRoom,
              userId: String(oldUser || ""),
            });

          emitRoomPresence(oldRoom);
        }
      }

      socket.join(`room:${room}`);

      socket.roomId = room;
      socket.roomUserId = id;

      addUserToRoom(room, id, {
        name: name || "User",
        image:
          dp ||
          "/default-avatar.png",
        email: email || "",
        accountId: accId,
      });

      const users = getRoomUsers(room);

      socket.emit("room_presence", {
        roomId: room,
        users,
        activeUserCount: users.length,
      });

      socket.emit("room_seats", {
        roomId: room,
        seats: getRoomSeats(room),
      });

      socket
        .to(`room:${room}`)
        .emit("room_user_online", {
          roomId: room,
          userId: id,
          user: {
            accountId: id,
            userId: id,
            name: name || "User",
            image:
              dp ||
              "/default-avatar.png",
            email: email || "",
          },
        });

      emitRoomPresence(room);
      emitGlobalRoomPresence();
    }
  );

  socket.on(
    "room_leave",
    ({ roomId, userId } = {}) => {
      const room = roomId
        ? String(roomId)
        : socket.roomId;

      if (!room) return;

      const id = String(
        userId ||
        socket.roomUserId ||
        socket.userId ||
        ""
      );

      socket.leave(`room:${room}`);

      clearUserSeatGracefully(room, id, 0);

      removeUserFromRoom(room, id);

      socket
        .to(`room:${room}`)
        .emit("room_user_offline", {
          roomId: room,
          userId: id,
        });

      emitRoomPresence(room);

      if (socket.roomId === room) {
        socket.roomId = null;
        socket.roomUserId = null;
      }

      emitGlobalRoomPresence();
    }
  );

  socket.on("room_seats_request", ({ roomId } = {}) => {
    if (!roomId) return;

    const room = String(roomId);

    // Only return seats for a room this socket has actually joined.
    if (String(socket.roomId || "") !== room) {
      return;
    }

    socket.emit("room_seats", {
      roomId: room,
      seats: getRoomSeats(room),
    });
  });

  socket.on("room_seat_action", (data = {}) => {
    const roomId = data.roomId ? String(data.roomId) : "";
    const userId = data.userId ? String(data.userId) : "";
    const action = data.action;
    const seatNumber = Number(data.seatNumber);

    if (
      !roomId ||
      !userId ||
      !Number.isFinite(seatNumber)
    ) {
      return;
    }

    // Only a user who is actually joined to this room can control a seat.
    if (
      String(socket.roomId || "") !== roomId ||
      String(socket.roomUserId || socket.userId || "") !== userId
    ) {
      return;
    }

    if (!roomSeats.has(roomId)) {
      roomSeats.set(roomId, new Map());
    }

    const seats = roomSeats.get(roomId);

    const current = seats.get(seatNumber) || {
      number: seatNumber,
      isOccupied: false,
      isLocked: false,
      isMuted: false,
      isSpeaking: false,
    };

    if (action === "take") {
      // One user can occupy only one seat.
      for (const [number, seat] of seats.entries()) {
        if (
          seat?.isOccupied &&
          String(seat?.user?.accountId) === userId &&
          Number(number) !== seatNumber
        ) {
          seats.set(number, {
            ...seat,
            isOccupied: false,
            user: undefined,
            isMuted: false,
            isSpeaking: false,
            gif: undefined,
          });
        }
      }

      if (
        current.isLocked &&
        !current.isOccupied
      ) {
        emitRoomSeats(roomId);
        return;
      }

      if (
        current.isOccupied &&
        String(current.user?.accountId) !== userId
      ) {
        emitRoomSeats(roomId);
        return;
      }

      seats.set(seatNumber, {
        ...current,
        number: seatNumber,
        isOccupied: true,
        user: {
          name: data.user?.name || "User",
          image:
            data.user?.image ||
            "/default-avatar.png",
          accountId: userId,
        },
        isMuted: false,
        isSpeaking: false,
        gif: undefined,
      });
    }

    if (action === "leave") {
      if (
        current.isOccupied &&
        String(current.user?.accountId) === userId
      ) {
        seats.set(seatNumber, {
          ...current,
          isOccupied: false,
          user: undefined,
          isMuted: false,
          isSpeaking: false,
          gif: undefined,
        });
      }
    }

    if (action === "mute") {
      if (
        current.isOccupied &&
        String(current.user?.accountId) === userId
      ) {
        seats.set(seatNumber, {
          ...current,
          isMuted: Boolean(data.isMuted),
        });
      }
    }

    if (action === "lock") {
      seats.set(seatNumber, {
        ...current,
        isLocked: Boolean(data.isLocked),
      });
    }

    if (action === "emoji") {
      if (
        current.isOccupied &&
        String(current.user?.accountId) === userId
      ) {
        seats.set(seatNumber, {
          ...current,
          gif: {
            src: data.src,
            timestamp: Number(
              data.timestamp || Date.now()
            ),
          },
        });
      }
    }

    // IMPORTANT:
    // Broadcast the complete seat state to EVERYONE in the room.
    emitRoomSeats(roomId);
  });

  socket.on("room_message", (message) => {
    if (
      !message?.roomId ||
      !message?.senderId
    ) {
      return;
    }

    io.to(`room:${message.roomId}`).emit(
      "room_message",
      message
    );
  });

  socket.on("room_clear_chat", (data = {}) => {
    const roomId = data?.roomId ? String(data.roomId) : "";
    if (!roomId) return;

    io.to(`room:${roomId}`).emit("room_chat_cleared", {
      roomId,
      timestamp: Date.now(),
    });
  });

  socket.on("private_message", async (message) => {
    if (
      !message?.senderId ||
      !message?.receiverId
    ) {
      return;
    }

    const receiverId = String(message.receiverId);
    const receiverAccountId = message.receiverAccountId ? String(message.receiverAccountId) : null;

    const normalizedMessage = {
      id: String(message.id || `${message.senderId}_${Date.now()}`),
      senderId: String(message.senderId),
      receiverId,
      receiverAccountId,
      senderName: message.senderName || message.otherUserName || "User",
      senderPhoto: message.senderPhoto || message.otherUserPhoto || "/default-avatar.png",
      text: String(message.text || ""),
      type: message.type || "message",
      imageUrl: message.imageUrl || undefined,
      roomData: message.roomData || undefined,
      replyTo: message.replyTo || null,
      timestamp: Number(message.timestamp || Date.now()),
    };

    try {
      if (db) {
        await db.collection("privateMessages").updateOne(
          { id: normalizedMessage.id },
          { $set: normalizedMessage },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error("Private message save failed:", error.message);
    }

    io.to(`user:${receiverId}`).emit(
      "private_message",
      normalizedMessage
    );

    if (receiverAccountId && receiverAccountId !== receiverId) {
      io.to(`user:${receiverAccountId}`).emit(
        "private_message",
        normalizedMessage
      );
    }
  });

  socket.on("private_message_history_request", async (data = {}) => {
    const userId = String(data.userId || "");
    const otherUserId = String(data.otherUserId || "");

    if (!userId || !otherUserId) {
      socket.emit("private_message_history", {
        chatId: data.chatId || "",
        messages: [],
      });
      return;
    }

    try {
      if (!db) {
        socket.emit("private_message_history", {
          chatId: data.chatId || "",
          messages: [],
        });
        return;
      }

      const messages = await db
        .collection("privateMessages")
        .find({
          $or: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        })
        .sort({ timestamp: 1 })
        .limit(500)
        .toArray();

      socket.emit("private_message_history", {
        chatId: data.chatId || "",
        messages,
      });
    } catch (error) {
      console.error("Private message history failed:", error.message);

      socket.emit("private_message_history", {
        chatId: data.chatId || "",
        messages: [],
      });
    }
  });

  socket.on("private_message_clear", async (data = {}) => {
    const userId = String(data.userId || "");
    const otherUserId = String(data.otherUserId || "");

    if (!userId || !otherUserId || !db) return;

    try {
      await db.collection("privateMessages").deleteMany({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      });

      io.to(`user:${userId}`).emit("private_message_cleared", {
        chatId: data.chatId || "",
      });

      io.to(`user:${otherUserId}`).emit("private_message_cleared", {
        chatId: data.chatId || "",
      });
    } catch (error) {
      console.error("Private message clear failed:", error.message);
    }
  });

  socket.on("private_message_delete", async (data = {}) => {
    const userId = String(data.userId || "");
    const otherUserId = String(data.otherUserId || "");
    const messageId = String(data.messageId || "");

    if (!userId || !otherUserId || !messageId || !db) return;

    try {
      await db.collection("privateMessages").deleteOne({
        id: messageId,
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      });

      io.to(`user:${userId}`).emit("private_message_deleted", {
        chatId: data.chatId || "",
        messageId,
      });

      io.to(`user:${otherUserId}`).emit("private_message_deleted", {
        chatId: data.chatId || "",
        messageId,
      });
    } catch (error) {
      console.error("Private message delete failed:", error.message);
    }
  });

  socket.on("private_message_delete_many", async (data = {}) => {
    const userId = String(data.userId || "");
    const otherUserId = String(data.otherUserId || "");
    const messageIds = Array.isArray(data.messageIds)
      ? data.messageIds.map(String).filter(Boolean)
      : [];

    if (!userId || !otherUserId || !messageIds.length || !db) return;

    try {
      await db.collection("privateMessages").deleteMany({
        id: { $in: messageIds },
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      });

      const payload = {
        chatId: data.chatId || "",
        messageIds,
      };

      io.to(`user:${userId}`).emit("private_messages_deleted", payload);
      io.to(`user:${otherUserId}`).emit("private_messages_deleted", payload);
    } catch (error) {
      console.error("Private messages delete failed:", error.message);
    }
  });

  socket.on("ai_support_message", async (data = {}) => {
    const userId = String(data.userId || "");
    if (!userId) return;

    const payload = {
      userId,
      userName: data.userName || "User",
      userEmail: data.userEmail || "",
      userPhoto: data.userPhoto || data.userImage || "",
      userAccountId: data.userAccountId || "",
      messages: Array.isArray(data.messages) ? data.messages : [],
      lastMessage: data.lastMessage || data.message || null,
      timestamp: Number(data.timestamp || Date.now()),
    };

    try {
      if (db) {
        await db.collection("aiSupportChats").updateOne(
          { userId },
          { $set: payload },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error("AI support message save failed:", error.message);
    }

    // Broadcast AI support chat real-time update to all listeners (including owner panel)
    io.emit("ai_support_message", payload);
  });

  socket.on("ai_support_history_request", async () => {
    try {
      if (db) {
        const chats = await db
          .collection("aiSupportChats")
          .find({})
          .sort({ timestamp: -1 })
          .limit(200)
          .toArray();

        socket.emit("ai_support_history_response", { chats });
      } else {
        socket.emit("ai_support_history_response", { chats: [] });
      }
    } catch (error) {
      console.error("AI support history fetch failed:", error.message);
      socket.emit("ai_support_history_response", { chats: [] });
    }
  });

  socket.on("disconnect", () => {
    const room = socket.roomId;
    const userId =
      socket.roomUserId ||
      socket.userId;

    if (socket.roomId && userId) {
      const room = String(socket.roomId);

      // Grace period of 5s before clearing seat on disconnect
      clearUserSeatGracefully(room, String(userId), 5000);
    }

    if (room && userId) {
      removeUserFromRoom(
        String(room),
        String(userId)
      );

      socket
        .to(`room:${room}`)
        .emit("room_user_offline", {
          roomId: String(room),
          userId: String(userId),
        });

      emitRoomPresence(room);
    }

    markUserOffline(socket);

    emitGlobalRoomPresence();

    console.log(
      "User disconnected:",
      socket.id
    );
  });
});

const PORT = process.env.PORT || 10000;

async function startServer() {
  try {
    if (mongoClient) {
      await mongoClient.connect();

      db = mongoClient.db("hurry");

      console.log("MongoDB connected");
    } else {
      console.log("MongoDB URI not configured - starting Socket.IO without MongoDB");
    }

    console.log("MongoDB connected");

    server.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `Hurry Backend running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "MongoDB connection failed"
    );

    console.error(error.message);

    process.exit(1);
  }
}

startServer();
