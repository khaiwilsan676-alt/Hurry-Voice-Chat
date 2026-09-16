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

const mongoClient = new MongoClient(process.env.MONGODB_URI);

let db = null;

const onlineUsers = new Map();

/*
 * roomId -> Map(userId -> socket count)
 */
const roomUsers = new Map();

function getRoomUsers(roomId) {
  const users = roomUsers.get(String(roomId));

  if (!users) return [];

  return Array.from(users.keys());
}

function addUserToRoom(roomId, userId) {
  if (!roomId || !userId) return;

  const room = String(roomId);
  const id = String(userId);

  if (!roomUsers.has(room)) {
    roomUsers.set(room, new Map());
  }

  const users = roomUsers.get(room);
  users.set(id, (users.get(id) || 0) + 1);
}

function removeUserFromRoom(roomId, userId) {
  if (!roomId || !userId) return;

  const room = String(roomId);
  const id = String(userId);

  const users = roomUsers.get(room);

  if (!users) return;

  const count = users.get(id) || 0;

  if (count <= 1) {
    users.delete(id);
  } else {
    users.set(id, count - 1);
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
  const rooms = Array.from(roomUsers.entries()).map(
    ([roomId, users]) => ({
      roomId: String(roomId),
      users: Array.from(users.keys()),
      activeUserCount: users.size,
    })
  );

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
      users: Array.from(users.keys()),
      activeUserCount: users.size,
    })
  );
}

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
    ({ roomId, userId } = {}) => {
      if (!roomId || !userId) return;

      const room = String(roomId);
      const id = String(userId);

      if (
        socket.roomId &&
        socket.roomId !== room
      ) {
        const oldRoom = String(socket.roomId);
        const oldUser =
          socket.roomUserId ||
          socket.userId;

        socket.leave(`room:${oldRoom}`);

        removeUserFromRoom(
          oldRoom,
          oldUser
        );

        emitRoomPresence(oldRoom);
      }

      socket.join(`room:${room}`);

      socket.roomId = room;
      socket.roomUserId = id;

      addUserToRoom(room, id);

      const users = getRoomUsers(room);

      socket.emit("room_presence", {
        roomId: room,
        users,
        activeUserCount: users.length,
      });

      socket
        .to(`room:${room}`)
        .emit("room_user_online", {
          roomId: room,
          userId: id,
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

  socket.on("private_message", (message) => {
    if (
      !message?.senderId ||
      !message?.receiverId
    ) {
      return;
    }

    io.to(
      `user:${message.receiverId}`
    ).emit(
      "private_message",
      message
    );
  });

  socket.on("disconnect", () => {
    const room = socket.roomId;
    const userId =
      socket.roomUserId ||
      socket.userId;

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
    await mongoClient.connect();

    db = mongoClient.db("hurry");

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
