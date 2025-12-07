// components/GameLayout.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Chess, Square } from "chess.js";
import { gameToBoard, getSquareColorWithSan, indexToSquare } from "@/utils/chessHelpers";
import { Board, Position, UiMove } from "@/types/chess";

import { getSquareColor } from "@/utils/chessHelpers";
import ChessBoard from "@/_components/ChessBoard";
import { Socket } from "socket.io-client";
import getSocket from "@/utils/socket";
import { useParams } from "next/navigation";
import { useChessGame } from "@/hooks/useChessGame";

export default function GameLayout() {
  // const gameRef = useRef(new Chess());
  // const [board, setBoard] = useState<Board>(() => gameToBoard(new Chess()));
  // const [draggingFrom, setDraggingFrom] = useState<Position | null>(null);
  // const [history, setHistory] = useState<UiMove[]>([]);
  // const [gameOver, setGameOver] = useState(false);
  // const [result, setResult] = useState("");
  // const [socket, setSocket] = React.useState<Socket | null>(null);
  // const [isConnected, setIsConnected] = React.useState(false);

  // const { mode, gameId } = useParams<{ mode: 'classic' | 'timed'; gameId: string }>()

  // const refreshBoard = () => {
  //   setBoard(gameToBoard(gameRef.current));
  // };

  // const handleDropPiece = (from: Position, to: Position) => {
  //   const g = gameRef.current;
  //   const fromSq = indexToSquare(from);
  //   const toSq = indexToSquare(to);

  //   // updateGame(g => {
  //   const legalMoves = g.moves({ square: fromSq as Square, verbose: true });
  //   const move = legalMoves.find((m: any) => m.to === toSq);
  //   if (!move) return;

  //   const played = g.move({
  //     from: fromSq,
  //     to: toSq,
  //     promotion: "q",
  //   });

  //   // emit move to server
  //   socket?.emit("move", {
  //     from: played?.from,
  //     to: played?.to,
  //     promotion: played?.promotion,
  //   });

  //   if (played) {
  //     setHistory(prev => {
  //       const moveNumber = Math.floor(prev.length / 2) + 1;
  //       const uiMove: UiMove = {
  //         san: played.san,
  //         from: played.from,
  //         to: played.to,
  //         moveNumber,
  //         color: played.color,
  //       };
  //       return [...prev, uiMove];
  //     });
  //   }

  //   if (g.inCheck()) {

  //   }

  //   if (g.isGameOver()) {
  //     setGameOver(true);
  //     if (g.isCheckmate()) {
  //       setResult(g.turn() === "w" ? "Black Wins!" : "White Wins!");
  //     } else if (g.isDraw()) {
  //       setResult("Draw!");
  //     } else if (g.isStalemate()) {
  //       setResult("Stalemate!");
  //     } else if (g.isThreefoldRepetition()) {
  //       setResult("Draw by repetition!");
  //     } else if (g.isInsufficientMaterial()) {
  //       setResult("Draw by insufficient material!");
  //     } else {
  //       setResult("Game Over");
  //     }
  //   }

  //   // });
  //   // refreshBoard()
  //   setDraggingFrom(null);
  // };

  // const handleUndo = () => {

  //   try {
  //     console.log("Undoing move");
  //     const g = gameRef.current;
  //     const undone = g.undo();
  //     if (!undone) return;

  //     setHistory(prev => prev.slice(0, -1));
  //     refreshBoard();

  //   }
  //   catch (error) { console.error("Failed to undo move:", error); }
  // };



  // useEffect(() => {
  //   const socket = getSocket();
  //   setSocket(socket);

  //   socket?.on("connect", () => {
  //     setIsConnected(true);
  //   });

  //   socket?.on("disconnect", () => {
  //     setIsConnected(false);
  //   });


  //   socket?.emit("join_game", { gameId: gameId, playerName: "Guest" });

  //   socket?.on("move_made", (data) => {
  //     console.log("Move made data received:", data);
  //     const g = gameRef.current;
  //     g.load(data.fen);
  //     setHistory(data.moves.map((m: any, index: number) => ({
  //       san: m.san,
  //       from: m.from,
  //       to: m.to,
  //       moveNumber: Math.floor(index / 2) + 1,
  //       color: m.color,
  //     })));
  //     refreshBoard();
  //   });
  // }, []);

  // return (
  //   <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
  //     <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
  //       <div className="font-semibold">My Chess App</div>
  //     </header>

  //     <main className="flex-1 flex justify-center">
  //       <div className="w-full max-w-6xl flex flex-col sm:flex-row sm:items-center sm:justify-center lg:items-start lg:justify-start gap-4 p-4">
  //         {/* board area */}
  //         <section className="flex justify-center items-center w-full sm:w-auto sm:h-full shrink-0">
  //           {/* <div
  //             className="relative bg-slate-800 rounded-lg shadow-xl overflow-hidden"
  //             style={{ width: 560, height: 560 }}
  //           > */}
  //           <ChessBoard
  //             board={board}
  //             draggingFrom={draggingFrom}
  //             onDropPiece={handleDropPiece}
  //             onDragStartSquare={setDraggingFrom}
  //             onDragEndSquare={() => setDraggingFrom(null)}
  //             result={result}
  //             gameOver={gameOver}
  //           />
  //           {/* </div> */}
  //         </section>

  //         <aside className="flex-1  rounded-lg border border-neutral-700 w-full lg:max-w-[440px] max-h-full lg:w-80 flex flex-col gap-3 sm:hidden lg:flex">
  //           <div className="flex border-b border-neutral-700">
  //             <button className="flex-1 py-3 text-sm font-medium hover:bg-neutral-700 border-b-2 border-emerald-500">History</button>
  //             <button className="flex-1 py-3 text-sm font-medium hover:bg-neutral-700 text-neutral-400">Chat</button>
  //             <button className="flex-1 py-3 text-sm font-medium hover:bg-neutral-700 text-neutral-400">Analysis</button>
  //           </div>
  //           <div className="flex-1  space-y-2 mb-2 p-3">
  //             <div className="flex items-center justify-between mb-2">
  //               <h2 className="text-sm font-semibold">Moves</h2>
  //               <button
  //                 onClick={handleUndo}
  //                 disabled={history.length === 0 || gameOver}
  //                 className="px-2 py-1 rounded bg-slate-700 disabled:opacity-40 hover:bg-slate-600 text-xs"
  //               >
  //                 Undo
  //               </button>
  //             </div>
  //           </div>

  //           <MoveList history={history} />
  //         </aside>
  //       </div>
  //     </main>
  //   </div>
  // );



  const { gameId } = useParams<{ gameId: string }>();
  const [socket, setSocket] = useState<any>(null);

  // Initialize Socket once
  useEffect(() => {
    const s = getSocket();
    setSocket(s);
    return () => { s?.disconnect(); }
  }, []);

  // ✨ The Magic Hook
  const {
    board,
    orientation,
    makeMove,
    history,
    status
  } = useChessGame(socket, gameId);

  // Handlers for the ChessBoard
  // We need to convert row/col indices to "e4" style strings
  const onDropPiece = (from: Position, to: Position) => {
    // You already have indexToSquare in your helpers
    const fromSquare = indexToSquare(from);
    const toSquare = indexToSquare(to);
    makeMove(fromSquare, toSquare);
  };

  const setDraggingFrom = (from: Position) => {
    // Optional: You can implement visual effects when dragging starts
  }


  return (
    // CHANGE 1: Use h-dvh (dynamic viewport height) and overflow-hidden
    // This locks the app to the screen size (no window scrollbar)
    // <div className="min-h-screen lg:h-dvh bg-slate-900 text-slate-100 flex flex-col lg:overflow-hidden">

    //   {/* Optional: Add this style tag for the custom scrollbar */}
    //   <style jsx global>{`
    //   ::-webkit-scrollbar { width: 6px; }
    //   ::-webkit-scrollbar-track { background: #1e293b; }
    //   ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
    //   ::-webkit-scrollbar-thumb:hover { background: #64748b; }
    // `}</style>

    //   <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 shrink-0">
    //     <div className="font-semibold">My Chess App</div>
    //   </header>

    //   {/* CHANGE 2: Main container fills remaining height, no scroll allowed here */}
    //   <main className="flex-1 flex justify-center p-2 sm:p-4 lg:overflow-hidden">

    //     {/* Container for Board + Sidebar */}
    //     <div className=" max-w-6xl flex flex-col lg:flex-row gap-4 h-auto lg:h-full">

    //       {/* BOARD SECTION: 
    //        - 'shrink-0' ensures the board doesn't get squished 
    //        - 'h-full' makes it fill vertical space on desktop
    //     */}
    //       <section className="flex flex-col justify-center items-center max-w-md mx-auto w-full mr-40 lg:mr-4 lg:max-w-none lg:w-auto lg:h-full shrink-0">
    //         {/* Wrapper to enforce aspect ratio */}
    //         <div className="relative w-full mb-1 flex items-center min-h-8 lg:min-h-10 px-2 lg:px-6">
    //           {gameRef.current.inCheck() && (
    //             <div className="z-10 p-1 animate-pulse bg-red-600 text-white text-sm font-bold rounded shadow-lg">
    //               Check!
    //             </div>
    //           )}
    //           {
    //             gameRef.current.turn() === 'w' ? (<>
    //               <span className="text-sm text-neutral-400 mr-auto">White to move</span>
    //               <div className={`w-4 h-4 animate-pulse rounded-full bg-white border-2 border-black ml-auto ${getSquareColorWithSan('e1') === 'light' ? 'shadow-light' : 'shadow-dark'}`}></div>
    //             </>
    //             ) : (<>
    //               <span className="text-sm text-neutral-400 mr-auto">Black to move</span>
    //               <div className={`w-4 h-4 animate-pulse rounded-full bg-neutral-600 border-2 border-black  ml-auto ${getSquareColorWithSan('e8') === 'light' ? 'shadow-light' : 'shadow-dark'}`}></div>
    //             </>
    //             )
    //           }

    //         </div>
    //         <div className="w-full aspect-square lg:w-auto lg:h-full lg:max-h-full">
    //           <ChessBoard
    //             board={board}
    //             draggingFrom={draggingFrom}
    //             onDropPiece={handleDropPiece}
    //             onDragStartSquare={setDraggingFrom}
    //             onDragEndSquare={() => setDraggingFrom(null)}
    //             result={result}
    //             gameOver={gameOver}
    //           />
    //         </div>
    //       </section>

    //       {/* SIDEBAR SECTION:
    //        - 'min-h-0' is the Magic Fix. It allows the flex item to be smaller 
    //          than its content, which forces the inner scrollbar to activate.
    //        - 'h-full' matches the board height on desktop.
    //     */}
    //       <aside className="flex flex-col gap-3 rounded-lg border border-neutral-700 w-full h-96 lg:h-full lg:w-80 lg:min-h-0 bg-slate-800/50">

    //         {/* Header/Tabs (Fixed) */}
    //         <div className="flex border-b border-neutral-700 shrink-0">
    //           <button className="flex-1 py-3 text-sm font-medium hover:bg-neutral-700 border-b-2 border-emerald-500">History</button>
    //           <button className="flex-1 py-3 text-sm font-medium hover:bg-neutral-700 text-neutral-400">Chat</button>
    //           <button className="flex-1 py-3 text-sm font-medium hover:bg-neutral-700 text-neutral-400">Analysis</button>
    //         </div>

    //         {/* Controls (Fixed) */}
    //         <div className="flex items-center justify-between px-3 shrink-0">
    //           <h2 className="text-sm font-semibold">Moves</h2>
    //           <button
    //             onClick={handleUndo}
    //             disabled={history.length === 0 || gameOver}
    //             className="px-2 py-1 rounded bg-slate-700 disabled:opacity-40 hover:bg-slate-600 text-xs"
    //           >
    //             Undo
    //           </button>
    //         </div>

    //         {/* Move List (Scrolls) */}
    //         <MoveList history={history} />
    //       </aside>
    //     </div>
    //   </main>
    // </div>

    <div className="min-h-screen lg:h-dvh bg-slate-900 text-slate-100 flex flex-col lg:overflow-hidden">
      {/* Header */}
      <header className="px-4 py-2 border-b border-slate-800">
        <div className="font-semibold flex gap-4">
          <span>Chess Arena</span>
          <span className="text-xs bg-slate-700 px-2 py-1 rounded">
            Playing as: {status.myColor === 'w' ? 'White' : status.myColor === 'b' ? 'Black' : 'Spectator'}
          </span>
        </div>
      </header>

      <main className="flex-1 flex justify-center p-2 lg:overflow-hidden">
        <div className="max-w-6xl flex flex-col lg:flex-row gap-4 h-full">

          {/* Board Section */}
          <section className="flex flex-col items-center justify-center shrink-0 h-full">
            <div className="aspect-square h-full max-h-[80vh]">
              {/* //<ChessBoard
                // board={board}
                // orientation={orientation} // Pass this down!
                // onDropPiece={onDropPiece}


                // board={board}
                // draggingFrom={draggingFrom}
                // // onDropPiece={handleDropPiece}
                // onDragStartSquare={setDraggingFrom}
                // onDragEndSquare={() => setDraggingFrom(null)}
                // result={result}
                // gameOver={gameOver}
              // ... other props
              // /> */}
            </div>
          </section>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 bg-slate-800/50 rounded-lg border border-slate-700 flex flex-col">
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
