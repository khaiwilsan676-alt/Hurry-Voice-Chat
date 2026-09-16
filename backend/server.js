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

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "Hurry Backend",
    socket: "ready",
    database: db ? "mongodb-connected" : "mongodb-connecting",
  });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (userId) => {
    if (!userId) return;

    socket.join(`user:${userId}`);
    socket.userId = userId;

    const count = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, count + 1);

    if (count === 0) {
      socket.broadcast.emit("user_online", userId);
    }

    socket.emit("presence_status", {
      userId,
      online: true,
    });
  });

  socket.on("check_presence", (userId) => {
    if (!userId) return;

    socket.emit("presence_status", {
      userId,
      online: onlineUsers.has(userId),
    });
  });

  socket.on("presence_online", (userId) => {
    if (!userId) return;

    socket.join(`user:${userId}`);
    socket.userId = userId;

    const count = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, count + 1);

    if (count === 0) {
      socket.broadcast.emit("user_online", userId);
    }
  });

  socket.on("presence_offline", (userId) => {
    if (!userId) return;

    const count = onlineUsers.get(userId) || 0;

    if (count <= 1) {
      onlineUsers.delete(userId);
      socket.broadcast.emit("user_offline", userId);
    } else {
      onlineUsers.set(userId, count - 1);
    }
  });

  socket.on("room_join", ({ roomId, userId } = {}) => {
    if (!roomId || !userId) return;

    socket.join(`room:${roomId}`);
    socket.roomId = roomId;
    socket.roomUserId = userId;

    socket.to(`room:${roomId}`).emit("room_user_online", {
      roomId,
      userId,
    });
  });

  socket.on("room_leave", ({ roomId, userId } = {}) => {
    if (!roomId) return;

    socket.leave(`room:${roomId}`);

    socket.to(`room:${roomId}`).emit("room_user_offline", {
      roomId,
      userId: userId || socket.roomUserId || "",
    });

    if (socket.roomId === roomId) {
      socket.roomId = null;
      socket.roomUserId = null;
    }
  });

  // Realtime room chat only.
  // Messages are NOT stored in MongoDB.
  socket.on("room_message", (message) => {
    if (!message?.roomId || !message?.senderId) return;

    io.to(`room:${message.roomId}`).emit("room_message", message);
  });

  // Realtime private chat only.
  // Messages are NOT stored in MongoDB.
  socket.on("private_message", (message) => {
    if (!message?.senderId || !message?.receiverId) return;

    io.to(`user:${message.receiverId}`).emit(
      "private_message",
      message
    );
  });

  socket.on("disconnect", () => {
    const userId = socket.userId;

    if (userId) {
      const count = onlineUsers.get(userId) || 0;

      if (count <= 1) {
        onlineUsers.delete(userId);
        socket.broadcast.emit("user_offline", userId);
      } else {
        onlineUsers.set(userId, count - 1);
      }
    }

    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 10000;

async function startServer() {
  try {
    await mongoClient.connect();

    db = mongoClient.db("hurry");

    console.log("MongoDB connected");

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Hurry Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed");
    console.error(error.message);
    process.exit(1);
  }
}

startServer();
