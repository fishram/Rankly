"use client";

import Link from "next/link";
import { useFetchMatches } from "../hooks/useFetchMatches";
import { format } from "date-fns";
import ErrorDisplay from "../components/ErrorDisplay";
import { useState, useMemo } from "react";
import PageHeading from "../components/page_heading";

export default function MatchHistory() {
  const { matches, loading, error } = useFetchMatches();
  const [selectedPlayer, setSelectedPlayer] = useState("");

  const players = useMemo(() => {
    if (!matches) return [];
    const playerSet = new Set<string>();
    matches.forEach((match) => {
      playerSet.add(match.player1.name);
      playerSet.add(match.player2.name);
    });
    return Array.from(playerSet).sort();
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (!selectedPlayer) return matches;
    return matches.filter(
      (match) =>
        match.player1.name === selectedPlayer ||
        match.player2.name === selectedPlayer
    );
  }, [matches, selectedPlayer]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  if (error) {
    return (
      <div className="max-w-md mx-auto py-4 px-4 mt-10">
        <ErrorDisplay error={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 mt-10 flex flex-col space-y-8">
      {/* Heading and Back Link */}
      <PageHeading pageTitle="History"></PageHeading>

      {/* Player Filter Dropdown */}
      <div className="w-full flex justify-start px-4">
        <div className="dropdown dropdown-hover">
          <div tabIndex={0} role="button" className="btn btn-outline w-48">
            {selectedPlayer || "All Players"}
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <a onClick={() => setSelectedPlayer("")}>All Players</a>
            </li>
            {players.map((player) => (
              <li key={player}>
                <a onClick={() => setSelectedPlayer(player)}>{player}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Match Cards */}
      <div className="flex flex-col space-y-4">
        {filteredMatches.map((match) => (
          <div key={match.id} className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <div className="text-sm opacity-70 mb-2">
                {format(new Date(match.date), "MMM d, yyyy 'at' h:mm a")}
              </div>

              <div className="flex justify-between items-center">
                <div
                  className={`text-2xl font-bold ${
                    match.winner.id === match.player1.id
                      ? "text-success"
                      : "text-error"
                  }`}
                >
                  {match.player1.name}
                </div>
                <div className="text-xl opacity-70">vs</div>
                <div
                  className={`text-2xl font-bold ${
                    match.winner.id === match.player2.id
                      ? "text-success"
                      : "text-error"
                  }`}
                >
                  {match.player2.name}
                </div>
              </div>

              {match.notes && (
                <div className="mt-2 text-sm opacity-70">{match.notes}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
