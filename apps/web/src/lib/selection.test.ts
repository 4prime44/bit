import { describe, expect, it } from 'vitest';
type Cell = { col: number; row: number };
type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

const cellsInRect = (start: Cell, end: Cell): Cell[] => {
    const cells: Cell[] = [];
    for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row++) {
        for (let col = Math.min(start.col, end.col); col <= Math.max(start.col, end.col); col++) {
            cells.push({ col, row });
        }
    }
    return cells;
};

const applyRect = <T>(
    selected: ReadonlySet<T>,
    keyOf: (cell: Cell) => T,
    start: Cell,
    end: Cell,
    action: 'add' | 'remove',
): Set<T> => {
    const result = new Set(selected);
    for (const cell of cellsInRect(start, end)) {
        const key = keyOf(cell);
        if (action === 'add') result.add(key);
        else result.delete(key);
    }
    return result;
};

const moveCell = (cell: Cell, direction: string, cols: number, rows: number): Cell | null => {
    const offsets: Record<Direction, Cell> = {
        ArrowUp: { col: 0, row: -1 },
        ArrowDown: { col: 0, row: 1 },
        ArrowLeft: { col: -1, row: 0 },
        ArrowRight: { col: 1, row: 0 },
    };
    if (!(direction in offsets)) return null;
    const offset = offsets[direction as Direction];
    return {
        col: Math.max(0, Math.min(cols - 1, cell.col + offset.col)),
        row: Math.max(0, Math.min(rows - 1, cell.row + offset.row)),
    };
};

const setsEqual = <T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean =>
    a.size === b.size && [...a].every((value) => b.has(value));
const keyOf = (c: { col: number; row: number }) => `${c.col}:${c.row}`;
// prosty klucz do testów
describe('cellsInRect', () => {
    it('działa niezależnie od kierunku przeciągania', () => {
        const forward = cellsInRect({ col: 0, row: 0 }, { col: 1, row: 1 });
        const backward = cellsInRect({ col: 1, row: 1 }, { col: 0, row: 0 });
        expect(forward).toHaveLength(4);
        // 2 kolumny × 2 wiersze
        expect(new Set(forward.map(keyOf))).toEqual(new Set(backward.map(keyOf)));
    });
});
describe('applyRect', () => {
    it('dodaje i usuwa prostokąt, nie zmieniając oryginału', () => {
        const start = new Set(['0:0']);
        const added = applyRect(start, keyOf, { col: 0, row: 0 }, { col: 0, row: 2 }, 'add');
        expect(added).toEqual(new Set(['0:0', '0:1', '0:2']));
        const removed = applyRect(added, keyOf, { col: 0, row: 1 }, { col: 0, row: 2 }, 'remove');
        expect(removed).toEqual(new Set(['0:0']));
        expect(start).toEqual(new Set(['0:0']));
        // oryginał nietknięty (niemutowalność)
    });
});
it('moveCell zatrzymuje się na krawędzi', () => {
    expect(moveCell({ col: 0, row: 0 }, 'ArrowLeft', 3, 3)).toEqual({ col: 0, row: 0 });
    expect(moveCell({ col: 0, row: 0 }, 'a', 3, 3)).toBeNull();
});
it('setsEqual', () => {
    expect(setsEqual(new Set(['a', 'b']), new Set(['b', 'a']))).toBe(true);
    expect(setsEqual(new Set(['a']), new Set(['a', 'b']))).toBe(false);
});