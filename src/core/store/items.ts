import { mutateField, withBase, touch } from "./useStore";
import type {
  Item,
  ConsumptionRecord,
  ShoppingListItem,
  ItemCategory,
} from "../types";

// ============ 物品 ============

export async function addItem(
  input: Omit<Item, "id" | "createdAt" | "updatedAt" | "isDeleted">
): Promise<Item> {
  const item = withBase(input);
  await mutateField("items", (arr) => [...arr, item]);
  return item;
}

export async function updateItem(
  id: string,
  patch: Partial<Item>
): Promise<void> {
  await mutateField("items", (arr) =>
    arr.map((it) => (it.id === id ? touch({ ...it, ...patch }) : it))
  );
}

export async function deleteItem(id: string): Promise<void> {
  // 软删除
  await mutateField("items", (arr) =>
    arr.map((it) =>
      it.id === id ? touch({ ...it, isDeleted: true }) : it
    )
  );
}

export async function purgeOldDeletedItems(daysOld = 30): Promise<void> {
  const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  await mutateField("items", (arr) =>
    arr.filter((it) => !(it.isDeleted && new Date(it.updatedAt).getTime() < cutoff))
  );
}

// ============ 消耗记录 ============

export async function addConsumptionRecord(
  input: Omit<ConsumptionRecord, "id" | "createdAt" | "updatedAt">
): Promise<ConsumptionRecord> {
  const record = withBase(input);
  await mutateField("consumptionRecords", (arr) => [...arr, record]);
  // 同步更新库存
  await mutateField("items", (arr) =>
    arr.map((it) =>
      it.id === input.itemId
        ? touch({ ...it, stock: Math.max(0, it.stock + input.quantity) })
        : it
    )
  );
  return record;
}

// ============ 购物清单 ============

export async function addShoppingItem(
  input: Omit<ShoppingListItem, "id" | "createdAt" | "updatedAt" | "status"> &
    Partial<Pick<ShoppingListItem, "status">>
): Promise<ShoppingListItem> {
  const item = withBase({ ...input, status: input.status ?? "pending" });
  await mutateField("shoppingList", (arr) => [...arr, item]);
  return item;
}

export async function markShoppingItemPurchased(
  id: string,
  purchasedQuantity?: number
): Promise<void> {
  await mutateField("shoppingList", (arr) =>
    arr.map((it) =>
      it.id === id
        ? touch({
            ...it,
            status: "purchased",
            purchasedQuantity,
          })
        : it
    )
  );
}

export async function removeShoppingItem(id: string): Promise<void> {
  await mutateField("shoppingList", (arr) => arr.filter((it) => it.id !== id));
}

// ============ 业务规则 ============

/**
 * 判断物品是否需要补货（库存 ≤ 阈值）
 */
export function needsRestock(item: Item): boolean {
  if (item.isDeleted) return false;
  if (item.threshold == null) return false;
  return item.stock <= item.threshold;
}

/**
 * 自动将补货物品加入购物清单（去重：同名 pending 不重复加）
 */
export async function autoAddRestockToShopping(): Promise<void> {
  const { useStore } = await import("./useStore");
  const { data } = useStore.getState();
  const pending = data.shoppingList.filter((s) => s.status === "pending");
  const pendingNames = new Set(pending.map((s) => s.name));

  const toAdd: ShoppingListItem[] = [];
  for (const item of data.items) {
    if (needsRestock(item) && !pendingNames.has(item.name)) {
      toAdd.push(
        withBase({
          name: item.name,
          quantity: item.threshold ? Math.max(1, item.threshold - item.stock) : 1,
          source: "reminder" as const,
          status: "pending" as const,
        })
      );
    }
  }
  if (toAdd.length > 0) {
    await mutateField("shoppingList", (arr) => [...arr, ...toAdd]);
  }
}
