import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import {
  enablePrivacyLock,
  disablePrivacyLock,
  isPrivacyEnabled,
  verifyPrivacyPassword,
  isModuleProtected,
  setProtectedModules,
} from "./privacy";
import { useStore } from "./useStore";

describe("privacy store", () => {
  let filePath: string;
  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    await loadStore();
  });
  afterEach(async () => {
    await cleanupTestDB(filePath);
  });

  it("default disabled", () => {
    expect(isPrivacyEnabled()).toBe(false);
  });

  it("enablePrivacyLock sets enabled + hash", async () => {
    await enablePrivacyLock("1234");
    expect(isPrivacyEnabled()).toBe(true);
    expect(useStore.getState().data.settings.privacy.passwordHash).toBeTruthy();
  });

  it("verifyPrivacyPassword correct", async () => {
    await enablePrivacyLock("mypass");
    expect(verifyPrivacyPassword("mypass")).toBe(true);
  });

  it("verifyPrivacyPassword wrong", async () => {
    await enablePrivacyLock("mypass");
    expect(verifyPrivacyPassword("wrong")).toBe(false);
  });

  it("disablePrivacyLock", async () => {
    await enablePrivacyLock("1234");
    await disablePrivacyLock();
    expect(isPrivacyEnabled()).toBe(false);
    expect(useStore.getState().data.settings.privacy.passwordHash).toBeUndefined();
  });

  it("isModuleProtected default modules", () => {
    // 默认未启用，即使模块在列表也返回 false
    expect(isModuleProtected("diary")).toBe(false);
  });

  it("isModuleProtected after enable", async () => {
    await enablePrivacyLock("1234");
    expect(isModuleProtected("diary")).toBe(true);
    expect(isModuleProtected("transaction")).toBe(true);
    expect(isModuleProtected("pet")).toBe(true);
  });

  it("setProtectedModules updates list", async () => {
    await setProtectedModules(["diary"]);
    expect(isModuleProtected("diary")).toBe(false); // 未启用
    await enablePrivacyLock("1234");
    expect(isModuleProtected("diary")).toBe(true);
    expect(isModuleProtected("pet")).toBe(false);
  });
});
