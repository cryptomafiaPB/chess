"use client";
import { useRouter } from "next/navigation";

export default function Landing() {
  const router = useRouter();

  const gameTypes = [
    { id: "classic", label: "Classic (Unlimited Time)", href: "/game/classic" },
    { id: "timed", label: "Timed (10 min)", href: "/game/timed" }
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-16">
        <h1 className="text-6xl font-bold bg-linear-to-r from-white to-slate-200 bg-clip-text text-transparent mb-6">
          Chess Arena
        </h1>
        <p className="text-xl text-slate-400 max-w-md mx-auto">
          Challenge yourself with different game modes
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-2xl w-full">
        {gameTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => router.push(type.href)}
            className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-3xl mb-4">♟️</div>
            <h2 className="text-2xl font-bold text-white mb-2">{type.label}</h2>
            <p className="text-slate-400 text-sm">Start new game</p>
            <div className="absolute inset-0 bg-lienar-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        ))}
      </div>
    </div>
  );
}
