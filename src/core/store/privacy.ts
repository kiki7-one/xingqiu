import { mutateField, useStore } from "./useStore";
import { hashPassword, verifyPassword } from "../crypto";

export async function enablePrivacyLock(password: string): Promise<void> {
  const hash = hashPassword(password);
  await mutateField("settings", (s) => ({
    ...s,
    privacy: { ...s.privacy, enabled: true, passwordHash: hash },
  }));
}

export async function disablePrivacyLock(): Promise<void> {
  await mutateField("settings", (s) => ({
    ...s,
    privacy: { ...s.privacy, enabled: false, passwordHash: undefined },
  }));
}

export function isPrivacyEnabled(): boolean {
  return useStore.getState().data.settings.privacy.enabled;
}

export function verifyPrivacyPassword(password: string): boolean {
  const { privacy } = useStore.getState().data.settings;
  if (!privacy.enabled || !privacy.passwordHash) return false;
  return verifyPassword(password, privacy.passwordHash);
}

export function isModuleProtected(module: string): boolean {
  const { privacy } = useStore.getState().data.settings;
  if (!privacy.enabled) return false;
  return privacy.protectedModules.includes(module);
}

export async function setProtectedModules(modules: string[]): Promise<void> {
  await mutateField("settings", (s) => ({
    ...s,
    privacy: { ...s.privacy, protectedModules: modules },
  }));
}
