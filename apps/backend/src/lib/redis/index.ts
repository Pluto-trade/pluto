import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;

export async function redisInit() {
  try {
    if (redisClient?.isOpen) {
    return redisClient;
  }

  const client = createClient({
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
  });

  client.on("error", (err) => console.log("Redis Client Error", err));

  await client.connect();
  redisClient = client;

  return client;
  } catch (error) {
    throw new Error("Can't initialize a redis client")
  }
  
}

export function getRedisClient() {
  if (!redisClient) {
    throw new Error(
      "Redis client is not initialized. Call redisInit() during backend startup first.",
    );
  }

  return redisClient;
}
