/**
 * 内容轮换算法
 * 按日期取模轮换展示语录/花语
 */
import type { Quote, Flower } from "../types";

/**
 * 获取一年中的第几天（1-366）
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * 按日期取模轮换获取当日语录
 */
export function getQuoteOfDay(
  date: Date,
  quotes: Quote[]
): Quote | null {
  if (quotes.length === 0) return null;
  const day = getDayOfYear(date);
  return quotes[day % quotes.length];
}

/**
 * 按日期取模轮换获取当日花语
 */
export function getFlowerOfDay(
  date: Date,
  flowers: Flower[]
): Flower | null {
  if (flowers.length === 0) return null;
  const day = getDayOfYear(date);
  return flowers[day % flowers.length];
}

/**
 * 随机换一条（排除当前）
 * 每日限 3 次（由调用方控制次数）
 */
export function getRandomQuote(
  quotes: Quote[],
  excludeId?: string
): Quote | null {
  if (quotes.length === 0) return null;
  const available = excludeId
    ? quotes.filter((q) => q.id !== excludeId)
    : quotes;
  if (available.length === 0) return quotes[0];
  return available[Math.floor(Math.random() * available.length)];
}
