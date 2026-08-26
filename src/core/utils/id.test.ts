import { describe, it, expect } from "vitest";
import { generateId, nowISO, todayDate } from "./id";

describe("id utils", () => {
  it("generateId 返回非空字符串", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(5);
  });

  it("generateId 每次生成不同 ID", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(1000);
  });

  it("nowISO 返回合法 ISO 时间", () => {
    const iso = nowISO();
    const d = new Date(iso);
    expect(d.toString()).not.toBe("Invalid Date");
  });

  it("todayDate 返回 YYYY-MM-DD 格式", () => {
    const t = todayDate();
    expect(t).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
