"use client";
import React, { useState } from 'react';

type Piece = string | null; // e.g., 'wK', 'bQ', etc.
type Board = Piece[][];

// Minimal starting position for demonstration
const initialBoard: Board = [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    Array(8).fill('bP'),
    ...Array(4).fill(Array(8).fill(null)),
    Array(8).fill('wP'),
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
];

const getSquareColor = (row: number, col: number) =>
    (row + col) % 2 === 0 ? 'bg-white' : 'bg-gray-800';

export default function ChessBoard() {
    const [board, setBoard] = useState<Board>(initialBoard);

    return (
        <div className="w-full flex justify-center items-center py-8">
            <div className="grid grid-cols-8 grid-rows-8 aspect-square w-full max-w-[90vw] sm:max-w-[500px] border-4 border-gray-700 rounded-md shadow-lg">
                {board.map((rowArr, row) =>
                    rowArr.map((piece, col) => (
                        <div
                            key={`${row}-${col}`}
                            className={`w-full h-full flex items-center justify-center ${getSquareColor(row, col)}`}
                        >
                            {piece && (
                                <span className="text-lg bg-red sm:text-2xl">
                                    {piece}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
