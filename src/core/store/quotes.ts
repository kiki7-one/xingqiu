import { mutateField, withBase, useStore } from "./useStore";
import type { QuoteFavorite } from "../types";

export async function favoriteQuote(
  quoteId: string,
  text: string,
  category?: string
): Promise<QuoteFavorite> {
  const fav = withBase({ quoteId, text, category });
  await mutateField("quoteFavorites", (arr) => [...arr, fav]);
  return fav;
}

export async function unfavoriteQuote(quoteId: string): Promise<void> {
  await mutateField("quoteFavorites", (arr) =>
    arr.filter((f) => f.quoteId !== quoteId)
  );
}

export function isQuoteFavorited(quoteId: string): boolean {
  return useStore
    .getState()
    .data.quoteFavorites.some((f) => f.quoteId === quoteId);
}

export function getFavoriteQuotes(): QuoteFavorite[] {
  return useStore.getState().data.quoteFavorites;
}
