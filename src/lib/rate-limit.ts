import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
    redisClient = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN
    });
    return redisClient;
  }
  return null;
}

export async function enforceRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<void> {
  const redis = getRedis();
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    if (count > maxRequests) {
      throw new AppError("RATE_LIMITED", "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.", 429);
    }
    return;
  }

  // Fallback bền vững bằng PostgreSQL (không dùng in-memory trên serverless)
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  const bucket = await prisma.rateLimitBucket.findUnique({ where: { id: key } });

  if (!bucket || bucket.resetAt <= now) {
    await prisma.rateLimitBucket.upsert({
      where: { id: key },
      create: { id: key, count: 1, resetAt },
      update: { count: 1, resetAt }
    });
    return;
  }

  const updated = await prisma.rateLimitBucket.update({
    where: { id: key },
    data: { count: { increment: 1 } }
  });

  if (updated.count > maxRequests) {
    throw new AppError("RATE_LIMITED", "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.", 429);
  }
}
