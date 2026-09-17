import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "";

export const socket: Socket = io(SOCKET_URL, {
  path: "/api/socket",
  transports: ["websocket"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

export default socket;
