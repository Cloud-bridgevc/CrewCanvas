import type { ISODate } from "./types";

const DAY = 86_400_000;

function toUTC(d: ISODate): number {
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, day);
}

export function addDays(d: ISODate, n: number): ISODate {
  return new Date(toUTC(d) + n * DAY).toISOString().slice(0, 10);
}

/** Whole calendar days from a to b (b - a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY);
}

export function maxDate(a: ISODate, b: ISODate): ISODate {
  return a > b ? a : b;
}

export function minDate(a: ISODate, b: ISODate): ISODate {
  return a < b ? a : b;
}

/** Inclusive date-range overlap; returns the shared window or null. */
export function overlap(aStart: ISODate, aEnd: ISODate, bStart: ISODate, bEnd: ISODate) {
  const start = maxDate(aStart, bStart);
  const end = minDate(aEnd, bEnd);
  return start <= end ? { start, end } : null;
}

export function fmt(d: ISODate, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  return new Date(toUTC(d)).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
}

export function fmtRange(a: ISODate, b: ISODate): string {
  return a === b ? fmt(a) : `${fmt(a)} – ${fmt(b)}`;
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
}

export function eachDay(start: ISODate, end: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

export function weekday(d: ISODate): number {
  return new Date(toUTC(d)).getUTCDay();
}
