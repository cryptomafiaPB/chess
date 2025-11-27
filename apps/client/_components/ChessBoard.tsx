"use client";
import React, { useState } from 'react';
import { Chess, Square } from 'chess.js';
import { gameToBoard, getSquareColor, indexToSquare, safeMove } from '@/utils/chessHelpers';
import { Board, Position } from '@/types/chess';
import { SquareBox } from './SquareBox';

export default function ChessBoard() {
    // keep chess.js game instance in state
    const [game, setGame] = useState(() => new Chess());
    const [board, setBoard] = useState<Board>(() => gameToBoard(new Chess()));
    const [draggingFrom, setDraggingFrom] = useState<Position | null>(null);

    const updateGame = (updater: (g: Chess) => void) => {
        setGame(prev => {
            // work on a copy so state remains immutable-friendly
            const next = new Chess(prev.fen());
            updater(next);
            setBoard(gameToBoard(next));
            return next;
        });
    };

    const handleDropPiece = (from: Position, to: Position) => {
        const fromSq = indexToSquare(from);
        const toSq = indexToSquare(to);

        updateGame(g => {

            const legalMoves = g.moves({ square: fromSq as Square, verbose: true });
            const isLegal = legalMoves.some((m: any) => m.to === toSq && (!m.promotion || m.promotion === undefined));
            if (!isLegal) {
                console.warn(`Illegal move attempted from ${from} to ${toSq}`);
                return false;
            }

            try {
                const move = g.move({
                    from: fromSq,
                    to: toSq,
                    promotion: 'q', // simple default promotion
                });
                // Log the piece moved name
                console.log("Moved piece:", move.piece);

            } catch (error) {
                // chess.js may throw on malformed moves — handle gracefully
                console.error("Error applying move:", error);
                return false;
            }
        });
        setDraggingFrom(null);
    };

    const handleDragStartSquare = (from: Position) => {
        setDraggingFrom(from);
    };

    const handleDragEndSquare = () => {
        setDraggingFrom(null);
    };

    return (
        <div className="w-full flex justify-center items-center py-8 md:flex-row flex-col gap-8">
            <div className="grid grid-cols-8 grid-rows-8 aspect-square w-full max-w-[100vh] sm:max-w-[500px] border-4 border-gray-700 rounded-md shadow-lg relative">
                {board.map((rowArr, row) =>
                    rowArr.map((piece, col) => {
                        const pos = { row, col };
                        const isDraggingFrom =
                            draggingFrom?.row === row && draggingFrom?.col === col;

                        return (
                            <SquareBox
                                key={`${row}-${col}`}
                                piece={piece}
                                bgColor={getSquareColor(row, col)}
                                position={pos}
                                onDropPiece={handleDropPiece}
                                onDragStartSquare={handleDragStartSquare}
                                onDragEndSquare={handleDragEndSquare}
                                isDraggingFrom={!!isDraggingFrom}
                            />
                        );
                    }
                    )
                )}
            </div>
            <div className='w-full bg-amber-200 h-96'>

            </div>
        </div>
    );
}
