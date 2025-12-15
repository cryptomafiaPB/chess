// src/features/game/utils/fen.ts
export type Piece =
    | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'
    | 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type Square = {
    file: number; // 0-7
    rank: number; // 0-7
    piece: Piece | null;
};

export type BoardMatrix = Square[][]; // [rank][file]

export function parseFenToBoard(fen: string): BoardMatrix {
    const [boardPart] = fen.split(' ');
    const ranks = boardPart.split('/');
    const board: BoardMatrix = [];

    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
        const rankStr = ranks[rankIndex];
        const row: Square[] = [];
        let file = 0;

        for (const ch of rankStr) {
            if (/[1-8]/.test(ch)) {
                const emptyCount = parseInt(ch, 10);
                for (let i = 0; i < emptyCount; i++) {
                    row.push({ file: file++, rank: 7 - rankIndex, piece: null });
                }
            } else {
                row.push({
                    file: file++,
                    rank: 7 - rankIndex,
                    piece: ch as Piece,
                });
            }
        }

        board.push(row);
    }

    return board;
}

// helpers to convert indices to algebraic ("a1" etc.)
export function indexToSquare(file: number, rank: number): string {
    const files = 'abcdefgh';
    return `${files[file]}${rank + 1}`;
}
