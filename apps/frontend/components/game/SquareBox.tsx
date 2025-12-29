// components/game/SquareBox.tsx
"use client";
import React, { useState, useRef } from 'react';
import type { Piece, Position } from '@/types/chess';
import { PieceIcon } from './PieceIcon';

interface SquareProps {
    piece: Piece;
    bgColor: string;
    position: Position;
    square: string;
    onDropPiece: (from: Position, to: Position) => void;
    onDragStartSquare: (from: Position) => void;
    onDragEndSquare: () => void;
    isDraggingFrom: boolean;
    isHighlighted?: boolean;
    isLastMove?: boolean;
    isSelected?: boolean;
    showFileLabel?: string;
    showRankLabel?: string;
    onClickSquare?: (square: string, piece: Piece) => void;
}

export const SquareBox: React.FC<SquareProps> = ({
    piece,
    bgColor,
    position,
    square,
    onDropPiece,
    onDragStartSquare,
    onDragEndSquare,
    isDraggingFrom,
    isHighlighted,
    isLastMove,
    isSelected,
    showFileLabel,
    showRankLabel,
    onClickSquare,
}) => {
    const pieceRef = useRef<HTMLSpanElement | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragStart = (e: React.DragEvent<HTMLSpanElement>) => {
        e.dataTransfer.setData('application/json', JSON.stringify(position));
        e.dataTransfer.effectAllowed = 'move';

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

    const handleClick = () => {
        onClickSquare?.(square, piece);
    };

    return (
        <div
            className={`
                relative w-full h-full flex items-center justify-center
                ${bgColor}
                ${isDragOver ? 'ring-2 ring-inset ring-amber-400/80' : ''}
                ${isSelected ? 'ring-2 ring-emerald-400/80 shadow-inner' : ''}
                overflow-hidden
                transition-shadow
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            {isLastMove && (
                <div className="pointer-events-none absolute inset-0 bg-amber-300/25" />
            )}
            {isHighlighted && (
                <div className={`
                    ${piece ? 'w-3 h-3 opacity-60 bg-sky-500 z-10 absolute rounded-full' : 'absolute w-4 h-4 bg-sky-500/60 rounded-full'}
                    `} />
            )}
            {showFileLabel && (
                <span className="pointer-events-none absolute bottom-1 right-1 text-[10px] font-semibold text-slate-900/70 drop-shadow">
                    {showFileLabel}
                </span>
            )}
            {showRankLabel && (
                <span className="pointer-events-none absolute top-1 left-1 text-[10px] font-semibold text-slate-900/70 drop-shadow">
                    {showRankLabel}
                </span>
            )}
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
