import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { FileDB, getDefaultDataPath, getDefaultBackupDir } from "../db/fileDb";
import { createInitialData, cloneData } from "../db/initialData";
import type { KikiData } from "../types";

/**
 * 临时文件辅助：每次测试使用独立临时文件，互不干扰
 */
function tmpFilePath(): string {
  return path.join(
    os.tmpdir(),
    `kiki-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
  );
}

describe("initialData", () => {
  it("createInitialData 应返回完整空数据结构", () => {
    const data = createInitialData();
    expect(data.version).toBe("2.1.0");
    expect(data.createdAt).toBeTruthy();
    expect(data.profile.nickname).toBe("");
    expect(data.items).toEqual([]);
    expect(data.pets).toEqual([]);
    expect(data.todos).toEqual([]);
    expect(data.diaries).toEqual([]);
    expect(data.transactions).toEqual([]);
    expect(data.settings.reminders.globalEnabled).toBe(true);
    expect(data.settings.reminders.quietHours.start).toBe("22:00");
    expect(data.settings.autoBackup.frequency).toBe("weekly");
    expect(data.settings.privacy.enabled).toBe(false);
    expect(data.contentOverrides.quotes).toEqual([]);
  });

  it("cloneData 应深拷贝，修改副本不影响原对象", () => {
    const original = createInitialData();
    const copy = cloneData(original);
    copy.profile.nickname = "kiki";
    copy.items.push({
      id: "x",
      name: "测试",
      category: "daily",
      stock: 1,
      unit: "件",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(original.profile.nickname).toBe("");
    expect(original.items.length).toBe(0);
  });
});

describe("FileDB", () => {
  let db: FileDB;
  let filePath: string;

  beforeEach(() => {
    filePath = tmpFilePath();
    db = new FileDB(filePath);
  });

  afterEach(() => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const tmp = `${filePath}.tmp`;
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  });

  it("read 首次读取应自动创建初始数据并写入文件", async () => {
    expect(fs.existsSync(filePath)).toBe(false);
    const data = await db.read();
    expect(data.version).toBe("2.1.0");
    expect(data.items).toEqual([]);
    // 文件应已创建
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("write 后 read 应返回写入的数据", async () => {
    const data = createInitialData();
    data.profile.nickname = "kiki";
    data.items.push({
      id: "item-1",
      name: "纸巾",
      category: "daily",
      stock: 10,
      unit: "包",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await db.write(data);

    const read = await db.read();
    expect(read.profile.nickname).toBe("kiki");
    expect(read.items.length).toBe(1);
    expect(read.items[0].name).toBe("纸巾");
  });

  it("write 应更新 updatedAt 字段", async () => {
    const data = createInitialData();
    const before = data.updatedAt;
    await new Promise((r) => setTimeout(r, 10));
    await db.write(data);
    const read = await db.read();
    expect(read.updatedAt >= before).toBe(true);
  });

  it("写入使用原子替换（不残留 tmp 文件）", async () => {
    const data = createInitialData();
    await db.write(data);
    expect(fs.existsSync(`${filePath}.tmp`)).toBe(false);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("read 文件损坏时应备份损坏文件并重新初始化", async () => {
    // 先写入正常数据
    await db.write(createInitialData());
    // 损坏文件
    fs.writeFileSync(filePath, "{invalid json", "utf-8");
    const data = await db.read();
    expect(data.version).toBe("2.1.0");
    // 损坏文件应被备份
    const files = fs.readdirSync(path.dirname(filePath));
    const corrupt = files.filter((f) =>
      f.includes(path.basename(filePath) + ".corrupt-")
    );
    expect(corrupt.length).toBeGreaterThanOrEqual(1);
    // 清理 corrupt 备份
    corrupt.forEach((f) =>
      fs.unlinkSync(path.join(path.dirname(filePath), f))
    );
  });

  it("export 应返回数据的深拷贝", async () => {
    const data = createInitialData();
    data.profile.nickname = "kiki";
    await db.write(data);
    const exported = await db.export();
    expect(exported.data.profile.nickname).toBe("kiki");
    exported.data.profile.nickname = "modified";
    const reRead = await db.read();
    expect(reRead.profile.nickname).toBe("kiki");
  });

  it("import 应覆盖当前数据，且恢复前自动备份原数据", async () => {
    // 先写入原数据
    const original = createInitialData();
    original.profile.nickname = "original";
    await db.write(original);

    // 导入新数据
    const newData = createInitialData();
    newData.profile.nickname = "imported";
    await db.import(newData);

    const read = await db.read();
    expect(read.profile.nickname).toBe("imported");

    // 恢复前应自动备份原数据到备份目录
    const backupDir = getDefaultBackupDir();
    const files = fs.existsSync(backupDir) ? fs.readdirSync(backupDir) : [];
    const preRestore = files.filter((f) => f.includes("pre-restore-"));
    // 清理
    preRestore.forEach((f) => {
      try {
        fs.unlinkSync(path.join(backupDir, f));
      } catch {}
    });
  });

  it("getFilePath 应返回配置的路径", () => {
    expect(db.getFilePath()).toBe(filePath);
  });
});

describe("getDefaultDataPath / getDefaultBackupDir", () => {
  it("默认数据路径在 home 目录下", () => {
    const p = getDefaultDataPath();
    expect(p).toContain("kiki-data.json");
    expect(p.startsWith(os.homedir())).toBe(true);
  });

  it("默认备份目录在 home 目录下", () => {
    const p = getDefaultBackupDir();
    expect(p).toContain("kiki-backups");
    expect(p.startsWith(os.homedir())).toBe(true);
  });
});
