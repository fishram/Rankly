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
      <div className="container mx-auto py-4 px-32 mt-10">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-32 mt-10">
      <div className="flex flex-row p-3 items-center justify-between">
        <h1 className="text-3xl font-bold">Rankings</h1>
        <Link href="./" className="btn btn-outline mr-5 px-7">
          Back
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>ELO</th>
            </tr>
          </thead>
          <tbody className="text-lg">
            {players
              .sort((a, b) => b.eloScore - a.eloScore)
              .map((player, index) => (
                <tr key={player.id}>
                  <td>{index + 1}</td>
                  <td>{player.name}</td>
                  <td>{player.eloScore}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
