import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ItemsPage } from "../pages/ItemsPage";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { useStore } from "../../core/store/useStore";

// 替代 confirm 弹窗
const confirmSpy = vi.spyOn(window, "confirm");
confirmSpy.mockImplementation(() => true);

function renderItemsPage() {
  return render(
    <TestRouter>
      <ItemsPage />
    </TestRouter>
  );
}

describe("ItemsPage", () => {
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

  it("空数据时显示空状态", () => {
    renderItemsPage();
    expect(screen.getByText("还没有物品记录")).toBeInTheDocument();
  });

  it("新增物品流程", async () => {
    const user = userEvent.setup();
    renderItemsPage();
    await user.click(screen.getByText("新增"));

    await user.type(screen.getByLabelText("名称"), "纸巾");
    await user.type(screen.getByLabelText("库存数量"), "10");
    await user.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.getByText("纸巾")).toBeInTheDocument();
    });
    expect(useStore.getState().data.items.length).toBe(1);
  });

  it("搜索过滤", async () => {
    const { useStore } = await import("../../core/store/useStore");
    const { addItem } = await import("../../core/store/items");
    await addItem({
      name: "纸巾",
      category: "daily",
      stock: 5,
      unit: "包",
    });
    await addItem({
      name: "牛奶",
      category: "food",
      stock: 2,
      unit: "瓶",
    });

    const user = userEvent.setup();
    renderItemsPage();
    expect(screen.getByText("纸巾")).toBeInTheDocument();
    expect(screen.getByText("牛奶")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("搜索物品名称"), "纸");
    await waitFor(() => {
      expect(screen.getByText("纸巾")).toBeInTheDocument();
      expect(screen.queryByText("牛奶")).not.toBeInTheDocument();
    });
  });

  it("快速消耗扣减库存", async () => {
    const { addItem } = await import("../../core/store/items");
    await addItem({
      name: "纸巾",
      category: "daily",
      stock: 5,
      unit: "包",
    });
    const user = userEvent.setup();
    renderItemsPage();
    await user.click(screen.getByLabelText("消耗纸巾"));
    await waitFor(() => {
      expect(screen.getByText(/4包/)).toBeInTheDocument();
    });
  });

  it("删除物品（confirm 确认）", async () => {
    const { addItem } = await import("../../core/store/items");
    await addItem({
      name: "纸巾",
      category: "daily",
      stock: 5,
      unit: "包",
    });
    const user = userEvent.setup();
    renderItemsPage();
    await user.click(screen.getByLabelText("删除纸巾"));
    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText("纸巾")).not.toBeInTheDocument();
    });
    expect(useStore.getState().data.items[0].isDeleted).toBe(true);
  });

  it("低库存显示需补货角标", async () => {
    const { addItem } = await import("../../core/store/items");
    await addItem({
      name: "纸巾",
      category: "daily",
      stock: 1,
      unit: "包",
      threshold: 3,
    });
    renderItemsPage();
    expect(screen.getByText("⚠️ 需补货")).toBeInTheDocument();
  });
});
