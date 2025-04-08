"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useFetchPlayers, useFetchAllPlayers } from "../hooks/useFetchPlayers";
import { useFetchMatches } from "../hooks/useFetchMatches";
import { useFetchPlayerSeasonStats } from "../hooks/useFetchPlayerSeasonStats";
import ErrorDisplay from "../components/ErrorDisplay";
import PageHeading from "../components/page_heading";
import { useSeason } from "@/contexts/SeasonContext";

export default function Page() {
  const { data: session, status } = useSession({ required: true });
  const { players, loading: playersLoading, error } = useFetchPlayers();
  const { players: allPlayers, loading: allPlayersLoading } =
    useFetchAllPlayers();
  const { seasons, currentSeason, loading: seasonsLoading } = useSeason();

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | "all" | null>(
    null
  );
  const [isChangingSeason, setIsChangingSeason] = useState(false);
  const [matchesRefreshKey, setMatchesRefreshKey] = useState(0);

  // Fetch season-specific player stats if a specific season is selected
  const { players: seasonPlayers, loading: seasonPlayersLoading } =
    useFetchPlayerSeasonStats(selectedSeason === "all" ? null : selectedSeason);

  // Determine the actual season ID to use for fetching matches
  const seasonIdForFetch =
    selectedSeason === "all"
      ? undefined
      : selectedSeason || (currentSeason?.id ?? undefined);

  const { matches, loading: matchesLoading } = useFetchMatches(
    seasonIdForFetch,
    matchesRefreshKey
  );

  // Reset the changing season flag when matches are loaded
  useEffect(() => {
    if (!matchesLoading && isChangingSeason) {
      setIsChangingSeason(false);
    }
  }, [matchesLoading, matches, isChangingSeason]);

  const handleDropdownClick = (callback: () => void) => {
    const elem = document.activeElement as HTMLElement;
    if (elem) {
      elem.blur();
    }
    callback();
  };

  const handleSeasonChange = (season: number | "all") => {
    setIsChangingSeason(true);
    setSelectedSeason(season);
    // Force refresh matches when season changes
    setMatchesRefreshKey((prev) => prev + 1);
  };

  // Set default season to the active season from context only once on initial mount
  useEffect(() => {
    if (currentSeason && selectedSeason === null) {
      setSelectedSeason(currentSeason.id);
    }
  }, [currentSeason, selectedSeason]);

  useEffect(() => {
    if (players && session?.user?.id) {
      const currentPlayer = players.find((p) => p.userId === session.user.id);
      if (currentPlayer) {
        setSelectedPlayer(currentPlayer.id);
      }
    }
  }, [players, session]);

  if (
    status === "loading" ||
    playersLoading ||
    matchesLoading ||
    allPlayersLoading ||
    seasonsLoading ||
    seasonPlayersLoading
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

  // Get season name for display
  const getSeasonName = () => {
    if (selectedSeason === "all") return "All Seasons";
    if (selectedSeason === null) {
      return currentSeason ? currentSeason.name : "Current Season";
    }
    const season = seasons?.find((s) => s.id === selectedSeason);
    return season ? season.name : "Current Season";
  };

  // Get player name for display
  const getPlayerName = () => {
    if (selectedPlayer === null) return "Select a Player";
    const player = players.find((p) => p.id === selectedPlayer);
    return player ? player.name : "Select a Player";
  };

  // Get player info with season-specific stats when available
  const getPlayerInfo = (playerId: string) => {
    if (selectedSeason && selectedSeason !== "all") {
      // Use season-specific stats
      const seasonPlayer = seasonPlayers?.find((p) => p.id === playerId);
      return seasonPlayer || players.find((p) => p.id === playerId);
    } else {
      // Use all-time stats
      return players.find((p) => p.id === playerId);
    }
  };

  // Get seasons where the player has matches
  const getPlayerSeasons = (playerId: string) => {
    if (!playerId || !seasons) return [];

    // For each season, check if player has matches
    return seasons.filter((season) => {
      // If we're already looking at season-specific data and this is the selected season
      if (selectedSeason === season.id && seasonPlayers) {
        return seasonPlayers.some((p) => p.id === playerId);
      }

      // Otherwise check the matches data we have
      return matches.some(
        (match) =>
          (match.player1.id === playerId || match.player2.id === playerId) &&
          match.seasonId === season.id
      );
    });
  };

  // Get player seasons for UI
  const playerSeasons = selectedPlayer ? getPlayerSeasons(selectedPlayer) : [];
  const hasNoSeasons = selectedPlayer && playerSeasons.length === 0;

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 mt-10 flex flex-col space-y-8">
      {/* Heading and Back Link */}
      <PageHeading pageTitle="Statistics"></PageHeading>

      {/* Filters Dropdown Section */}
      <div className="w-full flex justify-start px-4 gap-4">
        {/* Player Selection Dropdown */}
        <div className="dropdown dropdown-hover">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-square btn-accent w-44"
          >
            {getPlayerName()}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
          >
            {players.map((player) => (
              <li key={player.id}>
                <a
                  onClick={() =>
                    handleDropdownClick(() => {
                      setSelectedPlayer(player.id);
                      // Reset to "all seasons" when changing players
                      setSelectedSeason("all");
                    })
                  }
                >
                  {player.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Season Filter Dropdown */}
        <div className="dropdown dropdown-hover">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-square btn-primary w-36"
          >
            {getSeasonName()}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <a
                onClick={() =>
                  handleDropdownClick(() => handleSeasonChange("all"))
                }
              >
                All Seasons
              </a>
            </li>
            {selectedPlayer ? (
              playerSeasons.length > 0 ? (
                playerSeasons.map((season) => (
                  <li key={season.id}>
                    <a
                      onClick={() =>
                        handleDropdownClick(() => handleSeasonChange(season.id))
                      }
                    >
                      {season.name}
                      {season.isActive && " (Current)"}
                    </a>
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-gray-500 italic">
                  No seasons with matches
                </li>
              )
            ) : (
              <li className="px-4 py-2 text-gray-500 italic">
                Select a player first
              </li>
            )}
          </ul>
        </div>
      </div>

      {hasNoSeasons && selectedPlayer && (
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>This player has not participated in any matches yet.</span>
        </div>
      )}

      {selectedPlayer && !hasNoSeasons && (
        <>
          {matchesLoading || isChangingSeason ? (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : (
            <>
              {/* SR Display */}
              <div className="flex flex-col items-center space-y-2 py-4">
                <div className="text-4xl font-bold">
                  {getPlayerInfo(selectedPlayer)?.eloScore} SR
                </div>
                <div className="text-xl text-gray-400">
                  {selectedSeason && selectedSeason !== "all"
                    ? "Season"
                    : "Career"}{" "}
                  High: {getPlayerInfo(selectedPlayer)?.highestElo} SR
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
                        const winRate = (
                          (stats.wins / totalGames) *
                          100
                        ).toFixed(1);

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
        </>
      )}
    </div>
  );
}
