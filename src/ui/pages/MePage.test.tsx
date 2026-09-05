import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MePage } from "../pages/MePage";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { updateProfile } from "../../core/store/profile";

describe("MePage", () => {
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
    return render(
      <TestRouter initialEntries={["/me"]}>
        <MePage />
      </TestRouter>
    );
  }

  it("shows default nickname when not set", () => {
    renderPage();
    expect(screen.getByText("未设置昵称")).toBeInTheDocument();
  });

  it("shows profile nickname", async () => {
    await updateProfile({ nickname: "kiki", avatar: "" });
    renderPage();
    expect(screen.getByText("kiki")).toBeInTheDocument();
  });

  it("shows settings icon to edit profile", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("修改个人资料"));
    // 跳转到个人资料页
    expect(await screen.findByText("个人资料")).toBeInTheDocument();
  });

  it("shows feature entries", () => {
    renderPage();
    expect(screen.getByText("隐私锁")).toBeInTheDocument();
    expect(screen.getByText("提醒设置")).toBeInTheDocument();
    expect(screen.getByText("备份与恢复")).toBeInTheDocument();
  });
});
