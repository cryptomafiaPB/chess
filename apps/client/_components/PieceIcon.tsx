"use client";
import React from 'react';
import { Piece } from '../types/chess';
import { PIECE_IMAGES } from '../constants/pieces';
import Image from 'next/image';

interface PieceIconProps {
    piece: Piece;
}

export const PieceIcon: React.FC<PieceIconProps> = ({ piece }) => {
    if (!piece) return null;

    const Icon = PIECE_IMAGES[piece];
    // const isWhite = piece[0] === 'w';

    return (
        <div className="relative w-8 h-8 sm:w-10 sm:h-10 select-none">
            <Image
                src={Icon}
                alt={piece}
                fill
                sizes="(max-width: 640px) 8vw, 40px"
                className="object-contain pointer-events-none"
                priority={false}
            />
        </div>
    );
};
