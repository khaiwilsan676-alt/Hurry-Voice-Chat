const { Server } = require("socket.io");

const rooms = new Map();

function getUsers(roomId) {
  return Array.from(rooms.get(roomId)?.values() || []);
}

function sendPresence(io, roomId) {
  const users = getUsers(roomId);

  io.to(`room:${roomId}`).emit("room_presence", {
    roomId,
    users,
    activeUserCount: users.length,
  });
}

function removeUser(io, socket) {
  const roomId = socket.roomId;
  const userId = socket.roomUserId;

  if (!roomId || !userId) return;

  const room = rooms.get(roomId);

  if (room) {
    room.delete(userId);

    if (room.size === 0) {
      rooms.delete(roomId);
    }
  }

  socket.leave(`room:${roomId}`);

  socket.to(`room:${roomId}`).emit("room_user_offline", {
    roomId,
    userId,
  });

  sendPresence(io, roomId);

  socket.roomId = null;
  socket.roomUserId = null;
}

function setup(io) {
  io.on("connection", (socket) => {
    socket.on("register", (data = {}) => {
      const value =
        typeof data === "string"
          ? { userId: data }
          : data;

      const userId = String(
        value.userId ||
        value.uid ||
        value.id ||
        ""
      );

      const accountId = String(
        value.accountId ||
        userId
      );

      if (!userId) return;

      socket.userId = userId;
      socket.accountId = accountId;

      socket.join(`user:${userId}`);
      socket.join(`user:${accountId}`);

      socket.emit("global_room_presence", {
        rooms: Array.from(rooms.entries()).map(
          ([roomId, room]) => ({
            roomId,
            users: Array.from(room.values()),
            activeUserCount: room.size,
          })
        ),
      });
    });

    socket.on("global_room_presence_request", () => {
      socket.emit("global_room_presence", {
        rooms: Array.from(rooms.entries()).map(
          ([roomId, room]) => ({
            roomId,
            users: Array.from(room.values()),
            activeUserCount: room.size,
          })
        ),
      });
    });

    socket.on(
      "room_presence_request",
      ({ roomId } = {}) => {
        if (!roomId) return;

        const id = String(roomId);

        socket.emit("room_presence", {
          roomId: id,
          users: getUsers(id),
          activeUserCount: getUsers(id).length,
        });
      }
    );

    socket.on("room_join", (data = {}) => {
      const roomId = String(data.roomId || "");
      const userId = String(data.userId || "");

      if (!roomId || !userId) return;

      if (
        socket.roomId &&
        socket.roomUserId &&
        socket.roomId !== roomId
      ) {
        removeUser(io, socket);
      }

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }

      const room = rooms.get(roomId);

      const user = {
        accountId: userId,
        userId,
        name: data.name || "User",
        image:
          data.dp ||
          data.image ||
          "/default-avatar.png",
        email: data.email || "",
      };

      room.set(userId, user);

      socket.roomId = roomId;
      socket.roomUserId = userId;

      socket.join(`room:${roomId}`);

      socket.emit("room_presence", {
        roomId,
        users: getUsers(roomId),
        activeUserCount: getUsers(roomId).length,
      });

      socket.to(`room:${roomId}`).emit(
        "room_user_online",
        {
          roomId,
          userId,
          user,
        }
      );

      sendPresence(io, roomId);
    });

    socket.on("room_leave", () => {
      removeUser(io, socket);
    });

    socket.on("room_message", (message = {}) => {
      if (
        !message.roomId ||
        !message.senderId
      ) {
        return;
      }

      io.to(
        `room:${String(message.roomId)}`
      ).emit(
        "room_message",
        message
      );
    });

    socket.on(
      "private_message",
      (message = {}) => {
        if (
          !message.receiverId ||
          !message.senderId
        ) {
          return;
        }

        io.to(
          `user:${String(message.receiverId)}`
        ).emit(
          "private_message",
          message
        );
      }
    );

    socket.on(
      "check_presence",
      (targetUserId) => {
        const id = String(
          targetUserId || ""
        );

        if (!id) return;

        const online = io.sockets.adapter.rooms.has(
          `user:${id}`
        );

        socket.emit("presence_status", {
          userId: id,
          online,
        });
      }
    );

    socket.on("disconnect", () => {
      removeUser(io, socket);
    });
  });
}

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(
      res.socket.server,
      {
        path: "/api/socket",
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
        transports: ["websocket"],
      }
    );

    res.socket.server.io = io;
    setup(io);
  }

  res.end();
}
