import { timeRows, toSlotKey, type EventGrid, type ParticipantDto, type TimeWindow } from
    '@bit/shared';

export function availabilityBySlot(participants: ParticipantDto[]): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const p of participants) {
        for (const slot of p.slots) {
            const names = map.get(slot);
            if (names) names.push(p.name);
            else map.set(slot, [p.name]);
        }
    }
    return map;
}
export interface RankedWindow extends TimeWindow {
    available: string[];
}
// osoby wolne przez CAŁE okno najlepsze okna o długości durationSlots, posortowane malejąco wg liczby osób.
export function bestWindows(
    grid: EventGrid,
    participants: ParticipantDto[],
    durationSlots: number,
    limit = 5,
): RankedWindow[] {
    const people = participants.map((p) => ({ name: p.name, slots: new Set(p.slots) }));
    const rows = timeRows(grid);
    const candidates: RankedWindow[] = [];
    for (const date of grid.dates) {
        for (let i = 0; i + durationSlots <= rows.length; i++) {
            const keys = rows.slice(i, i + durationSlots).map((m) => toSlotKey(date, m));
            const available = people
                .filter((p) => keys.every((k) => p.slots.has(k)))
                .map((p) => p.name);
            if (available.length === 0) continue;
            const startMinute = rows[i]!;
            candidates.push({
                date, startMinute, endMinute: startMinute + durationSlots *
                    grid.slotMinutes, available
            });
        }
    }    candidates.sort((a, b) =>
        b.available.length - a.available.length || a.date.localeCompare(b.date) || a.startMinute -
        b.startMinute);
    const picked: RankedWindow[] = [];
    for (const w of candidates) {
        const overlaps = picked.some((p) => p.date === w.date && w.startMinute < p.endMinute &&
            p.startMinute < w.endMinute);
        if (!overlaps) picked.push(w);
        if (picked.length === limit) break;
    }
    return picked;
}