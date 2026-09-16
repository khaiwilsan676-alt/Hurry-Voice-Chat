import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function GET(request) {
  const roomId = new URL(request.url).searchParams.get("roomId");

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db("hurry");
    const roomsCollection = db.collection("rooms");

    if (roomId) {
      const room = await roomsCollection.findOne(
        { roomId },
        { projection: { _id: 0 } }
      );

      if (!room) {
        return NextResponse.json({ room: null }, { status: 404 });
      }

      return NextResponse.json({ room });
    }

    const rooms = await roomsCollection
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ rooms });
  } finally {
    await client.close();
  }
}


export async function PUT(request) {
  const body = await request.json();
  const roomId = body.roomId || body.id;

  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }

  const { _id, roomId: _roomId, id: _idField, ...data } = body;

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db("hurry");

    await db.collection("rooms").updateOne(
      { roomId },
      {
        $set: {
          roomId,
          ...data,
          updatedAt: Date.now(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } finally {
    await client.close();
  }
}
