import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "./test/dbHelper";
import { useStore } from "./core/store/useStore";
import { addItem, addConsumptionRecord } from "./core/store/items";
import { addPet, addPetReminder, addPetFood } from "./core/store/pets";
import { addTodo, completeTodo } from "./core/store/todos";
import { scanReminders, clearTriggered, markTriggered } from "./core/reminders/engine";
import { getDB } from "./core/db";

/**
 * 端到端主流程：记录 → 提醒 → 备份恢复
 */
describe("E2E: 主流程", () => {
  let filePath: string;

  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    clearTriggered();
    await loadStore();
  });

  afterEach(async () => {
    await cleanupTestDB(filePath);
  });

  it("物品补货全流程：录入→消耗→触发提醒→备份→恢复", async () => {
    // 1. 录入物品（库存 5，阈值 3）
    const item = await addItem({
      name: "纸巾",
      category: "daily",
      stock: 5,
      unit: "包",
      threshold: 3,
    });
    expect(item.stock).toBe(5);

    // 2. 消耗 3 个，库存剩 2 ≤ 阈值 3
    await addConsumptionRecord({
      itemId: item.id,
      quantity: -3,
      recordTime: new Date().toISOString(),
    });
    expect(useStore.getState().data.items[0].stock).toBe(2);

    // 3. 扫描提醒，应触发补货提醒
    const settings = useStore.getState().data.settings.reminders;
    const now = new Date("2026-08-26T12:00:00Z");
    const results = scanReminders(useStore.getState().data, now, settings);
    const restock = results.find((r) => r.kind === "restock");
    expect(restock).toBeTruthy();
    expect(restock!.title).toContain("纸巾");

    // 4. 标记已触发
    markTriggered(restock!.id, now);

    // 5. 备份
    const backupData = JSON.parse(JSON.stringify(useStore.getState().data));
    expect(backupData.items.length).toBe(1);

    // 6. 修改数据后恢复
    await addItem({ name: "新物品", category: "food", stock: 1, unit: "个" });
    expect(useStore.getState().data.items.length).toBe(2);

    // 恢复备份
    await getDB().import(backupData);
    await useStore.getState().load();
    expect(useStore.getState().data.items.length).toBe(1);
    expect(useStore.getState().data.items[0].name).toBe("纸巾");
    expect(useStore.getState().data.items[0].stock).toBe(2);
  });

  it("宠物疫苗提醒流程：录入→推算下次→扫描触发", async () => {
    const pet = await addPet({ name: "团子", species: "cat" });
    await addPetReminder({
      petId: pet.id,
      type: "vaccine",
      title: "猫三联",
      nextDate: "2026-08-29T00:00:00Z", // 3 天后
      enabled: true,
    });

    const settings = useStore.getState().data.settings.reminders;
    const results = scanReminders(
      useStore.getState().data,
      new Date("2026-08-26T00:00:00Z"),
      settings
    );
    const v = results.find((r) => r.kind === "vaccine");
    expect(v).toBeTruthy();
    expect(v!.body).toContain("3 天");
  });

  it("待办重复生成流程：完成每日任务→生成新任务", async () => {
    const { generateRepeatingTodos, updateTodo } = await import("./core/store/todos");
    const yesterday = new Date("2026-08-25T10:00:00Z");
    const today = new Date("2026-08-26T10:00:00Z");

    await addTodo({
      title: "喝水",
      priority: "low",
      repeatRule: "daily",
      deadline: yesterday.toISOString(),
    });
    const todo = useStore.getState().data.todos[0];
    await completeTodo(todo.id);
    // 手动将 completedAt 设为昨天，模拟昨天完成的任务
    await updateTodo(todo.id, { completedAt: yesterday.toISOString() });

    await generateRepeatingTodos(today);
    const todos = useStore.getState().data.todos;
    expect(todos.length).toBe(2);
    const newTodo = todos.find((t) => !t.isCompleted);
    expect(newTodo).toBeTruthy();
    expect(newTodo!.title).toBe("喝水");
  });

  it("粮食余量推算流程：录入→过期→不足提醒", async () => {
    const pet = await addPet({ name: "团子", species: "cat" });
    await addPetFood({
      petId: pet.id,
      totalWeight: 1,
      dailyConsumption: 200,
      recordDate: "2026-08-20T00:00:00Z", // 6 天前
    });

    const settings = useStore.getState().data.settings.reminders;
    const results = scanReminders(
      useStore.getState().data,
      new Date("2026-08-26T00:00:00Z"),
      settings
    );
    const f = results.find((r) => r.kind === "food_low");
    expect(f).toBeTruthy();
    expect(f!.title).toContain("粮食");
  });

  it("数据持久化：重启后数据不丢失", async () => {
    await addItem({ name: "持久化测试", category: "daily", stock: 1, unit: "个" });
    await addTodo({ title: "待办", priority: "high", repeatRule: "none" });

    // 重新加载（模拟重启）
    await useStore.getState().load();
    expect(useStore.getState().data.items.length).toBe(1);
    expect(useStore.getState().data.todos.length).toBe(1);
  });
});
