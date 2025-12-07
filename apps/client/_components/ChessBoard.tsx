// components/ChessBoard.tsx
"use client";
import React, { useEffect } from "react";
import { Board, Position } from "@/types/chess";
import { SquareBox } from "./SquareBox";
import { getSquareColor } from "@/utils/chessHelpers";
import getSocket from "@/utils/socket";
import { Socket } from "socket.io-client";

interface ChessBoardProps {
    board: Board;
    orientation?: 'white' | 'black';
    draggingFrom: Position | null;
    onDropPiece: (from: Position, to: Position) => void;
    onDragStartSquare: (from: Position) => void;
    onDragEndSquare: () => void;
    result?: string;
    gameOver?: boolean;
}

export default function ChessBoard({
    board,
    orientation,
    draggingFrom,
    onDropPiece,
    onDragStartSquare,
    onDragEndSquare,
    result,
    gameOver,
}: ChessBoardProps) {

    const displayBoard = orientation === "black"
        ? [...board].reverse().map(row => [...row].reverse())
        : board;
    return (
        // <div className="relative 
        //     w-full h-full 
        //     bg-neutral-800 rounded-lg border-4 border-neutral-700 shadow-2xl
        //     grid grid-cols-8 grid-rows-8 overflow-hidden">
        //     {board.map((rowArr, row) =>
        //         rowArr.map((piece, col) => {
        //             const pos = { row, col };
        //             const isDraggingFrom =
        //                 draggingFrom?.row === row && draggingFrom?.col === col;

        //             return (
        //                 <SquareBox
        //                     key={`${row}-${col}`}
        //                     piece={piece}
        //                     bgColor={getSquareColor(row, col)}
        //                     position={pos}
        //                     onDropPiece={onDropPiece}
        //                     onDragStartSquare={onDragStartSquare}
        //                     onDragEndSquare={onDragEndSquare}
        //                     isDraggingFrom={!!isDraggingFrom}
        //                 />
        //             );
        //         })
        //     )}
        //     {gameOver && result && (
        //         <div className="absolute inset-0 bg-opacity-100 backdrop-blur-[0.8px] flex items-center justify-center">
        //             <div className="bg-white text-black p-4 rounded shadow-lg text-center">
        //                 <h2 className="text-2xl font-bold mb-2">Game Over</h2>
        //                 <p className="text-lg">{result}</p>
        //             </div>
        //         </div>
        //     )}
        // </div>


        <div className="grid grid-cols-8 grid-rows-8 ...">
            {displayBoard.map((rowArr, row) =>
                rowArr.map((piece, col) => {
                    // ⚠️ TRICKY PART: 
                    // If we reverse the board data, the 'row' index here is visual, not logical.
                    // We need to map visual (0,0) back to logical (7,7) if black.

                    const logicalRow = orientation === 'black' ? 7 - row : row;
                    const logicalCol = orientation === 'black' ? 7 - col : col;

                    const pos = { row: logicalRow, col: logicalCol };

                    return (
                        <SquareBox
                            key={`${logicalRow}-${logicalCol}`}
                            // piece={piece}
                            // Important: Pass LOGICAL position to drop handler
                            // position={pos}

                            // key={`${row}-${col}`}
                            piece={piece}
                            bgColor={getSquareColor(row, col)}
                            position={pos}
                            onDropPiece={onDropPiece}
                            onDragStartSquare={onDragStartSquare}
                            onDragEndSquare={onDragEndSquare}
                            isDraggingFrom={!!draggingFrom}
                        />
                    )
                })
            )}
        </div>
    );
}
