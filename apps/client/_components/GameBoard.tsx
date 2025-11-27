"use client";
import { useState, useCallback } from "react";
import { Chessboard, DraggingPieceDataType, PieceDropHandlerArgs } from "react-chessboard";
import { Chess, Square } from "chess.js";

interface GameBoardProps {
    mode: string;
}

export default function GameBoard({ mode }: GameBoardProps) {
    const [game, setGame] = useState(new Chess());
    const [moveHistory, setMoveHistory] = useState<string[]>([]);
    const [rightClickedSquares, setRightClickedSquares] = useState<string[]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [result, setResult] = useState("");

    const safeGameMutate = (modify: (game: Chess) => void) => {
        setGame((g) => {
            // clone from current position so we keep methods
            const update = new Chess(g.fen());
            modify(update);
            return update;
        });
    };


    const onDrop = useCallback((sourceSquare: string, targetSquare: string): boolean => {
        console.log(`Move`, sourceSquare, targetSquare)
        if (gameOver) return false;

        // Create a local clone of the game to mutate synchronously and avoid relying on React setState timing
        const newGame = new Chess(game.fen());

        // Validate the move using the legal moves API to prevent chess.js from throwing
        const legalMoves = newGame.moves({ square: sourceSquare as Square, verbose: true });
        const isLegal = legalMoves.some((m: any) => m.to === targetSquare && (!m.promotion || m.promotion === undefined));
        if (!isLegal) {
            console.warn(`Illegal move attempted from ${sourceSquare} to ${targetSquare}`);
            return false;
        }

        let move: ReturnType<typeof newGame.move> | null = null;
        try {
            move = newGame.move({
                from: sourceSquare,
                to: targetSquare,
                // promotion: "q",
            });
        } catch (e) {
            // chess.js may throw on malformed moves — handle gracefully
            console.error("Error applying move:", e);
            return false;
        }

        if (move === null) return false;

        // Commit the new game state
        setGame(newGame);
        const history = newGame.history({ verbose: false });
        setMoveHistory(history);

        if (newGame.isGameOver()) {
            setGameOver(true);
            if (newGame.isCheckmate()) {
                setResult(newGame.turn() === "w" ? "Black Wins!" : "White Wins!");
            } else if (newGame.isDraw()) {
                setResult("Draw!");
            } else if (newGame.isStalemate()) {
                setResult("Stalemate!");
            } else if (newGame.isThreefoldRepetition()) {
                setResult("Draw by repetition!");
            } else if (newGame.isInsufficientMaterial()) {
                setResult("Draw by insufficient material!");
            } else {
                setResult("Game Over");
            }
        }

        return true;
    }, [game, gameOver]);

    const resetGame = () => {
        setGame(new Chess());
        setMoveHistory([]);
        setGameOver(false);
        setResult("");
        setRightClickedSquares([]);
    };

    const getMoveNotation = (index: number) => {
        const moveNumber = Math.floor(index / 2) + 1;
        const moveIndex = index % 2 === 0 ? moveNumber : "";
        return `${moveNumber}${moveIndex ? `... ${moveHistory[index]}` : `. ${moveHistory[index]}`}`;
    };

    const onSquareRClick = (square: any) => {
        const newSquares = rightClickedSquares.includes(square)
            ? rightClickedSquares.filter(s => s !== square)
            : [...rightClickedSquares, square];
        setRightClickedSquares(newSquares);
    }


    const chessboardOptions = {
        position: game.fen(),
        onPieceDrop: ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
            if (!targetSquare) return false;
            return onDrop(sourceSquare, targetSquare);
        },
        boardOrientation: (game.turn() === "w" ? "white" : "black") as "white" | "black",
        customSquareStyles: {
            ...rightClickedSquares.reduce((a, c) => ({ ...a, [c]: { backgroundColor: "rgba(0, 255, 0, 0.4)" } }), {}),
        },
        onSquareRightClick: onSquareRClick
    }
    return (
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start max-w-6xl mx-auto">
            {/* Game Info */}
            <div className="flex flex-col items-center lg:items-start space-y-4 w-full lg:w-96">
                <div className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
                </div>

                <div className="w-64 h-64 lg:w-96 lg:h-96">
                    <Chessboard
                        options={chessboardOptions}
                    />
                </div>

                {gameOver && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center backdrop-blur-sm">
                        <h3 className="text-2xl font-bold mb-2">{result}</h3>
                        <p className="text-slate-300 mb-4">Game Over</p>
                        <button
                            onClick={resetGame}
                            className="bg-white text-slate-900 px-6 py-2 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            {/* Move History Panel */}
            <div className="w-full lg:w-80 h-fit bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 sticky top-4 lg:self-start">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    Move History
                    <span className="text-sm bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                        {moveHistory.length} moves
                    </span>
                </h3>

                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {moveHistory.length === 0 ? (
                        <p className="text-slate-400 text-center py-8">No moves yet. Start playing!</p>
                    ) : (
                        moveHistory.map((move, index) => (
                            <div
                                key={index}
                                className="flex text-sm bg-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors cursor-pointer"
                                title={move}
                            >
                                <span className="w-12 font-mono text-slate-400 min-w-12">
                                    {getMoveNotation(index)}
                                </span>
                                <span className="font-semibold">{move}</span>
                            </div>
                        ))
                    )}
                </div>

                <button
                    onClick={resetGame}
                    className="mt-6 w-full bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    🔄 New Game
                </button>
            </div>
        </div>
    );
}
