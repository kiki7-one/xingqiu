/**
 * 内容库访问层
 * 合并内置库与用户自定义覆盖
 */
import type { Quote, Flower } from "../types";
import quotesData from "./data/quotes.json";
import flowersData from "./data/flowers.json";

const BUILTIN_QUOTES: Quote[] = quotesData as Quote[];
const BUILTIN_FLOWERS: Flower[] = flowersData as Flower[];

export function getAllQuotes(overrides: Quote[] = []): Quote[] {
  return [...BUILTIN_QUOTES, ...overrides];
}

export function getAllFlowers(overrides: Flower[] = []): Flower[] {
  return [...BUILTIN_FLOWERS, ...overrides];
}

export function findQuoteById(
  id: string,
  overrides: Quote[] = []
): Quote | undefined {
  return getAllQuotes(overrides).find((q) => q.id === id);
}

export function findFlowerById(
  id: string,
  overrides: Flower[] = []
): Flower | undefined {
  return getAllFlowers(overrides).find((f) => f.id === id);
}
