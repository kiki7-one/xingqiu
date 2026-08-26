import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import {
  addPet,
  updatePet,
  deletePet,
  addPetReminder,
  updatePetReminder,
  deletePetReminder,
  calculateNextDate,
  addPetFood,
  getFoodLevel,
  FoodLevelLabel,
  calculateFoodRatio,
} from "../../core/store/pets";
import { useStore } from "../../core/store/useStore";

describe("pets store", () => {
  let filePath: string;

  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    await loadStore();
  });

  afterEach(async () => {
    await cleanupTestDB(filePath);
  });

  it("addPet 增加宠物", async () => {
    const pet = await addPet({
      name: "团子",
      species: "cat",
      breed: "英短",
      gender: "male",
    });
    expect(pet.name).toBe("团子");
    expect(useStore.getState().data.pets.length).toBe(1);
  });

  it("updatePet 修改", async () => {
    const pet = await addPet({ name: "团子", species: "cat" });
    await updatePet(pet.id, { weight: 4.5 });
    expect(useStore.getState().data.pets[0].weight).toBe(4.5);
  });

  it("deletePet 软删除 + 禁用提醒", async () => {
    const pet = await addPet({ name: "团子", species: "cat" });
    await addPetReminder({
      petId: pet.id,
      type: "vaccine",
      title: "疫苗",
      enabled: true,
    });
    await deletePet(pet.id);
    expect(useStore.getState().data.pets[0].isDeleted).toBe(true);
    expect(useStore.getState().data.petReminders[0].enabled).toBe(false);
  });

  it("calculateNextDate 推算下次日期", () => {
    const last = "2026-08-01T00:00:00.000Z";
    const next = calculateNextDate(last, 30);
    // 8月1日 + 30天 = 8月31日
    expect(next.slice(0, 10)).toBe("2026-08-31");
  });

  it("addPetFood + getFoodLevel", async () => {
    const now = new Date("2026-08-26T00:00:00.000Z");
    const food = await addPetFood({
      petId: "p1",
      totalWeight: 2, // 2kg
      dailyConsumption: 50, // 50g/天
      recordDate: "2026-08-20T00:00:00.000Z", // 已过 6 天
    });
    // 消耗 = 6 * 50 = 300g = 0.3kg，剩余 1.7kg，比例 0.85 → 充足
    const level = getFoodLevel(food, now);
    expect(level).toBe("sufficient");
  });

  it("getFoodLevel 不足等级", async () => {
    const now = new Date("2026-08-26T00:00:00.000Z");
    const food = await addPetFood({
      petId: "p1",
      totalWeight: 1, // 1kg
      dailyConsumption: 200, // 200g/天
      recordDate: "2026-08-20T00:00:00.000Z", // 已过 6 天 = 1200g = 1.2kg
    });
    // 剩余 = max(0, 1 - 1.2) = 0，比例 0 → 空
    const level = getFoodLevel(food, now);
    expect(level).toBe("empty");
  });

  it("FoodLevelLabel 包含中文", () => {
    expect(FoodLevelLabel.sufficient).toBe("充足");
    expect(FoodLevelLabel.moderate).toBe("适中");
    expect(FoodLevelLabel.low).toBe("不足");
    expect(FoodLevelLabel.empty).toBe("空");
  });

  it("calculateFoodRatio 不超过 1", async () => {
    const food = await addPetFood({
      petId: "p1",
      totalWeight: 1,
      dailyConsumption: 50,
      recordDate: new Date().toISOString(),
    });
    const ratio = calculateFoodRatio(food);
    expect(ratio).toBeLessThanOrEqual(1);
    expect(ratio).toBeGreaterThan(0.9); // 刚录入，接近满
  });
});
