import { minutesToHHMM, type TimeWindow } from '@bit/shared';
const pad = (n: number) => String(n).padStart(2, '0');
export function toIsoDate(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const fromIsoDate = (iso: string) => new Date(`${iso}T12:00:00`);
export function addDays(d: Date, days: number): Date {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
}
export function startOfWeek(d: Date): Date {
    const mondayOffset = (d.getDay() + 6) % 7;
    "0=poniedziałek"
    return addDays(d, -mondayOffset);
}
const shortFmt = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'short', day: 'numeric', month:
        'numeric'
});
const longFmt = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long'
});
export const formatDay = (iso: string) => shortFmt.format(fromIsoDate(iso));
export const formatDayLong = (iso: string) => longFmt.format(fromIsoDate(iso));
export function formatWindow(w: TimeWindow): string {
    return `${formatDayLong(w.date)}, ${minutesToHHMM(w.startMinute)}–${minutesToHHMM(w.endMinute)}`;
}