import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EventDto, JoinInput, ParticipantDto, TimeWindow } from '@bit/shared';
import { api } from './client';
export const eventKey = (id: string) => ['event', id] as const;
export function useEvent(eventId: string) {
    return useQuery({
        queryKey: eventKey(eventId),
        queryFn: () => api.getEvent(eventId),
        refetchInterval: 10_000,
});
}
function upsert(list: ParticipantDto[], p: ParticipantDto) {
    return list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p];
}
function useUpdateEventCache(eventId: string) {
    const queryClient = useQueryClient();
    return (fn: (event: EventDto) => EventDto) =>
        queryClient.setQueryData<EventDto>(eventKey(eventId), (old) => (old ? fn(old) : old));
}
export function useCreateEvent() {
    return useMutation({ mutationFn: api.createEvent });
}
export function useJoin(eventId: string) {
    const updateCache = useUpdateEventCache(eventId);
    return useMutation({
        mutationFn: (input: JoinInput) => api.join(eventId, input),
        onSuccess: ({ participant }) =>
            updateCache((e) => ({ ...e, participants: upsert(e.participants, participant) })),
    });
}
export function useSaveAvailability(eventId: string, token: string) {
    const updateCache = useUpdateEventCache(eventId);
    return useMutation({
        mutationFn: (slots: string[]) => api.saveAvailability(eventId, token, slots),
        onSuccess: (participant) =>
            updateCache((e) => ({ ...e, participants: upsert(e.participants, participant) })),
    });
}
export function useLeave(eventId: string, token: string, participantId: string) {
    const updateCache = useUpdateEventCache(eventId);
    return useMutation({
        mutationFn: () => api.leave(eventId, token),
        onSuccess: () =>
            updateCache((e) => ({
                ...e, participants: e.participants.filter((p) => p.id !== participantId)
            })),
    });
}
export function useFinalize(eventId: string, adminToken: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (finalWindow: TimeWindow | null) => api.finalize(eventId, adminToken, finalWindow),
        onSuccess: (event) => queryClient.setQueryData(eventKey(eventId), event),
    });
}