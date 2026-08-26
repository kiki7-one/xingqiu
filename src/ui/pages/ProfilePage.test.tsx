import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfilePage } from "../pages/ProfilePage";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { useStore } from "../../core/store/useStore";

describe("ProfilePage", () => {
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
    return render(<TestRouter><ProfilePage /></TestRouter>);
  }
  it("shows title", () => {
    renderPage();
    expect(screen.getByText("个人资料")).toBeInTheDocument();
  });
  it("save profile", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText("昵称"), "kiki");
    await user.click(screen.getByText("保存"));
    await waitFor(() => expect(screen.getByText("已保存")).toBeInTheDocument());
    expect(useStore.getState().data.profile.nickname).toBe("kiki");
  });
});
