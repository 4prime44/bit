export interface Cell {
    col: number;
    row: number;
}
export type DragMode = 'add' | 'remove';
export function cellsInRect(a: Cell, b: Cell): Cell[] {
    const cells: Cell[] = [];
    const [c1, c2] = [Math.min(a.col, b.col), Math.max(a.col, b.col)]; // lewa i prawa krawędź
    const [r1, r2] = [Math.min(a.row, b.row), Math.max(a.row, b.row)]; // górna i dolna krawędź
    for (let col = c1; col <= c2; col++) {
        for (let row = r1; row <= r2; row++) cells.push({ col, row });
    }
    return cells;
}
export function applyRect(
    selected: ReadonlySet<string>,
    keyOf: (cell: Cell) => string,
    a: Cell,
    b: Cell,
    mode: DragMode,
): Set<string> {
    const next = new Set(selected);
    for (const cell of cellsInRect(a, b)) {
        if (mode === 'add') next.add(keyOf(cell));
        else next.delete(keyOf(cell));
    }
    return next;
}
export function moveCell(cell: Cell, key: string, cols: number, rows: number): Cell | null {
    switch (key) {
        case 'ArrowLeft': return { ...cell, col: Math.max(0, cell.col - 1) };
        case 'ArrowRight': return { ...cell, col: Math.min(cols - 1, cell.col + 1) };
        case 'ArrowUp': return { ...cell, row: Math.max(0, cell.row - 1) };
        case 'ArrowDown': return { ...cell, row: Math.min(rows - 1, cell.row + 1) };
        default: return null;
        // inny klawisz niet
    }
}
export function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
    if (a.size !== b.size) return false;
    for (const x of a) if (!b.has(x)) return false;
    return true;
}