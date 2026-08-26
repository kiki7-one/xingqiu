import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { KikiData } from "../types";
import { createInitialData, cloneData } from "./initialData";

/**
 * 数据访问层接口
 * 双形态共享接口，实现分别为：
 * - app-db.ts: Electron/Node fs 直接读写文件
 * - web-db.ts: IndexedDB（后续网页形态实现）
 */
export interface KikiDB {
  /** 读取全部数据 */
  read(): Promise<KikiData>;
  /** 写入全部数据（覆盖） */
  write(data: KikiData): Promise<void>;
  /** 导出数据为 .kikibak 文件 */
  export(): Promise<{ data: KikiData; blob?: never }>;
  /** 从备份文件导入数据（覆盖当前） */
  import(data: KikiData): Promise<void>;
  /** 获取数据文件路径（App 形态有值，网页形态返回 null） */
  getFilePath(): string | null;
}

/**
 * 默认数据文件路径
 * App 形态: ~/kiki-data.json
 */
export function getDefaultDataPath(): string {
  return path.join(os.homedir(), "kiki-data.json");
}

/**
 * 默认备份目录
 * ~/kiki-backups/
 */
export function getDefaultBackupDir(): string {
  return path.join(os.homedir(), "kiki-backups");
}

/**
 * Node/Electron 文件系统数据层实现
 * 直接读写本地 JSON 文件，刷新/关闭/重启不丢失
 */
export class FileDB implements KikiDB {
  private filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath ?? getDefaultDataPath();
  }

  getFilePath(): string {
    return this.filePath;
  }

  async read(): Promise<KikiData> {
    try {
      if (!fs.existsSync(this.filePath)) {
        const initial = createInitialData();
        await this.write(initial);
        return initial;
      }
      const raw = fs.readFileSync(this.filePath, "utf-8");
      const data = JSON.parse(raw) as KikiData;
      // 简单的版本兼容：如果缺少新字段，补全
      return this.migrate(data);
    } catch (err) {
      // 文件损坏：备份损坏文件，重新初始化
      if (fs.existsSync(this.filePath)) {
        const corruptBackup = `${this.filePath}.corrupt-${Date.now()}`;
        fs.copyFileSync(this.filePath, corruptBackup);
      }
      const initial = createInitialData();
      await this.write(initial);
      return initial;
    }
  }

  async write(data: KikiData): Promise<void> {
    const updated = { ...data, updatedAt: new Date().toISOString() };
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // 先写临时文件，再原子替换，避免写入中断损坏
    const tmp = `${this.filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(updated, null, 2), "utf-8");
    fs.renameSync(tmp, this.filePath);
  }

  async export(): Promise<{ data: KikiData }> {
    const data = await this.read();
    return { data: cloneData(data) };
  }

  async import(data: KikiData): Promise<void> {
    // 恢复前自动备份当前数据
    if (fs.existsSync(this.filePath)) {
      const backupDir = getDefaultBackupDir();
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const preRestorePath = path.join(
        backupDir,
        `pre-restore-${new Date().toISOString().replace(/[:.]/g, "-")}.kikibak`
      );
      fs.copyFileSync(this.filePath, preRestorePath);
    }
    await this.write(this.migrate(data));
  }

  /**
   * 数据迁移：补全新字段（向前兼容）
   */
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
