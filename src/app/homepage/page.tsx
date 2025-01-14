"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session } = useSession();
  const { currentPlayer, loading, refreshPlayers } = usePlayer();

  const isAtPeak = currentPlayer && currentPlayer.eloScore >= currentPlayer.highestElo;

  useEffect(() => {
    refreshPlayers();
  }, [refreshPlayers]);

  return (
    <>
      <div className="pb-20 flex flex-col items-center justify-center h-screen">
        <h1 className="text-8xl font-bold pb-4">Rankly</h1>
        
        {currentPlayer && (
          <div className={`text-4xl font-semibold mb-7 ${isAtPeak ? 'text-yellow-400' : 'opacity-90'}`}>
            {currentPlayer.eloScore} SR
          </div>
        )}
        {loading && (
          <div className="text-2xl font-semibold mb-8 opacity-50">
            Loading...
          </div>
        )}

        <nav>
          <div className="grid-cols-2 grid gap-4">
            <Link className="btn btn-accent btn-lg col-span-2" href="/newmatch">
              New Match
            </Link>
            <Link className="btn btn-secondary btn-lg" href="/rankings">
              Rankings
            </Link>
            <Link className="btn btn-primary btn-lg" href="/statistics">
              Statistics
            </Link>
            <Link className="btn btn-default btn-lg" href="/history">
              History
            </Link>
            <Link className="btn btn-neutral btn-lg" href="/settings">
              Settings
            </Link>
            {session?.user?.isAdmin && (
              <Link className="btn btn-warning btn-lg col-span-2" href="/admin">
                Admin Settings
              </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
