import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import {
  addDiary,
  updateDiary,
  deleteDiary,
  getActiveDiaries,
  searchDiaries,
} from "../../core/store/diaries";
import { useStore } from "../../core/store/useStore";

describe("diaries store", () => {
  let filePath: string;

  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    await loadStore();
  });

  afterEach(async () => {
    await cleanupTestDB(filePath);
  });

  it("addDiary 增加日记", async () => {
    const d = await addDiary({
      date: "2026-08-26",
      content: "今天很开心",
      mood: "happy",
      weather: "sunny",
      tags: ["生活"],
    });
    expect(d.content).toBe("今天很开心");
    expect(useStore.getState().data.diaries.length).toBe(1);
  });

  it("deleteDiary 软删除", async () => {
    const d = await addDiary({ date: "2026-08-26", content: "测试" });
    await deleteDiary(d.id);
    expect(useStore.getState().data.diaries[0].isDeleted).toBe(true);
    expect(getActiveDiaries().length).toBe(0);
  });

  it("getActiveDiaries 按日期倒序", async () => {
    await addDiary({ date: "2026-08-25", content: "前天" });
    await addDiary({ date: "2026-08-27", content: "后天" });
    await addDiary({ date: "2026-08-26", content: "今天" });
    const list = getActiveDiaries();
    expect(list[0].date).toBe("2026-08-27");
    expect(list[1].date).toBe("2026-08-26");
    expect(list[2].date).toBe("2026-08-25");
  });

  it("searchDiaries 关键词搜索", async () => {
    await addDiary({ date: "2026-08-25", content: "今天买了花" });
    await addDiary({ date: "2026-08-26", content: "今天很开心" });
    const result = searchDiaries({ keyword: "花" });
    expect(result.length).toBe(1);
    expect(result[0].content).toBe("今天买了花");
  });

  it("searchDiaries 标签搜索", async () => {
    await addDiary({
      date: "2026-08-25",
      content: "日记A",
      tags: ["旅行"],
    });
    await addDiary({
      date: "2026-08-26",
      content: "日记B",
      tags: ["生活"],
    });
    const result = searchDiaries({ tag: "旅行" });
    expect(result.length).toBe(1);
    expect(result[0].content).toBe("日记A");
  });

  it("searchDiaries 日期范围", async () => {
    await addDiary({ date: "2026-08-01", content: "月初" });
    await addDiary({ date: "2026-08-15", content: "月中" });
    await addDiary({ date: "2026-08-25", content: "月末" });
    const result = searchDiaries({ startDate: "2026-08-10", endDate: "2026-08-20" });
    expect(result.length).toBe(1);
    expect(result[0].content).toBe("月中");
  });
});
