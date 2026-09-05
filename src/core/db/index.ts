import { FileDB } from "./fileDb";
import { WebDB } from "./webDb";
import type { KikiDB } from "./fileDb";

/**
 * 数据层单例
 * - App 形态（Node/Electron）：FileDB（Node fs 直接读写文件）
 * - 网页/浏览器形态：WebDB（localStorage 持久化）
 */
let dbInstance: KikiDB | null = null;

/** 判断是否为浏览器环境 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getDB(): KikiDB {
  if (!dbInstance) {
    dbInstance = isBrowser() ? new WebDB() : new FileDB();
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
