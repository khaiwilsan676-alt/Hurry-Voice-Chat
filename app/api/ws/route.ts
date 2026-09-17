import {
  experimental_upgradeWebSocket,
  type WebSocketData,
} from "@vercel/functions";

export const runtime = "nodejs";

export function GET() {
  return experimental_upgradeWebSocket((ws) => {
    ws.on("message", (data: WebSocketData) => {
      ws.send(data);
    });

    ws.on("error", () => {
      ws.close();
    });
  });
}
