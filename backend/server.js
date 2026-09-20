require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { MongoClient } = require("mongodb");
const { setOnlineStatus, removeOnlineStatus } = require("./redis");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 50 * 1024 * 1024,
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
    if (userData.accountId) existing.accountId = String(userData.accountId);
  } else {
    users.set(id, {
      count: 1,
      userId: id,
      accountId: String(userData.accountId || id),
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

    // Sync to Redis asynchronously (fire and forget)
    setOnlineStatus(presenceId);
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

      // Remove from Redis asynchronously
      removeOnlineStatus(id);
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


app.get("/api/rooms", async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: "MongoDB is not connected" });
    }

    const roomId = req.query.roomId;
    if (roomId) {
      const room = await db.collection("rooms").findOne({
        $or: [
          { accountId: roomId },
          { id: roomId },
          { roomId: roomId }
        ]
      });

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      return res.json({ room });
    }

    const rooms = await db.collection("rooms")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return res.json({ rooms });
  } catch (error) {
    console.error("GET /api/rooms error:", error);
    return res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

app.put("/api/rooms", async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: "MongoDB is not connected" });
    }

    const data = req.body || {};

    // Strict room ID definition using accountId or user uid
    const accountId = String(
      data.accountId ||
      data["Room Admin"] ||
      data.roomAdmin ||
      data.id ||
      ""
    ).trim();

    if (!accountId) {
      return res.status(400).json({ error: "Missing room accountId" });
    }

    const rooms = db.collection("rooms");

    const roomData = {
      accountId,
      id: accountId,
      roomId: accountId,
      name: data.name || data.roomName || data["Room Name"] || "Voice Chat Room",
      image: data.image || data.roomDp || data["Room dp"] || "/default-avatar.png",
      country: data.country || data.Country || "🇮🇳",
      message: data.message || data.announcement || "",
      theme: data.theme || "default",
      isLocked: Boolean(data.isLocked),
      roomPassword: data.roomPassword || null,
      updatedAt: Date.now()
    };

    await rooms.updateOne(
      {
        $or: [
          { accountId },
          { id: accountId }
        ]
      },
      {
        $set: roomData,
        $setOnInsert: {
          createdAt: Date.now()
        }
      },
      { upsert: true }
    );

    return res.json({
      success: true,
      room: roomData
    });
  } catch (error) {
    console.error("PUT /api/rooms error:", error);
    return res.status(500).json({ error: "Failed to save room" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        error: "MongoDB is not connected",
      });
    }

    const searchQuery = String(
      req.query.search ||
      req.query.q ||
      req.query.query ||
      ""
    ).trim();

    const uid = String(req.query.uid || "").trim();
    const accountId = String(req.query.accountId || "").trim();

    const users = db.collection("users");

    const normalizeUser = (user) => {
      const id = String(
        user.id || user.uid || user.appLongId || user._id || ""
      );

      let numberId = String(
        user.accountId ||
        user.accountNumber ||
        user["Account Number"] ||
        user.displayUserNumber ||
        ""
      );

      if (!numberId || numberId === id) {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
          hash = (hash << 5) - hash + id.charCodeAt(i);
          hash |= 0;
        }
        numberId = String(10000000 + (Math.abs(hash) % 90000000));
      }

      return {
        ...user,
        id,
        uid: String(user.uid || id),
        appLongId: String(user.appLongId || id),
        accountId: numberId,
        accountNumber: numberId,
        displayUserNumber: numberId,
        name: user.name || user.displayName || user.userName || "User",
        email: user.email || user.gmail || user.emailPhone || "",
        image: user.image || user.photo || user.photoURL || user.avatar || "/default-avatar.png",
        country: user.country || "🇮🇳",
      };
    };

    const q = searchQuery || accountId || uid;
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const numericQ = !isNaN(Number(q)) && q.trim() !== "" ? Number(q) : null;

      const orConditions = [
        { accountId: q },
        { accountNumber: q },
        { "Account Number": q },
        { displayUserNumber: q },
        { uid: q },
        { id: q },
        { appLongId: q },
        { accountId: regex },
        { accountNumber: regex },
        { displayUserNumber: regex },
        { name: regex },
        { displayName: regex },
        { userName: regex },
        { uid: regex },
        { id: regex },
        { appLongId: regex },
      ];

      // Add numeric match if the query is a valid number
      if (numericQ !== null) {
        orConditions.push(
          { accountId: numericQ },
          { accountNumber: numericQ },
          { displayUserNumber: numericQ }
        );
      }

      const matches = await users
        .find({
          $or: orConditions,
        })
        .limit(50)
        .toArray();

      const normalizedUsers = matches.map(normalizeUser);

      // Filter/rank to prioritize exact or startsWith matches on accountId, accountNumber, uid, or name
      const rankedUsers = normalizedUsers.filter((u) => {
        const uAcc = String(u.accountId || u.accountNumber || u.displayUserNumber || "").toLowerCase();
        const uUid = String(u.uid || u.id || u.appLongId || "").toLowerCase();
        const uName = String(u.name || "").toLowerCase();
        const qLower = q.toLowerCase();

        return (
          uAcc.includes(qLower) ||
          uUid.includes(qLower) ||
          uName.includes(qLower)
        );
      });

      const finalUsers = rankedUsers.length > 0 ? rankedUsers : normalizedUsers;

      if (finalUsers.length === 0 && uid) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        users: finalUsers,
        user: finalUsers[0] || null,
      });
    }

    // No query = return all registered users (for Owner Panel).
    const allUsers = await users
      .find({})
      .sort({ createdAt: -1 })
      .limit(1000)
      .toArray();

    return res.json({
      users: allUsers.map(normalizeUser),
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
      lastIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
    };
    if (data.deviceId) {
      userData.lastDeviceId = data.deviceId;
    }

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

app.get("/api/privateMessages", async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: "MongoDB is not connected" });
    }

    const messages = await db
      .collection("privateMessages")
      .find({})
      .sort({ timestamp: -1 })
      .limit(1000)
      .toArray();

    return res.json({ messages });
  } catch (error) {
    console.error("GET /api/privateMessages error:", error);
    return res.status(500).json({ error: "Failed to fetch private messages" });
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
      if (!roomId || (!userId && !accountId)) return;

      const room = String(roomId);
      const accId = accountId ? String(accountId) : String(userId);

      cancelPendingSeatDisconnect(room, accId);
      if (userId) cancelPendingSeatDisconnect(room, String(userId));

      // Prevent duplicate joins from increasing the live count.
      if (
        socket.roomId === room &&
        socket.roomAccountId === accId
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
          socket.roomAccountId ||
          socket.accountId ||
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
      if (userId) socket.roomUserId = String(userId);
      socket.accountId = accId;
      socket.roomAccountId = accId;

      addUserToRoom(room, accId, {
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
          userId: accId,
          user: {
            accountId: accId,
            userId: userId ? String(userId) : accId,
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
    ({ roomId, userId, accountId } = {}) => {
      const room = roomId
        ? String(roomId)
        : socket.roomId;

      if (!room) return;

      const id = String(
        accountId ||
        userId ||
        socket.roomAccountId ||
        socket.accountId ||
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
        socket.roomAccountId = null;
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
    const isRoomUser =
      String(socket.roomAccountId || "") === userId ||
      String(socket.accountId || "") === userId ||
      String(socket.roomUserId || "") === userId ||
      String(socket.userId || "") === userId ||
      Boolean(socket.roomId && String(socket.roomId) === roomId);

    if (String(socket.roomId || "") !== roomId || !isRoomUser) {
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
      if (current.isOccupied) {
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
      if (current.isOccupied) {
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
      if (current.isOccupied) {
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

  socket.on("room_settings_update", (data = {}) => {
    if (!data || !data.roomId) return;
    const roomId = String(data.roomId);
    io.to(`room:${roomId}`).emit("room_settings_updated", data);
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


  socket.on("user_report", async (data = {}) => {
    const reportId = String(data.id || `report_${Date.now()}`);

    const payload = {
      id: reportId,
      senderId: String(data.senderId || ""),
      senderName: String(data.senderName || "User"),
      senderPhoto: String(data.senderPhoto || ""),
      reportedId: String(data.reportedId || ""),
      reportedName: String(data.reportedName || "User"),
      reportedPhoto: String(data.reportedPhoto || ""),
      category: String(data.category || ""),
      description: String(data.description || ""),
      proofImage: data.proofImage ? String(data.proofImage) : null,
      timestamp: Number(data.timestamp || Date.now()),
    };

    try {
      if (db) {
        await db.collection("userReports").updateOne(
          { id: reportId },
          { $set: payload },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error("User report save failed:", error.message);
    }

    // Broadcast user report real-time update
    io.emit("user_report", payload);
  });

  socket.on("user_report_history_request", async () => {
    try {
      if (db) {
        const reports = await db
          .collection("userReports")
          .find({})
          .sort({ timestamp: -1 })
          .limit(200)
          .toArray();

        socket.emit("user_report_history_response", { reports });
      } else {
        socket.emit("user_report_history_response", { reports: [] });
      }
    } catch (error) {
      console.error("User report history fetch failed:", error.message);
      socket.emit("user_report_history_response", { reports: [] });
    }
  });

  socket.on("user_feedback", async (data = {}) => {
    const feedbackId = String(data.id || `fb_${Date.now()}`);

    const payload = {
      id: feedbackId,
      userId: String(data.userId || ""),
      userName: String(data.userName || "User"),
      userAccountId: String(data.userAccountId || ""),
      userPhoto: String(data.userPhoto || ""),
      type: String(data.type || ""),
      typeLabel: String(data.typeLabel || "Feedback"),
      description: String(data.description || ""),
      contactInfo: String(data.contactInfo || ""),
      createdAt: data.createdAt || new Date().toISOString(),
      timestamp: Number(data.timestamp || Date.now()),
      status: String(data.status || "pending")
    };

    try {
      if (db) {
        await db.collection("userFeedbacks").updateOne(
          { id: feedbackId },
          { $set: payload },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error("User feedback save failed:", error.message);
    }

    // Broadcast user feedback real-time update to all listeners (including owner panel)
    io.emit("user_feedback", payload);
  });

  socket.on("user_feedback_history_request", async () => {
    try {
      if (db) {
        const feedbacks = await db
          .collection("userFeedbacks")
          .find({})
          .sort({ timestamp: -1 })
          .limit(200)
          .toArray();

        socket.emit("user_feedback_history_response", { feedbacks });
      } else {
        socket.emit("user_feedback_history_response", { feedbacks: [] });
      }
    } catch (error) {
      console.error("User feedback history fetch failed:", error.message);
      socket.emit("user_feedback_history_response", { feedbacks: [] });
    }
  });

  socket.on("send_official_message", async (data = {}) => {
    const rawSenderId = String(data.senderId || "");
    // Strictly restrict official sender IDs to hurry_team_official and hurry_system_official
    if (rawSenderId !== "hurry_team_official" && rawSenderId !== "hurry_system_official") {
      console.warn("Unauthorized or invalid official sender ID:", rawSenderId);
      return;
    }

    const isTeam = rawSenderId === "hurry_team_official";
    const senderName = isTeam ? "Hurry Team" : "Hurry System";
    const senderPhoto = isTeam ? "/logo.png" : "/file_00000000a66881f8aa9e15d2fe2b9a0c.png";

    const messageId = String(data.id || `official_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

    const payload = {
      id: messageId,
      senderId: rawSenderId,
      senderName,
      senderPhoto,
      text: String(data.text || ""),
      type: data.type || (data.imageUrl ? "image" : "message"),
      imageUrl: data.imageUrl || undefined,
      timestamp: Number(data.timestamp || Date.now()),
      isOfficialBroadcast: true,
    };

    try {
      if (db) {
        await db.collection("officialMessages").updateOne(
          { id: messageId },
          { $set: payload },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error("Official message save failed:", error.message);
    }

    // Broadcast to ALL connected clients in real time
    io.emit("official_broadcast_message", payload);
  });

  socket.on("official_message_history_request", async () => {
    try {
      if (db) {
        const messages = await db
          .collection("officialMessages")
          .find({})
          .sort({ timestamp: 1 })
          .limit(500)
          .toArray();

        socket.emit("official_message_history_response", { messages });
      } else {
        socket.emit("official_message_history_response", { messages: [] });
      }
    } catch (error) {
      console.error("Official message history fetch failed:", error.message);
      socket.emit("official_message_history_response", { messages: [] });
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



// ==============================================================
// BANS ENDPOINTS
// ==============================================================

app.get("/api/bans", async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "DB not connected" });
    const bans = await db.collection("bans").find().toArray();
    res.json({ bans });
  } catch (err) {
    console.error("GET /api/bans error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/bans", async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "DB not connected" });

    // Check if requester is actually an official/admin (Using a simple check matching the owner panel login logic)
    const requesterId = req.headers['x-requester-id'];
    const OFFICIAL_IDS = ['500001', '500002', '500003', '500004', '500005', '700001', '700002', '700003'];
    // In this app, special accounts and owner login use specific IDs.
    // Ideally we'd verify a Firebase token here, but given the existing codebase's reliance on client-side ID checks (like in LoginPage),
    // we'll enforce that the requester is in the OFFICIAL_IDS list or is the Hurry Owner.
    if (!requesterId || (!OFFICIAL_IDS.includes(requesterId) && requesterId !== '100002' && requesterId !== '100003')) {
       return res.status(403).json({ error: "Forbidden: Not an admin" });
    }

    const data = req.body;
    if (!data.accountId) return res.status(400).json({ error: "Missing accountId" });

    await db.collection("bans").updateOne(
      { accountId: data.accountId },
      { $set: data },
      { upsert: true }
    );
    io.emit('banned_logout', { accountId: data.accountId });
    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/bans error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/bans/unban", async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "DB not connected" });

    // Check if requester is actually an official/admin (Using a simple check matching the owner panel login logic)
    const requesterId = req.headers['x-requester-id'];
    const OFFICIAL_IDS = ['500001', '500002', '500003', '500004', '500005', '700001', '700002', '700003'];
    // In this app, special accounts and owner login use specific IDs.
    // Ideally we'd verify a Firebase token here, but given the existing codebase's reliance on client-side ID checks (like in LoginPage),
    // we'll enforce that the requester is in the OFFICIAL_IDS list or is the Hurry Owner.
    if (!requesterId || (!OFFICIAL_IDS.includes(requesterId) && requesterId !== '100002' && requesterId !== '100003')) {
       return res.status(403).json({ error: "Forbidden: Not an admin" });
    }

    const { accountId, reason } = req.body;
    if (!accountId) return res.status(400).json({ error: "Missing accountId" });

    await db.collection("bans").deleteOne({ accountId: String(accountId) });
    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/bans/unban error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/check-ban", async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "DB not connected" });
    const { accountId, deviceId, ipAddress } = req.body;

    const query = { $or: [] };
    if (accountId) query.$or.push({ accountId: String(accountId) });
    if (deviceId && deviceId !== '') query.$or.push({ deviceId: String(deviceId), timeOption: 'Device Ban' });

    if (query.$or.length === 0) {
      return res.json({ banned: false });
    }

    const activeBans = await db.collection("bans").find(query).toArray();
    if (activeBans.length === 0) return res.json({ banned: false });

    const now = Date.now();
    for (const ban of activeBans) {
      if (ban.unbanTime === -1 || ban.unbanTime > now) {
        return res.json({
          banned: true,
          banData: ban
        });
      }
    }

    res.json({ banned: false });
  } catch (err) {
    console.error("POST /api/check-ban error:", err);
    res.status(500).json({ error: "Internal error" });
  }
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
