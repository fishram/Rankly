"use client";

import Link from "next/link";
import { useFetchMatches } from "../hooks/useFetchMatches";
import { format } from "date-fns";

export default function MatchHistory() {
  const { matches, loading, error } = useFetchMatches();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 mt-10 flex flex-col space-y-8">
      {/* Heading and Back Link */}
      <div className="w-full flex flex-row justify-between items-center px-4">
        <h1 className="text-4xl font-bold">Match History</h1>
        <Link href="./" className="btn btn-outline px-4">
          Back
        </Link>
      </div>

      {/* Match Cards */}
      <div className="flex flex-col space-y-4">
        {matches.map((match) => (
          <div key={match.id} className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <div className="text-sm opacity-70 mb-2">
                {format(new Date(match.date), "MMM d, yyyy 'at' h:mm a")}
              </div>
              
              <div className="flex justify-between items-center">
                <div className={`text-2xl font-bold ${match.winner.id === match.player1.id ? 'text-success' : 'text-error'}`}>
                  {match.player1.name}
                </div>
                <div className="text-xl opacity-70">
                  vs
                </div>
                <div className={`text-2xl font-bold ${match.winner.id === match.player2.id ? 'text-success' : 'text-error'}`}>
                  {match.player2.name}
                </div>
              </div>

              {match.notes && (
                <div className="mt-2 text-sm opacity-70">
                  {match.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
