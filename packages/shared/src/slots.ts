// opis siatki
export interface EventGrid{
    dates:string[];
    startMinute:number;
    endMinute:number;
    slotMinutes:number;
}
//minuty na czas+doklejanie 0
export function minutesToHHMM(minutes:number):string{
    const h=Math.floor(minutes/60);
    const m=minutes%60; 
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
    //uzyte padStart do doklejenia 0
}
//klucz slotu
export function toSlotKey(date:string,minute:number):string{
    return `${date}T${minutesToHHMM(minute)}`;
}
//sloty
export function timeRows(grid: EventGrid): number[] {
    const rows: number[]=[];
    for (let m=grid.startMinute; m<grid.endMinute; m+=grid.slotMinutes) {
        rows.push(m);
    }
    return rows;
}
export function buildSlotKeys(grid: EventGrid): string[] {
    const rows=timeRows(grid);
    return grid.dates.flatMap((date)=> rows.map((m) => toSlotKey(date, m)));
}