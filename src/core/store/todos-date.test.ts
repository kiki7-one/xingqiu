import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { addTodo, completeTodo, getTodosByDate, getAllCompletedTodos } from "./todos";
import { useStore } from "./useStore";

describe("todos date filter", () => {
  let filePath: string;
  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    await loadStore();
  });
  afterEach(async () => {
    await cleanupTestDB(filePath);
  });

  it("getTodosByDate returns pending for that date", async () => {
    await addTodo({ title: "当天任务", priority: "medium", repeatRule: "none", deadline: "2026-08-26T10:00:00Z" });
    await addTodo({ title: "其他天任务", priority: "medium", repeatRule: "none", deadline: "2026-08-27T10:00:00Z" });
    const { pending } = getTodosByDate("2026-08-26");
    expect(pending.length).toBe(1);
    expect(pending[0].title).toBe("当天任务");
  });

  it("getTodosByDate returns done completed on that date", async () => {
    await addTodo({ title: "已完成A", priority: "medium", repeatRule: "none", deadline: "2026-08-26T10:00:00Z" });
    const todo = useStore.getState().data.todos[0];
    await completeTodo(todo.id);
    // completeTodo 设置 completedAt 为真实当前时间，需手动设为指定日期
    const { updateTodo } = await import("./todos");
    await updateTodo(todo.id, { completedAt: "2026-08-26T12:00:00Z" });
    const { done } = getTodosByDate("2026-08-26");
    expect(done.length).toBe(1);
    expect(done[0].title).toBe("已完成A");
  });

  it("getTodosByDate splits pending and done", async () => {
    await addTodo({ title: "未完成", priority: "high", repeatRule: "none", deadline: "2026-08-26T10:00:00Z" });
    await addTodo({ title: "已完成", priority: "low", repeatRule: "none", deadline: "2026-08-25T10:00:00Z" });
    const todo2 = useStore.getState().data.todos.find((t) => t.title === "已完成")!;
    await completeTodo(todo2.id);
    const { updateTodo } = await import("./todos");
    await updateTodo(todo2.id, { completedAt: "2026-08-26T09:00:00Z" });
    const { pending, done } = getTodosByDate("2026-08-26");
    expect(pending.length).toBe(1);
    expect(done.length).toBe(1);
  });

  it("getAllCompletedTodos returns all completed", async () => {
    await addTodo({ title: "完成1", priority: "medium", repeatRule: "none", deadline: "2026-08-20T10:00:00Z" });
    await addTodo({ title: "未完成1", priority: "medium", repeatRule: "none", deadline: "2026-08-26T10:00:00Z" });
    const t1 = useStore.getState().data.todos.find((t) => t.title === "完成1")!;
    await completeTodo(t1.id);
    const all = getAllCompletedTodos();
    expect(all.length).toBe(1);
    expect(all[0].title).toBe("完成1");
  });
});
