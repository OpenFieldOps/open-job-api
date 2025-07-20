import Redis from "ioredis";
import { config } from "../../config";

export const redisPublisher = new Redis(config.redis.url);
export const redisSubscriber = new Redis(config.redis.url);
