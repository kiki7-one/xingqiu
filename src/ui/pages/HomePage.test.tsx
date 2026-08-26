import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomePage } from "../pages/HomePage";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { addTodo } from "../../core/store/todos";
import { useStore } from "../../core/store/useStore";

describe("HomePage", () => {
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
    return render(<TestRouter><HomePage /></TestRouter>);
  }
  it("title", () => {
    renderPage();
    expect(screen.getByText("今日概览")).toBeInTheDocument();
  });
  it("daily quote", () => {
    renderPage();
    expect(screen.getByText("每日语录")).toBeInTheDocument();
  });
  it("daily flower", () => {
    renderPage();
    expect(screen.getByText("每日花语")).toBeInTheDocument();
  });
  it("todo empty", () => {
    renderPage();
    expect(screen.getByText("今日暂无待办")).toBeInTheDocument();
  });
  it("shows today todos", async () => {
    await addTodo({ title: "今日任务", priority: "medium", repeatRule: "none", deadline: "2026-08-26T18:00:00.000Z" });
    renderPage();
    expect(screen.getByText("今日任务")).toBeInTheDocument();
  });
  it("complete todo", async () => {
    await addTodo({ title: "待办A", priority: "medium", repeatRule: "none", deadline: "2026-08-26T18:00:00.000Z" });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("完成待办A"));
    await waitFor(() => expect(useStore.getState().data.todos[0].isCompleted).toBe(true));
    expect(useStore.getState().data.todos[0].isCompleted).toBe(true);
  });
  it("quick links", () => {
    renderPage();
    expect(screen.getByText("物品")).toBeInTheDocument();
    expect(screen.getByText("宠物")).toBeInTheDocument();
    expect(screen.getByText("记账")).toBeInTheDocument();
    expect(screen.getByText("日记")).toBeInTheDocument();
  });
});
