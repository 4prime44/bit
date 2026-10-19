import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Request } from 'express';
import { prisma } from '../db';
import { HttpError } from './errors';

const scryptAsync = promisify(scrypt) as (pw: string, salt: string, len: number) => Promise<Buffer>;

//generowanie losowego tokenu
export const newToken=()=> randomBytes(32).toString('base64url');
export const newEventId= ()=>randomBytes(6).toString('base64url');
export const sha256= (value: string)=> createHash('sha256').update(value).digest('hex');

//typowy algorytm zabezpieczajacy
export async function hashPin(pin: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const key = await scryptAsync(pin, salt, 32);
    return `${salt}:${key.toString('hex')}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
    const [salt, hex] = stored.split(':');
    if (!salt || !hex) return false;
    const key = await scryptAsync(pin, salt, 32);
    return timingSafeEqual(key, Buffer.from(hex, 'hex'));
}

// Wyciąganie tokenu z naglowka
function bearerToken(req: Request): string | null {
const header = req.headers.authorization;
return header?.startsWith('Bearer ') ? header.slice(7) : null;
}
//zwracanie uzytkownika
export async function requireParticipant(req: Request, eventId: string) {
    const token = bearerToken(req);
    if (!token) throw new HttpError(401, 'Zaloguj się, aby edytować dostępność');
        const participant = await prisma.participant.findUnique({ where: { tokenHash: sha256(token) } });
    if (!participant || participant.eventId !== eventId) { // token z innego wydarzenia też odpada
        throw new HttpError(401, 'Sesja wygasła. Dołącz ponownie');
    }
    return participant;
}