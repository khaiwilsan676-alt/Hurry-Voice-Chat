import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Hurry Socket Backend",
    websocket: "ready",
    chatStorage: "IndexedDB-only",
    database: "MongoDB",
  });
}
