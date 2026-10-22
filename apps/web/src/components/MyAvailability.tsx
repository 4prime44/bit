import { useMemo, useState } from 'react';
import { timeRows, type EventDto, type ParticipantDto } from '@bit/shared';
import { useLeave, useSaveAvailability } from '../api/hooks';
import { setsEqual } from '../lib/selection';
import { useBeforeUnload } from '../lib/useBeforeUnload';
import type { Session } from '../lib/session';
import { AvailabilityGrid } from './AvailabilityGrid';
interface Props {
    event: EventDto;
    dates: string[];
    session: Session;
    me: ParticipantDto;
    onLeave: () => void;
}
export function MyAvailability({ event, dates, session, me, onLeave }: Props) {
    const rows = useMemo(() => timeRows(event), [event]);
    const saved = useMemo(() => new Set(me.slots), [me.slots]);
    const [draft, setDraft] = useState<Set<string>>(() => new Set(me.slots)); 
    const [confirmDelete, setConfirmDelete] = useState(false);
    const save = useSaveAvailability(event.id, session.token);
    const leave = useLeave(event.id, session.token, me.id);
    const isDirty = !setsEqual(draft, saved);
    useBeforeUnload(isDirty);
    function handleChange(next: Set<string>) {
        setDraft(next);
        save.reset();
        "Zapisano"
    }
    const status = save.isPending ? 'Zapisywanie…'
        : save.isSuccess && !isDirty ? 'Zapisano ✓' : isDirty ? 'Masz niezapisane zmiany'
            : draft.size === 0 ? 'Przeciągnij po siatce, aby zaznaczyć, kiedy możesz.'
                : '';
    return (
        <div className="stack">
            <AvailabilityGrid dates={dates} rows={rows} value={draft} onChange={handleChange} />
            <p role="status" aria-live="polite" className="muted" style={{
                minHeight: '1.5em', margin: 0
            }}>{status}</p>
            {save.isError && (
                <div role="alert" className="error-text">
                    Nie udało się zapisać: {save.error.message}{' '}
                    <button className="btn" onClick={() => save.mutate([...draft].sort())}>Spróbuj
                        ponownie</button>
                </div>
            )}
            <div className="row">
                <button className="btn btn-primary" disabled={!isDirty || save.isPending}
                    onClick={() => save.mutate([...draft].sort())}>
                    Zapisz{isDirty ? ' •' : ''}

                </button>
                <button className="btn" disabled={!isDirty} onClick={() => setDraft(new Set(saved))}>Cofnij
                    zmiany</button>
                <button className="btn" disabled={draft.size === 0} onClick={() => handleChange(new
                    Set())}>Wyczyść</button>
            </div>
            <div className="row">
                {confirmDelete ? (
                    <>
<span>Na pewno usunąć Cię z wydarzenia?</span>
<button className="btn btn-danger" disabled={leave.isPending}
onClick={() => leave.mutate(undefined, { onSuccess: onLeave })}>Tak, usuń</button>
<button className="btn" onClick={() => setConfirmDelete(false)}>Anuluj</button>
</>
            ) : (
            <>
                <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Usuń moją
                    dostępność</button>
                <button className="btn" onClick={onLeave}>To nie ja (wyloguj)</button>
            </>
)}
        </div>
{ leave.isError && <p role="alert" className="error-text">{leave.error.message}</p> }
</div >
);
}