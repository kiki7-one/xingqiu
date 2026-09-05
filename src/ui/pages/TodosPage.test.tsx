import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodosPage } from "../pages/TodosPage";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { addTodo, completeTodo } from "../../core/store/todos";
import { useStore } from "../../core/store/useStore";

const confirmSpy = vi.spyOn(window, "confirm");
confirmSpy.mockImplementation(() => true);

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

describe("TodosPage", () => {
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
    return render(<TestRouter><TodosPage /></TestRouter>);
  }

  it("shows week calendar", () => {
    renderPage();
    expect(screen.getByText("待办")).toBeInTheDocument();
    expect(screen.getByText("周一")).toBeInTheDocument();
    expect(screen.getByText("周日")).toBeInTheDocument();
  });

  it("add todo appears in today view", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("新增"));
    await user.type(screen.getByLabelText("标题"), "买菜");
    await user.click(screen.getByText("保存"));
    await waitFor(() => {
      expect(screen.getByText("买菜")).toBeInTheDocument();
    });
    expect(useStore.getState().data.todos.length).toBe(1);
  });

  it("empty title validation", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("新增"));
    await user.click(screen.getByText("保存"));
    expect(screen.getByText("任务标题不能为空")).toBeInTheDocument();
  });

  it("complete todo dims it", async () => {
    await addTodo({ title: "买菜", priority: "medium", repeatRule: "none" });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("完成买菜"));
    await waitFor(() => {
      const els = screen.getAllByText("买菜");
      const dimmed = els.some((el) => el.className.includes("line-through"));
      expect(dimmed).toBe(true);
    });
    expect(useStore.getState().data.todos[0].isCompleted).toBe(true);
  });

  it("delete todo", async () => {
    await addTodo({ title: "买菜", priority: "medium", repeatRule: "none" });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("删除买菜"));
    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText("买菜")).not.toBeInTheDocument();
    });
    expect(useStore.getState().data.todos.length).toBe(0);
  });

  it("clicking another date shows historical todos", async () => {
    const { updateTodo } = await import("../../core/store/todos");
    await addTodo({ title: "明日任务", priority: "medium", repeatRule: "none", deadline: `${tomorrowStr()}T10:00:00Z` });
    const user = userEvent.setup();
    renderPage();
    // 明天不在今天视图
    expect(screen.queryByText("明日任务")).not.toBeInTheDocument();
    // 点击明天的日期 tab
    await user.click(screen.getByLabelText(new RegExp(tomorrowStr())));
    await waitFor(() => {
      expect(screen.getByText("明日任务")).toBeInTheDocument();
    });
  });

  it("completed button shows completed todos", async () => {
    await addTodo({ title: "已完成项", priority: "medium", repeatRule: "none" });
    const t = useStore.getState().data.todos[0];
    await completeTodo(t.id);
    const user = userEvent.setup();
    renderPage();
    // 待办列表区显示已完成项（置灰）
    expect(screen.getAllByText("已完成项").length).toBeGreaterThanOrEqual(1);
    // 点击已完成按钮
    await user.click(screen.getByRole("button", { name: /已完成/ }));
    await waitFor(() => {
      expect(screen.getByText("已完成的待办")).toBeInTheDocument();
    });
  });
});
