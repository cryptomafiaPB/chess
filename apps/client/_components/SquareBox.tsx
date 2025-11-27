// components/SquareBox.tsx
"use client";
import React, { useState, useRef } from 'react';
import { Piece, Position } from '../types/chess';
import { PieceIcon } from './PieceIcon';

interface SquareProps {
    piece: Piece;
    bgColor: string;
    position: Position;
    onDropPiece: (from: Position, to: Position) => void;
    onDragStartSquare: (from: Position) => void;
    onDragEndSquare: () => void;
    isDraggingFrom: boolean;
}

export const SquareBox: React.FC<SquareProps> = ({
    piece,
    bgColor,
    position,
    onDropPiece,
    onDragStartSquare,
    onDragEndSquare,
    isDraggingFrom,
}) => {
    const pieceRef = useRef<HTMLSpanElement | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragStart = (e: React.DragEvent<HTMLSpanElement>) => {
        e.dataTransfer.setData('application/json', JSON.stringify(position));

        // tell the browser this is a "move" operation (affects cursor)
        e.dataTransfer.effectAllowed = 'move';

        // custom drag image: only the piece element
        if (pieceRef.current) {
            const rect = pieceRef.current.getBoundingClientRect();
            e.dataTransfer.setDragImage(
                pieceRef.current,
                rect.width / 2,
                rect.height / 2
            );
        }

        onDragStartSquare(position);
    };

    const handleDragEnd = () => {
        setIsDragOver(false);
        onDragEndSquare();
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);

        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        const from: Position = JSON.parse(data);
        onDropPiece(from, position);
    };

    return (
        <div
            className={`
        w-full h-full flex items-center justify-center
        ${bgColor}
        ${isDragOver ? 'ring-1 ring-inset' : ''}
        transition-shadow
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {piece && (
                <span
                    ref={pieceRef}
                    className={`
            text-lg sm:text-2xl select-none
            cursor-grab active:cursor-grabbing
            transition-all
            ${isDraggingFrom ? 'opacity-20 blur-[1px]' : 'opacity-100'}
          `}
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <PieceIcon piece={piece} />
                </span>
            )}
        </div>
    );
};
