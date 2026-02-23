import { isValidYMD } from "./date";

const KEY = "meet-days.v1";
const SYNC_ENDPOINT = (import.meta.env.VITE_SYNC_ENDPOINT as string | undefined)
  ?.trim()
  .replace(/\/$/, "");
const SYNC_KEY = (import.meta.env.VITE_SYNC_KEY as string | undefined)?.trim();

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

function normalizeDates(dates: string[]): string[] {
  const dedup = new Set<string>();
  for (const d of dates) {
    if (isValidYMD(d)) dedup.add(d);
  }
  return Array.from(dedup).sort();
}

function syncHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (SYNC_KEY) headers["x-sync-key"] = SYNC_KEY;
  return headers;
}

function canSync() {
  return Boolean(SYNC_ENDPOINT);
}

export async function pullMeetDatesRemote(): Promise<string[] | null> {
  if (!canSync()) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(`${SYNC_ENDPOINT}/dates`, {
      method: "GET",
      headers: syncHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data || !Array.isArray(data.dates)) return null;
    return normalizeDates(data.dates);
  } catch {
    return null;
  }
}

export async function pushMeetDatesRemote(dates: string[]): Promise<boolean> {
  if (!canSync()) return false;
  try {
    const body = JSON.stringify({ dates: normalizeDates(dates) });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(`${SYNC_ENDPOINT}/dates`, {
      method: "PUT",
      headers: syncHeaders(),
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return resp.ok;
  } catch {
    return false;
  }
}
