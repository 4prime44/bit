import { Router } from 'express';
import {
    availabilitySchema, buildSlotKeys, createEventSchema, finalizeSchema, joinSchema,
} from '@bit/shared';
import { prisma } from '../db';
import { HttpError } from '../lib/errors';
import { hashPin, newEventId, newToken, requireParticipant, sha256, verifyPin } from '../lib/auth';
import { eventInclude, parseGrid, toEventDto, toParticipantDto } from '../lib/dto';
export const eventsRouter=Router();


async function findEventOr404(id:string) {
    const event=await prisma.event.findUnique({ where:{ id }, include:eventInclude });
    if (!event) throw new HttpError(404, 'Nie znaleziono wydarzenia');
    return event;
}
//POST /api/events: utwórz wydarzenie
eventsRouter.post('/', async (req, res)=>{
    const input=createEventSchema.parse(req.body);
    const adminToken=newToken();
    const dates=[...new Set(input.dates)].sort();
    const event=await prisma.event.create({
        data:{
            id:newEventId(),
            title:input.title,
            description:input.description ?? null,
            dates:JSON.stringify(dates),
            startMinute:input.startMinute,
            endMinute:input.endMinute,
            slotMinutes:input.slotMinutes,
            adminTokenHash:sha256(adminToken),
        },
        include:eventInclude,
    });
    res.status(201).json({ event:toEventDto(event), adminToken }); // 201 Created
});
//GET /api/events/:id: pobierz wydarzenie ze wszystkimi dostępnościami
eventsRouter.get('/:id', async (req, res)=>{
    const event=await findEventOr404(req.params.id);
    res.json(toEventDto(event));
});
//POST /api/events/:id/participants: dołącz albo wróć (PIN)
eventsRouter.post('/:id/participants', async (req, res)=>{
    const event=await findEventOr404(req.params.id);
    const { name, pin }=joinSchema.parse(req.body);
    const token=newToken();
    const existing=await prisma.participant.findUnique({
        where:{ eventId_name:{ eventId:event.id, name } },
    });
    //ktos ten juz jest w wydarzeniu
    if (existing) {
        if (!existing.pinHash) {
            throw new HttpError(409, 'To imię jest już zajęte. Wybierz inne lub wróć na urządzeniu, na którym się zapisałeś');
        }
        if (!pin || !(await verifyPin(pin, existing.pinHash))) {
            throw new HttpError(401, 'Niepoprawny PIN');
        }
        const participant=await prisma.participant.update({
            where:{ id:existing.id },
            data:{ tokenHash:sha256(token) },
            include:{ slots:true },
        });
        res.json({ participant:toParticipantDto(participant), token });
        return;
    }
    // nowa osoba
    const participant=await prisma.participant.create({
        data:{
            eventId:event.id,
            name,
            pinHash:pin?await hashPin(pin):null,
            tokenHash:sha256(token),
        },
        include:{ slots:true },
    });
    res.status(201).json({ participant:toParticipantDto(participant), token });
});
// ── PUT …/participants/me/availability: zastąp CAŁĄ moją dostępność ──
eventsRouter.put('/:id/participants/me/availability', async (req, res)=>{
    const event=await findEventOr404(req.params.id);
    const me=await requireParticipant(req, event.id); // 401, jeśli brak/zły token
    const { slots }=availabilitySchema.parse(req.body);
    const allowed=new Set(buildSlotKeys(parseGrid(event))); // wszystkie poprawne pola tej siatki
    const invalid=slots.filter((s)=>!allowed.has(s)); // Set.has jest O(1), więc szybko
    if (invalid.length>0) {
        throw new HttpError(400, 'Część slotów nie należy do tego wydarzenia', invalid.slice(0, 5));
    }
    // Prisma robi oba kroki w jednej transakcji
    const participant=await prisma.participant.update({
        where:{ id:me.id },
        data:{
            slots:{
                deleteMany:{}, // 1) usuń WSZYSTKIE moje stare sloty
                create:[...new Set(slots)].map((slot)=>({ slot })), // 2) wstaw nowe (bez duplikatów)
            },
        },
        include:{ slots:true },
    });
    res.json(toParticipantDto(participant));
});
// ── DELETE …/participants/me: usuń mnie (i moje sloty) ────────────
eventsRouter.delete('/:id/participants/me', async (req, res)=>{
    const event=await findEventOr404(req.params.id);
    const me=await requireParticipant(req, event.id);
    await prisma.participant.delete({ where:{ id:me.id } }); // sloty znikną dzięki onDelete: Cascade
    res.status(204).end(); // 204 No Content = sukces bez body
});
// ── PATCH /api/events/:id: twórca zatwierdza termin (opcjonalne) ──
eventsRouter.patch('/:id', async (req, res)=>{
    const event=await findEventOr404(req.params.id);
    const adminToken=req.header('x-admin-token'); // sekretny nagłówek twórcy
    if (!adminToken || sha256(adminToken)!==event.adminTokenHash) {
        throw new HttpError(403, 'Tylko twórca może zatwierdzić termin'); // 403 = wiem, kim jesteś, ale nie możesz
    }
    const { finalWindow }=finalizeSchema.parse(req.body);
    if (finalWindow) {
        // sprawdzamy, czy okno mieści się w siatce
        const grid=parseGrid(event);
        const fits=grid.dates.includes(finalWindow.date)
            && finalWindow.startMinute>=grid.startMinute
            && finalWindow.endMinute<=grid.endMinute;
        if (!fits) throw new HttpError(400, 'Termin spoza zakresu wydarzenia');
    }
    const updated=await prisma.event.update({
        where:{ id:event.id },
        data:{ finalWindow:finalWindow?JSON.stringify(finalWindow):null },
        include:eventInclude,
    });
    res.json(toEventDto(updated));
});
