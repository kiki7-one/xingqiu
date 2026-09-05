import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { setMoodForDate, getMoodByDate, getAllMoodRecords } from "./mood";
import { useStore } from "./useStore";

describe("mood store", () => {
  let filePath: string;
  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    await loadStore();
  });
  afterEach(async () => {
    await cleanupTestDB(filePath);
  });

  it("setMoodForDate records mood", async () => {
    await setMoodForDate("2026-08-26", "happy");
    expect(getMoodByDate("2026-08-26")).toBe("happy");
    expect(useStore.getState().data.moodRecords.length).toBe(1);
  });

  it("setMoodForDate overwrites same date", async () => {
    await setMoodForDate("2026-08-26", "happy");
    await setMoodForDate("2026-08-26", "sad");
    expect(getMoodByDate("2026-08-26")).toBe("sad");
    expect(useStore.getState().data.moodRecords.length).toBe(1);
  });

  it("getMoodByDate returns undefined when absent", () => {
    expect(getMoodByDate("2026-01-01")).toBeUndefined();
  });

  it("different dates create separate records", async () => {
    await setMoodForDate("2026-08-26", "happy");
    await setMoodForDate("2026-08-27", "calm");
    expect(useStore.getState().data.moodRecords.length).toBe(2);
    expect(getAllMoodRecords().length).toBe(2);
  });

  it("persists mood record", async () => {
    await setMoodForDate("2026-08-26", "happy");
    const { getDB } = await import("../db");
    const data = await getDB().read();
    expect(data.moodRecords.length).toBe(1);
    expect(data.moodRecords[0].mood).toBe("happy");
  });
});
