// components/GameLayout.tsx
"use client";

import React, { useRef, useState } from "react";
import { Chess, Square } from "chess.js";
import { gameToBoard, indexToSquare } from "@/utils/chessHelpers";
import { Board, Position, UiMove } from "@/types/chess";

import { getSquareColor } from "@/utils/chessHelpers";
import ChessBoard from "@/_components/ChessBoard";

export default function GameLayout() {
  const gameRef = useRef(new Chess());
  const [board, setBoard] = useState<Board>(() => gameToBoard(new Chess()));
  const [draggingFrom, setDraggingFrom] = useState<Position | null>(null);
  const [history, setHistory] = useState<UiMove[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState("");

  const refreshBoard = () => {
    setBoard(gameToBoard(gameRef.current));
  };

  const handleDropPiece = (from: Position, to: Position) => {
    const g = gameRef.current;
    const fromSq = indexToSquare(from);
    const toSq = indexToSquare(to);

    // updateGame(g => {
    const legalMoves = g.moves({ square: fromSq as Square, verbose: true });
    const move = legalMoves.find((m: any) => m.to === toSq);
    if (!move) return;

    const played = g.move({
      from: fromSq,
      to: toSq,
      promotion: "q",
    });

    if (played) {
      setHistory(prev => {
        const moveNumber = Math.floor(prev.length / 2) + 1;
        const uiMove: UiMove = {
          san: played.san,
          from: played.from,
          to: played.to,
          moveNumber,
          color: played.color,
        };
        return [...prev, uiMove];
      });
    }

    if (g.isGameOver()) {
      setGameOver(true);
      if (g.isCheckmate()) {
        setResult(g.turn() === "w" ? "Black Wins!" : "White Wins!");
      } else if (g.isDraw()) {
        setResult("Draw!");
      } else if (g.isStalemate()) {
        setResult("Stalemate!");
      } else if (g.isThreefoldRepetition()) {
        setResult("Draw by repetition!");
      } else if (g.isInsufficientMaterial()) {
        setResult("Draw by insufficient material!");
      } else {
        setResult("Game Over");
      }
    }

    // });
    refreshBoard()
    setDraggingFrom(null);
  };

  const handleUndo = () => {

    try {
      console.log("Undoing move");
      const g = gameRef.current;
      const undone = g.undo();
      if (!undone) return;

      setHistory(prev => prev.slice(0, -1));
      refreshBoard();

    }
    catch (error) { console.error("Failed to undo move:", error); }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <div className="font-semibold">My Chess App</div>
      </header>

      <main className="flex-1 flex justify-center">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 p-4">
          {/* board area */}
          <section className="flex-1 flex justify-center items-center">
            <div
              className="relative bg-slate-800 rounded-lg shadow-xl overflow-hidden"
              style={{ width: 560, height: 560 }}
            >
              <ChessBoard
                board={board}
                draggingFrom={draggingFrom}
                onDropPiece={handleDropPiece}
                onDragStartSquare={setDraggingFrom}
                onDragEndSquare={() => setDraggingFrom(null)}
                result={result}
                gameOver={gameOver}
              />
            </div>
          </section>

          <aside className="w-full lg:w-80 flex flex-col gap-3">
            <div className="bg-slate-800 rounded-lg p-3 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">Moves</h2>
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0 || gameOver}
                  className="px-2 py-1 rounded bg-slate-700 disabled:opacity-40 hover:bg-slate-600 text-xs"
                >
                  Undo
                </button>
              </div>

              <MoveList history={history} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MoveList({ history }: { history: UiMove[] }) {
  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    const white = history[i];
    const black = history[i + 1];
    rows.push({ num: white?.moveNumber ?? (i / 2 + 1), white, black });
  }

  return (
    <div className="space-y-1 text-xs">
      {rows.map(row => (
        <div key={row.num} className="flex gap-2">
          <span className="w-6 text-slate-400">{row.num}.</span>
          <span className="flex-1">{row.white?.san ?? ""}</span>
          <span className="flex-1">{row.black?.san ?? ""}</span>
        </div>
      ))}
    </div>
  );
}
