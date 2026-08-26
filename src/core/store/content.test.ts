import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import {
  importQuotes,
  importFlowers,
  clearContentOverrides,
  parseQuotesJson,
  parseFlowersJson,
} from "./content";
import { useStore } from "./useStore";

describe("content store", () => {
  let filePath: string;
  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    await loadStore();
  });
  afterEach(async () => {
    await cleanupTestDB(filePath);
  });

  it("importQuotes adds to overrides", async () => {
    const n = await importQuotes([
      { id: "c1", text: "自定义1", category: "love" },
      { id: "c2", text: "自定义2", category: "healing" },
    ]);
    expect(n).toBe(2);
    expect(useStore.getState().data.contentOverrides.quotes.length).toBe(2);
  });

  it("importQuotes dedup by id", async () => {
    await importQuotes([{ id: "c1", text: "a", category: "love" }]);
    const n = await importQuotes([{ id: "c1", text: "b", category: "love" }]);
    expect(n).toBe(0);
    expect(useStore.getState().data.contentOverrides.quotes.length).toBe(1);
  });

  it("importQuotes empty returns 0", async () => {
    expect(await importQuotes([])).toBe(0);
  });

  it("importFlowers adds to overrides", async () => {
    const n = await importFlowers([
      { id: "cf1", name: "自定义花", meaning: "自定义寓意", imageUrl: "" },
    ]);
    expect(n).toBe(1);
    expect(useStore.getState().data.contentOverrides.flowers.length).toBe(1);
  });

  it("clearContentOverrides empties both", async () => {
    await importQuotes([{ id: "c1", text: "a", category: "love" }]);
    await importFlowers([{ id: "f1", name: "花", meaning: "m", imageUrl: "" }]);
    await clearContentOverrides();
    expect(useStore.getState().data.contentOverrides.quotes.length).toBe(0);
    expect(useStore.getState().data.contentOverrides.flowers.length).toBe(0);
  });

  it("parseQuotesJson parses valid json", () => {
    const json = JSON.stringify([
      { id: "x1", text: "hi", category: "love" },
      { id: "x2", text: "yo", category: "healing" },
    ]);
    const q = parseQuotesJson(json);
    expect(q.length).toBe(2);
    expect(q[0].text).toBe("hi");
  });

  it("parseQuotesJson throws on invalid format", () => {
    expect(() => parseQuotesJson('{"a":1}')).toThrow();
  });

  it("parseFlowersJson parses valid json", () => {
    const json = JSON.stringify([
      { id: "f1", name: "rose", meaning: "love", imageUrl: "", careTips: "sun" },
    ]);
    const f = parseFlowersJson(json);
    expect(f.length).toBe(1);
    expect(f[0].careTips).toBe("sun");
  });

  it("parseQuotesJson assigns id if missing", () => {
    const json = JSON.stringify([{ text: "no id", category: "love" }]);
    const q = parseQuotesJson(json);
    expect(q[0].id).toBeTruthy();
  });
});
