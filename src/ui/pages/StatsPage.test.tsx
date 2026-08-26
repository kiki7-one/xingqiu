import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatsPage } from "../pages/StatsPage";
import {
  setupTestDB,
  loadStore,
  cleanupTestDB,
  resetStore,
} from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { addTransaction } from "../../core/store/transactions";

describe("StatsPage", () => {
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
        <StatsPage />
      </TestRouter>
    );
  }

  it("无数据时显示空状态", () => {
    renderPage();
    expect(screen.getByText("本月暂无支出数据")).toBeInTheDocument();
  });

  it("月度收支概览正确", async () => {
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
    fireEvent.change(screen.getByLabelText("选择月份"), {
      target: { value: "2026-08" },
    });

    await waitFor(() => {
      expect(screen.getByText(/¥5000\.00/)).toBeInTheDocument();
      expect(screen.getByText(/¥150\.00/)).toBeInTheDocument();
      expect(screen.getByText(/¥4850\.00/)).toBeInTheDocument();
    });
  });

  it("分类支出统计与占比", async () => {
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
    fireEvent.change(screen.getByLabelText("选择月份"), {
      target: { value: "2026-08" },
    });

    await waitFor(() => {
      // 餐饮 100/150 ≈ 67%
      expect(screen.getByText(/¥100\.00 \(67%\)/)).toBeInTheDocument();
      // 交通 50/150 ≈ 33%
      expect(screen.getByText(/¥50\.00 \(33%\)/)).toBeInTheDocument();
    });
  });

  it("设置预算后显示当前预算", async () => {
    renderPage();
    const budgetInput = screen.getByLabelText("总预算");
    await userEvent.type(budgetInput, "500");
    await userEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.getByText(/当前预算：¥500\.00/)).toBeInTheDocument();
    });
  });

  it("超支提醒", async () => {
    await addTransaction({
      type: "expense",
      amount: 300,
      category: "food",
      date: "2026-08-15",
    });
    await addTransaction({
      type: "expense",
      amount: 300,
      category: "transport",
      date: "2026-08-20",
    });

    renderPage();
    fireEvent.change(screen.getByLabelText("选择月份"), {
      target: { value: "2026-08" },
    });

    // 先设预算 500
    const budgetInput = screen.getByLabelText("总预算");
    await userEvent.type(budgetInput, "500");
    await userEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(
        screen.getByText(/已超出预算.*超支.*¥100\.00/)
      ).toBeInTheDocument();
    });
  });

  it("未超支时不显示提醒", async () => {
    await addTransaction({
      type: "expense",
      amount: 100,
      category: "food",
      date: "2026-08-15",
    });

    renderPage();
    fireEvent.change(screen.getByLabelText("选择月份"), {
      target: { value: "2026-08" },
    });

    const budgetInput = screen.getByLabelText("总预算");
    await userEvent.type(budgetInput, "500");
    await userEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.queryByText(/已超出预算/)).not.toBeInTheDocument();
    });
  });
});
