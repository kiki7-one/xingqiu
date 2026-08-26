import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlowersPage } from "../pages/FlowersPage";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { useStore } from "../../core/store/useStore";

describe("FlowersPage", () => {
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
    return render(<TestRouter><FlowersPage /></TestRouter>);
  }
  it("shows daily flower", () => {
    renderPage();
    expect(screen.getByText("每日花语")).toBeInTheDocument();
  });
  it("favorite", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("收藏花语"));
    await waitFor(() => expect(screen.getByLabelText("取消收藏")).toBeInTheDocument());
    expect(useStore.getState().data.flowerFavorites.length).toBe(1);
  });
  it("unfavorite", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("收藏花语"));
    await waitFor(() => expect(screen.getByLabelText("取消收藏")).toBeInTheDocument());
    await user.click(screen.getByLabelText("取消收藏"));
    await waitFor(() => expect(screen.getByLabelText("收藏花语")).toBeInTheDocument());
    expect(useStore.getState().data.flowerFavorites.length).toBe(0);
  });
  it("next changes", async () => {
    const user = userEvent.setup();
    renderPage();
    const first = screen.getAllByRole("heading")[1].textContent;
    await user.click(screen.getByLabelText("下一条花语"));
    const second = screen.getAllByRole("heading")[1].textContent;
    expect(first).not.toBe(second);
  });
  it("prev disabled", () => {
    renderPage();
    expect((screen.getByLabelText("上一条花语") as HTMLButtonElement)).toBeDisabled();
  });
});
