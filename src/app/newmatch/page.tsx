"use client";

import Link from "next/link";
import { useFetchPlayers } from "../hooks/useFetchPlayers";
import { useState, useEffect } from "react";
import { Player } from "../types/player";
import calculateElo from "../../../lib/calculateElo";

export default function Page() {
  const { players, loading, error, setPlayers } = useFetchPlayers();

  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [probabilities, setProbabilities] = useState<{
    player1: number;
    player2: number;
  } | null>(null);
  const [matchCompleted, setMatchCompleted] = useState(false);
  const [eloChanges, setEloChanges] = useState<{
    player1Change: number;
    player2Change: number;
    newPlayer1Elo: number;
    newPlayer2Elo: number;
  } | null>(null);

  useEffect(() => {
    if (player1 && player2) {
      const { player1WinProbability, player2WinProbability } = calculateElo(
        player1.eloScore,
        player2.eloScore,
        "player1" // The winner doesn't matter for probability calculation
      );
      setProbabilities({
        player1: player1WinProbability,
        player2: player2WinProbability,
      });
    } else {
      setProbabilities(null);
    }
  }, [player1, player2]);

  if (loading) return null;
  if (error) {
    return (
      <div className="max-w-md mx-auto py-4 px-4 mt-10">
        <p>Error: {error}</p>
      </div>
    );
  }

  const handleConfirmMatch = async () => {
    // 1. Validate selection
    if (!player1 || !player2 || !winner) {
      return;
    }

    // 2. Verify winner is one of them
    if (winner.id !== player1.id && winner.id !== player2.id) {
      return;
    }

    // Determine who is player1 and player2 in terms of the Elo calculation
    const matchWinner = winner.id === player1.id ? "player1" : "player2";

    // 3. Calculate new Elo ratings
    const { newPlayer1Elo, newPlayer2Elo } = calculateElo(
      player1.eloScore,
      player2.eloScore,
      matchWinner
    );

    // Calculate Elo changes
    const { player1Change, player2Change } = calculateElo(
      player1.eloScore,
      player2.eloScore,
      matchWinner
    );

    setEloChanges({
      player1Change,
      player2Change,
      newPlayer1Elo,
      newPlayer2Elo,
    });


    setMatchCompleted(true);

    // 4. Update the database
    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player1Id: player1.id,
          player2Id: player2.id,
          winnerId: winner.id,
          newPlayer1Elo,
          newPlayer2Elo,
          date: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save match data to the database.");
      }

      // Update the players list with new Elo scores
      setPlayers(players.map(p => {
        if (p.id === player1.id) {
          return { ...p, eloScore: newPlayer1Elo };
        }
        if (p.id === player2.id) {
          return { ...p, eloScore: newPlayer2Elo };
        }
        return p;
      }));

    } catch (err: any) {
      console.error(err);
      // You might want to add some error state handling here instead of the alert
      setMatchCompleted(false);
      setEloChanges(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 mt-10 flex flex-col space-y-8">
      {/* Heading and Back Link */}
      <div className="w-full flex flex-row justify-between items-center px-4">
        <h1 className="text-4xl font-bold">New Match</h1>
        <Link href="./" className="btn btn-outline px-4">
          Back
        </Link>
      </div>

      {/* Player Selection Row */}
      <div className="w-full flex flex-row justify-center space-x-4">
        {/* Player 1 Dropdown */}
        <div className="dropdown dropdown-hover">
          <div
            tabIndex={0}
            role="button"
            className={`btn w-40 text-lg truncate ${
              player1 ? "btn-primary" : "btn-outline"
            }`}
          >
            {player1 ? player1.name : "Select Player 1"}
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
          >
            {players
              .filter(p => p.id !== player2?.id)
              .map((p) => (
                <li key={p.id}>
                  <a onClick={() => setPlayer1(p)}>{p.name}</a>
                </li>
              ))}
          </ul>
        </div>

        {/* Player 2 Dropdown */}
        <div className="dropdown dropdown-hover">
          <div
            tabIndex={0}
            role="button"
            className={`btn w-40 text-lg truncate ${
              player2 ? "btn-secondary" : "btn-outline"
            }`}
          >
            {player2 ? player2.name : "Select Player 2"}
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
          >
            {players
              .filter(p => p.id !== player1?.id)
              .map((p) => (
                <li key={p.id}>
                  <a onClick={() => setPlayer2(p)}>{p.name}</a>
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Score Display Row */}
      <div className="w-full flex flex-row items-center justify-center space-x-4">
        <div className="text-center w-40 h-16 flex flex-col items-center justify-center">
          {player1 && (
            <>
              <div className={`text-2xl ${matchCompleted ? 'animate-score' : ''}`}>
                {matchCompleted ? `${eloChanges?.newPlayer1Elo} SR` : `${player1.eloScore} SR`}
              </div>
              {matchCompleted ? (
                <div className={`text-smd animate-elo-change ${eloChanges?.player1Change! >= 0 ? 'text-success' : 'text-error'}`}>
                  {eloChanges?.player1Change! >= 0 ? '+' : ''}{eloChanges?.player1Change}
                </div>
              ) : (
                probabilities && (
                  <>
                    <div className="text-sm text-gray-400">{`${probabilities.player1}% chance`}</div>
                    <div className="text-sm text-gray-400">
                      {probabilities.player1 >= 50 
                        ? `-${Math.round((probabilities.player1 / (100 - probabilities.player1)) * 100)}` 
                        : `+${Math.round((100 - probabilities.player1) / probabilities.player1 * 100)}`}
                    </div>
                  </>
                )
              )}
            </>
          )}
        </div>
        <div className="text-center w-40 h-16 flex flex-col items-center justify-center">
          {player2 && (
            <>
              <div className={`text-2xl ${matchCompleted ? 'animate-score' : ''}`}>
                {matchCompleted ? `${eloChanges?.newPlayer2Elo} SR` : `${player2.eloScore} SR`}
              </div>
              {matchCompleted ? (
                <div className={`text-md animate-elo-change ${eloChanges?.player2Change! >= 0 ? 'text-success' : 'text-error'}`}>
                  {eloChanges?.player2Change! >= 0 ? '+' : ''}{eloChanges?.player2Change}
                </div>
              ) : (
                probabilities && (
                  <>
                    <div className="text-sm text-gray-400">{`${probabilities.player2}% chance`}</div>
                    <div className="text-sm text-gray-400">
                      {probabilities.player2 >= 50 
                        ? `-${Math.round((probabilities.player2 / (100 - probabilities.player2)) * 100)}` 
                        : `+${Math.round((100 - probabilities.player2) / probabilities.player2 * 100)}`}
                    </div>
                  </>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Winner Section - Only show if match not completed */}
      {!matchCompleted && (
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-3xl font-bold">Winner</h1>
          <div className="dropdown dropdown-hover">
            <div
              tabIndex={0}
              role="button"
              className={`btn w-40 text-lg truncate ${
                winner
                  ? winner.id === player1?.id
                    ? "btn-primary"
                    : "btn-secondary"
                  : "btn-outline"
              }`}
            >
              {winner ? winner.name : "Select"}
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
            >
              <li>
                <a
                  onClick={() => {
                    if (player1) setWinner(player1);
                  }}
                >
                  {player1 ? player1.name : "Player 1 not selected"}
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    if (player2) setWinner(player2);
                  }}
                >
                  {player2 ? player2.name : "Player 2 not selected"}
                </a>
              </li>
            </ul>
          </div>
          <button
            className={`btn btn-lg mt-16 ${
              player1 && player2 && winner
                ? "btn-outline btn-accent"
                : "btn-disabled"
            }`}
            onClick={handleConfirmMatch}
          >
            Confirm Match
          </button>
          <button
            className="btn btn-outline px-10"
            onClick={() => {
              setPlayer1(null);
              setPlayer2(null);
              setWinner(null);
              setProbabilities(null);
            }}
          >
            Reset
          </button>
        </div>
      )}

      {/* New Match Button - Only show if match completed */}
      {matchCompleted && (
        <button
          className="btn btn-accent btn-lg animate-elo-change mx-14"
          onClick={() => {
            setMatchCompleted(false);
            setEloChanges(null);
            setPlayer1(null);
            setPlayer2(null);
            setWinner(null);
            setProbabilities(null);
          }}
        >
          New Match
        </button>
      )}
    </div>
  );
}
