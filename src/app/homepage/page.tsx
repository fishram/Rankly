"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useEffect } from "react";
import { useSeason } from "@/contexts/SeasonContext";

export default function HomePage() {
  const { data: session } = useSession();
  const { currentPlayer, loading: playerLoading, refreshPlayers } = usePlayer();
  const { currentSeason, loading: seasonLoading } = useSeason();

  const isAtPeak =
    currentPlayer && currentPlayer.eloScore >= currentPlayer.highestElo;

  useEffect(() => {
    refreshPlayers();
  }, [refreshPlayers]);

  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen pb-4">
        <h1 className="text-8xl font-bold">Rankly</h1>
        {playerLoading || seasonLoading ? (
          <>
            {/* Season skeleton */}
            <div className="text-2xl font-semibold text-secondary animate-pulse min-w-36 h-8  mb-2 border border-secondary/30 rounded-lg px-8 bg-info/10"></div>

            <div className="flex flex-row items-center justify-center gap-4 mt-2 mb-4">
              {/* SR skeleton */}
              <div className="text-5xl font-semibold animate-pulse min-w-48 h-12 text-primary border border-primary/30 rounded-lg  bg-accent/10"></div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-secondary">
              {currentSeason?.name}
            </h2>

            <div className="flex flex-row items-center justify-center gap-4 mt-1 mb-4">
              {currentPlayer && (
                <div
                  className={`text-5xl font-semibold py-1 min-w-32 text-center ${
                    isAtPeak
                      ? "text-yellow-400 border-yellow-400"
                      : "text-primary border-secondary"
                  }`}
                >
                  {currentPlayer.eloScore} SR
                </div>
              )}
            </div>
          </>
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
