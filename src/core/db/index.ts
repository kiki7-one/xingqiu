import { FileDB } from "./fileDb";
import type { KikiDB } from "./fileDb";

/**
 * 数据层单例
 * App 形态使用 FileDB（Node fs 直接读写）
 * 网页形态后续会实现 IndexedDB 版本
 */
let dbInstance: KikiDB | null = null;

export function getDB(): KikiDB {
  if (!dbInstance) {
    dbInstance = new FileDB();
  }
  return dbInstance;
}

/**
 * 用于测试：注入自定义 DB 实例
 */
export function setDB(db: KikiDB): void {
  dbInstance = db;
}

export type { KikiDB } from "./fileDb";
export { FileDB, getDefaultDataPath, getDefaultBackupDir } from "./fileDb";
