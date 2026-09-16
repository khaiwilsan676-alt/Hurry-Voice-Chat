import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function POST(request) {
  const body = await request.json();
  const { reportedBy, reportedUser, reportedUserName, chatId } = body;

  if (!reportedBy || !reportedUser) {
    return NextResponse.json({ error: "Missing user IDs" }, { status: 400 });
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db("hurry");

    await db.collection("reports").insertOne({
      reportedBy,
      reportedUser,
      reportedUserName: reportedUserName || "",
      chatId: chatId || "",
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true });
  } finally {
    await client.close();
  }
}
