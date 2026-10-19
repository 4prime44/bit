import type { Prisma } from '@prisma/client';
import type { EventDto, EventGrid, ParticipantDto, TimeWindow } from '@bit/shared';

export const eventInclude = {
    participants: { include: { slots: true }, orderBy: { createdAt: 'asc' } },
} satisfies Prisma.EventInclude;

//typy wierszy z bazy
type EventRow = Prisma.EventGetPayload<{ include: typeof eventInclude }>;
type ParticipantRow = Prisma.ParticipantGetPayload<{ include: { slots: true } }>;

export function parseGrid(event: { dates: string; startMinute: number; endMinute: number;
    slotMinutes: number }): EventGrid {
    return {
        dates: JSON.parse(event.dates) as string[],
        startMinute: event.startMinute,
        endMinute: event.endMinute,
        slotMinutes: event.slotMinutes,
    };
}
//mapowanie wierszy z bazy na DTO dla frontu
export function toParticipantDto(p: ParticipantRow): ParticipantDto {
return {
    id: p.id,
    name: p.name,
    slots: p.slots.map((s) => s.slot).sort(),
    updatedAt: p.updatedAt.toISOString(),
};
}
export function toEventDto(e: EventRow): EventDto {
return {
    id: e.id,
    title: e.title,
    description: e.description,
    ...parseGrid(e),
    finalWindow: e.finalWindow ? (JSON.parse(e.finalWindow) as TimeWindow) : null,
    createdAt: e.createdAt.toISOString(),
    participants: e.participants.map(toParticipantDto),
};
}