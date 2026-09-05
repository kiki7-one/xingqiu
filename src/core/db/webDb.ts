import type { KikiData } from "../types";
import { createInitialData, cloneData } from "./initialData";

const STORAGE_KEY = "kiki-star-data";

/**
 * 浏览器数据层实现（localStorage 持久化）
 * 用于网页形态 / 浏览器预览，刷新不丢失
 */
export class WebDB {
  getFilePath(): string | null {
    return null;
  }

  async read(): Promise<KikiData> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return this.migrate(JSON.parse(raw));
      } catch {
        // 解析失败则回退
      }
    }
    // 首次初始化：使用空数据
    const initial = createInitialData();
    await this.write(initial);
    return initial;
  }

  async write(data: KikiData): Promise<void> {
    const updated = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async export(): Promise<{ data: KikiData }> {
    return { data: cloneData(await this.read()) };
  }

  async import(data: KikiData): Promise<void> {
    await this.write(this.migrate(data));
  }

  /** 数据迁移：补全新字段（向前兼容） */
  private migrate(data: Partial<KikiData>): KikiData {
    const initial = createInitialData();
    return {
      ...initial,
      ...data,
      profile: { ...initial.profile, ...(data.profile ?? {}) },
      settings: {
        ...initial.settings,
        ...(data.settings ?? {}),
        reminders: {
          ...initial.settings.reminders,
          ...((data.settings as any)?.reminders ?? {}),
          quietHours: {
            ...initial.settings.reminders.quietHours,
            ...((data.settings as any)?.reminders?.quietHours ?? {}),
          },
        },
        autoBackup: {
          ...initial.settings.autoBackup,
          ...((data.settings as any)?.autoBackup ?? {}),
        },
        privacy: {
          ...initial.settings.privacy,
          ...((data.settings as any)?.privacy ?? {}),
        },
      },
      contentOverrides: {
        ...initial.contentOverrides,
        ...(data.contentOverrides ?? {}),
      },
    };
  }
}
