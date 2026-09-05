import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SleepPage } from "../pages/SleepPage";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { setSleepForDate } from "../../core/store/sleep";
import { useStore } from "../../core/store/useStore";

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("SleepPage", () => {
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
    return render(<TestRouter><SleepPage /></TestRouter>);
  }

  it("empty state", () => {
    renderPage();
    expect(screen.getByText("还没有睡眠记录")).toBeInTheDocument();
  });

  it("record sleep via modal", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("新增"));
    const hoursInput = screen.getByLabelText("睡眠时长（小时）");
    await user.clear(hoursInput);
    await user.type(hoursInput, "7.5");
    await user.click(screen.getByText("保存"));
    await waitFor(() => {
      expect(useStore.getState().data.sleepRecords.length).toBe(1);
    });
    expect(useStore.getState().data.sleepRecords[0].hours).toBe(7.5);
  });

  it("hours validation", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("新增"));
    const hoursInput = screen.getByLabelText("睡眠时长（小时）");
    await user.clear(hoursInput);
    await user.type(hoursInput, "25");
    await user.click(screen.getByText("保存"));
    expect(screen.getByText("请输入 1-24 的睡眠时长")).toBeInTheDocument();
  });

  it("lists sleep records", async () => {
    await setSleepForDate("2026-08-26", 8);
    await setSleepForDate("2026-08-25", 7);
    renderPage();
    expect(screen.getByText("2026-08-26")).toBeInTheDocument();
    expect(screen.getByText("2026-08-25")).toBeInTheDocument();
  });
});
