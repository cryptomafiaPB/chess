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

    if (g.inCheck()) {
      window.alert("check")
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
        <div className="w-full max-w-6xl flex flex-col sm:flex-row sm:items-center sm:justify-center lg:items-start lg:justify-start gap-4 p-4">
          {/* board area */}
          <section className="flex justify-center items-center w-full sm:w-auto sm:h-full shrink-0">
            {/* <div
              className="relative bg-slate-800 rounded-lg shadow-xl overflow-hidden"
              style={{ width: 560, height: 560 }}
            > */}
            <ChessBoard
              board={board}
              draggingFrom={draggingFrom}
              onDropPiece={handleDropPiece}
              onDragStartSquare={setDraggingFrom}
              onDragEndSquare={() => setDraggingFrom(null)}
              result={result}
              gameOver={gameOver}
            />
            {/* </div> */}
          </section>

          <aside className="flex-1  rounded-lg border border-neutral-700 w-full lg:max-w-[440px] max-h-full lg:w-80 flex flex-col gap-3 sm:hidden lg:flex">
            <div className="flex border-b border-neutral-700">
              <button className="flex-1 py-3 text-sm font-medium hover:bg-neutral-700 border-b-2 border-emerald-500">History</button>
              <button className="flex-1 py-3 text-sm font-medium hover:bg-neutral-700 text-neutral-400">Chat</button>
              <button className="flex-1 py-3 text-sm font-medium hover:bg-neutral-700 text-neutral-400">Analysis</button>
            </div>
            <div className="flex-1  space-y-2 mb-2 p-3">
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
            </div>

            <MoveList history={history} />
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
    <div className="flex-1 overflow-y-scroll p-4 space-y-2">
      {rows.map(row => (
        <div key={row.num} className="flex justify-between text-sm py-1 border-b border-neutral-700/50">
          <span className="text-neutral-500 w-8">{row.num}.</span>
          <span className="flex-1">{row.white?.san ?? ""}</span>
          <span className="flex-1">{row.black?.san ?? ""}</span>
        </div>
      ))}
    </div>
  );
}
