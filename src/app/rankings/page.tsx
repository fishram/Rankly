"use client";

import Link from "next/link";
import { useFetchPlayers } from "../hooks/useFetchPlayers";

export default function Page() {
  const { players, loading, error } = useFetchPlayers();

  if (loading) {
    return <></>;
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto py-4 px-4 mt-10">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-4 px-4 mt-10 flex flex-col space-y-8">
      {/* Header and Back Button */}
      <div className="w-full flex flex-row items-center justify-between px-4">
        <h1 className="text-3xl font-bold">Rankings</h1>
        <Link href="./" className="btn btn-outline px-4">
          Back
        </Link>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-hidden">
        <table className="table mx-auto ml-5">
          <thead>
            <tr>
              <th className="whitespace-nowrap">Rank</th>
              <th className="whitespace-nowrap">Name</th>
              <th className="whitespace-nowrap">ELO</th>
            </tr>
          </thead>
          <tbody className="text-lg">
            {players
              .sort((a, b) => b.eloScore - a.eloScore)
              .map((player, index) => (
                <tr key={player.id}>
                  <td>{index + 1}</td>
                  <td className="truncate">{player.name}</td>
                  <td>{player.eloScore}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
