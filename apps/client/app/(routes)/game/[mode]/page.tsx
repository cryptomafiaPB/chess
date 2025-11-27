"use client";

import ChessBoard from "@/_components/ChessBoard";
import GameBoard from "@/_components/GameBoard";
import { useParams } from "next/navigation";

export default function GamePage() {
  const params = useParams<{ mode: string }>()
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        <ChessBoard />
        {/* <GameBoard mode={params.mode} /> */}
      </div>
    </div>
  );
}
