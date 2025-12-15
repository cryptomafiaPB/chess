// src/components/game/ChessBoard.tsx
'use client';

import { useMemo, useState } from 'react';
import type { Board, Position } from '@/types/chess';
import { fenToBoard, indexToSquare, getSquareColor } from '@/utils/chessHelpers';
import { SquareBox } from './SquareBox';

type Props = {
  fen: string;
  canMove: boolean;
  orientation: 'white' | 'black';
  highlightedSquares?: string[];
  onMove: (from: string, to: string, promotion?: string) => void;
  onSelectSquare?: (square: string) => void;
  result?: string;
  gameOver?: boolean;
};

export function ChessBoard({
  fen,
  canMove,
  orientation,
  highlightedSquares = [],
  onMove,
  onSelectSquare,
  result,
  gameOver,
}: Props) {
  const [draggingFrom, setDraggingFrom] = useState<Position | null>(null);

  const board: Board = useMemo(() => fenToBoard(fen), [fen]);

  // Flip board for black orientation
  const displayBoard = useMemo(() => {
    if (orientation === 'black') {
      return [...board].reverse().map(row => [...row].reverse());
    }
    return board;
  }, [board, orientation]);

  const handleDragStartSquare = (from: Position) => {
    if (!canMove) return;
    setDraggingFrom(from);
    onSelectSquare?.(indexToSquare(from));
  };

  const handleDragEndSquare = () => {
    setDraggingFrom(null);
  };

  const handleDropPiece = (from: Position, to: Position) => {
    if (!canMove) return;
    const fromSquare = indexToSquare(from);
    const toSquare = indexToSquare(to);
    onMove(fromSquare, toSquare);
    setDraggingFrom(null);
  };

  const isHighlighted = (row: number, col: number): boolean => {
    const square = indexToSquare({ row, col });
    return highlightedSquares.includes(square);
  };

  return (
    <div className="relative content w-full max-w-[400px] aspect-square">
      <div className="w-full h-full bg-neutral-800 rounded-lg border-4 border-neutral-700 shadow-2xl grid grid-cols-8 grid-rows-8 overflow-hidden">
        {displayBoard.map((rowArr, row) =>
          rowArr.map((piece, col) => {
            // Map visual position back to logical position
            const logicalRow = orientation === 'black' ? 7 - row : row;
            const logicalCol = orientation === 'black' ? 7 - col : col;

            const pos = { row: logicalRow, col: logicalCol };
            const isDraggingFromThis =
              draggingFrom?.row === logicalRow && draggingFrom?.col === logicalCol;

            return (
              <SquareBox
                key={`${logicalRow}-${logicalCol}`}
                piece={piece}
                bgColor={getSquareColor(row, col)}
                position={pos}
                onDropPiece={handleDropPiece}
                onDragStartSquare={handleDragStartSquare}
                onDragEndSquare={handleDragEndSquare}
                isDraggingFrom={isDraggingFromThis}
                isHighlighted={isHighlighted(logicalRow, logicalCol)}
              />
            );
          })
        )}
      </div>
      {gameOver && result && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
          <div className="bg-card text-card-foreground p-4 rounded shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-2">Game Over</h2>
            <p className="text-lg">{result}</p>
          </div>
        </div>
      )}
    </div>
  );
}
