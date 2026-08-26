import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { updateProfile, getProfile } from "./profile";
import { useStore } from "./useStore";

describe("profile store", () => {
  let filePath: string;
  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    await loadStore();
  });
  afterEach(async () => {
    await cleanupTestDB(filePath);
  });

  it("getProfile returns initial empty", () => {
    const p = getProfile();
    expect(p.nickname).toBe("");
  });

  it("updateProfile updates fields", async () => {
    await updateProfile({ nickname: "kiki", gender: "female", birthday: "2000-01-01" });
    const p = useStore.getState().data.profile;
    expect(p.nickname).toBe("kiki");
    expect(p.gender).toBe("female");
    expect(p.birthday).toBe("2000-01-01");
  });

  it("updateProfile partial merge", async () => {
    await updateProfile({ nickname: "a" });
    await updateProfile({ gender: "male" });
    const p = useStore.getState().data.profile;
    expect(p.nickname).toBe("a");
    expect(p.gender).toBe("male");
  });

  it("updateProfile persists", async () => {
    await updateProfile({ nickname: "persist" });
    const { getDB } = await import("../db");
    const data = await getDB().read();
    expect(data.profile.nickname).toBe("persist");
  });
});
