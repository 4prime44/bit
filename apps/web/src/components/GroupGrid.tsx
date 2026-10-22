//heatmapa
import { useState, type CSSProperties } from 'react';
import { minutesToHHMM, toSlotKey, type TimeWindow } from '@bit/shared';
import { formatDay, formatDayLong } from '../lib/format';
import styles from './GroupGrid.module.css';
interface Props {
    dates: string[];
    rows: number[];
    bySlot: Map<string, string[]>;
    allNames: string[];
    highlight: TimeWindow | null;
}
export function GroupGrid({ dates, rows, bySlot, allNames, highlight }: Props) {
    const [active, setActive] = useState<string | null>(null);
    const total = allNames.length;
    const activeNames = active ? bySlot.get(active) ?? [] : [];
    const inHighlight = (date: string, minute: number) =>
        !!highlight && highlight.date === date && minute >= highlight.startMinute && minute <
        highlight.endMinute;
    return (
        <div className="stack">
            <div role="grid" aria-label="Dostępność grupy" className={styles.grid}
                style={{ gridTemplateColumns: `3.5rem repeat(${dates.length}, minmax(2.75rem, 1fr))` }}
                onPointerLeave={(e) => { if (e.pointerType === 'mouse') setActive(null); }}>
                <div role="row" className={styles.row}>
                    <span role="columnheader" />
                    {dates.map((d) => <span role="columnheader" key={d} className={styles.dayHeader}>
                        {formatDay(d)}</span>)}
                </div>
                {rows.map((minute) => (
                    <div role="row" key={minute} className={styles.row}>
                        <span role="rowheader" className={styles.time} aria-label={minutesToHHMM(minute)}>
                            {minute % 60 === 0 ? minutesToHHMM(minute) : ''}
                        </span>
                        {dates.map((date) => {
                            const key = toSlotKey(date, minute);
                            const count = bySlot.get(key)?.length ?? 0;
                            const ratio = total ? count / total : 0;
                            return (
                                <div
                                    key={key}
                                    role="gridcell"
                                    aria-label={`${formatDayLong(date)}, ${minutesToHHMM(minute)}: ${count} z
${total}`}
                                    className={[styles.cell, ratio >= 0.55 && styles.dark, minute % 60 === 0 &&
                                        styles.hourStart,
                                    inHighlight(date, minute) && styles.highlight, active === key && styles.active]
                                        .filter(Boolean).join(' ')}
                                    style={{ '--ratio': ratio } as CSSProperties}
                                    onPointerEnter={() => setActive(key)}
                                    onClick={() => setActive(key)}
                                >
                                    {count > 0 ? count : ''}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            <div className={styles.legend} aria-hidden="true">
                <span>0</span><span className={styles.scale} /><span>{total} os.</span>
            </div>
            <div className={styles.details} aria-live="polite">
                {active ? (
                    <>
                        <strong>{formatDayLong(active.slice(0, 10))}, {active.slice(11)}</strong>
                        <div>
                            Mogą ({activeNames.length}): {activeNames.join(', ') || '—'}</div>
                        <div>
                            Nie mogą: {allNames.filter((n) => !activeNames.includes(n)).join(', ') || '—'}
                        </div>
                    </>
                ) : (
                    <span className="muted">Najedź lub dotknij pola, aby zobaczyć, kto może.</span>
                )}
            </div>
        </div>
    );
}