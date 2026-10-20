import express from 'express';
import { eventsRouter } from './routes/events';
import { errorHandler } from './lib/errors';

//osobno od listen, zeby testy mogly uzyc aplikacji bez startu serwera
export function createApp() {
    const app=express();
    app.use(express.json());
    app.use('/api/events', eventsRouter);
    app.use(errorHandler);
    return app;
}
