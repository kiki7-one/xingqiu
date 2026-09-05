import { mutateField, withBase, useStore } from "./useStore";
import type { Mood, MoodRecord } from "../types";

/**
 * 记录/更新某日心情（按日期覆盖）
 */
export async function setMoodForDate(date: string, mood: Mood): Promise<void> {
  await mutateField("moodRecords", (arr) => {
    const existing = arr.find((r) => r.date === date);
    if (existing) {
      return arr.map((r) =>
        r.id === existing.id
          ? { ...r, mood, updatedAt: new Date().toISOString() }
          : r
      );
    }
    const record = withBase({ date, mood });
    return [...arr, record];
  });
}

/**
 * 获取某日心情
 */
export function getMoodByDate(date: string): Mood | undefined {
  return useStore.getState().data.moodRecords.find((r) => r.date === date)
    ?.mood;
}

/**
 * 获取全部心情记录
 */
export function getAllMoodRecords(): MoodRecord[] {
  return useStore.getState().data.moodRecords;
}
