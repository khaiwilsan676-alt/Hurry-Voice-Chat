const { Redis } = require("@upstash/redis");

let redis = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log("Redis client initialized");
  } catch (error) {
    console.error("Failed to initialize Redis client:", error);
  }
} else {
  console.log("Redis credentials not provided, Redis integration disabled.");
}

async function setOnlineStatus(userId) {
  if (!redis) return;
  try {
    // 3600 seconds = 1 hour expiration for safety, though markUserOffline will clean it up
    await redis.set(`user:online:${userId}`, "1", { ex: 3600 });
  } catch (error) {
    console.error(`Failed to set online status for user ${userId} in Redis:`, error.message);
  }
}

async function removeOnlineStatus(userId) {
  if (!redis) return;
  try {
    await redis.del(`user:online:${userId}`);
  } catch (error) {
    console.error(`Failed to remove online status for user ${userId} in Redis:`, error.message);
  }
}

async function getRoomGiftCount(roomId) {
  if (!redis) return 0;

  try {
    const value = await redis.get(`room:gifts:${String(roomId)}`);
    return Number(value || 0);
  } catch (error) {
    console.error("Failed to get room gift count:", error.message);
    return 0;
  }
}

async function incrementRoomGiftCount(roomId) {
  if (!redis) return 1;

  try {
    return Number(await redis.incr(`room:gifts:${String(roomId)}`));
  } catch (error) {
    console.error("Failed to increment room gift count:", error.message);
    return 1;
  }
}

module.exports = {
  redis,
  setOnlineStatus,
  removeOnlineStatus,
  getRoomGiftCount,
  incrementRoomGiftCount,
};
