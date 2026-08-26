import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuotesPage } from "../pages/QuotesPage";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { useStore } from "../../core/store/useStore";

describe("QuotesPage", () => {
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
    return render(<TestRouter><QuotesPage /></TestRouter>);
  }

  it("shows daily quote", () => {
    renderPage();
    expect(screen.getByText("每日语录")).toBeInTheDocument();
  });

  it("favorite quote", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("收藏语录"));
    await waitFor(() => {
      expect(screen.getByLabelText("取消收藏")).toBeInTheDocument();
    });
    expect(useStore.getState().data.quoteFavorites.length).toBe(1);
  });

  it("unfavorite", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("收藏语录"));
    await waitFor(() => expect(screen.getByLabelText("取消收藏")).toBeInTheDocument());
    await user.click(screen.getByLabelText("取消收藏"));
    await waitFor(() => expect(screen.getByLabelText("收藏语录")).toBeInTheDocument());
    expect(useStore.getState().data.quoteFavorites.length).toBe(0);
  });

  it("refresh count", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("换一条"));
    await waitFor(() => expect(screen.getByText(/1\/3/)).toBeInTheDocument());
  });

  it("refresh max 3", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("换一条"));
    await user.click(screen.getByLabelText("换一条"));
    await user.click(screen.getByLabelText("换一条"));
    const btn = screen.getByLabelText("换一条") as HTMLButtonElement;
    expect(btn).toBeDisabled();
  });

  it("view favorites", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("收藏语录"));
    // 顶部"收藏"按钮（Bookmark）在 DOM 中先出现
    const favBtns = screen.getAllByText("收藏");
    await user.click(favBtns[0]);
    await waitFor(() => expect(screen.getByText("我的收藏")).toBeInTheDocument());
  });

  it("empty favorites hint", async () => {
    const user = userEvent.setup();
    renderPage();
    const favBtns = screen.getAllByText("收藏");
    await user.click(favBtns[0]);
    await waitFor(() => expect(screen.getByText("还没有收藏语录")).toBeInTheDocument());
  });
});
