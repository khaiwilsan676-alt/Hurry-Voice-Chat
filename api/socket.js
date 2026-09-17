const { createServer } = require("http");
const { Server } = require("socket.io");

const server = createServer();

const io = new Server(server, {
  path: "/api/socket",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket"],
});

const rooms = new Map();

function users(roomId) {
  return Array.from(rooms.get(roomId)?.values() || []);
}

function presence(roomId) {
  const list = users(roomId);

  io.to(`room:${roomId}`).emit("room_presence", {
    roomId,
    users: list,
    activeUserCount: list.length,
  });
}

io.on("connection", (socket) => {
  socket.on("register", (data = {}) => {
    socket.userId = String(data.userId || data.uid || data.id || "");
    socket.accountId = String(data.accountId || socket.userId);

    if (!socket.userId) return;

    socket.join(`user:${socket.userId}`);
    socket.join(`user:${socket.accountId}`);

    socket.emit("global_room_presence", {
      rooms: Array.from(rooms.entries()).map(([roomId, map]) => ({
        roomId,
        users: Array.from(map.values()),
        activeUserCount: map.size,
      })),
    });
  });

  socket.on("global_room_presence_request", () => {
    socket.emit("global_room_presence", {
      rooms: Array.from(rooms.entries()).map(([roomId, map]) => ({
        roomId,
        users: Array.from(map.values()),
        activeUserCount: map.size,
      })),
    });
  });

  socket.on("room_presence_request", ({ roomId } = {}) => {
    if (!roomId) return;

    const id = String(roomId);
    socket.emit("room_presence", {
      roomId: id,
      users: users(id),
      activeUserCount: users(id).length,
    });
  });

  socket.on("room_join", (data = {}) => {
    const roomId = String(data.roomId || "");
    const userId = String(data.userId || "");

    if (!roomId || !userId) return;

    if (socket.roomId && socket.roomUserId) {
      const oldRoom = socket.roomId;
      const oldUser = socket.roomUserId;

      if (oldRoom !== roomId) {
        rooms.get(oldRoom)?.delete(oldUser);
        socket.leave(`room:${oldRoom}`);
        presence(oldRoom);
      }
    }

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    rooms.get(roomId).set(userId, {
      accountId: userId,
      userId,
      name: data.name || "User",
      image: data.dp || "/default-avatar.png",
      email: data.email || "",
    });

    socket.roomId = roomId;
    socket.roomUserId = userId;

    socket.join(`room:${roomId}`);

    socket.emit("room_presence", {
      roomId,
      users: users(roomId),
      activeUserCount: users(roomId).length,
    });

    socket.to(`room:${roomId}`).emit("room_user_online", {
      roomId,
      userId,
      user: rooms.get(roomId).get(userId),
    });

    presence(roomId);
  });

  socket.on("room_leave", (data = {}) => {
    const roomId = String(data.roomId || socket.roomId || "");
    const userId = String(
      data.userId || socket.roomUserId || socket.userId || ""
    );

    if (!roomId || !userId) return;

    rooms.get(roomId)?.delete(userId);

    socket.leave(`room:${roomId}`);

    socket.to(`room:${roomId}`).emit("room_user_offline", {
      roomId,
      userId,
    });

    presence(roomId);

    if (socket.roomId === roomId) {
      socket.roomId = null;
      socket.roomUserId = null;
    }
  });

  socket.on("room_message", (message) => {
    if (!message?.roomId || !message?.senderId) return;

    io.to(`room:${String(message.roomId)}`).emit(
      "room_message",
      message
    );
  });

  socket.on("private_message", (message) => {
    if (!message?.receiverId || !message?.senderId) return;

    io.to(`user:${String(message.receiverId)}`).emit(
      "private_message",
      message
    );
  });

  socket.on("disconnect", () => {
    if (socket.roomId && socket.roomUserId) {
      const roomId = socket.roomId;
      const userId = socket.roomUserId;

      rooms.get(roomId)?.delete(userId);

      socket.to(`room:${roomId}`).emit("room_user_offline", {
        roomId,
        userId,
      });

      presence(roomId);
    }
  });
});

module.exports = server;
