import { useState, type FormEvent } from "react";
import { joinSchema } from "@bit/shared";
import { useJoin } from "../api/hooks";
import type { Session } from "../lib/session";
interface Props {
  eventId: string;
  onJoined: (session: Session) => void;
}

export function JoinForm({ eventId, onJoined }: Props) {
  const join = useJoin(eventId);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = joinSchema.safeParse({ name, pin: pin || undefined });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Niepoprawne dane");
      return;
    }
    setError(null);
    join.mutate(parsed.data, {
      onSuccess: ({ participant, token }) =>
        onJoined({
          participantId: participant.id,
          name: participant.name,
          token,
        }),
      onError: (err) => setError(err.message),
    });
  }
  return (
    <form className="stack" onSubmit={handleSubmit} noValidate>
      <p className="muted">
        Podaj imię, żeby zaznaczyć, kiedy możesz. Heatmapę grupy widzisz obok.
      </p>
      <div className="field">
        <label htmlFor="name">Imię lub nick</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="nickname"
        />
      </div>
      <div className="field">
        <label htmlFor="pin">PIN (opcjonalnie, 4 cyfry)</label>
        <input
          id="pin"
          value={pin}
          inputMode="numeric"
          maxLength={4}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          aria-describedby="pin-hint"
        />
        <small id="pin-hint" className="muted">
          Pozwoli wrócić i edytować z innego urządzenia.
        </small>
      </div>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <button className="btn btn-primary" disabled={join.isPending}>
        {join.isPending ? "Dołączanie…" : "Dołącz"}
      </button>
    </form>
  );
}
