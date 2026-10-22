import { useState } from 'react';
export function ShareBox({ eventId, adminToken, highlight }: {
    eventId: string; adminToken: string |
        null; highlight: boolean
}) {
    const [copied, setCopied] = useState<string | null>(null);
    const link = `${window.location.origin}/e/${eventId}`;
    const adminLink = adminToken ? `${link}#admin=${adminToken}` : null;
    async function copy(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(text);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            window.prompt('Skopiuj link:', text);
        }
    }
    return (
        <div className="card stack" style={highlight ? { borderColor: 'var(--accent)' } : undefined}>
            {highlight && <strong>Wydarzenie utworzone! Wyślij link uczestnikom:</strong>}
            <div className="row">
                <input readOnly value={link} aria-label="Link do wydarzenia" style={{
                    flex: 1, minWidth: 0
                }}
                    onFocus={(e) => e.target.select()} />
                <button className="btn" onClick={() => copy(link)}>{copied === link ? 'Skopiowano ✓' :
                    'Kopiuj link'}</button>
            </div>
            {adminLink && (
                <p className="muted" style={{ margin: 0 }}>
                    Jesteś twórcą. <button className="btn" onClick={() => copy(adminLink)}>
                        {copied === adminLink ? 'Skopiowano ✓' : 'Kopiuj link twórcy'}</button> (otwiera paneltwórcy na innym urządzeniu, nie udostępniaj go!)
                </p>
            )}
        </div>
    );
}