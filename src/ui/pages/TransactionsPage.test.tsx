import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionsPage } from "../pages/TransactionsPage";
import {
  setupTestDB,
  loadStore,
  cleanupTestDB,
  resetStore,
} from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { useStore } from "../../core/store/useStore";

// 替代 confirm
const confirmSpy = vi.spyOn(window, "confirm");
confirmSpy.mockImplementation(() => true);

function renderPage() {
  return render(
    <TestRouter>
      <TransactionsPage />
    </TestRouter>
  );
}

describe("TransactionsPage", () => {
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
    renderPage();
    expect(screen.getByText("还没有记账记录")).toBeInTheDocument();
  });

  it("新增支出流程", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("新增"));

    await user.type(screen.getByLabelText("金额"), "25.5");
    await user.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.getByText(/-¥25\.50/)).toBeInTheDocument();
    });
    expect(useStore.getState().data.transactions.length).toBe(1);
    const tx = useStore.getState().data.transactions[0];
    expect(tx.type).toBe("expense");
    expect(tx.amount).toBe(25.5);
  });

  it("新增收入流程", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("新增"));

    await user.selectOptions(screen.getByLabelText("类型"), "income");
    await user.type(screen.getByLabelText("金额"), "5000");
    await user.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.getByText(/\+¥5000\.00/)).toBeInTheDocument();
    });
    expect(useStore.getState().data.transactions[0].type).toBe("income");
  });

  it("金额必须大于 0", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("新增"));

    await user.type(screen.getByLabelText("金额"), "0");
    await user.click(screen.getByText("保存"));

    expect(screen.getByText("金额必须大于 0")).toBeInTheDocument();
    expect(useStore.getState().data.transactions.length).toBe(0);
  });

  it("空金额校验失败", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("新增"));
    await user.click(screen.getByText("保存"));

    expect(screen.getByText("请输入有效金额")).toBeInTheDocument();
  });

  it("收支合计正确", async () => {
    const { addTransaction } = await import("../../core/store/transactions");
    await addTransaction({
      type: "income",
      amount: 5000,
      category: "other",
      date: "2026-08-01",
    });
    await addTransaction({
      type: "expense",
      amount: 100,
      category: "food",
      date: "2026-08-15",
    });
    await addTransaction({
      type: "expense",
      amount: 50,
      category: "transport",
      date: "2026-08-20",
    });

    renderPage();
    // 收入合计区
    const incomeBlocks = screen.getAllByText(/¥5000\.00/);
    expect(incomeBlocks.length).toBeGreaterThanOrEqual(1);
    // 支出合计 150
    expect(screen.getByText(/¥150\.00/)).toBeInTheDocument();
    // 结余 4850
    expect(screen.getByText(/¥4850\.00/)).toBeInTheDocument();
  });

  it("按类型筛选", async () => {
    const { addTransaction } = await import("../../core/store/transactions");
    await addTransaction({
      type: "income",
      amount: 1000,
      category: "other",
      date: "2026-08-01",
    });
    await addTransaction({
      type: "expense",
      amount: 50,
      category: "food",
      date: "2026-08-15",
    });

    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText(/\+¥1000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/-¥50\.00/)).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("按类型筛选"),
      "income"
    );
    await waitFor(() => {
      expect(screen.queryByText(/-¥50\.00/)).not.toBeInTheDocument();
    });
  });

  it("按分类筛选", async () => {
    const { addTransaction } = await import("../../core/store/transactions");
    await addTransaction({
      type: "expense",
      amount: 50,
      category: "food",
      date: "2026-08-15",
    });
    await addTransaction({
      type: "expense",
      amount: 30,
      category: "transport",
      date: "2026-08-16",
    });

    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText(/-¥50\.00/)).toBeInTheDocument();
    expect(screen.getByText(/-¥30\.00/)).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("按分类筛选"),
      "transport"
    );
    await waitFor(() => {
      expect(screen.queryByText(/-¥50\.00/)).not.toBeInTheDocument();
      expect(screen.getByText(/-¥30\.00/)).toBeInTheDocument();
    });
  });

  it("编辑账目", async () => {
    const { addTransaction } = await import("../../core/store/transactions");
    const tx = await addTransaction({
      type: "expense",
      amount: 50,
      category: "food",
      date: "2026-08-15",
      remark: "午餐",
    });

    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("编辑午餐"));
    // 金额改为 80
    const amountInput = screen.getByLabelText("金额");
    await user.clear(amountInput);
    await user.type(amountInput, "80");
    await user.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.getByText(/-¥80\.00/)).toBeInTheDocument();
    });
    const updated = useStore.getState().data.transactions.find(
      (t) => t.id === tx.id
    );
    expect(updated?.amount).toBe(80);
  });

  it("删除账目（confirm 确认）", async () => {
    const { addTransaction } = await import("../../core/store/transactions");
    await addTransaction({
      type: "expense",
      amount: 50,
      category: "food",
      date: "2026-08-15",
      remark: "午餐",
    });

    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("删除午餐"));
    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText(/-¥50\.00/)).not.toBeInTheDocument();
    });
    expect(useStore.getState().data.transactions.length).toBe(0);
  });

  it("按月份筛选", async () => {
    const { addTransaction } = await import("../../core/store/transactions");
    await addTransaction({
      type: "expense",
      amount: 50,
      category: "food",
      date: "2026-08-15",
    });
    await addTransaction({
      type: "expense",
      amount: 30,
      category: "food",
      date: "2026-07-10",
    });

    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText(/-¥50\.00/)).toBeInTheDocument();
    expect(screen.getByText(/-¥30\.00/)).toBeInTheDocument();

    await user.type(screen.getByLabelText("按月份筛选"), "2026-08");
    await waitFor(() => {
      expect(screen.getByText(/-¥50\.00/)).toBeInTheDocument();
      expect(screen.queryByText(/-¥30\.00/)).not.toBeInTheDocument();
    });
  });
});
