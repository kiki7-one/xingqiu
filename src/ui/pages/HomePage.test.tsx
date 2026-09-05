import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomePage } from "../pages/HomePage";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { addTodo, completeTodo } from "../../core/store/todos";
import { useStore } from "../../core/store/useStore";
import { getAllQuotes, getAllFlowers } from "../../core/content/library";

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

  it("shows greeting by time", () => {
    renderPage();
    expect(screen.getByText(/早上好呀～|中午好呀～|下午好呀～|晚上好呀～/)).toBeInTheDocument();
  });

  it("shows daily quote text directly (no 每日语录 label)", () => {
    renderPage();
    // 不应再出现"每日语录"标题文字
    expect(screen.queryByText("每日语录")).not.toBeInTheDocument();
    // 应直接展示某条语录文案（允许周围有引号等装饰字符）
    const quotes = getAllQuotes();
    const found = quotes.some((q) =>
      screen.queryByText(new RegExp(q.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    );
    expect(found).toBe(true);
  });

  it("daily flower shown in top quote card", () => {
    // 首页固定展示飞燕草
    renderPage();
    expect(screen.getByText(/飞燕草/)).toBeInTheDocument();
    expect(screen.getByText(/积极、浪漫、快乐/)).toBeInTheDocument();
  });

  it("todo empty", () => {
    renderPage();
    expect(screen.getByText(/今日没有未完成的待办/)).toBeInTheDocument();
  });

  it("shows pending today todos", async () => {
    await addTodo({ title: "今日任务", priority: "medium", repeatRule: "none", deadline: "2026-08-26T18:00:00.000Z" });
    renderPage();
    expect(screen.getByText("今日任务")).toBeInTheDocument();
  });

  it("complete todo marks completed", async () => {
    await addTodo({ title: "待办A", priority: "medium", repeatRule: "none", deadline: "2026-08-26T18:00:00.000Z" });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("完成待办A"));
    await waitFor(() => expect(useStore.getState().data.todos[0].isCompleted).toBe(true));
  });

  it("completed todo not shown on home", async () => {
    await addTodo({ title: "已完成项", priority: "medium", repeatRule: "none", deadline: "2026-08-26T18:00:00.000Z" });
    const todo = useStore.getState().data.todos[0];
    await completeTodo(todo.id);
    renderPage();
    // 首页只展示未完成待办，已完成的不展示
    expect(screen.queryByText("已完成项")).not.toBeInTheDocument();
  });

  it("quick links removed", () => {
    renderPage();
    expect(screen.queryByText("物品")).not.toBeInTheDocument();
    expect(screen.queryByText("宠物")).not.toBeInTheDocument();
    expect(screen.queryByText("记账")).not.toBeInTheDocument();
    expect(screen.queryByText("日记")).not.toBeInTheDocument();
  });

  it("shows today mood prompt", () => {
    renderPage();
    expect(screen.getByText(/今天心情怎么样呀/)).toBeInTheDocument();
  });

  it("shows mood options", () => {
    renderPage();
    expect(screen.getByText("开心")).toBeInTheDocument();
    expect(screen.getByText("平静")).toBeInTheDocument();
    expect(screen.getByText("难过")).toBeInTheDocument();
  });

  it("select mood records it", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("选择心情开心"));
    await waitFor(() => {
      expect(useStore.getState().data.moodRecords.length).toBe(1);
    });
    expect(useStore.getState().data.moodRecords[0].mood).toBe("happy");
  });

  it("selected mood persisted on rerender", async () => {
    await import("../../core/store/mood").then(async ({ setMoodForDate }) => {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      await setMoodForDate(today, "sad");
    });
    renderPage();
    // 已选择的心情应为选中态
    const btn = screen.getByLabelText("选择心情难过");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("shows today overview section", () => {
    renderPage();
    expect(screen.getByText(/今日概览/)).toBeInTheDocument();
    expect(screen.getByText(/运动/)).toBeInTheDocument();
    expect(screen.getByText("睡眠")).toBeInTheDocument();
    expect(screen.getByText("消费")).toBeInTheDocument();
  });

  it("today overview shows exercise minutes", async () => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const { addExercise } = await import("../../core/store/exercise");
    await addExercise({ date: today, type: "walk", duration: 30 });
    renderPage();
    expect(screen.getByText("0h30m")).toBeInTheDocument();
  });

  it("today overview shows sleep hours", async () => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const { setSleepForDate } = await import("../../core/store/sleep");
    await setSleepForDate(today, 8);
    renderPage();
    expect(screen.getByText("8h")).toBeInTheDocument();
  });

  it("today overview shows expense", async () => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const { addTransaction } = await import("../../core/store/transactions");
    await addTransaction({ type: "expense", amount: 50, category: "food", date: today });
    renderPage();
    expect(screen.getByText(/¥50/)).toBeInTheDocument();
  });
});
