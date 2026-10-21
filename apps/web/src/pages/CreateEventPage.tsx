import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { createEventSchema, minutesToHHMM } from '@bit/shared';
import { useCreateEvent } from '../api/hooks';
import { saveAdminToken } from '../lib/session';
import { DatePicker } from '../components/DatePicker';
const HOURS = Array.from({ length: 25 }, (_, h) => h * 60);
export function CreateEventPage() {
    const navigate = useNavigate();
    const createEvent = useCreateEvent();
    const [title, setTitle] = useState('');
    const [dates, setDates] = useState<string[]>([]);
    const [startMinute, setStartMinute] = useState(9 * 60);
    const [endMinute, setEndMinute] = useState(18 * 60);
    const [slotMinutes, setSlotMinutes] = useState<15 | 30 | 60>(30);
    const [errors, setErrors] = useState<Record<string, string>>({}); // np. { title: 'Podaj tytuł' }
    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const parsed = createEventSchema.safeParse({
            title, dates, startMinute, endMinute, slotMinutes
        });
        if (!parsed.success) {
            const next: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
                const field = String(issue.path[0] ?? 'form');
                next[field] ??= issue.message;
            }
            setErrors(next);
            return;
        }
        setErrors({});
        createEvent.mutate(parsed.data, {
            onSuccess: ({ event, adminToken }) => {
                saveAdminToken(event.id, adminToken);
                // ta przeglądarka=twórca
                navigate(`/e/${event.id}`, { state: { justCreated: true } });
            },
        });
    }
    return (
        <form className="card stack" onSubmit={handleSubmit} noValidate> 

            <h1>Nowe spotkanie</h1>
            <p className="muted">Wybierz dni i godziny, a potem wyślij link członkom koła.</p>
            <div className="field">
                <label htmlFor="title">Nazwa</label>
                <input
                    id="title" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="np. Spotkanie projektu BIT"
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? 'title-error' : undefined} // i przeczyta treść błędu
                />
                {errors.title && <p id="title-error" className="error-text">{errors.title}</p>}
            </div>
            <fieldset>
                <legend>Dni ({dates.length} wybrane)</legend>
                <DatePicker value={dates} onChange={setDates} />
                {errors.dates && <p className="error-text">{errors.dates}</p>}
            </fieldset>
            <div className="row">
                <div className="field">
                    <label htmlFor="start">Od</label>
                    <select id="start" value={startMinute} onChange={(e) =>
                        setStartMinute(Number(e.target.value))}>
                        {HOURS.slice(0, -1).map((m) => <option key={m} value={m}>{minutesToHHMM(m)}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="end">Do</label>
                    <select id="end" value={endMinute} onChange={(e) => setEndMinute(Number(e.target.value))}>
                        {HOURS.slice(1).map((m) => <option key={m} value={m}>{minutesToHHMM(m)}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="slot">Dokładność</label>
                    <select id="slot" value={slotMinutes}
                        onChange={(e) => setSlotMinutes(Number(e.target.value) as 15 | 30 | 60)}>
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={60}>1 h</option>
                    </select>
                </div>
            </div>
            {errors.endMinute && <p className="error-text">{errors.endMinute}</p>}
            {createEvent.isError && <p role="alert" className="error-text">{createEvent.error.message}
            </p>}
            <button className="btn btn-primary" disabled={createEvent.isPending}>
                {createEvent.isPending ? 'Tworzenie…' : 'Utwórz i pobierz link'}
            </button>
        </form>
        );
}