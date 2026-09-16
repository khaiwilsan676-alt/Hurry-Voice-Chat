import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const uid = params.get("uid");
  const accountId = params.get("accountId");

  if (!uid && !accountId) {
    return NextResponse.json({ error: "Missing uid or accountId" }, { status: 400 });
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db("hurry");

    const searchValue = accountId || uid;

    const user = await db.collection("users").findOne(
      {
        $or: [
          { accountId: searchValue },
          { uid: searchValue },
          { id: searchValue },
          { appLongId: searchValue },
        ],
      },
      { projection: { _id: 0 } }
    );

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user });
  } finally {
    await client.close();
  }
}

export async function PUT(request) {
  const body = await request.json();
  const uid = body.uid || body.id || body.appLongId;

  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  const { _id, ...data } = body;

  delete data.uid;
  delete data.id;
  delete data.appLongId;

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db("hurry");

    await db.collection("users").updateOne(
      { $or: [{ uid }, { id: uid }, { appLongId: uid }] },
      {
        $set: {
          uid,
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
