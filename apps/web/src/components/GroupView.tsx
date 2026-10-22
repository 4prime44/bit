import { useMemo, useState } from 'react';
import { timeRows, type EventDto } from '@bit/shared';
import { availabilityBySlot, bestWindows, type RankedWindow } from '../lib/aggregate';
import { formatWindow } from '../lib/format';
import { useFinalize } from '../api/hooks';
import { GroupGrid } from './GroupGrid';
interface Props { event: EventDto; dates: string[]; adminToken: string | null }
export function GroupView({ event, dates, adminToken }: Props) {
    const [durationMinutes, setDurationMinutes] = useState(60); // jak długie spotkanie?
    const [highlight, setHighlight] = useState<RankedWindow | null>(null);
    const finalize = useFinalize(event.id, adminToken ?? '');
    const rows = useMemo(() => timeRows(event), [event]);
    const bySlot = useMemo(() => availabilityBySlot(event.participants), [event.participants]); 
    const durationSlots = Math.max(1, Math.round(durationMinutes / event.slotMinutes));
    const best = useMemo(
        () => bestWindows(event, event.participants, durationSlots),
        [event, durationSlots],
    );
    const total = event.participants.length;
    if (total === 0) {
        // pusty
        return <p className="muted">Jeszcze nikt się nie zapisał. Skopiuj link powyżej i wyślij go
            znajomym!</p>;
    }
    const everyoneFits = best[0]?.available.length === total;
    return (
        <div className="stack">
            <GroupGrid dates={dates} rows={rows} bySlot={bySlot}
                allNames={event.participants.map((p) => p.name)} highlight={highlight} />
            <div className="row">
                <h3 style={{ margin: 0 }}>Najlepsze terminy</h3>
                <label className="muted">
                    długość{' '}
                    <select value={durationMinutes} onChange={(e) =>
                        setDurationMinutes(Number(e.target.value))}>
                        {[30, 60, 90, 120, 180].filter((m) => m >= event.slotMinutes).map((m) => (
                            <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} h`}</option>
                        ))}
                    </select>
                </label>
            </div>
            {best.length === 0 ? (
                <p className="muted">Brak okna tej długości, w którym ktokolwiek jest wolny. Spróbuj
                    krótszego.</p>
            ) : (
                <>{!everyoneFits && (
 
                    < p role="note">Nie ma terminu pasującego wszystkim. Najlepsze: <b>
                        {best[0]!.available.length} z {total}</b> osób.</p>
)}
            <ol className="stack" style={{ paddingLeft: '1.2rem' }}>
                {best.map((w) => (
                    <li key={`${w.date}-${w.startMinute}`}
                        onPointerEnter={() => setHighlight(w)} onPointerLeave={() => setHighlight(null)}
                        onFocus={() => setHighlight(w)} onBlur={() => setHighlight(null)}> 
                        <strong>{formatWindow(w)}</strong>: {w.available.length}/{total}
                        <div className="muted" style={{ fontSize: '.85rem' }}>{w.available.join(', ')}</div>
                        {adminToken && (
                            <button className="btn" disabled={finalize.isPending}
                                onClick={() => finalize.mutate({
                                    date: w.date, startMinute: w.startMinute,
                                    endMinute: w.endMinute
                                })}>
                                Zatwierdź ten termin
                            </button>
                        )}
                    </li>
                ))}
            </ol>
        </>
    )
}
{
    adminToken && event.finalWindow && (
        <button className="btn" onClick={() => finalize.mutate(null)}>Cofnij zatwierdzenie</button>
    )
}
{ finalize.isError && <p role="alert" className="error-text">{finalize.error.message}</p> }
</div >
);
}