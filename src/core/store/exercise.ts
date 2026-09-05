import { mutateField, withBase, useStore } from "./useStore";
import type { ExerciseRecord, ExerciseType } from "../types";

export async function addExercise(
  input: { date: string; type: ExerciseType; duration: number; remark?: string }
): Promise<ExerciseRecord> {
  const record = withBase(input);
  await mutateField("exerciseRecords", (arr) => [...arr, record]);
  return record;
}

export async function deleteExercise(id: string): Promise<void> {
  await mutateField("exerciseRecords", (arr) =>
    arr.filter((r) => r.id !== id)
  );
}

export function getExercisesByDate(date: string): ExerciseRecord[] {
  return useStore
    .getState()
    .data.exerciseRecords.filter((r) => r.date === date);
}

/** 某日运动总时长（分钟） */
export function getExerciseMinutes(date: string): number {
  return getExercisesByDate(date).reduce((a, r) => a + r.duration, 0);
}

/**
 * 某日运动总步数估算
 * 按运动类型估算每分钟步数（walk/hike/run 较快，其余一般）
 */
const STEPS_PER_MINUTE: Partial<Record<ExerciseType, number>> = {
  walk: 120,
  hike: 110,
  run: 150,
  yoga: 20,
  fitness: 30,
  swim: 40,
  bike: 60,
  badminton: 90,
  basketball: 100,
  other: 60,
};

export function getExerciseSteps(date: string): number {
  const records = getExercisesByDate(date);
  let total = 0;
  for (const r of records) {
    const perMin = STEPS_PER_MINUTE[r.type] ?? 60;
    total += r.duration * perMin;
  }
  return Math.round(total);
}

export function getAllExercises(): ExerciseRecord[] {
  return useStore.getState().data.exerciseRecords;
}
