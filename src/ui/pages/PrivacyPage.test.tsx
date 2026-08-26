import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrivacyPage } from "../pages/PrivacyPage";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { useStore } from "../../core/store/useStore";

describe("PrivacyPage", () => {
  let filePath: string;
  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    await loadStore();
  });
  afterEach(async () => {
    await cleanupTestDB(filePath);
  });
  function renderPage() {
    return render(<TestRouter><PrivacyPage /></TestRouter>);
  }
  it("shows disabled state", () => {
    renderPage();
    expect(screen.getByText("未开启")).toBeInTheDocument();
  });
  it("enable privacy lock", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText("设置密码"), "1234");
    await user.type(screen.getByLabelText("确认密码"), "1234");
    await user.click(screen.getByText("开启隐私锁"));
    await waitFor(() => expect(screen.getByText("已开启")).toBeInTheDocument());
    expect(useStore.getState().data.settings.privacy.enabled).toBe(true);
  });
  it("password too short", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText("设置密码"), "12");
    await user.type(screen.getByLabelText("确认密码"), "12");
    await user.click(screen.getByText("开启隐私锁"));
    expect(screen.getByText("密码至少 4 位")).toBeInTheDocument();
  });
  it("password mismatch", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText("设置密码"), "1234");
    await user.type(screen.getByLabelText("确认密码"), "5678");
    await user.click(screen.getByText("开启隐私锁"));
    expect(screen.getByText("两次密码不一致")).toBeInTheDocument();
  });
  it("disable privacy lock", async () => {
    const { enablePrivacyLock } = await import("../../core/store/privacy");
    await enablePrivacyLock("1234");
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("关闭隐私锁"));
    await waitFor(() => expect(screen.getByText("未开启")).toBeInTheDocument());
    expect(useStore.getState().data.settings.privacy.enabled).toBe(false);
  });
});
