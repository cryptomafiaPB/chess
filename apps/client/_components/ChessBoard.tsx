// components/ChessBoard.tsx
"use client";
import React from "react";
import { Board, Position } from "@/types/chess";
import { SquareBox } from "./SquareBox";
import { getSquareColor } from "@/utils/chessHelpers";

interface ChessBoardProps {
    board: Board;
    draggingFrom: Position | null;
    onDropPiece: (from: Position, to: Position) => void;
    onDragStartSquare: (from: Position) => void;
    onDragEndSquare: () => void;
    result?: string;
    gameOver?: boolean;
}

export default function ChessBoard({
    board,
    draggingFrom,
    onDropPiece,
    onDragStartSquare,
    onDragEndSquare,
    result,
    gameOver,
}: ChessBoardProps) {
    return (
        <div className="w-full h-full grid grid-cols-8 grid-rows-8">
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
                            onDropPiece={onDropPiece}
                            onDragStartSquare={onDragStartSquare}
                            onDragEndSquare={onDragEndSquare}
                            isDraggingFrom={!!isDraggingFrom}
                        />
                    );
                })
            )}
            {gameOver && result && (
                <div className="absolute inset-0 bg-opacity-100 backdrop-blur-[0.8px] flex items-center justify-center">
                    <div className="bg-white text-black p-4 rounded shadow-lg text-center">
                        <h2 className="text-2xl font-bold mb-2">Game Over</h2>
                        <p className="text-lg">{result}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
