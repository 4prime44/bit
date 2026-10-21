export interface Session {
    participantId: string;
    name: string;
    token: string;
}
const sessionKey = (eventId: string) => `terminbit:session:${eventId}`;
const adminKey = (eventId: string) => `terminbit:admin:${eventId}`;

function read(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string | null) {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    } catch { /*easter egg*/ }
}
export function loadSession(eventId: string): Session | null {
    const raw = read(sessionKey(eventId));
    if (!raw) return null;
    try { return JSON.parse(raw) as Session; } catch { return null; }
}
export function saveSession(eventId: string, session: Session | null) {
    write(sessionKey(eventId), session && JSON.stringify(session));
}
export const loadAdminToken = (eventId: string) => read(adminKey(eventId));
export const saveAdminToken = (eventId: string, token: string) => write(adminKey(eventId), token);
export function takeAdminTokenFromHash(eventId: string): string | null {
    const match = window.location.hash.match(/^#admin=(.+)$/);
    if (!match?.[1]) return null;
    saveAdminToken(eventId, match[1]);
    history.replaceState(null, '', window.location.pathname);
    return match[1];
}