import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import {
  addExercise,
  deleteExercise,
  getExercisesByDate,
  getExerciseMinutes,
  getAllExercises,
} from "./exercise";
import { useStore } from "./useStore";

describe("exercise store", () => {
  let filePath: string;
  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    await loadStore();
  });
  afterEach(async () => {
    await cleanupTestDB(filePath);
  });

  it("addExercise records", async () => {
    await addExercise({ date: "2026-08-26", type: "walk", duration: 30 });
    expect(useStore.getState().data.exerciseRecords.length).toBe(1);
    expect(useStore.getState().data.exerciseRecords[0].type).toBe("walk");
  });

  it("getExercisesByDate filters by date", async () => {
    await addExercise({ date: "2026-08-26", type: "run", duration: 30 });
    await addExercise({ date: "2026-08-27", type: "yoga", duration: 20 });
    expect(getExercisesByDate("2026-08-26").length).toBe(1);
  });

  it("getExerciseMinutes sums duration", async () => {
    await addExercise({ date: "2026-08-26", type: "walk", duration: 30 });
    await addExercise({ date: "2026-08-26", type: "run", duration: 20 });
    expect(getExerciseMinutes("2026-08-26")).toBe(50);
  });

  it("deleteExercise removes record", async () => {
    const e = await addExercise({ date: "2026-08-26", type: "walk", duration: 30 });
    await deleteExercise(e.id);
    expect(useStore.getState().data.exerciseRecords.length).toBe(0);
  });

  it("persists exercise record", async () => {
    await addExercise({ date: "2026-08-26", type: "walk", duration: 30, remark: "晚上散步" });
    const { getDB } = await import("../db");
    const data = await getDB().read();
    expect(data.exerciseRecords.length).toBe(1);
    expect(data.exerciseRecords[0].remark).toBe("晚上散步");
  });

  it("getAllExercises returns all", async () => {
    await addExercise({ date: "2026-08-26", type: "walk", duration: 30 });
    await addExercise({ date: "2026-08-27", type: "run", duration: 15 });
    expect(getAllExercises().length).toBe(2);
  });
});
