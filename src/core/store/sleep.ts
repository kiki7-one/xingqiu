import { mutateField, withBase, useStore } from "./useStore";
import type { SleepRecord } from "../types";

/**
 * 记录/更新某日睡眠（按日期覆盖）
 */
export async function setSleepForDate(
  date: string,
  hours: number,
  extra?: { sleepTime?: string; wakeTime?: string }
): Promise<void> {
  await mutateField("sleepRecords", (arr) => {
    const existing = arr.find((r) => r.date === date);
    if (existing) {
      return arr.map((r) =>
        r.id === existing.id
          ? {
              ...r,
              hours,
              sleepTime: extra?.sleepTime ?? r.sleepTime,
              wakeTime: extra?.wakeTime ?? r.wakeTime,
              updatedAt: new Date().toISOString(),
            }
          : r
      );
    }
    const record = withBase({
      date,
      hours,
      sleepTime: extra?.sleepTime,
      wakeTime: extra?.wakeTime,
    });
    return [...arr, record];
  });
}

/**
 * 获取某日睡眠
 */
export function getSleepByDate(date: string): SleepRecord | undefined {
  return useStore.getState().data.sleepRecords.find((r) => r.date === date);
}

/**
 * 获取全部睡眠记录
 */
export function getAllSleepRecords(): SleepRecord[] {
  return useStore.getState().data.sleepRecords;
}
