const fs = require('fs');

const path = 'backend/server.js';
let data = fs.readFileSync(path, 'utf8');

// Insert the block and unblock API routes
const apiUsersPut = 'app.put("/api/users"';
if (!data.includes('app.post("/api/users/block"')) {
  const blockRoutes = `
app.post("/api/users/block", async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "DB not connected" });
    const { blockedBy, blockedUser } = req.body;
    if (!blockedBy || !blockedUser) return res.status(400).json({ error: "Missing ids" });

    await db.collection("blocks").updateOne(
      { blockerId: String(blockedBy), blockedId: String(blockedUser) },
      { $set: { blockerId: String(blockedBy), blockedId: String(blockedUser), timestamp: Date.now() } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/users/block error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/users/unblock", async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "DB not connected" });
    const { blockedBy, blockedUser } = req.body;
    if (!blockedBy || !blockedUser) return res.status(400).json({ error: "Missing ids" });

    await db.collection("blocks").deleteOne({ blockerId: String(blockedBy), blockedId: String(blockedUser) });
    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/users/unblock error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

`;
  data = data.replace(apiUsersPut, blockRoutes + apiUsersPut);
}

// Modify socket.on("private_message")
const privateMsgStart = 'socket.on("private_message", async (message) => {';
const receiverIdCode = 'const receiverId = String(message.receiverId);';

if (!data.includes('const blockRecord = await db.collection("blocks").findOne')) {
  const blockCheckCode = `
    const receiverId = String(message.receiverId);

    // Check if the receiver has blocked the sender
    if (db) {
      const blockRecord = await db.collection("blocks").findOne({
        blockerId: receiverId,
        blockedId: String(message.senderId)
      });
      if (blockRecord) {
        // Drop the message silently if blocked
        return;
      }
    }
  `;
  data = data.replace('const receiverId = String(message.receiverId);', blockCheckCode);
}

fs.writeFileSync(path, data);
