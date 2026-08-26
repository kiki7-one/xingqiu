import { create } from "zustand";
import type { KikiData } from "../types";
import { getDB } from "../db";
import { createInitialData } from "../db/initialData";
import { generateId, nowISO } from "../utils/id";

/**
 * 全局数据 store
 * 所有模块共享同一份 KikiData，与本地文件同步
 *
 * 设计原则：
 * - load(): 从文件读取到内存
 * - 各模块通过自己的 store 方法操作内存数据
 * - 操作后自动调用 save() 持久化到文件
 */
interface StoreState {
  data: KikiData;
  loaded: boolean;
  /** 从文件加载数据到内存 */
  load: () => Promise<void>;
  /** 持久化内存数据到文件 */
  save: () => Promise<void>;
  /** 直接替换内存数据（用于导入恢复） */
  replace: (data: KikiData) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  data: createInitialData(),
  loaded: false,
  load: async () => {
    const data = await getDB().read();
    set({ data, loaded: true });
  },
  save: async () => {
    await getDB().write(get().data);
  },
  replace: async (data) => {
    await getDB().write(data);
    set({ data, loaded: true });
  },
}));

/**
 * 更新某数组字段并自动保存
 * 用法：mutateField("items", (arr) => [...arr, newItem])
 */
export async function mutateField<K extends keyof KikiData>(
  field: K,
  mutator: (current: KikiData[K]) => KikiData[K]
): Promise<void> {
  const { data, save } = useStore.getState();
  const next = { ...data, [field]: mutator(data[field]) } as KikiData;
  useStore.setState({ data: next });
  await save();
}

/**
 * 创建带 BaseEntity 字段的对象
 */
export function withBase<T extends object>(obj: T): T & {
  id: string;
  createdAt: string;
  updatedAt: string;
} {
  const ts = nowISO();
  return {
    ...obj,
    id: generateId(),
    createdAt: ts,
    updatedAt: ts,
  };
}

/**
 * 更新某条记录的 updatedAt
 */
export function touch<T extends { updatedAt: string }>(item: T): T {
  return { ...item, updatedAt: nowISO() };
}
