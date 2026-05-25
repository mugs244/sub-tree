import { prisma } from "@/lib/db";

const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, { value: string; expiresAt: number }>();

export async function getSetting(key: string, defaultValue: string): Promise<string> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const setting = await prisma.platformSetting.findUnique({ where: { key } });
  const value = setting?.value ?? defaultValue;
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function getSettingAsNumber(key: string, defaultValue: number): Promise<number> {
  const raw = await getSetting(key, String(defaultValue));
  const parsed = parseFloat(raw);
  return isNaN(parsed) ? defaultValue : parsed;
}

export async function getFeeRate(key: string, defaultRate: number): Promise<number> {
  return getSettingAsNumber(key, defaultRate);
}

export async function getSettingAsBool(key: string, defaultValue: boolean): Promise<boolean> {
  const raw = await getSetting(key, String(defaultValue));
  return raw === "true";
}

export async function updateSetting(
  key: string,
  value: string,
  adminUserId: number
): Promise<void> {
  const current = await prisma.platformSetting.findUnique({ where: { key } });

  await prisma.$transaction([
    prisma.platformSetting.upsert({
      where: { key },
      update: { value, updated_by: adminUserId },
      create: { key, value, description: "", updated_by: adminUserId },
    }),
    prisma.platformSettingAuditLog.create({
      data: {
        key,
        old_value: current?.value ?? "(not set)",
        new_value: value,
        changed_by: adminUserId,
      },
    }),
  ]);

  cache.delete(key);
}

export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
