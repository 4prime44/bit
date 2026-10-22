import { useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { useEvent } from '../api/hooks';
import { ApiError } from '../api/client';
import { loadAdminToken, loadSession, saveSession, takeAdminTokenFromHash, type Session } from'../lib/session';
import { useMediaQuery } from '../lib/useMediaQuery';
import { formatWindow } from '../lib/format';
import { NotFoundPage } from './NotFoundPage';
import { JoinForm } from '../components/JoinForm';
import { ShareBox } from '../components/shareBox';
import { MyAvailability } from '../components/MyAvailability';
import { GroupView } from '../components/GroupView';
import styles from './EventPage.module.css';
export function EventPage() {
    const { eventId = '' } = useParams();
    const location = useLocation();
    const justCreated = Boolean((location.state as { justCreated?: boolean } | null)?.justCreated);
    const { data: event, isPending, error } = useEvent(eventId);
    const [session, setSession] = useState(() => loadSession(eventId));
    const [adminToken] = useState(() => takeAdminTokenFromHash(eventId) ?? loadAdminToken(eventId));
    const isMobile = useMediaQuery('(max-width: 640px)');
    const [tab, setTab] = useState<'me' | 'group'>('me');
    const [page, setPage] = useState(0);
    if (isPending) return <p className="muted" role="status">Ładowanie wydarzenia…</p>;
    if (error) {
        return error instanceof ApiError && error.status === 404
            ? <NotFoundPage message="Nie ma takiego wydarzenia. Sprawdź, czy link jest poprawny." />
            : <p role="alert" className="error-text">Nie udało się wczytać wydarzenia: {error.message}
            </p>;
    }
    const me = session ? event.participants.find((p) => p.id === session.participantId) : undefined;
    function changeSession(next: Session | null) {
        saveSession(eventId, next);
        setSession(next);
    }
    const pageSize = isMobile ? 3 : 7;
    const pageCount = Math.ceil(event.dates.length / pageSize);
    const safePage = Math.min(page, pageCount - 1);
    const visibleDates = event.dates.slice(safePage * pageSize, (safePage + 1) * pageSize);
    return (
        <div className="stack">
            <div>
                <h1>{event.title}</h1>
                {event.description && <p className="muted">{event.description}</p>}
            </div>
            {event.finalWindow && (
                // gdy zalozyciel ustali termin
                <div className={`card ${styles.final}`} role="status">
                    <strong>Ustalony termin: {formatWindow(event.finalWindow)}</strong>
                </div>
            )}
            <ShareBox eventId={event.id} adminToken={adminToken} highlight={justCreated} />
            {isMobile && (
                <div role="tablist" aria-label="Widok" className={styles.tabs}>
                    <button role="tab" aria-selected={tab === 'me'} onClick={() => setTab('me')}>Ja</button>
                    <button role="tab" aria-selected={tab === 'group'} onClick={() => setTab('group')}>
                        Grupa ({event.participants.length})
                    </button>
                </div>
            )}
            {pageCount > 1 && (
                <div className={styles.pager}>
                    <button className="btn" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}
                        aria-label="Poprzednie dni">‹</button>
                    <span>Dni {safePage + 1} / {pageCount}</span>
                    <button className="btn" disabled={safePage === pageCount - 1} onClick={() =>
                        setPage(safePage + 1)} aria-label="Następne dni">›</button>
                </div>
            )}
            <div className={styles.panels}>
                <section className="card" hidden={isMobile && tab !== 'me'} aria-labelledby="me-h">
                    <h2 id="me-h">{me ? `Twoja dostępność (${me.name})` : 'Dołącz'}</h2>
                    {session && me
                        ? <MyAvailability event={event} dates={visibleDates} session={session} me={me} onLeave=
                            {() => changeSession(null)} />
                        : <JoinForm eventId={event.id} onJoined={changeSession} />}
                </section>
                <section className="card" hidden={isMobile && tab !== 'group'} aria-labelledby="group-h">
                    <h2 id="group-h">Dostępność grupy</h2>
                    <GroupView event={event} dates={visibleDates} adminToken={adminToken} />
                </section>
            </div>
        </div>
    );
}