import { isValidYMD } from "./date";

const KEY = "meet-days.v1";

export function loadMeetDates(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const dedup = new Set<string>();
    for (const x of parsed) {
      if (typeof x === "string" && isValidYMD(x)) dedup.add(x);
    }
    return Array.from(dedup).sort();
  } catch {
    return [];
  }
}

export function saveMeetDates(dates: string[]) {
  const dedup = new Set<string>();
  for (const d of dates) {
    if (isValidYMD(d)) dedup.add(d);
  }
  localStorage.setItem(KEY, JSON.stringify(Array.from(dedup).sort()));
}
