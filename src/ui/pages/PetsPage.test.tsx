import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PetsPage } from "../pages/PetsPage";
import {
  setupTestDB,
  loadStore,
  cleanupTestDB,
  resetStore,
} from "../../test/dbHelper";
import { TestRouter } from "../../test/TestRouter";
import { addPet, addPetReminder } from "../../core/store/pets";
import { useStore } from "../../core/store/useStore";

const confirmSpy = vi.spyOn(window, "confirm");
confirmSpy.mockImplementation(() => true);

function renderPage() {
  return render(
    <TestRouter>
      <PetsPage />
    </TestRouter>
  );
}

describe("PetsPage", () => {
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
    expect(screen.getByText("还没有宠物档案")).toBeInTheDocument();
  });

  it("新增宠物流程", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("新增"));
    await user.type(screen.getByLabelText("名字"), "团子");
    await user.click(screen.getByText("保存"));
    await waitFor(() => {
      expect(screen.getAllByText("团子").length).toBeGreaterThanOrEqual(1);
    });
    expect(useStore.getState().data.pets.length).toBe(1);
  });

  it("宠物名字校验", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("新增"));
    await user.click(screen.getByText("保存"));
    expect(screen.getByText("宠物名字不能为空")).toBeInTheDocument();
  });

  it("编辑宠物", async () => {
    const pet = await addPet({ name: "团子", species: "cat" });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("编辑"));
    const nameInput = screen.getByLabelText("名字");
    await user.clear(nameInput);
    await user.type(nameInput, "小花");
    await user.click(screen.getByText("保存"));
    await waitFor(() => {
      expect(screen.getAllByText("小花").length).toBeGreaterThanOrEqual(1);
    });
    const updated = useStore.getState().data.pets.find((p) => p.id === pet.id);
    expect(updated?.name).toBe("小花");
  });

  it("删除宠物（confirm + 禁用提醒）", async () => {
    const pet = await addPet({ name: "团子", species: "cat" });
    await addPetReminder({
      petId: pet.id,
      type: "vaccine",
      title: "疫苗",
      enabled: true,
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("删除"));
    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText("还没有宠物档案")).toBeInTheDocument();
    });
    expect(useStore.getState().data.pets[0].isDeleted).toBe(true);
    expect(useStore.getState().data.petReminders[0].enabled).toBe(false);
  });

  it("多宠物切换", async () => {
    await addPet({ name: "团子", species: "cat" });
    await addPet({ name: "豆豆", species: "dog" });
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText("猫")).toBeInTheDocument();
    await user.click(screen.getByText("豆豆"));
    await waitFor(() => {
      expect(screen.getByText("狗")).toBeInTheDocument();
    });
  });

  it("添加提醒", async () => {
    const pet = await addPet({ name: "团子", species: "cat" });
    const user = userEvent.setup();
    renderPage();
    const addButtons = screen.getAllByText("添加");
    await user.click(addButtons[addButtons.length - 1]);
    await user.type(screen.getByLabelText("标题"), "猫三联");
    await user.click(screen.getByText("保存"));
    await waitFor(() => {
      expect(screen.getByText("猫三联")).toBeInTheDocument();
    });
    const reminders = useStore
      .getState()
      .data.petReminders.filter((r) => r.petId === pet.id);
    expect(reminders.length).toBe(1);
    expect(reminders[0].type).toBe("vaccine");
  });

  it("根据上次日期+周期自动推算下次日期", async () => {
    await addPet({ name: "团子", species: "cat" });
    const user = userEvent.setup();
    renderPage();
    const addButtons = screen.getAllByText("添加");
    await user.click(addButtons[addButtons.length - 1]);
    await user.type(screen.getByLabelText("标题"), "驱虫");
    await user.type(screen.getByLabelText("上次日期"), "2026-08-01");
    await user.clear(screen.getByLabelText("周期（天）"));
    await user.type(screen.getByLabelText("周期（天）"), "30");
    const nextDateInput = screen.getByLabelText(
      "下次提醒日期"
    ) as HTMLInputElement;
    expect(nextDateInput.value).toBe("2026-08-31");
  });

  it("编辑提醒", async () => {
    const pet = await addPet({ name: "团子", species: "cat" });
    await addPetReminder({
      petId: pet.id,
      type: "vaccine",
      title: "猫三联",
      enabled: true,
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("编辑猫三联提醒"));
    const titleInput = screen.getByLabelText("标题");
    await user.clear(titleInput);
    await user.type(titleInput, "猫四联");
    await user.click(screen.getByText("保存"));
    await waitFor(() => {
      expect(screen.getByText("猫四联")).toBeInTheDocument();
    });
  });

  it("删除提醒（confirm）", async () => {
    const pet = await addPet({ name: "团子", species: "cat" });
    await addPetReminder({
      petId: pet.id,
      type: "vaccine",
      title: "猫三联",
      enabled: true,
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("删除猫三联提醒"));
    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText("猫三联")).not.toBeInTheDocument();
    });
    expect(useStore.getState().data.petReminders.length).toBe(0);
  });
});
