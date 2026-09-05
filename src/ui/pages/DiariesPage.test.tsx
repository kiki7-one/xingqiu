import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiariesPage } from "../pages/DiariesPage";
import {
  setupTestDB,
  loadStore,
  cleanupTestDB,
  resetStore,
} from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { addDiary } from "../../core/store/diaries";
import { useStore } from "../../core/store/useStore";

const confirmSpy = vi.spyOn(window, "confirm");
confirmSpy.mockImplementation(() => true);

function renderPage() {
  return render(
    <TestRouter>
      <DiariesPage />
    </TestRouter>
  );
}

describe("DiariesPage", () => {
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
    expect(screen.getByText("还没有日记")).toBeInTheDocument();
  });

  it("新增日记流程", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("新增"));

    await user.type(screen.getByLabelText("内容"), "今天很开心");
    await user.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.getByText("今天很开心")).toBeInTheDocument();
    });
    expect(useStore.getState().data.diaries.length).toBe(1);
  });

  it("空内容校验失败", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("新增"));
    await user.click(screen.getByText("保存"));

    expect(screen.getByText("日记内容不能为空")).toBeInTheDocument();
    expect(useStore.getState().data.diaries.length).toBe(0);
  });

  it("日记列表按日期倒序", async () => {
    await addDiary({ date: "2026-08-25", content: "前天日记" });
    await addDiary({ date: "2026-08-27", content: "后天日记" });
    await addDiary({ date: "2026-08-26", content: "今天日记" });

    renderPage();
    const dates = screen.getAllByText(/^\d{4}-\d{2}-\d{2}$/);
    expect(dates[0]).toHaveTextContent("2026-08-27");
    expect(dates[1]).toHaveTextContent("2026-08-26");
    expect(dates[2]).toHaveTextContent("2026-08-25");
  });

  it("关键词搜索", async () => {
    await addDiary({ date: "2026-08-25", content: "今天买了花" });
    await addDiary({ date: "2026-08-26", content: "今天很开心" });

    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText("今天买了花")).toBeInTheDocument();
    expect(screen.getByText("今天很开心")).toBeInTheDocument();

    await user.type(screen.getByLabelText("搜索关键词"), "花");
    await waitFor(() => {
      expect(screen.getByText("今天买了花")).toBeInTheDocument();
      expect(screen.queryByText("今天很开心")).not.toBeInTheDocument();
    });
  });

  it("标签搜索", async () => {
    await addDiary({
      date: "2026-08-25",
      content: "日记A内容",
      tags: ["旅行"],
    });
    await addDiary({
      date: "2026-08-26",
      content: "日记B内容",
      tags: ["生活"],
    });

    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText("按标签筛选"), "旅行");
    await waitFor(() => {
      expect(screen.getByText("日记A内容")).toBeInTheDocument();
      expect(screen.queryByText("日记B内容")).not.toBeInTheDocument();
    });
  });

  it("日期范围搜索", async () => {
    await addDiary({ date: "2026-08-01", content: "月初日记" });
    await addDiary({ date: "2026-08-15", content: "月中日记" });
    await addDiary({ date: "2026-08-25", content: "月末日记" });

    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText("开始日期"), "2026-08-10");
    await user.type(screen.getByLabelText("结束日期"), "2026-08-20");
    await waitFor(() => {
      expect(screen.queryByText("月初日记")).not.toBeInTheDocument();
      expect(screen.getByText("月中日记")).toBeInTheDocument();
      expect(screen.queryByText("月末日记")).not.toBeInTheDocument();
    });
  });

  it("编辑日记", async () => {
    const d = await addDiary({ date: "2026-08-26", content: "原内容" });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("编辑2026-08-26的日记"));

    const contentInput = screen.getByLabelText("内容");
    await user.clear(contentInput);
    await user.type(contentInput, "修改后内容");
    await user.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.getByText("修改后内容")).toBeInTheDocument();
    });
    const updated = useStore.getState().data.diaries.find(
      (x) => x.id === d.id
    );
    expect(updated?.content).toBe("修改后内容");
  });

  it("删除日记（confirm 确认）", async () => {
    await addDiary({ date: "2026-08-26", content: "待删除内容" });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("编辑2026-08-26的日记"));
    await user.click(screen.getByText("删除"));
    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText("待删除内容")).not.toBeInTheDocument();
    });
    expect(useStore.getState().data.diaries[0].isDeleted).toBe(true);
  });
});
