import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Hurry Backend",
    websocket: "ready",
    database: "MongoDB",
  });
}
