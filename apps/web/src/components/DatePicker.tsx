import { useMemo } from 'react';
import { addDays, formatDayLong, startOfWeek, toIsoDate } from '../lib/format';
import styles from './DatePicker.module.css';

const WEEKDAYS=['Pn','Wt','Śr','Cz','Pt','Sb','Nd'];

interface Props{
    value: string[]
    onChange:(dates:string[])=>void
}
//useMemo zeby nie obiazac renderów
export function DatePicker({ value, onChange }: Props) {
    const today = toIsoDate(new Date());
    const days = useMemo(() => {
        const start = startOfWeek(new Date());
        return Array.from({ length: 35 }, (_, i) => toIsoDate(addDays(start, i)));
}, []);
    const selected = new Set(value);
    function toggle(day:string){
        const next=new Set(selected);
        if(next.has(day)) next.delete(day);
        else next.add(day);
        onChange([...next].sort());
    }
    return(
        <div className={styles.picker}>
            {WEEKDAYS.map((w)=>(
                <span key={w} className={styles.weekday} aria-hidden="true">{w}</span>
            ))}
            {days.map((day)=>
            <button
                key={day}
                type="button"
                className={styles.day}
                aria-pressed={selected.has(day)}
                aria-label={formatDayLong(day)}
                disabled={day<today}
                onClick={() => toggle(day)}>{Number(day.slice(8))}</button>
        )}
        </div>
    )
}