import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function POST(request) {
  const body = await request.json();
  const { blockedBy, blockedUser } = body;

  if (!blockedBy || !blockedUser) {
    return NextResponse.json({ error: "Missing user IDs" }, { status: 400 });
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db("hurry");

    await db.collection("blocks").updateOne(
      { blockedBy, blockedUser },
      { $set: { blockedBy, blockedUser, timestamp: Date.now() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } finally {
    await client.close();
  }
}
