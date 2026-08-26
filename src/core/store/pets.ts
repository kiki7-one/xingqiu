import { mutateField, withBase, touch } from "./useStore";
import type {
  Pet,
  PetReminder,
  PetFood,
  FoodLevel,
  ReminderType,
} from "../types";

// ============ 宠物档案 ============

export async function addPet(
  input: Omit<Pet, "id" | "createdAt" | "updatedAt" | "isDeleted">
): Promise<Pet> {
  const pet = withBase(input);
  await mutateField("pets", (arr) => [...arr, pet]);
  return pet;
}

export async function updatePet(
  id: string,
  patch: Partial<Pet>
): Promise<void> {
  await mutateField("pets", (arr) =>
    arr.map((p) => (p.id === id ? touch({ ...p, ...patch }) : p))
  );
}

export async function deletePet(id: string): Promise<void> {
  await mutateField("pets", (arr) =>
    arr.map((p) => (p.id === id ? touch({ ...p, isDeleted: true }) : p))
  );
  // 同时禁用该宠物的提醒
  await mutateField("petReminders", (arr) =>
    arr.map((r) =>
      r.petId === id ? touch({ ...r, enabled: false }) : r
    )
  );
}

// ============ 宠物提醒 ============

export async function addPetReminder(
  input: Omit<PetReminder, "id" | "createdAt" | "updatedAt" | "isDeleted">
): Promise<PetReminder> {
  const reminder = withBase(input);
  await mutateField("petReminders", (arr) => [...arr, reminder]);
  return reminder;
}

export async function updatePetReminder(
  id: string,
  patch: Partial<PetReminder>
): Promise<void> {
  await mutateField("petReminders", (arr) =>
    arr.map((r) => (r.id === id ? touch({ ...r, ...patch }) : r))
  );
}

export async function deletePetReminder(id: string): Promise<void> {
  await mutateField("petReminders", (arr) => arr.filter((r) => r.id !== id));
}

/**
 * 根据上次日期 + 周期推算下次提醒日期
 */
export function calculateNextDate(
  lastDate: string,
  cycleDays: number
): string {
  const last = new Date(lastDate);
  const next = new Date(last.getTime() + cycleDays * 24 * 60 * 60 * 1000);
  return next.toISOString();
}

// ============ 粮食余量 ============

export async function addPetFood(
  input: Omit<PetFood, "id" | "createdAt" | "updatedAt">
): Promise<PetFood> {
  const food = withBase(input);
  await mutateField("petFoods", (arr => [...arr, food]));
  return food;
}

export async function updatePetFood(
  id: string,
  patch: Partial<PetFood>
): Promise<void> {
  await mutateField("petFoods", (arr) =>
    arr.map((f) => (f.id === id ? touch({ ...f, ...patch }) : f))
  );
}

/**
 * 计算粮食剩余比例
 * 剩余比例 = (录入重量 - 已过天数 × 每日消耗/1000) / 录入重量
 */
export function calculateFoodRatio(food: PetFood, now: Date = new Date()): number {
  const elapsedDays =
    (now.getTime() - new Date(food.recordDate).getTime()) /
    (1000 * 60 * 60 * 24);
  const consumedKg = (elapsedDays * food.dailyConsumption) / 1000;
  const remainingKg = Math.max(0, food.totalWeight - consumedKg);
  return food.totalWeight > 0 ? remainingKg / food.totalWeight : 0;
}

/**
 * 根据剩余比例返回模糊等级
 * 充足 > 60%，适中 30%-60%，不足 10%-30%，空 < 10%
 */
export function getFoodLevel(food: PetFood, now: Date = new Date()): FoodLevel {
  const ratio = calculateFoodRatio(food, now);
  if (ratio > 0.6) return "sufficient";
  if (ratio > 0.3) return "moderate";
  if (ratio > 0.1) return "low";
  return "empty";
}

export const FoodLevelLabel: Record<FoodLevel, string> = {
  sufficient: "充足",
  moderate: "适中",
  low: "不足",
  empty: "空",
};
