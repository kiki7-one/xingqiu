import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShoppingListPage } from "../pages/ShoppingListPage";
import {
  setupTestDB,
  loadStore,
  cleanupTestDB,
  resetStore,
} from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { addShoppingItem, addItem } from "../../core/store/items";
import { useStore } from "../../core/store/useStore";
import { isOnline } from "../../core/utils/ecommerce";

describe("ShoppingListPage", () => {
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
    return render(
      <TestRouter>
        <ShoppingListPage />
      </TestRouter>
    );
  }

  it("空数据时显示空状态", () => {
    renderPage();
    expect(screen.getByText("购物清单是空的")).toBeInTheDocument();
  });

  it("手动添加购物项", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("添加"));

    await user.type(screen.getByLabelText("物品名称"), "牛奶");
    await user.type(screen.getByLabelText("数量（可选）"), "2");
    await user.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.getByText("牛奶")).toBeInTheDocument();
      expect(screen.getByText("x2")).toBeInTheDocument();
    });
    expect(useStore.getState().data.shoppingList.length).toBe(1);
    expect(useStore.getState().data.shoppingList[0].source).toBe("manual");
  });

  it("物品名称校验", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("添加"));
    await user.click(screen.getByText("保存"));

    expect(screen.getByText("物品名称不能为空")).toBeInTheDocument();
  });

  it("标记已购移动到已购区", async () => {
    await addShoppingItem({ name: "纸巾", source: "manual", quantity: 1 });

    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText("待购（1）")).toBeInTheDocument();

    await user.click(screen.getByLabelText("标记纸巾已购"));
    await user.click(screen.getByText("确认"));

    await waitFor(() => {
      expect(screen.getByText("已购（1）")).toBeInTheDocument();
      expect(screen.queryByText("待购（1）")).not.toBeInTheDocument();
    });
    expect(useStore.getState().data.shoppingList[0].status).toBe("purchased");
  });

  it("标记已购并回写同名物品库存", async () => {
    await addItem({
      name: "纸巾",
      category: "daily",
      stock: 5,
      unit: "包",
    });
    await addShoppingItem({ name: "纸巾", source: "manual", quantity: 3 });

    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("标记纸巾已购"));
    await user.click(screen.getByText("确认"));

    await waitFor(() => {
      expect(useStore.getState().data.shoppingList[0].status).toBe(
        "purchased"
      );
    });
    expect(useStore.getState().data.items[0].stock).toBe(8);
  });

  it("标记已购不回写（取消勾选）", async () => {
    await addItem({
      name: "纸巾",
      category: "daily",
      stock: 5,
      unit: "包",
    });
    await addShoppingItem({ name: "纸巾", source: "manual", quantity: 3 });

    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("标记纸巾已购"));
    await user.click(screen.getByText("同步补充库存（若存在同名物品）"));
    await user.click(screen.getByText("确认"));

    await waitFor(() => {
      expect(useStore.getState().data.shoppingList[0].status).toBe(
        "purchased"
      );
    });
    expect(useStore.getState().data.items[0].stock).toBe(5);
  });

  it("删除购物项", async () => {
    await addShoppingItem({ name: "纸巾", source: "manual" });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("删除纸巾"));
    await waitFor(() => {
      expect(screen.queryByText("纸巾")).not.toBeInTheDocument();
    });
    expect(useStore.getState().data.shoppingList.length).toBe(0);
  });

  it("来源标记显示（补货/手动）", async () => {
    await addShoppingItem({ name: "补货项", source: "reminder" });
    await addShoppingItem({ name: "手动项", source: "manual" });

    renderPage();
    expect(screen.getByText("补货")).toBeInTheDocument();
    expect(screen.getByText("手动")).toBeInTheDocument();
  });

  it("待购条目显示三个电商跳转按钮", async () => {
    await addShoppingItem({ name: "牛奶", source: "manual" });
    renderPage();
    expect(screen.getByLabelText("去淘宝搜索牛奶")).toBeInTheDocument();
    expect(screen.getByLabelText("去京东搜索牛奶")).toBeInTheDocument();
    expect(screen.getByLabelText("去拼多多搜索牛奶")).toBeInTheDocument();
  });

  it("联网时点击电商跳转调用 window.open", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
    const openSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);
    await addShoppingItem({ name: "牛奶", source: "manual" });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("去淘宝搜索牛奶"));
    expect(openSpy).toHaveBeenCalledTimes(1);
    const calledUrl = openSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("s.taobao.com");
    expect(calledUrl).toContain(encodeURIComponent("牛奶"));
    openSpy.mockRestore();
  });

  it("离线时电商跳转按钮置灰且不跳转", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    const openSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);
    await addShoppingItem({ name: "牛奶", source: "manual" });
    renderPage();
    const btn = screen.getByLabelText("去淘宝搜索牛奶") as HTMLButtonElement;
    expect(btn).toBeDisabled();
    btn.click();
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
    // 恢复在线状态
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
  });
});
