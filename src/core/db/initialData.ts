import type { KikiData } from "../types";

/**
 * 创建初始空数据结构
 */
export function createInitialData(): KikiData {
  const now = new Date().toISOString();
  return {
    version: "2.1.0",
    createdAt: now,
    updatedAt: now,
    profile: {
      nickname: "",
      avatar: "",
    },
    settings: {
      reminders: {
        globalEnabled: true,
        quietHours: {
          enabled: true,
          start: "22:00",
          end: "08:00",
        },
        perType: {},
        deduplicationHours: 24,
      },
      autoBackup: {
        enabled: true,
        frequency: "weekly",
      },
      privacy: {
        enabled: false,
        protectedModules: ["diary", "transaction", "pet"],
      },
    },
    items: [],
    consumptionRecords: [],
    shoppingList: [],
    pets: [],
    petReminders: [],
    petFoods: [],
    todos: [],
    diaries: [],
    transactions: [],
    budgets: [],
    quoteFavorites: [],
    flowerFavorites: [],
    contentOverrides: {
      quotes: [],
      flowers: [],
    },
  };
}

/**
 * 深拷贝数据（避免引用共享）
 */
export function cloneData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * 合并数据：以 base 为基础，用 patch 覆盖（浅合并顶层数组）
 */
export function mergeData(base: KikiData, patch: Partial<KikiData>): KikiData {
  return {
    ...base,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}
