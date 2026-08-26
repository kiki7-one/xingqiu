import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackupPage } from "../pages/BackupPage";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { useStore } from "../../core/store/useStore";

const confirmSpy = vi.spyOn(window, "confirm");
confirmSpy.mockImplementation(() => true);

describe("BackupPage", () => {
  let filePath: string;
  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    await loadStore();
    confirmSpy.mockClear();
  });
  afterEach(async () => {
    await cleanupTestDB(filePath);
  });
  function renderPage() {
    return render(<TestRouter><BackupPage /></TestRouter>);
  }
  it("shows title", () => {
    renderPage();
    expect(screen.getByText("备份与恢复")).toBeInTheDocument();
  });
  it("backup triggers download", async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(document, "createElement");
    renderPage();
    const btn = screen.getByRole("button", { name: "立即备份" });
    await user.click(btn);
    expect(createSpy).toHaveBeenCalledWith("a");
    createSpy.mockRestore();
  });
  it("restore invalid file shows error", async () => {
    const user = userEvent.setup();
    renderPage();
    const file = new File(["invalid json"], "backup.kikibak", { type: "application/json" });
    const input = screen.getByLabelText("选择备份文件");
    await user.upload(input, file);
    await waitFor(() => {
      expect(screen.getByText(/文件格式错误/)).toBeInTheDocument();
    });
  });
  it("restore valid file updates data", async () => {
    const { updateProfile } = await import("../../core/store/profile");
    await updateProfile({ nickname: "before" });
    const beforeData = JSON.stringify(useStore.getState().data);
    const restoredData = JSON.parse(beforeData);
    restoredData.profile.nickname = "restored";

    // 直接通过 DB 层验证恢复逻辑
    const { getDB } = await import("../../core/db");
    await getDB().import(restoredData);
    await useStore.getState().load();
    expect(useStore.getState().data.profile.nickname).toBe("restored");
  });
});
