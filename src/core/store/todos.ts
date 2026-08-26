import { mutateField, withBase, touch } from "./useStore";
import { useStore } from "./useStore";
import type { Todo, RepeatRule } from "../types";

export async function addTodo(
  input: Omit<Todo, "id" | "createdAt" | "updatedAt" | "isCompleted">
): Promise<Todo> {
  const todo = withBase({ ...input, isCompleted: false });
  await mutateField("todos", (arr) => [...arr, todo]);
  return todo;
}

export async function updateTodo(
  id: string,
  patch: Partial<Todo>
): Promise<void> {
  await mutateField("todos", (arr) =>
    arr.map((t) => (t.id === id ? touch({ ...t, ...patch }) : t))
  );
}

export async function completeTodo(id: string): Promise<void> {
  await mutateField("todos", (arr) =>
    arr.map((t) =>
      t.id === id
        ? touch({
            ...t,
            isCompleted: true,
            completedAt: new Date().toISOString(),
          })
        : t
    )
  );
}

export async function uncompleteTodo(id: string): Promise<void> {
  await mutateField("todos", (arr) =>
    arr.map((t) =>
      t.id === id
        ? touch({
            ...t,
            isCompleted: false,
            completedAt: undefined,
          })
        : t
    )
  );
}

export async function deleteTodo(id: string): Promise<void> {
  await mutateField("todos", (arr) => arr.filter((t) => t.id !== id));
}

/**
 * 延迟待办：将截止时间推后
 * @param id 待办 id
 * @param duration 15min | 1h | tomorrow
 * @param now 当前时间（可注入用于测试）
 */
export async function snoozeTodo(
  id: string,
  duration: "15min" | "1h" | "tomorrow",
  now: Date = new Date()
): Promise<void> {
  const next = new Date(now);
  switch (duration) {
    case "15min":
      next.setTime(next.getTime() + 15 * 60 * 1000);
      break;
    case "1h":
      next.setTime(next.getTime() + 60 * 60 * 1000);
      break;
    case "tomorrow":
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0); // 明天 9:00
      break;
  }
  await mutateField("todos", (arr) =>
    arr.map((t) =>
      t.id === id ? touch({ ...t, deadline: next.toISOString() }) : t
    )
  );
}

/**
 * 根据重复规则生成下次任务
 * 对于已过期的重复任务，生成下一周期的新任务
 */
export async function generateRepeatingTodos(now: Date = new Date()): Promise<void> {
  const { useStore } = await import("./useStore");
  const { data } = useStore.getState();
  const todos = data.todos;
  const newTodos: Todo[] = [];

  for (const todo of todos) {
    if (!todo.isCompleted) continue;
    if (todo.repeatRule === "none") continue;

    // 计算下次日期
    const completedAt = todo.completedAt ? new Date(todo.completedAt) : now;
    const nextDeadline = calculateNextOccurrence(
      todo.repeatRule,
      completedAt,
      todo.customRepeatDays
    );

    if (nextDeadline && (nextDeadline.getTime() <= now.getTime() || isSameDay(nextDeadline, now))) {
      // 生成新的重复任务
      newTodos.push(
        withBase({
          title: todo.title,
          priority: todo.priority,
          deadline: nextDeadline.toISOString(),
          repeatRule: todo.repeatRule,
          customRepeatDays: todo.customRepeatDays,
          category: todo.category,
          remark: todo.remark,
          isCompleted: false,
        })
      );
    }
  }

  if (newTodos.length > 0) {
    await mutateField("todos", (arr) => [...arr, ...newTodos]);
  }
}

/**
 * 计算下次发生日期
 */
function calculateNextOccurrence(
  rule: RepeatRule,
  from: Date,
  customDays?: number
): Date | null {
  const next = new Date(from);
  switch (rule) {
    case "daily":
      next.setDate(next.getDate() + 1);
      return next;
    case "weekly":
      next.setDate(next.getDate() + 7);
      return next;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      return next;
    case "custom":
      if (customDays && customDays > 0) {
        next.setDate(next.getDate() + customDays);
        return next;
      }
      return null;
    case "none":
    default:
      return null;
  }
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * 获取今日待办（截止时间在今日或已过期且未完成 + 今日完成的）
 */
export function getTodayTodos(now: Date = new Date()): Todo[] {
  const { data } = useStore.getState();
  const todayStr = now.toISOString().slice(0, 10);
  return data.todos.filter((t: Todo) => {
    if (t.isCompleted) {
      return t.completedAt?.slice(0, 10) === todayStr;
    }
    if (!t.deadline) return false;
    return t.deadline.slice(0, 10) <= todayStr;
  });
}
