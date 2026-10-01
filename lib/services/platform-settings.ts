import { prisma } from "@/lib/db";

// Read straight from the DB, no in-process cache: on serverless each instance
// would hold its own copy, so an admin change only invalidated the instance
// that handled the save and every other one kept showing (and charging) the
// old rate for minutes. A single unique-key lookup is cheap enough.
export async function getSetting(key: string, defaultValue: string): Promise<string> {
  const setting = await prisma.platformSetting.findUnique({ where: { key } });
  return setting?.value ?? defaultValue;
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
}

export interface RatePeriod {
  from: Date;
  to: Date | null;
  rate: number;
}

// Reconstructs the sequence of rates a fee key has held over time from its
// audit log, so historical amounts can be estimated at the rate that was
// actually in effect on each date, not today's rate applied retroactively.
export async function getRateHistory(key: string, defaultRate: number): Promise<RatePeriod[]> {
  const [current, logs] = await Promise.all([
    prisma.platformSetting.findUnique({ where: { key } }),
    prisma.platformSettingAuditLog.findMany({ where: { key }, orderBy: { changed_at: "asc" } }),
  ]);

  if (logs.length === 0) {
    const currentRate = current ? parseFloat(current.value) : defaultRate;
    return [{ from: new Date(0), to: null, rate: isNaN(currentRate) ? defaultRate : currentRate }];
  }

  const periods: RatePeriod[] = [];

  const firstOld = parseFloat(logs[0]!.old_value);
  periods.push({ from: new Date(0), to: logs[0]!.changed_at, rate: isNaN(firstOld) ? defaultRate : firstOld });

  for (let i = 0; i < logs.length; i++) {
    const rate = parseFloat(logs[i]!.new_value);
    const to = i + 1 < logs.length ? logs[i + 1]!.changed_at : null;
    periods.push({ from: logs[i]!.changed_at, to, rate: isNaN(rate) ? defaultRate : rate });
  }

  return periods;
}

export function rateAtTime(periods: RatePeriod[], date: Date): number {
  for (const p of periods) {
    if (date >= p.from && (p.to === null || date < p.to)) return p.rate;
  }
  return periods[periods.length - 1]?.rate ?? 0;
}
