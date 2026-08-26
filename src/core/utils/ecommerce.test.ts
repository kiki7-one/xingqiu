import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildSearchUrl,
  isOnline,
  jumpToEcommerce,
  ECOMMERCE_LABEL,
} from "./ecommerce";

describe("ecommerce utils", () => {
  it("buildSearchUrl 淘宝", () => {
    const url = buildSearchUrl("taobao", "纸巾");
    expect(url).toContain("s.taobao.com/search");
    expect(url).toContain("q=");
    expect(url).toContain(encodeURIComponent("纸巾"));
  });

  it("buildSearchUrl 京东", () => {
    const url = buildSearchUrl("jd", "猫粮");
    expect(url).toContain("search.jd.com/Search");
    expect(url).toContain(encodeURIComponent("猫粮"));
  });

  it("buildSearchUrl 拼多多", () => {
    const url = buildSearchUrl("pinduoduo", "猫砂");
    expect(url).toContain(encodeURIComponent("猫砂"));
  });

  it("ECOMMERCE_LABEL 包含中文", () => {
    expect(ECOMMERCE_LABEL.taobao).toBe("淘宝");
    expect(ECOMMERCE_LABEL.jd).toBe("京东");
    expect(ECOMMERCE_LABEL.pinduoduo).toBe("拼多多");
  });

  describe("isOnline", () => {
    const original = Object.getOwnPropertyDescriptor(navigator, "onLine");
    beforeEach(() => {
      // jsdom 默认 navigator.onLine = true
    });
    afterEach(() => {
      // 恢复
      if (original) {
        Object.defineProperty(navigator, "onLine", original);
      }
    });

    it("navigator.onLine 为 true 时返回 true", () => {
      Object.defineProperty(navigator, "onLine", {
        value: true,
        configurable: true,
      });
      expect(isOnline()).toBe(true);
    });

    it("navigator.onLine 为 false 时返回 false", () => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        configurable: true,
      });
      expect(isOnline()).toBe(false);
    });
  });

  describe("jumpToEcommerce", () => {
    it("离线时返回 false 且不打开窗口", () => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        configurable: true,
      });
      const openSpy = vi.spyOn(window, "open");
      const result = jumpToEcommerce("taobao", "纸巾");
      expect(result).toBe(false);
      expect(openSpy).not.toHaveBeenCalled();
    });

    it("联网时返回 true 并打开新窗口", () => {
      Object.defineProperty(navigator, "onLine", {
        value: true,
        configurable: true,
      });
      const openSpy = vi
        .spyOn(window, "open")
        .mockImplementation(() => null);
      const result = jumpToEcommerce("jd", "猫粮");
      expect(result).toBe(true);
      expect(openSpy).toHaveBeenCalledTimes(1);
      const calledUrl = openSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain("search.jd.com");
      openSpy.mockRestore();
    });
  });
});
