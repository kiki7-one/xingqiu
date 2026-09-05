import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SportsPage } from "../pages/SportsPage";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { addExercise } from "../../core/store/exercise";
import { useStore } from "../../core/store/useStore";

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("SportsPage", () => {
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
    return render(<TestRouter><SportsPage /></TestRouter>);
  }

  it("empty state", () => {
    renderPage();
    expect(screen.getByText("当日暂无运动记录")).toBeInTheDocument();
  });

  it("add exercise flow", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("新增"));
    await user.selectOptions(screen.getByLabelText("运动类型"), "run");
    await user.type(screen.getByLabelText("时长（分钟）"), "30");
    await user.type(screen.getByLabelText("备注"), "晨跑");
    await user.click(screen.getByText("保存"));
    await waitFor(() => {
      expect(screen.getByText("跑步")).toBeInTheDocument();
    });
    expect(useStore.getState().data.exerciseRecords.length).toBe(1);
    expect(useStore.getState().data.exerciseRecords[0].type).toBe("run");
    expect(useStore.getState().data.exerciseRecords[0].duration).toBe(30);
  });

  it("duration validation", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("新增"));
    await user.type(screen.getByLabelText("时长（分钟）"), "0");
    await user.click(screen.getByText("保存"));
    expect(screen.getByText("请输入有效的运动时长（分钟）")).toBeInTheDocument();
    expect(useStore.getState().data.exerciseRecords.length).toBe(0);
  });

  it("shows total minutes", async () => {
    await addExercise({ date: todayLocal(), type: "walk", duration: 30 });
    await addExercise({ date: todayLocal(), type: "run", duration: 20 });
    renderPage();
    expect(screen.getByText(/当日运动 0h50m/)).toBeInTheDocument();
  });

  it("delete exercise", async () => {
    await addExercise({ date: todayLocal(), type: "walk", duration: 30 });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("删除散步"));
    await waitFor(() => {
      expect(screen.getByText("当日暂无运动记录")).toBeInTheDocument();
    });
    expect(useStore.getState().data.exerciseRecords.length).toBe(0);
  });
});
