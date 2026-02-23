const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYMD(ymd: string): { y: number; m: number; d: number } | null {
  if (!YMD_RE.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

export function isValidYMD(ymd: string): boolean {
  const parsed = parseYMD(ymd);
  if (!parsed) return false;
  const idx = Math.floor(Date.UTC(parsed.y, parsed.m - 1, parsed.d) / 86400000);
  return dayIndexToYMDLocal(idx) === ymd;
}

export function ymdToDayIndexLocal(ymd: string): number {
  if (!isValidYMD(ymd)) return Number.NaN;
  const parsed = parseYMD(ymd);
  if (!parsed) return Number.NaN;
  return Math.floor(Date.UTC(parsed.y, parsed.m - 1, parsed.d) / 86400000);
}

export function dayIndexToYMDLocal(dayIndex: number): string {
  const d = new Date(dayIndex * 86400000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayYMDLocal(): string {
  return formatYMD(new Date());
}

export function lastNDays(n: number): string[] {
  const out: string[] = [];
  const todayIndex = ymdToDayIndexLocal(todayYMDLocal());
  if (!Number.isFinite(todayIndex)) return out;

  for (let i = n - 1; i >= 0; i--) {
    out.push(dayIndexToYMDLocal(todayIndex - i));
  }
  return out;
}
