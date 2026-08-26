import { mutateField, withBase, useStore } from "./useStore";
import type { FlowerFavorite } from "../types";

export async function favoriteFlower(flowerId: string, name: string): Promise<FlowerFavorite> {
  const fav = withBase({ flowerId, name });
  await mutateField("flowerFavorites", (arr) => [...arr, fav]);
  return fav;
}

export async function unfavoriteFlower(flowerId: string): Promise<void> {
  await mutateField("flowerFavorites", (arr) => arr.filter((f) => f.flowerId !== flowerId));
}

export function isFlowerFavorited(flowerId: string): boolean {
  return useStore.getState().data.flowerFavorites.some((f) => f.flowerId === flowerId);
}

export function getFavoriteFlowers(): FlowerFavorite[] {
  return useStore.getState().data.flowerFavorites;
}
