import { describe, it, expect } from "vitest";
import { getDayOfYear, getQuoteOfDay, getFlowerOfDay, getRandomQuote } from "./rotation";
import { getAllQuotes, getAllFlowers, findQuoteById } from "./library";
import type { Quote, Flower } from "../types";

describe("rotation", () => {
  it("getDayOfYear 1 and 365", () => {
    expect(getDayOfYear(new Date("2026-01-01T00:00:00Z"))).toBe(1);
    expect(getDayOfYear(new Date("2026-12-31T00:00:00Z"))).toBe(365);
  });
  it("getQuoteOfDay rotate by day", () => {
    const q: Quote[] = [
      { id: "q1", text: "a", category: "motivational" },
      { id: "q2", text: "b", category: "healing" },
      { id: "q3", text: "c", category: "love" },
    ];
    // day 1 % 3 = 1 -> idx 1 (q2)
    // day 2 % 3 = 2 -> idx 2 (q3)
    // day 4 % 3 = 1 -> idx 1 (q2)
    const d1 = getQuoteOfDay(new Date("2026-01-01T00:00:00Z"), q);
    const d2 = getQuoteOfDay(new Date("2026-01-02T00:00:00Z"), q);
    const d4 = getQuoteOfDay(new Date("2026-01-04T00:00:00Z"), q);
    expect(d1!.id).toBe("q2");
    expect(d2!.id).toBe("q3");
    expect(d4!.id).toBe("q2");
  });
  it("getQuoteOfDay empty returns null", () => {
    expect(getQuoteOfDay(new Date(), [])).toBeNull();
  });
  it("getFlowerOfDay rotate", () => {
    const f: Flower[] = [
      { id: "f1", name: "rose", meaning: "love", imageUrl: "" },
      { id: "f2", name: "lily", meaning: "pure", imageUrl: "" },
    ];
    expect(getFlowerOfDay(new Date("2026-01-01T00:00:00Z"), f)).toBeTruthy();
  });
  it("getRandomQuote exclude", () => {
    const q: Quote[] = [
      { id: "q1", text: "a", category: "motivational" },
      { id: "q2", text: "b", category: "healing" },
    ];
    const r = getRandomQuote(q, "q1");
    expect(r!.id).toBe("q2");
  });
  it("getRandomQuote empty null", () => {
    expect(getRandomQuote([])).toBeNull();
  });
});

describe("library", () => {
  it("getAllQuotes >=90", () => {
    expect(getAllQuotes().length).toBeGreaterThanOrEqual(90);
  });
  it("getAllFlowers >=30", () => {
    expect(getAllFlowers().length).toBeGreaterThanOrEqual(30);
  });
  it("getAllQuotes merge overrides", () => {
    const c: Quote[] = [{ id: "c1", text: "x", category: "motivational" }];
    const all = getAllQuotes(c);
    expect(all.find((q) => q.id === "c1")).toBeTruthy();
  });
  it("findQuoteById builtin", () => {
    expect(findQuoteById("q1")).toBeTruthy();
  });
  it("findQuoteById custom", () => {
    const c: Quote[] = [{ id: "my", text: "x", category: "love" }];
    expect(findQuoteById("my", c)).toBeTruthy();
  });
});
