import { z } from 'zod';
import type { EventGrid } from './slots';


const isoDate= z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/,'data w formacie rrrr-mm-dd')
    .refine((s)=>!Number.isNaN(Date.parse(s)),'nieistniejaca data');
const minuteOfDay=z.number().int().min(0).max(24*60)
export const slotKeySchema=z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Zly klucz slotu');
// Body POST /api/events
export const createEventSchema=z
    .object({
        title: z.string().trim().min(1, 'Podaj tytul').max(100),
        description: z.string().trim().max(500).optional(),
        dates: z.array(isoDate).min(1, 'Wybierz co najmniej 1 dzień').max(31),
        startMinute: minuteOfDay,
        endMinute: minuteOfDay,
        slotMinutes: z.union([z.literal(15), z.literal(30), z.literal(60)]),
    })
    .refine((d)=>d.endMinute>d.startMinute,{
        message:'Koniec musi byc po poczatku',
        path:['endMinute'],
    })
    .refine((d)=>(d.endMinute-d.startMinute)%d.slotMinutes===0,{
        message: 'Zakres godzin musi dzielić się na sloty',
        path: ['endMinute'],
        });
// Body POST /api/events/:id/participants
export const joinSchema=z.object({
    name: z.string().trim().min(1, 'Podaj imię').max(40),
    pin: z.string().regex(/^\d{4}$/, 'PIN to 4 cyfry').optional(),
});
// Body PUT me/availability
export const availabilitySchema=z.object({
    slots: z.array(slotKeySchema).max(5000),
});
//panel tworcy
export const timeWindowSchema=z
.object({ date: isoDate, startMinute: minuteOfDay, endMinute: minuteOfDay })
.refine((w)=>w.endMinute > w.startMinute, { message: 'Pusty przedział', path: ['endMinute'] });
export const finalizeSchema= z.object({ finalWindow: timeWindowSchema.nullable() });

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type JoinInput = z.infer<typeof joinSchema>;
export type TimeWindow = z.infer<typeof timeWindowSchema>;

export interface ParticipantDto {
id: string;
name: string;
slots: string[];
updatedAt: string;
}
export interface EventDto extends EventGrid {
id: string;
title: string;
description: string | null;
finalWindow: TimeWindow | null;
createdAt: string;
participants: ParticipantDto[];
}