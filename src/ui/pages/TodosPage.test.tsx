import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodosPage } from "../pages/TodosPage";
import {
  setupTestDB,
  loadStore,
  cleanupTestDB,
  resetStore,
} from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { addTodo } from "../../core/store/todos";
import { useStore } from "../../core/store/useStore";

const confirmSpy = vi.spyOn(window, "confirm");
confirmSpy.mockImplementation(() => true);

function renderPage() {
  return render(
    <TestRouter>
      <TodosPage />
    </TestRouter>
  );
}

describe("TodosPage", () => {
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
    expect(screen.getByText("暂无待办")).toBeInTheDocument();
  });

  it("新增待办流程", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("新增"));
    await user.type(screen.getByLabelText("标题"), "买菜");
    await user.click(screen.getByText("保存"));
    await waitFor(() => {
      expect(screen.getByText("买菜")).toBeInTheDocument();
    });
    expect(useStore.getState().data.todos.length).toBe(1);
  });

  it("空标题校验", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("新增"));
    await user.click(screen.getByText("保存"));
    expect(screen.getByText("任务标题不能为空")).toBeInTheDocument();
  });

  it("完成待办从列表移除", async () => {
    await addTodo({
      title: "买菜",
      priority: "medium",
      repeatRule: "none",
    });
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText("买菜")).toBeInTheDocument();
    await user.click(screen.getByLabelText("完成买菜"));
    await waitFor(() => {
      expect(screen.queryByText("买菜")).not.toBeInTheDocument();
    });
    expect(useStore.getState().data.todos[0].isCompleted).toBe(true);
  });

  it("删除待办（confirm）", async () => {
    await addTodo({
      title: "买菜",
      priority: "medium",
      repeatRule: "none",
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("删除买菜"));
    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText("买菜")).not.toBeInTheDocument();
    });
    expect(useStore.getState().data.todos.length).toBe(0);
  });

  it("优先级显示", async () => {
    await addTodo({
      title: "紧急任务",
      priority: "high",
      repeatRule: "none",
    });
    await addTodo({
      title: "普通任务",
      priority: "low",
      repeatRule: "none",
    });
    renderPage();
    expect(screen.getByText(/优先级: 高/)).toBeInTheDocument();
    expect(screen.getByText(/优先级: 低/)).toBeInTheDocument();
  });

  it("重复规则显示", async () => {
    await addTodo({
      title: "喝水",
      priority: "low",
      repeatRule: "daily",
    });
    renderPage();
    expect(screen.getByText(/重复: 每日/)).toBeInTheDocument();
  });

  it("截止时间显示", async () => {
    await addTodo({
      title: "开会",
      priority: "medium",
      repeatRule: "none",
      deadline: "2026-08-26T18:00:00.000Z",
    });
    renderPage();
    expect(screen.getByText(/截止: 2026-08-26/)).toBeInTheDocument();
  });

  it("设置重复规则", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("新增"));
    await user.type(screen.getByLabelText("标题"), "打卡");
    await user.selectOptions(screen.getByLabelText("重复"), "daily");
    await user.click(screen.getByText("保存"));
    await waitFor(() => {
      expect(screen.getByText(/重复: 每日/)).toBeInTheDocument();
    });
    expect(useStore.getState().data.todos[0].repeatRule).toBe("daily");
  });
});
