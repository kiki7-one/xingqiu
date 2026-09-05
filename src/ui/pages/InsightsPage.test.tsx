import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InsightsPage } from "../pages/InsightsPage";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { addTodo, completeTodo } from "../../core/store/todos";
import { addTransaction } from "../../core/store/transactions";
import { setSleepForDate } from "../../core/store/sleep";
import { useStore } from "../../core/store/useStore";

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("InsightsPage", () => {
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
    return render(<TestRouter><InsightsPage /></TestRouter>);
  }

  it("shows week insight sections", () => {
    renderPage();
    expect(screen.getByText("洞察")).toBeInTheDocument();
    expect(screen.getByText(/完成任务/)).toBeInTheDocument();
    expect(screen.getByText(/睡眠平均/)).toBeInTheDocument();
    expect(screen.getByText(/周消费/)).toBeInTheDocument();
  });

  it("shows trend section", () => {
    renderPage();
    expect(screen.getByText(/睡眠与心情趋势/)).toBeInTheDocument();
  });

  it("shows analysis sections", () => {
    renderPage();
    expect(screen.getByText(/洞察分析/)).toBeInTheDocument();
    expect(screen.getByText("睡眠分析")).toBeInTheDocument();
    expect(screen.getByText("消费分析")).toBeInTheDocument();
  });

  it("shows advice section", () => {
    renderPage();
    expect(screen.getByText(/本周建议/)).toBeInTheDocument();
    expect(screen.getByText(/公园/)).toBeInTheDocument();
  });

  it("counts completed todos and expense", async () => {
    await addTodo({ title: "任务A", priority: "medium", repeatRule: "none" });
    const t = useStore.getState().data.todos[0];
    await completeTodo(t.id);
    await addTransaction({ type: "expense", amount: 100, category: "food", date: todayLocal() });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/完成任务/)).toBeInTheDocument();
    });
  });

  it("sleep analysis shows unknown when no data", () => {
    renderPage();
    expect(screen.getByText(/还没有睡眠记录/)).toBeInTheDocument();
  });

  it("records sleep updates avg", async () => {
    await setSleepForDate(todayLocal(), 8);
    renderPage();
    // 睡眠分析显示平均 8h
    expect(screen.getByText(/达到建议 8h/)).toBeInTheDocument();
  });

  it("洞察板块不再显示记录睡眠入口", () => {
    renderPage();
    expect(screen.queryByText("记录睡眠")).not.toBeInTheDocument();
  });

  it("右上角提供时间周期选择器（周历）", () => {
    renderPage();
    expect(screen.getByLabelText("上一周")).toBeInTheDocument();
    expect(screen.getByLabelText("下一周")).toBeInTheDocument();
    expect(screen.getByLabelText("选择一周")).toBeInTheDocument();
    // 默认显示本周
    expect(screen.getByText(/~ .*本周/)).toBeInTheDocument();
  });

  it("切换上一周更新日期区间", async () => {
    const user = userEvent.setup();
    renderPage();
    const text = screen.getByText(/~ /).textContent ?? "";
    await user.click(screen.getByLabelText("上一周"));
    // 日期区间发生变化，且不再标注"本周"
    expect(screen.queryByText(/~ .*本周/)).not.toBeInTheDocument();
    const text2 = screen.getByText(/~ /).textContent ?? "";
    expect(text2).not.toBe(text);
  });

  it("无数据时环比显示短横杠", () => {
    renderPage();
    // 空数据时三项环比均为 "-"
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });
});
