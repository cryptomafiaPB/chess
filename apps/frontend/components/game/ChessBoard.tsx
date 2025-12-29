// src/components/game/ChessBoard.tsx
'use client';

import { useMemo, useState, useCallback, useRef, type ReactElement } from 'react';
import type { Board, Piece, Position } from '@/types/chess';
import { fenToBoard, indexToSquare } from '@/utils/chessHelpers';

type Props = {
  fen: string;
  canMove: boolean;
  orientation: 'white' | 'black';
  highlightedSquares?: string[];
  selectedSquare?: string;
  lastMoveSquares?: string[];
  playerColor?: 'white' | 'black';
  onMove: (from: string, to: string, promotion?: string) => void;
  onSelectSquare?: (square: string) => void;
  onSquareClick?: (square: string, piece: Piece | null) => void;
};

// Chess piece SVG components - clean and scale perfectly
const PieceSVG: React.FC<{ piece: Piece }> = ({ piece }) => {
  if (!piece) return null;

  const isWhite = piece.startsWith('w');
  const fill = isWhite ? '#fff' : '#1e293b';
  const stroke = isWhite ? '#475569' : '#0f172a';
  const type = piece[1];

  const paths: Record<string, ReactElement> = {
    'K': (
      <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.5 11.63V6M20 8h5M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
        <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" />
        <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0" />
      </g>
    ),
    'Q': (
      <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12z" />
        <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" />
        <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" />
        <circle cx="6" cy="12" r="2" /><circle cx="14" cy="9" r="2" /><circle cx="22.5" cy="8" r="2" />
        <circle cx="31" cy="9" r="2" /><circle cx="39" cy="12" r="2" />
      </g>
    ),
    'R': (
      <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" />
        <path d="M34 14l-3 3H14l-3-3" />
        <path d="M31 17v12.5H14V17" />
        <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
        <path d="M11 14h23" />
      </g>
    ),
    'B': (
      <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <g strokeLinecap="butt">
          <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z" />
          <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
          <path d="M25 8a2.5 2.5 0 11-5 0 2.5 2.5 0 115 0z" />
        </g>
        <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" strokeLinejoin="miter" />
      </g>
    ),
    'N': (
      <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
        <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" />
        <path d="M9.5 25.5a.5.5 0 11-1 0 .5.5 0 111 0z" fill={stroke} />
        <path d="M14.933 15.75a.5 1.5 30 11-.866-.5.5 1.5 30 11.866.5z" fill={stroke} />
      </g>
    ),
    'P': (
      <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
      </g>
    ),
  };

  return (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm">
      {paths[type]}
    </svg>
  );
};

