import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { minutesToHHMM, toSlotKey } from '@bit/shared';
import { applyRect, moveCell, type Cell, type DragMode } from '../lib/selection';
import { formatDay, formatDayLong } from '../lib/format';
import styles from './AvailabilityGrid.module.css';

interface Props {
    dates: string[];
    rows: number[];
    value: ReadonlySet<string>;
    onChange: (next: Set<string>) => void;
}

interface Drag {
    anchor: Cell;
    current: Cell;
    mode: DragMode;
}

export function AvailabilityGrid({ dates, rows, value, onChange }: Props) {
    const [drag, setDrag] = useState<Drag | null>(null);
    const [focus, setFocus] = useState<Cell>({ col: 0, row: 0 });
    const cellRefs = useRef(new Map<string, HTMLDivElement>());

    const keyOf = useCallback((c: Cell) => toSlotKey(dates[c.col]!, rows[c.row]!), [dates, rows]);

    const preview = useMemo(
        () => (drag ? applyRect(value, keyOf, drag.anchor, drag.current, drag.mode) : value),
        [drag, value, keyOf],
    );

    const safeFocus = {
        col: Math.min(focus.col, dates.length - 1),
        row: Math.min(focus.row, rows.length - 1)
    };

    function cellAt(x: number, y: number): Cell | null {
        const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-col]');
        if (!el) return null;
        return { col: Number(el.dataset.col), row: Number(el.dataset.row) };
    }

    function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
        if (e.button !== 0) return;
        const cell = cellAt(e.clientX, e.clientY);
        if (!cell) return;
        
        e.currentTarget.setPointerCapture(e.pointerId);
        setFocus(cell);
        setDrag({ anchor: cell, current: cell, mode: value.has(keyOf(cell)) ? 'remove' : 'add' });
    }

    function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
        if (!drag) return;
        const cell = cellAt(e.clientX, e.clientY);
        if (cell && (cell.col !== drag.current.col || cell.row !== drag.current.row)) {
            setDrag({ ...drag, current: cell });
        }
    }

    function handlePointerUp() {
        if (!drag) return;
        onChange(new Set(preview));
        setDrag(null);
    }

    function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            const key = keyOf(safeFocus);
            const next = new Set(value);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            onChange(next);
            return;
        }
        
        const next = moveCell(safeFocus, e.key, dates.length, rows.length);
        if (next) {
            e.preventDefault();
            setFocus(next);
            cellRefs.current.get(`${next.col}:${next.row}`)?.focus();
        }
    }

    return (
        <div
            role="grid"
            aria-label="Twoja dostępność. Strzałki: ruch, spacja: zaznacz"
            aria-multiselectable="true"
            className={styles.grid}
            style={{ gridTemplateColumns: `3.5rem repeat(${dates.length}, minmax(2.75rem, 1fr))` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => setDrag(null)}
            onKeyDown={handleKeyDown}
        >
            <div role="row" className={styles.row}>
                <span role="columnheader" />
                {dates.map((d) => (
                    <span role="columnheader" key={d} className={styles.dayHeader}>
                        {formatDay(d)}
                    </span>
                ))}
            </div>
            
            {rows.map((minute, row) => (
                <div role="row" key={minute} className={styles.row}>
                    <span role="rowheader" className={styles.time} aria-label={minutesToHHMM(minute)}>
                        {minute % 60 === 0 ? minutesToHHMM(minute) : ''}
                    </span>
                    {dates.map((date, col) => {
                        const key = toSlotKey(date, minute);
                        const selected = preview.has(key);
                        const isFocus = col === safeFocus.col && row === safeFocus.row;
                        
                        return (
                            <div
                                key={key}
                                role="gridcell"
                                data-col={col}
                                data-row={row}
                                ref={(el) => {
                                    if (el) cellRefs.current.set(`${col}:${row}`, el);
                                    else cellRefs.current.delete(`${col}:${row}`);
                                }}
                                tabIndex={isFocus ? 0 : -1}
                                aria-selected={selected}
                                aria-label={`${formatDayLong(date)}, ${minutesToHHMM(minute)}`}
                                className={[
                                    styles.cell,
                                    selected && styles.selected,
                                    minute % 60 === 0 && styles.hourStart
                                ].filter(Boolean).join(' ')}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
