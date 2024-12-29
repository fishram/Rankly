"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useFetchPlayers, useFetchAllPlayers } from "../hooks/useFetchPlayers";
import { useFetchMatches } from "../hooks/useFetchMatches";
import ErrorDisplay from "../components/ErrorDisplay";
import PageHeading from "../components/page_heading";

export default function Page() {
  const { data: session, status } = useSession({ required: true });
  const { players, loading: playersLoading, error } = useFetchPlayers();
  const { players: allPlayers, loading: allPlayersLoading } =
    useFetchAllPlayers();
  const { matches, loading: matchesLoading } = useFetchMatches();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  useEffect(() => {
    if (players && session?.user?.username) {
      const currentPlayer = players.find(
        (p) => p.name === session.user.username
      );
      if (currentPlayer) {
        setSelectedPlayer(currentPlayer.id);
      }
    }
  }, [players, session]);

  if (
    status === "loading" ||
    playersLoading ||
    matchesLoading ||
    allPlayersLoading
  ) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-4 px-4 mt-10">
        <ErrorDisplay error={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // Calculate head-to-head records
  const getHeadToHeadStats = (playerId: string) => {
    const stats = new Map<
      string,
      { wins: number; losses: number; eloChange: number }
    >();

    matches.forEach((match) => {
      let opponent: string;
      let isWin: boolean;
      const eloChange: number = 0;

      if (match.player1.id === playerId) {
        opponent = match.player2.id;
        isWin = match.winner.id === playerId;
      } else if (match.player2.id === playerId) {
        opponent = match.player1.id;
        isWin = match.winner.id === playerId;
      } else {
        return;
      }

      const current = stats.get(opponent) || {
        wins: 0,
        losses: 0,
        eloChange: 0,
      };
      stats.set(opponent, {
        wins: current.wins + (isWin ? 1 : 0),
        losses: current.losses + (isWin ? 0 : 1),
        eloChange: current.eloChange + eloChange,
      });
    });

    return stats;
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 mt-10 flex flex-col space-y-8">
      {/* Heading and Back Link */}
      <PageHeading pageTitle="Statistics"></PageHeading>

      {/* Player Selection Dropdown */}
      <div className="w-full flex">
        <div className="dropdown dropdown-hover w-full sm:w-1/3 btn-primary">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-lg w-full text-xl text-black flex justify-center items-center"
          >
            <span>
              {selectedPlayer
                ? players.find((p) => p.id === selectedPlayer)?.name
                : "Select a Player"}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-full text-white"
          >
            {players.map((player) => (
              <li key={player.id}>
                <a onClick={() => setSelectedPlayer(player.id)}>
                  {player.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {selectedPlayer && (
        <>
          {/* SR Display */}
          <div className="flex flex-col items-center space-y-2 py-4">
            <div className="text-4xl font-bold">
              {players.find((p) => p.id === selectedPlayer)?.eloScore} SR
            </div>
            <div className="text-xl text-gray-400">
              Peak: {players.find((p) => p.id === selectedPlayer)?.highestElo}{" "}
              SR
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Opponent</th>
                  <th>Record</th>
                  <th className="whitespace-nowrap">Win Rate</th>
                  <th className="text-right">Games</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(getHeadToHeadStats(selectedPlayer))
                  .filter(([, stats]) => stats.wins + stats.losses > 0)
                  .sort((a, b) => {
                    const totalGamesA = a[1].wins + a[1].losses;
                    const totalGamesB = b[1].wins + b[1].losses;
                    return totalGamesB - totalGamesA;
                  })
                  .map(([opponentId, stats]) => {
                    const opponent = allPlayers.find(
                      (p) => p.id === opponentId
                    );
                    const totalGames = stats.wins + stats.losses;
                    const winRate = ((stats.wins / totalGames) * 100).toFixed(
                      1
                    );

                    return (
                      <tr key={opponentId}>
                        <td className="font-medium">{opponent?.name}</td>
                        <td className="whitespace-nowrap">
                          <span className="text-success">{stats.wins}</span>
                          {" - "}
                          <span className="text-error">{stats.losses}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="hidden sm:flex w-full max-w-24 h-2 bg-base-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  Number(winRate) >= 50
                                    ? "bg-success"
                                    : "bg-error"
                                }`}
                                style={{ width: `${winRate}%` }}
                              />
                            </div>
                            <span className="text-sm whitespace-nowrap">
                              {winRate}%
                            </span>
                          </div>
                        </td>
                        <td className="text-right">{totalGames}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
