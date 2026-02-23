import {
  todayYMDLocal,
  ymdToDayIndexLocal,
  dayIndexToYMDLocal,
  isValidYMD,
} from "./date";

function normalizeMeetDays(meetDates: string[]): Set<string> {
  const out = new Set<string>();
  for (const d of meetDates) {
    if (isValidYMD(d)) out.add(d);
  }
  return out;
}

// 从指定日期到今天的比例
export function ratioSince(meetDates: string[], start: string) {
  const startIdx = ymdToDayIndexLocal(start);
  const todayIdx = ymdToDayIndexLocal(todayYMDLocal());
  if (!Number.isFinite(startIdx) || !Number.isFinite(todayIdx) || startIdx > todayIdx) {
    return 0;
  }

  const days = todayIdx - startIdx + 1;
  const set = normalizeMeetDays(meetDates);
  let count = 0;
  for (const d of set) {
    const idx = ymdToDayIndexLocal(d);
    if (Number.isFinite(idx) && idx >= startIdx && idx <= todayIdx) {
      count++;
    }
  }
  return count / days;
}

// 最近365天比例
export function ratioLast365(meetDates: string[]) {
  const todayIdx = ymdToDayIndexLocal(todayYMDLocal());
  if (!Number.isFinite(todayIdx)) return 0;

  const cutoffIdx = todayIdx - 364;
  const set = normalizeMeetDays(meetDates);
  let count = 0;
  for (const d of set) {
    const idx = ymdToDayIndexLocal(d);
    if (Number.isFinite(idx) && idx >= cutoffIdx && idx <= todayIdx) {
      count++;
    }
  }
  return count / 365;
}

// 最近30天比例
export function ratioLast30(meetDates: string[]) {
  const todayIdx = ymdToDayIndexLocal(todayYMDLocal());
  if (!Number.isFinite(todayIdx)) return 0;

  const cutoffIdx = todayIdx - 29;
  const set = normalizeMeetDays(meetDates);
  let count = 0;
  for (const d of set) {
    const idx = ymdToDayIndexLocal(d);
    if (Number.isFinite(idx) && idx >= cutoffIdx && idx <= todayIdx) {
      count++;
    }
  }
  return count / 30;
}

// 判断闰年
export function isLeap(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// 年比例
export function ratioYear(meetDates: string[], year: number) {
  const total = isLeap(year) ? 366 : 365;
  const set = normalizeMeetDays(meetDates);
  let count = 0;
  for (const d of set) {
    if (d.startsWith(`${year}-`)) count++;
  }
  return count / total;
}

// 月比例
export function ratioMonth(meetDates: string[], year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  const set = normalizeMeetDays(meetDates);
  let count = 0;
  for (const d of set) {
    if (d.startsWith(prefix)) count++;
  }

  const days = new Date(year, month, 0).getDate();
  return count / days;
}

// 提取所有出现过的年份
export function extractYears(meetDates: string[]) {
  const set = new Set<number>();
  normalizeMeetDays(meetDates).forEach((d) => set.add(Number(d.slice(0, 4))));
  return Array.from(set).sort((a, b) => b - a);
}

export function currentStreak(meetDates: string[]): number {
  const set = normalizeMeetDays(meetDates);
  const todayYMD = todayYMDLocal();

  if (!set.has(todayYMD)) return 0;

  let streak = 0;
  let idx = ymdToDayIndexLocal(todayYMD);
  if (!Number.isFinite(idx)) return 0;

  while (set.has(dayIndexToYMDLocal(idx))) {
    streak++;
    idx--;
  }
  return streak;
}

export function longestStreak(meetDates: string[]): number {
  if (meetDates.length === 0) return 0;

  // 去重 + 排序成 dayIndex
  const indices = Array.from(
    new Set(
      Array.from(normalizeMeetDays(meetDates))
        .map(ymdToDayIndexLocal)
        .filter((idx) => Number.isFinite(idx))
    )
  ).sort((a, b) => a - b);
  if (indices.length === 0) return 0;

  let best = 1;
  let cur = 1;

  for (let i = 1; i < indices.length; i++) {
    const prev = indices[i - 1];
    const next = indices[i];
    if (prev === undefined || next === undefined) continue;

    if (next === prev + 1) {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 1;
    }
  }
  return best;
}

export function totalMeetDurationDays(meetDates: string[]): number {
  return normalizeMeetDays(meetDates).size;
}
