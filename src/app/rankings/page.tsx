"use client";

import Link from "next/link";
import { useState } from "react";
import { useFetchPlayers } from "../hooks/useFetchPlayers";
import ErrorDisplay from '../components/ErrorDisplay';
import NameCard from './components/nameCard';

export default function Page() {
  const { players, loading, error } = useFetchPlayers();
  const [sortBy, setSortBy] = useState<'rank' | 'matches' | 'peak'>('rank');

  if (loading) {
    return <></>;
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto py-4 px-4 mt-10">
        <ErrorDisplay error={error} />
      </div>
    );
  }

  const sortedPlayers = [...players]
    .filter(player => player.isActive)
    .sort((a, b) => {
      switch (sortBy) {
        case 'matches':
          return b.wins - a.wins;
        case 'peak':
          return b.highestElo - a.highestElo;
        case 'rank':
        default:
          return b.eloScore - a.eloScore;
      }
    });

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 mt-10 flex flex-col space-y-8">
      {/* Header and Back Button */}
      <div className="w-full flex flex-row items-center justify-between px-4">
        <h1 className="text-3xl font-bold">Rankings</h1>
        <Link href="./" className="btn btn-outline px-4">
          Back
        </Link>
      </div>

      {/* Cards Container */}
      <div className="flex flex-col gap-4">
        {sortedPlayers.map((player, index) => (
          <NameCard
            key={player.id}
            rank={index + 1}
            player={player}
            sortBy={sortBy}
          />
        ))}
      </div>

      {/* Sort Dropdown */}
      <div className="w-full flex justify-start px-4">
        <div className="dropdown dropdown-hover">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-outline w-48"
          >
            {sortBy === 'rank' ? 'Current Rank' : sortBy === 'matches' ? 'Matches Won' : 'Peak SR'}
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li><a onClick={() => setSortBy('rank')}>Current Rank</a></li>
            <li><a onClick={() => setSortBy('matches')}>Matches Won</a></li>
            <li><a onClick={() => setSortBy('peak')}>Peak SR</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
