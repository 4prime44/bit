import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
export class HttpError extends Error {
    constructor(public status:number, message:string, public details?:unknown) {
        super(message);
    }
}

export const errorHandler:ErrorRequestHandler=(err, _req, res, _next)=>{
    if (err instanceof HttpError) {
        res.status(err.status).json({ error:err.message, details:err.details });
        return;
    }
    if (err instanceof ZodError) {
        res.status(400).json({ error:'Niepoprawne dane', details:err.issues });
        return;
    }
    if (err?.type==='entity.parse.failed') {
        res.status(400).json({ error:'Niepoprawny JSON w body' });
        return;
    }
    console.error(err);
    res.status(500).json({ error:'Błąd serwera' });
};
