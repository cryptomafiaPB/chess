// components/game/PieceIcon.tsx
"use client";
import React from 'react';
import type { Piece } from '@/types/chess';
import { PIECE_IMAGES } from '@/constants/pieces';
import Image from 'next/image';

interface PieceIconProps {
    piece: Piece;
}

export const PieceIcon: React.FC<PieceIconProps> = ({ piece }) => {
    if (!piece) return null;

    const src = PIECE_IMAGES[piece];

    return (
        <div className="relative w-8 h-8 sm:w-10 sm:h-10 select-none">
            <Image
                src={src}
                alt={piece}
                fill
                sizes="(max-width: 640px) 8vw, 40px"
                className="object-contain pointer-events-none"
                priority={false}
                unoptimized
            />
        </div>
    );
};
