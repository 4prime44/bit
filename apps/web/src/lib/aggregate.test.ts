import { describe, expect, it } from 'vitest';
import type { ParticipantDto } from '@bit/shared';
import { availabilityBySlot, bestWindows } from './aggregate';
const grid = { dates: ['2026-10-20'], startMinute: 540, endMinute: 660, slotMinutes: 30 }; // 9:00–11:00
// Pomocnik do tworzenia uczestnika z samym imieniem i slotami.
const person = (name: string, slots: string[]): ParticipantDto => ({
    id: name, name, slots,
    updatedAt: ''
}); describe('bestWindows', () => {
    const ola = person('Ola', ['2026-10-20T09:00', '2026-10-20T09:30', '2026-10-20T10:00']);
    const kuba = person('Kuba', ['2026-10-20T09:30', '2026-10-20T10:00', '2026-10-20T10:30']);
    it('znajduje godzinę, w której mogą oboje', () => {
        const [top] = bestWindows(grid, [ola, kuba], 2);
        // 2 sloty = 1 h
        expect(top).toMatchObject({ startMinute: 570, endMinute: 630, available: ['Ola', 'Kuba'] }); //9:30–10:30
    });
    it('nie zwraca nachodzących na siebie okien', () => {
        const result = bestWindows(grid, [ola], 1);
        const starts = result.map((w) => w.startMinute);
        expect(starts).toEqual([540, 570, 600]);
    });
    // 3 osobne półgodziny Oli
    it('zwraca pustą listę, gdy nikt nie ma czasu', () => {
        expect(bestWindows(grid, [person('Ania', [])], 1)).toEqual([]);
    });
});
it('availabilityBySlot grupuje imiona', () => {
    const map = availabilityBySlot([person('Ola', ['x']), person('Kuba', ['x', 'y'])]);
    expect(map.get('x')).toEqual(['Ola', 'Kuba']);
    expect(map.get('y')).toEqual(['Kuba']);
});