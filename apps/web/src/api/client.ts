import type { CreateEventInput, EventDto, JoinInput, ParticipantDto, TimeWindow } from
'@bit/shared';

export class ApiError extends Error {
    status:number;
    constructor(status:number,message:string){
        super(message);
        this.status=status
    }
}
interface RequestOptions{
    method?:string;
    body?:unknown;
    headers?:Record<string,string>;
}
//_ do wyciszenia błedu unread
async function request<T>(_path: string, options: RequestOptions = {}): Promise<T> {
    const res = await fetch(`/api${_path}`, { 
        method: options.method ?? 'GET',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    if (res.status === 204) return undefined as T;
    
    const data = await res.json().catch(() => null);
    
    if (!res.ok) {
        throw new ApiError(res.status, data?.error ?? `Błąd serwera (${res.status})`);
    }
    return data as T;
}
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
export const api = {
    getEvent: (id: string) => request<EventDto>(`/events/${id}`),
    createEvent: (input: CreateEventInput) =>
        request<{ event: EventDto; adminToken: string }>('/events', { method: 'POST', body: input }),
    join: (eventId: string, input: JoinInput) =>
        request<{ participant: ParticipantDto; token: string }>(`/events/${eventId}/participants`, {
            method: 'POST', body: input,
        }),
    saveAvailability: (eventId: string, token: string, slots: string[]) =>
        request<ParticipantDto>(`/events/${eventId}/participants/me/availability`, {
            method: 'PUT', body: { slots }, headers: bearer(token),
}),
    leave: (eventId: string, token: string) =>
        request<void>(`/events/${eventId}/participants/me`, { method: 'DELETE', headers: bearer(token)}),
    finalize: (eventId: string, adminToken: string, finalWindow: TimeWindow | null) =>
        request<EventDto>(`/events/${eventId}`, {
        method: 'PATCH', body: { finalWindow }, headers: { 'X-Admin-Token': adminToken },
    }),
};