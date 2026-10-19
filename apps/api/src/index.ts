import express from 'express';
import { eventsRouter } from './routes/events';
import { errorHandler } from './lib/errors';

const PORT=Number(process.env.PORT ?? 3000);
const app=express();

app.use(express.json());
app.use('/api/events', eventsRouter);
app.use(errorHandler);

app.listen(PORT, ()=>{
    console.log(`API: http://localhost:${PORT}`);
});