export function ChessBoard({
  fen,
  canMove,
  orientation,
  highlightedSquares = [],
  selectedSquare,
  lastMoveSquares = [],
  playerColor,
  onMove,
  onSelectSquare,
  onSquareClick,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [draggingFrom, setDraggingFrom] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [draggedPiece, setDraggedPiece] = useState<Piece | null>(null);
  const [hoverSquare, setHoverSquare] = useState<string | null>(null);

  const board: Board = useMemo(() => fenToBoard(fen), [fen]);

  const displayBoard = useMemo(() => {
    if (orientation === 'black') {
      return [...board].reverse().map(row => [...row].reverse());
    }
    return board;
  }, [board, orientation]);

  const isOwnPiece = useCallback((piece: Piece | null) => {
    if (!piece || !playerColor) return false;
    const prefix = playerColor === 'white' ? 'w' : 'b';
    return piece.startsWith(prefix);
  }, [playerColor]);

  const getSquareFromPosition = useCallback((clientX: number, clientY: number): string | null => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const squareSize = rect.width / 8;

    let col = Math.floor((clientX - rect.left) / squareSize);
    let row = Math.floor((clientY - rect.top) / squareSize);

    col = Math.max(0, Math.min(7, col));
    row = Math.max(0, Math.min(7, row));

    const logicalRow = orientation === 'black' ? 7 - row : row;
    const logicalCol = orientation === 'black' ? 7 - col : col;

    return indexToSquare({ row: logicalRow, col: logicalCol });
  }, [orientation]);

  const handlePointerDown = useCallback((e: React.PointerEvent, square: string, piece: Piece | null) => {
    if (!canMove || !piece || !isOwnPiece(piece)) return;

    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setDraggingFrom(square);
    setDraggedPiece(piece);
    setDragPosition({ x: e.clientX, y: e.clientY });
    onSelectSquare?.(square);
  }, [canMove, isOwnPiece, onSelectSquare]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingFrom) return;
    setDragPosition({ x: e.clientX, y: e.clientY });
    const square = getSquareFromPosition(e.clientX, e.clientY);
    setHoverSquare(square);
  }, [draggingFrom, getSquareFromPosition]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!draggingFrom) return;

    const toSquare = getSquareFromPosition(e.clientX, e.clientY);
    if (toSquare && toSquare !== draggingFrom) {
      onMove(draggingFrom, toSquare);
    }

    setDraggingFrom(null);
    setDraggedPiece(null);
    setDragPosition(null);
    setHoverSquare(null);
  }, [draggingFrom, getSquareFromPosition, onMove]);

  const handleSquareClick = useCallback((square: string, piece: Piece | null) => {
    if (!canMove) return;

    if (selectedSquare && selectedSquare !== square) {
      if (highlightedSquares.includes(square)) {
        onMove(selectedSquare, square);
      } else if (piece && isOwnPiece(piece)) {
        onSelectSquare?.(square);
      } else {
        onSquareClick?.(square, piece);
      }
    } else if (piece && isOwnPiece(piece)) {
      onSelectSquare?.(square);
    } else {
      onSquareClick?.(square, piece);
    }
  }, [canMove, selectedSquare, highlightedSquares, isOwnPiece, onMove, onSelectSquare, onSquareClick]);

  const files = orientation === 'white'
    ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

  const ranks = orientation === 'white'
    ? ['8', '7', '6', '5', '4', '3', '2', '1']
    : ['1', '2', '3', '4', '5', '6', '7', '8'];

  return (
    <div className="relative w-full h-full select-none">
      <div
        ref={boardRef}
        className="relative w-full h-full rounded-md overflow-hidden shadow-xl ring-1 ring-black/10"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {displayBoard.map((rowArr, visualRow) =>
            rowArr.map((piece, visualCol) => {
              const logicalRow = orientation === 'black' ? 7 - visualRow : visualRow;
              const logicalCol = orientation === 'black' ? 7 - visualCol : visualCol;
              const square = indexToSquare({ row: logicalRow, col: logicalCol });
              const isLight = (visualRow + visualCol) % 2 === 0;
              const isSelected = selectedSquare === square;
              const isLastMove = lastMoveSquares.includes(square);
              const isHint = highlightedSquares.includes(square);
              const isDragOrigin = draggingFrom === square;
              const isHovered = hoverSquare === square && draggingFrom && isHint;

              return (
                <div
                  key={square}
                  className={`
                                        relative flex items-center justify-center
                                        ${isLight ? 'bg-[#ecd9b9]' : 'bg-[#ae8a68]'}
                                        ${isHovered ? 'ring-2 ring-inset ring-sky-400/80' : ''}
                                    `}
                  onPointerDown={(e) => handlePointerDown(e, square, piece)}
                  onClick={() => !draggingFrom && handleSquareClick(square, piece)}
                >
                  {isLastMove && (
                    <div className="absolute inset-0 bg-yellow-400/50 pointer-events-none" />
                  )}

                  {isSelected && !isDragOrigin && (
                    <div className="absolute inset-0 bg-emerald-500/40 pointer-events-none" />
                  )}

                  {isHint && !piece && (
                    <div className="absolute w-[28%] h-[28%] rounded-full bg-black/20 pointer-events-none" />
                  )}

                  {isHint && piece && !isDragOrigin && (
                    <div className="absolute inset-[6%] rounded-full ring-[4px] ring-inset ring-black/20 pointer-events-none" />
                  )}

                  {visualRow === 7 && (
                    <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold pointer-events-none ${isLight ? 'text-[#ae8a68]' : 'text-[#ecd9b9]'}`}>
                      {files[visualCol]}
                    </span>
                  )}

                  {visualCol === 0 && (
                    <span className={`absolute top-0.5 left-1 text-[10px] font-bold pointer-events-none ${isLight ? 'text-[#ae8a68]' : 'text-[#ecd9b9]'}`}>
                      {ranks[visualRow]}
                    </span>
                  )}

                  {piece && !isDragOrigin && (
                    <div className={`w-[80%] h-[80%] ${canMove && isOwnPiece(piece) ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                      <PieceSVG piece={piece} />
                    </div>
                  )}

                  {isDragOrigin && draggedPiece && (
                    <div className="w-[80%] h-[80%] opacity-40">
                      <PieceSVG piece={draggedPiece} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {draggingFrom && draggedPiece && dragPosition && boardRef.current && (
        <div
          className="fixed pointer-events-none z-50 drop-shadow-lg"
          style={{
            left: dragPosition.x,
            top: dragPosition.y,
            transform: 'translate(-50%, -50%)',
            width: boardRef.current.getBoundingClientRect().width / 8 * 1.15,
            height: boardRef.current.getBoundingClientRect().height / 8 * 1.15,
          }}
        >
          <PieceSVG piece={draggedPiece} />
        </div>
      )}
    </div>
  );
}
