import { mutateField, useStore } from "./useStore";
import type { Quote, Flower } from "../types";

/**
 * 导入自定义语录包：追加到 contentOverrides.quotes
 */
export async function importQuotes(quotes: Quote[]): Promise<number> {
  if (quotes.length === 0) return 0;
  const existing = useStore.getState().data.contentOverrides.quotes;
  const existingIds = new Set(existing.map((q) => q.id));
  const toAdd = quotes.filter((q) => q.id && !existingIds.has(q.id));
  if (toAdd.length === 0) return 0;
  await mutateField("contentOverrides", (co) => ({
    ...co,
    quotes: [...co.quotes, ...toAdd],
  }));
  return toAdd.length;
}

/**
 * 导入自定义花语包：追加到 contentOverrides.flowers
 */
export async function importFlowers(flowers: Flower[]): Promise<number> {
  if (flowers.length === 0) return 0;
  const existing = useStore.getState().data.contentOverrides.flowers;
  const existingIds = new Set(existing.map((f) => f.id));
  const toAdd = flowers.filter((f) => f.id && !existingIds.has(f.id));
  if (toAdd.length === 0) return 0;
  await mutateField("contentOverrides", (co) => ({
    ...co,
    flowers: [...co.flowers, ...toAdd],
  }));
  return toAdd.length;
}

/**
 * 清空自定义内容
 */
export async function clearContentOverrides(): Promise<void> {
  await mutateField("contentOverrides", () => ({
    quotes: [],
    flowers: [],
  }));
}

/**
 * 解析语录 JSON 字符串
 */
export function parseQuotesJson(json: string): Quote[] {
  const data = JSON.parse(json);
  if (!Array.isArray(data)) throw new Error("格式错误：应为数组");
  return data.map((q: any, i: number) => ({
    id: q.id ?? `imported-q-${Date.now()}-${i}`,
    text: String(q.text ?? ""),
    category: q.category ?? "motivational",
  }));
}

/**
 * 解析花语 JSON 字符串
 */
export function parseFlowersJson(json: string): Flower[] {
  const data = JSON.parse(json);
  if (!Array.isArray(data)) throw new Error("格式错误：应为数组");
  return data.map((f: any, i: number) => ({
    id: f.id ?? `imported-f-${Date.now()}-${i}`,
    name: String(f.name ?? ""),
    meaning: String(f.meaning ?? ""),
    imageUrl: String(f.imageUrl ?? ""),
    careTips: f.careTips ? String(f.careTips) : undefined,
  }));
}
