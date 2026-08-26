/**
 * 提醒引擎核心
 * 扫描数据，匹配触发条件，生成提醒结果
 * 支持 24h 去重（基于 lastTriggeredAt）
 */
import type {
  KikiData,
  PetReminder,
  ReminderSettings,
} from "../types";
import { needsRestock } from "../store/items";
import { getFoodLevel } from "../store/pets";
import { getTodayTodos } from "../store/todos";

export type ReminderKind =
  | "restock"
  | "vaccine"
  | "deworming"
  | "health_custom"
  | "cat_litter"
  | "food_low"
  | "todo_due";

export interface ReminderResult {
  id: string; // 去重键：kind + 关联实体 id
  kind: ReminderKind;
  title: string;
  body: string;
  relatedId: string;
  triggeredAt: string; // ISO
}

/**
 * 判断是否在去重窗口内
 */
export function isWithinDedupWindow(
  lastTriggeredAt: string | undefined,
  now: Date,
  hours: number
): boolean {
  if (!lastTriggeredAt) return false;
  const last = new Date(lastTriggeredAt).getTime();
  const elapsed = now.getTime() - last;
  return elapsed < hours * 60 * 60 * 1000;
}

/**
 * 检查提醒是否在免打扰时段
 */
export function isInQuietHours(
  now: Date,
  settings: ReminderSettings
): boolean {
  if (!settings.quietHours.enabled) return false;
  const start = settings.quietHours.start;
  const end = settings.quietHours.end;
  const current = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startTime = sh * 60 + sm;
  const endTime = eh * 60 + em;
  if (startTime <= endTime) {
    return current >= startTime && current < endTime;
  }
  return current >= startTime || current < endTime;
}

/**
 * 检查某类提醒是否启用
 */
export function isReminderTypeEnabled(
  settings: ReminderSettings,
  type: ReminderKind | "todo" | "shopping"
): boolean {
  if (!settings.globalEnabled) return false;
  const perType = settings.perType[type];
  return perType !== false;
}

function mapPetReminderKind(reminder: PetReminder): ReminderKind {
  switch (reminder.type) {
    case "vaccine":
      return "vaccine";
    case "deworming_internal":
    case "deworming_external":
      return "deworming";
    case "health_custom":
      return "health_custom";
    case "cat_litter":
      return "cat_litter";
    case "food":
      return "food_low";
  }
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/**
 * 触发记录内存表（运行期去重）
 * key: ReminderResult.id, value: 上次触发 ISO
 */
const triggeredMap = new Map<string, string>();

export function findLastTriggered(id: string): string | undefined {
  return triggeredMap.get(id);
}

export function markTriggered(id: string, when: Date): void {
  triggeredMap.set(id, when.toISOString());
}

export function clearTriggered(): void {
  triggeredMap.clear();
}

/**
 * 扫描全部数据，生成当前应触发的提醒
 */
export function scanReminders(
  data: KikiData,
  now: Date,
  settings: ReminderSettings
): ReminderResult[] {
  if (!settings.globalEnabled) return [];
  if (isInQuietHours(now, settings)) return [];

  const dedupHours = settings.deduplicationHours || 24;
  const results: ReminderResult[] = [];
  const nowISO = now.toISOString();

  // 1. 补货提醒
  if (isReminderTypeEnabled(settings, "restock")) {
    for (const item of data.items) {
      if (item.isDeleted) continue;
      if (!needsRestock(item)) continue;
      const dedupKey = `restock-${item.id}`;
      if (isWithinDedupWindow(findLastTriggered(dedupKey), now, dedupHours))
        continue;
      results.push({
        id: dedupKey,
        kind: "restock",
        title: `补货提醒：${item.name}`,
        body: `${item.name} 库存仅剩 ${item.stock}${item.unit}，已低于预警阈值 ${item.threshold}`,
        relatedId: item.id,
        triggeredAt: nowISO,
      });
    }
  }

  // 2. 宠物提醒
  for (const reminder of data.petReminders) {
    if (!reminder.enabled) continue;
    if (!reminder.nextDate) continue;
    const kind = mapPetReminderKind(reminder);
    if (!isReminderTypeEnabled(settings, kind)) continue;
    const nextDate = new Date(reminder.nextDate);
    const daysUntil = daysBetween(now, nextDate);

    const shouldTrigger =
      kind === "vaccine"
        ? [7, 3, 1, 0].includes(daysUntil)
        : daysUntil <= 0;

    if (!shouldTrigger) continue;
    const dedupKey = `${kind}-${reminder.id}`;
    if (isWithinDedupWindow(findLastTriggered(dedupKey), now, dedupHours))
      continue;

    const pet = data.pets.find((p) => p.id === reminder.petId);
    const petName = pet?.name ?? "宠物";
    results.push({
      id: dedupKey,
      kind,
      title: `${petName}：${reminder.title}`,
      body:
        daysUntil === 0
          ? `${petName} 的「${reminder.title}」今天到期`
          : `${petName} 的「${reminder.title}」还有 ${daysUntil} 天到期`,
      relatedId: reminder.id,
      triggeredAt: nowISO,
    });
  }

  // 3. 粮食余量不足
  if (isReminderTypeEnabled(settings, "food_low")) {
    for (const food of data.petFoods) {
      const level = getFoodLevel(food, now);
      if (level !== "low" && level !== "empty") continue;
      const dedupKey = `food_low-${food.id}`;
      if (isWithinDedupWindow(findLastTriggered(dedupKey), now, dedupHours))
        continue;
      const pet = data.pets.find((p) => p.id === food.petId);
      const petName = pet?.name ?? "宠物";
      results.push({
        id: dedupKey,
        kind: "food_low",
        title: `${petName}：粮食不足`,
        body: `${petName} 的粮食余量已${level === "empty" ? "空" : "不足"}，请及时补充`,
        relatedId: food.id,
        triggeredAt: nowISO,
      });
    }
  }

  // 4. 待办到期
  if (isReminderTypeEnabled(settings, "todo")) {
    const todos = getTodayTodos(now);
    for (const todo of todos) {
      if (todo.isCompleted) continue;
      if (!todo.deadline) continue;
      const dedupKey = `todo_due-${todo.id}`;
      if (isWithinDedupWindow(findLastTriggered(dedupKey), now, dedupHours))
        continue;
      results.push({
        id: dedupKey,
        kind: "todo_due",
        title: `待办到期：${todo.title}`,
        body: `任务「${todo.title}」已到期，请及时处理`,
        relatedId: todo.id,
        triggeredAt: nowISO,
      });
    }
  }

  return results;
}
