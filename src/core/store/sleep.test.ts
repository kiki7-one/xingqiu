import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { setSleepForDate, getSleepByDate, getAllSleepRecords } from "./sleep";
import { useStore } from "./useStore";

describe("sleep store", () => {
  let filePath: string;
  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    await loadStore();
  });
  afterEach(async () => {
    await cleanupTestDB(filePath);
  });

  it("setSleepForDate records sleep", async () => {
    await setSleepForDate("2026-08-26", 8);
    expect(getSleepByDate("2026-08-26")?.hours).toBe(8);
    expect(useStore.getState().data.sleepRecords.length).toBe(1);
  });

  it("setSleepForDate overwrites same date", async () => {
    await setSleepForDate("2026-08-26", 8);
    await setSleepForDate("2026-08-26", 7.5);
    expect(getSleepByDate("2026-08-26")?.hours).toBe(7.5);
    expect(useStore.getState().data.sleepRecords.length).toBe(1);
  });

  it("getSleepByDate undefined when absent", () => {
    expect(getSleepByDate("2026-01-01")).toBeUndefined();
  });

  it("different dates separate records", async () => {
    await setSleepForDate("2026-08-26", 8);
    await setSleepForDate("2026-08-27", 6.5);
    expect(getAllSleepRecords().length).toBe(2);
  });

  it("persists sleep record", async () => {
    await setSleepForDate("2026-08-26", 8);
    const { getDB } = await import("../db");
    const data = await getDB().read();
    expect(data.sleepRecords.length).toBe(1);
    expect(data.sleepRecords[0].hours).toBe(8);
  });
});
