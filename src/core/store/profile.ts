import { mutateField, useStore } from "./useStore";
import type { Profile } from "../types";

export async function updateProfile(patch: Partial<Profile>): Promise<void> {
  await mutateField("profile", (p) => ({ ...p, ...patch }));
}

export function getProfile(): Profile {
  return useStore.getState().data.profile;
}
