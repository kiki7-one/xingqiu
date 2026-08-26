import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { FileDB } from "../core/db/fileDb";
import { setDB } from "../core/db";
import { useStore } from "../core/store/useStore";
import { createInitialData } from "../core/db/initialData";

/**
 * 测试辅助：每个测试用例独立的临时 DB + 已 load 的 store
 */
export function setupTestDB() {
  const filePath = path.join(
    os.tmpdir(),
    `kiki-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
  );
  const db = new FileDB(filePath);
  setDB(db);
  return { filePath, db };
}

export async function loadStore() {
  await useStore.getState().load();
}

export async function cleanupTestDB(filePath: string) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const tmp = `${filePath}.tmp`;
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  } catch {}
}

/**
 * 重置 store 内存数据到初始状态
 */
export function resetStore() {
  useStore.setState({ data: createInitialData(), loaded: false });
}
