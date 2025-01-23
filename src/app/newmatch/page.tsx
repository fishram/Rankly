"use client";

import { useFetchPlayers } from "../hooks/useFetchPlayers";
import { useFetchMatches } from "../hooks/useFetchMatches";
import { useState, useEffect } from "react";
import { Player } from "../types/player";
import calculateElo from "../../../lib/calculateElo";
import ErrorDisplay from "../components/ErrorDisplay";
import { useKFactor } from "../hooks/useKFactor";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PageHeading from "../components/page_heading";

export default function Page() {
  const { players, loading, error, setPlayers } = useFetchPlayers();
  const [matchesRefreshKey, setMatchesRefreshKey] = useState(0);
  const { matches, loading: matchesLoading } = useFetchMatches(matchesRefreshKey);
  const { kFactor } = useKFactor();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [probabilities, setProbabilities] = useState<{
    player1: number;
    player2: number;
  } | null>(null);
  const [matchCompleted, setMatchCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eloChanges, setEloChanges] = useState<{
    player1Change: number;
    player2Change: number;
    newPlayer1Elo: number;
    newPlayer2Elo: number;
  } | null>(null);
  const [headToHead, setHeadToHead] = useState<{
    player1Wins: number;
    player2Wins: number;
  } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Auto-populate player1 with the current user's player
  useEffect(() => {
    if (players.length > 0 && session?.user?.id) {
      const userPlayer = players.find((p) => p.userId === session.user.id);
      if (userPlayer) {
        setPlayer1(userPlayer);
      }
    }
  }, [players, session]);

  useEffect(() => {
    if (player1 && player2) {
      const { player1WinProbability, player2WinProbability } = calculateElo(
        player1.eloScore,
        player2.eloScore,
        "player1",
        kFactor
      );
      setProbabilities({
        player1: player1WinProbability,
        player2: player2WinProbability,
      });

      // Calculate head-to-head record
      const calculateH2H = (p1Id: string, p2Id: string) => {
        let p1Wins = 0;
        let p2Wins = 0;
        matches.forEach((match) => {
          if (
            (match.player1.id === p1Id && match.player2.id === p2Id) ||
            (match.player1.id === p2Id && match.player2.id === p1Id)
          ) {
            if (match.winner.id === p1Id) p1Wins++;
            else if (match.winner.id === p2Id) p2Wins++;
          }
        });
        return { player1Wins: p1Wins, player2Wins: p2Wins };
      };

      const h2h = calculateH2H(player1.id, player2.id);
      setHeadToHead(h2h);
    } else {
      setProbabilities(null);
      setHeadToHead(null);
    }
  }, [player1, player2, kFactor, matches]);

  const handleDropdownClick = (callback: () => void) => {
    const elem = document.activeElement as HTMLElement;
    if (elem) {
      elem.blur();
    }
    callback();
  };

  if (loading || status === "loading" || matchesLoading)
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

  const handleConfirmMatch = async () => {
    // 1. Validate selection and prevent double submission
    if (!player1 || !player2 || !winner || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 2. Verify winner is one of them
      if (winner.id !== player1.id && winner.id !== player2.id) {
        setIsSubmitting(false);
        return;
      }

      // Determine who is player1 and player2 in terms of the Elo calculation
      const matchWinner = winner.id === player1.id ? "player1" : "player2";

      // 3. Calculate new Elo ratings
      const { newPlayer1Elo, newPlayer2Elo, player1Change, player2Change } =
        calculateElo(player1.eloScore, player2.eloScore, matchWinner, kFactor);

      setEloChanges({
        player1Change,
        player2Change,
        newPlayer1Elo,
        newPlayer2Elo,
      });

      // 4. Update the database
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
      setPlayers(
        players.map((p) => {
          if (p.id === player1.id) {
            return { ...p, eloScore: newPlayer1Elo };
          }
          if (p.id === player2.id) {
            return { ...p, eloScore: newPlayer2Elo };
          }
          return p;
        })
      );

      // Trigger a refetch of matches
      setMatchesRefreshKey(prev => prev + 1);
      
      setMatchCompleted(true);

    } catch (err: unknown) {
      console.error(err);
      setMatchCompleted(false);
      setEloChanges(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 mt-8 flex flex-col space-y-6">
      {/* Heading and Back Link */}
      <PageHeading pageTitle="New Match"></PageHeading>

      {/* Player Selection Row */}
      <div className="w-full flex flex-row justify-center space-x-4 pt-3">
        {/* Player 1 Display (not selectable) */}
        <div className="w-40">
          <div className="btn w-40 text-lg truncate btn-primary">
            {player1 ? player1.name : "Loading..."}
          </div>
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
              .filter((p) => p.id !== player1?.id)
              .map((p) => (
                <li key={p.id}>
                  <a
                    onClick={() => handleDropdownClick(() => setPlayer2(p))}
                  >
                    {p.name}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Stats Container - Fixed height to prevent shifting */}
      <div className="w-full h-48 flex flex-col items-center justify-center space-y-6">
        {/* Score Display Row */}
        <div className="w-full flex flex-row items-center justify-center space-x-4 h-16">
          <div className="text-center w-40 flex flex-col items-center justify-center">
            {player1 && (
              <>
                <div
                  className={`text-3xl font-semibold ${matchCompleted ? "animate-score" : ""}`}
                >
                  {matchCompleted
                    ? `${eloChanges?.newPlayer1Elo} SR`
                    : `${player1.eloScore} SR`}
                </div>
                {matchCompleted ? (
                  <div
                    className={`text-xl animate-elo-change ${
                      eloChanges
                        ? eloChanges.player1Change >= 0
                          ? "text-success"
                          : "text-error"
                        : ""
                    }`}
                  >
                    {eloChanges && (
                      <>
                        {eloChanges.player1Change >= 0 ? "+" : ""}
                        {eloChanges.player1Change}
                      </>
                    )}
                  </div>
                ) : (
                  probabilities && (
                    <>
                      <div className="text-sm text-gray-400">{`${probabilities.player1}% chance`}</div>
                      <div className="text-sm text-gray-400">
                        {probabilities.player1 >= 50
                          ? `-${Math.round(
                              (probabilities.player1 /
                                (100 - probabilities.player1)) *
                                100
                            )}`
                          : `+${Math.round(
                              ((100 - probabilities.player1) /
                                probabilities.player1) *
                                100
                            )}`}
                      </div>
                    </>
                  )
                )}
              </>
            )}
          </div>
          <div className="text-center w-40 flex flex-col items-center justify-center">
            {player2 && (
              <>
                <div
                  className={`text-3xl font-semibold ${matchCompleted ? "animate-score" : ""}`}
                >
                  {matchCompleted
                    ? `${eloChanges?.newPlayer2Elo} SR`
                    : `${player2.eloScore} SR`}
                </div>
                {matchCompleted ? (
                  <div
                    className={`text-xl animate-elo-change ${
                      eloChanges
                        ? eloChanges.player2Change >= 0
                          ? "text-success"
                          : "text-error"
                        : ""
                    }`}
                  >
                    {eloChanges && (
                      <>
                        {eloChanges.player2Change >= 0 ? "+" : ""}
                        {eloChanges.player2Change}
                      </>
                    )}
                  </div>
                ) : (
                  probabilities && (
                    <>
                      <div className="text-sm text-gray-400">{`${probabilities.player2}% chance`}</div>
                      <div className="text-sm text-gray-400">
                        {probabilities.player2 >= 50
                          ? `-${Math.round(
                              (probabilities.player2 /
                                (100 - probabilities.player2)) *
                                100
                            )}`
                          : `+${Math.round(
                              ((100 - probabilities.player2) /
                                probabilities.player2) *
                                100
                            )}`}
                      </div>
                    </>
                  )
                )}
              </>
            )}
          </div>
        </div>

        {/* Head to Head Record - Fixed height container */}
        <div className="h-24 flex flex-col items-center justify-center">
          {player1 && player2 && headToHead && (
            <>
              <div className="text-2xl font-semibold mb-2">Head to Head</div>
              <div className="flex items-center gap-4">
                <span className="text-xl">
                  <span className="text-primary text-4xl font-bold"> {headToHead.player1Wins}</span>
                  <span className="text-4xl font-bold"> - </span>
                  <span className="text-secondary text-4xl font-bold">{headToHead.player2Wins}</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Winner Section - Only show if match not completed */}
      {!matchCompleted && (
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-4xl font-bold">Winner</h1>
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
              } ${isSubmitting ? 'btn-disabled' : ''}`}
            >
              {winner ? winner.name : "Select"}
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
            >
              <li>
                <a
                  onClick={() => 
                    !isSubmitting && handleDropdownClick(() => {
                      if (player1) setWinner(player1);
                    })
                  }
                >
                  {player1 ? player1.name : "Player 1 not selected"}
                </a>
              </li>
              <li>
                <a
                  onClick={() => 
                    !isSubmitting && handleDropdownClick(() => {
                      if (player2) setWinner(player2);
                    })
                  }
                >
                  {player2 ? player2.name : "Player 2 not selected"}
                </a>
              </li>
            </ul>
          </div>
          {isSubmitting ? (
            <div className="mt-8 flex flex-col items-center gap-4">
              <span className="loading loading-spinner loading-lg"></span>
              <p className="text-lg font-medium">Saving match results...</p>
            </div>
          ) : (
            <button
              className={`btn btn-lg btn-wide mt-8 text-xl ${
                player1 && player2 && winner
                  ? "btn-accent"
                  : "btn-disabled"
              }`}
              onClick={handleConfirmMatch}
              disabled={!player1 || !player2 || !winner || isSubmitting}
            >
              Confirm Match
            </button>
          )}
        </div>
      )}

      {/* New Match Button - Only show if match completed */}
      {matchCompleted && (
        <button
          className="btn btn-accent btn-lg animate-elo-change mx-14"
          onClick={() => {
            setMatchCompleted(false);
            setEloChanges(null);
            setPlayer2(null);
            setWinner(null);
            setProbabilities(null);
            setHeadToHead(null);

            // Re-populate player1 with the current user's player
            if (session?.user?.id) {
              const userPlayer = players.find(
                (p) => p.userId === session.user.id
              );
              if (userPlayer) {
                setPlayer1(userPlayer);
              }
            }
          }}
        >
          New Match
        </button>
      )}
    </div>
  );
}
