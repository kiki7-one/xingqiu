import { mutateField, withBase, touch } from "./useStore";
import { useStore } from "./useStore";
import type { Diary } from "../types";

export async function addDiary(
  input: Omit<Diary, "id" | "createdAt" | "updatedAt" | "isDeleted">
): Promise<Diary> {
  const diary = withBase(input);
  await mutateField("diaries", (arr) => [...arr, diary]);
  return diary;
}

export async function updateDiary(
  id: string,
  patch: Partial<Diary>
): Promise<void> {
  await mutateField("diaries", (arr) =>
    arr.map((d) => (d.id === id ? touch({ ...d, ...patch }) : d))
  );
}

export async function deleteDiary(id: string): Promise<void> {
  // 软删除
  await mutateField("diaries", (arr) =>
    arr.map((d) => (d.id === id ? touch({ ...d, isDeleted: true }) : d))
  );
}

/**
 * 获取日记列表（排除已删除），按日期倒序
 */
export function getActiveDiaries(): Diary[] {
  return useStore
    .getState()
    .data.diaries.filter((d) => !d.isDeleted)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * 搜索日记（关键词 / 标签 / 日期范围）
 */
export function searchDiaries(opts: {
  keyword?: string;
  tag?: string;
  startDate?: string;
  endDate?: string;
}): Diary[] {
  const list = getActiveDiaries();
  return list.filter((d) => {
    if (opts.keyword && !d.content.includes(opts.keyword)) return false;
    if (opts.tag && !(d.tags ?? []).includes(opts.tag)) return false;
    if (opts.startDate && d.date < opts.startDate) return false;
    if (opts.endDate && d.date > opts.endDate) return false;
    return true;
  });
}
