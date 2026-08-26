import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import {
  addItem,
  updateItem,
  deleteItem,
  addConsumptionRecord,
  addShoppingItem,
  markShoppingItemPurchased,
  removeShoppingItem,
  needsRestock,
  autoAddRestockToShopping,
} from "../../core/store/items";
import { useStore } from "../../core/store/useStore";
import type { Item } from "../../core/types";

describe("items store", () => {
  let filePath: string;

  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    await loadStore();
  });

  afterEach(async () => {
    await cleanupTestDB(filePath);
  });

  it("addItem 增加物品并持久化", async () => {
    const item = await addItem({
      name: "纸巾",
      category: "daily",
      stock: 10,
      unit: "包",
      threshold: 3,
    });
    expect(item.id).toBeTruthy();
    expect(item.name).toBe("纸巾");
    // 内存
    expect(useStore.getState().data.items.length).toBe(1);
    // 持久化
    const db = (await import("../../core/db")).getDB();
    const data = await db.read();
    expect(data.items.length).toBe(1);
    expect(data.items[0].name).toBe("纸巾");
  });

  it("updateItem 修改物品", async () => {
    const item = await addItem({
      name: "纸巾",
      category: "daily",
      stock: 10,
      unit: "包",
    });
    await updateItem(item.id, { stock: 5 });
    const updated = useStore.getState().data.items[0];
    expect(updated.stock).toBe(5);
  });

  it("deleteItem 软删除", async () => {
    const item = await addItem({
      name: "纸巾",
      category: "daily",
      stock: 10,
      unit: "包",
    });
    await deleteItem(item.id);
    const after = useStore.getState().data.items[0];
    expect(after.isDeleted).toBe(true);
  });

  it("addConsumptionRecord 扣减库存", async () => {
    const item = await addItem({
      name: "纸巾",
      category: "daily",
      stock: 10,
      unit: "包",
    });
    await addConsumptionRecord({
      itemId: item.id,
      quantity: -3,
      recordTime: new Date().toISOString(),
    });
    expect(useStore.getState().data.items[0].stock).toBe(7);
    expect(useStore.getState().data.consumptionRecords.length).toBe(1);
  });

  it("addConsumptionRecord 补充增加库存", async () => {
    const item = await addItem({
      name: "纸巾",
      category: "daily",
      stock: 2,
      unit: "包",
    });
    await addConsumptionRecord({
      itemId: item.id,
      quantity: 5,
      recordTime: new Date().toISOString(),
    });
    expect(useStore.getState().data.items[0].stock).toBe(7);
  });

  it("库存不能小于 0", async () => {
    const item = await addItem({
      name: "纸巾",
      category: "daily",
      stock: 2,
      unit: "包",
    });
    await addConsumptionRecord({
      itemId: item.id,
      quantity: -10,
      recordTime: new Date().toISOString(),
    });
    expect(useStore.getState().data.items[0].stock).toBe(0);
  });

  it("needsRestock 库存 ≤ 阈值返回 true", () => {
    const item: Item = {
      id: "x",
      name: "纸巾",
      category: "daily",
      stock: 2,
      unit: "包",
      threshold: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(needsRestock(item)).toBe(true);
  });

  it("needsRestock 无阈值返回 false", () => {
    const item: Item = {
      id: "x",
      name: "纸巾",
      category: "daily",
      stock: 0,
      unit: "包",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(needsRestock(item)).toBe(false);
  });

  it("needsRestock 已删除返回 false", () => {
    const item: Item = {
      id: "x",
      name: "纸巾",
      category: "daily",
      stock: 0,
      unit: "包",
      threshold: 3,
      isDeleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(needsRestock(item)).toBe(false);
  });

  it("addShoppingItem + markShoppingItemPurchased", async () => {
    const s = await addShoppingItem({ name: "牛奶", source: "manual" });
    expect(s.status).toBe("pending");
    await markShoppingItemPurchased(s.id, 2);
    const after = useStore.getState().data.shoppingList[0];
    expect(after.status).toBe("purchased");
    expect(after.purchasedQuantity).toBe(2);
  });

  it("removeShoppingItem 删除条目", async () => {
    const s = await addShoppingItem({ name: "牛奶", source: "manual" });
    await removeShoppingItem(s.id);
    expect(useStore.getState().data.shoppingList.length).toBe(0);
  });

  it("autoAddRestockToShopping 自动补货加入清单（去重）", async () => {
    await addItem({
      name: "纸巾",
      category: "daily",
      stock: 1,
      unit: "包",
      threshold: 3,
    });
    await addItem({
      name: "牛奶",
      category: "food",
      stock: 0,
      unit: "瓶",
      threshold: 2,
    });
    await autoAddRestockToShopping();
    const list = useStore.getState().data.shoppingList;
    expect(list.length).toBe(2);
    expect(list.some((s) => s.name === "纸巾")).toBe(true);
    expect(list.some((s) => s.name === "牛奶")).toBe(true);

    // 再次调用不应重复
    await autoAddRestockToShopping();
    expect(useStore.getState().data.shoppingList.length).toBe(2);
  });
});
