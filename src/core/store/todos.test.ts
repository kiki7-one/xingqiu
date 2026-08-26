import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import {
  addTodo,
  updateTodo,
  completeTodo,
  uncompleteTodo,
  deleteTodo,
  generateRepeatingTodos,
  getTodayTodos,
  snoozeTodo,
} from "../../core/store/todos";
import { useStore } from "../../core/store/useStore";

describe("todos store", () => {
  let filePath: string;

  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    await loadStore();
  });

  afterEach(async () => {
    await cleanupTestDB(filePath);
  });

  it("addTodo 增加待办", async () => {
    const todo = await addTodo({
      title: "买菜",
      priority: "high",
      repeatRule: "none",
    });
    expect(todo.title).toBe("买菜");
    expect(todo.isCompleted).toBe(false);
    expect(useStore.getState().data.todos.length).toBe(1);
  });

  it("completeTodo + uncompleteTodo", async () => {
    const todo = await addTodo({
      title: "买菜",
      priority: "medium",
      repeatRule: "none",
    });
    await completeTodo(todo.id);
    expect(useStore.getState().data.todos[0].isCompleted).toBe(true);
    expect(useStore.getState().data.todos[0].completedAt).toBeTruthy();
    await uncompleteTodo(todo.id);
    expect(useStore.getState().data.todos[0].isCompleted).toBe(false);
    expect(useStore.getState().data.todos[0].completedAt).toBeUndefined();
  });

  it("deleteTodo 删除", async () => {
    const todo = await addTodo({
      title: "买菜",
      priority: "medium",
      repeatRule: "none",
    });
    await deleteTodo(todo.id);
    expect(useStore.getState().data.todos.length).toBe(0);
  });

  it("generateRepeatingTodos 为每日重复任务生成新任务", async () => {
    const yesterday = new Date("2026-08-25T10:00:00.000Z");
    const today = new Date("2026-08-26T10:00:00.000Z");
    await addTodo({
      title: "喝水",
      priority: "low",
      repeatRule: "daily",
      deadline: yesterday.toISOString(),
    });
    // 完成昨日任务
    const todo = useStore.getState().data.todos[0];
    await completeTodo(todo.id);
    // 手动将 completedAt 设为昨天
    await updateTodo(todo.id, { completedAt: yesterday.toISOString() });

    await generateRepeatingTodos(today);
    const todos = useStore.getState().data.todos;
    // 应有：原已完成任务 + 新生成的今日任务
    expect(todos.length).toBe(2);
    const newTodo = todos.find((t) => !t.isCompleted);
    expect(newTodo).toBeTruthy();
    expect(newTodo!.title).toBe("喝水");
  });

  it("generateRepeatingTodos 不为单次任务生成", async () => {
    const now = new Date();
    await addTodo({
      title: "买菜",
      priority: "medium",
      repeatRule: "none",
      deadline: new Date(now.getTime() - 86400000).toISOString(),
    });
    const todo = useStore.getState().data.todos[0];
    await completeTodo(todo.id);
    await generateRepeatingTodos(now);
    expect(useStore.getState().data.todos.length).toBe(1);
  });

  it("getTodayTodos 返回今日相关", async () => {
    const today = new Date("2026-08-26T10:00:00.000Z");
    await addTodo({
      title: "今日任务",
      priority: "medium",
      repeatRule: "none",
      deadline: "2026-08-26T18:00:00.000Z",
    });
    await addTodo({
      title: "明日任务",
      priority: "medium",
      repeatRule: "none",
      deadline: "2026-08-27T10:00:00.000Z",
    });
    const result = getTodayTodos(today);
    expect(result.length).toBe(1);
    expect(result[0].title).toBe("今日任务");
  });

  it("snoozeTodo 延迟 15min", async () => {
    const todo = await addTodo({
      title: "开会",
      priority: "medium",
      repeatRule: "none",
      deadline: "2026-08-26T10:00:00.000Z",
    });
    const now = new Date("2026-08-26T10:00:00.000Z");
    await snoozeTodo(todo.id, "15min", now);
    const updated = useStore.getState().data.todos[0];
    // 10:00 + 15min = 10:15
    expect(updated.deadline).toBe("2026-08-26T10:15:00.000Z");
  });

  it("snoozeTodo 延迟 1h", async () => {
    const todo = await addTodo({
      title: "开会",
      priority: "medium",
      repeatRule: "none",
      deadline: "2026-08-26T10:00:00.000Z",
    });
    const now = new Date("2026-08-26T10:00:00.000Z");
    await snoozeTodo(todo.id, "1h", now);
    const updated = useStore.getState().data.todos[0];
    expect(updated.deadline).toBe("2026-08-26T11:00:00.000Z");
  });

  it("snoozeTodo 延迟到明天 9:00", async () => {
    const todo = await addTodo({
      title: "开会",
      priority: "medium",
      repeatRule: "none",
      deadline: "2026-08-26T10:00:00.000Z",
    });
    const now = new Date("2026-08-26T10:00:00.000Z");
    await snoozeTodo(todo.id, "tomorrow", now);
    const updated = useStore.getState().data.todos[0];
    // 8月27日 09:00（本地时区，但 toISOString 是 UTC）
    const d = new Date(updated.deadline!);
    expect(d.getDate()).toBe(27);
    expect(d.getHours()).toBe(9);
  });
});
