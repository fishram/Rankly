"use client";

import { useState, useEffect, useMemo } from "react";
import { useFetchPlayers } from "../hooks/useFetchPlayers";
import { useFetchPlayerSeasonStats } from "../hooks/useFetchPlayerSeasonStats";
import { useSeason } from "@/contexts/SeasonContext";
import ErrorDisplay from "../components/ErrorDisplay";
import NameCard from "./components/nameCard";
import PageHeading from "../components/page_heading";

export default function Page() {
  const {
    players: allTimePlayers,
    loading: loadingAllTime,
    error: errorAllTime,
  } = useFetchPlayers();
  const { seasons, currentSeason } = useSeason();
  const [sortBy, setSortBy] = useState<
    "rank" | "matches" | "peak" | "endSeason"
  >("rank");
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

  const {
    players: seasonPlayers,
    loading: loadingSeasonPlayers,
    error: errorSeasonPlayers,
  } = useFetchPlayerSeasonStats(selectedSeason);

  // Set default season to current season when available
  useEffect(() => {
    if (currentSeason && currentSeason.id) {
      setSelectedSeason(currentSeason.id);
    }
  }, [currentSeason]);

  const loading = loadingAllTime || loadingSeasonPlayers;
  const error = errorAllTime || errorSeasonPlayers;
  const players = selectedSeason ? seasonPlayers : allTimePlayers;

  // Get list of seasons with at least one match
  const seasonsWithMatches = useMemo(() => {
    if (!seasons) return [];
    // For the rankings page, we'll show only seasons with active players
    return seasons.filter((season) => {
      // Current season is always shown as it's the default
      if (season.isActive) return true;

      // For past seasons, check if they have matches or player stats
      return (
        (season._count?.matches ?? 0) > 0 ||
        (season._count?.playerStats ?? 0) > 0
      );
    });
  }, [seasons]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto py-4 px-4 mt-10">
        <ErrorDisplay error={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // Filter players to only include those who actually have data in the selected season
  const filteredPlayers = selectedSeason
    ? players.filter((player) => {
        // A player has data in a season if they have played at least one match (wins + losses > 0)
        return player.wins > 0 || player.losses > 0;
      })
    : players;

  const sortedPlayers = [...filteredPlayers]
    .filter((player) => player.isActive && player.wins + player.losses >= 5)
    .sort((a, b) => {
      switch (sortBy) {
        case "matches":
          return b.wins - a.wins;
        case "peak":
          return b.highestElo - a.highestElo;
        case "endSeason":
          // For season stats, finalElo is the end of season SR
          // Note: if finalElo is null (ongoing season), use current eloScore
          return (b.finalElo || b.eloScore) - (a.finalElo || a.eloScore);
        case "rank":
        default:
          return b.eloScore - a.eloScore;
      }
    });

  // Check if any players meet the minimum games requirement
  const playersWithMinimumGames = filteredPlayers.filter(
    (player) => player.isActive && player.wins + player.losses >= 5
  );
  const hasPlayersWithMinimumGames = playersWithMinimumGames.length > 0;

  const handleClick = (
    newSortBy: "rank" | "matches" | "peak" | "endSeason"
  ) => {
    setSortBy(newSortBy);
    const elem = document.activeElement;
    if (elem) {
      (elem as HTMLElement).blur();
    }
  };

  const handleSeasonChange = (seasonId: number | null) => {
    setSelectedSeason(seasonId);
    // If switching to current season and sort is set to endSeason, change to rank
    if (seasonId === currentSeason?.id && sortBy === "endSeason") {
      setSortBy("rank");
    }
    // If switching to a past season, set sort to endSeason (Final SR)
    else if (seasonId !== currentSeason?.id && seasonId !== null) {
      setSortBy("endSeason");
    }
    const elem = document.activeElement;
    if (elem) {
      (elem as HTMLElement).blur();
    }
  };

  // Find the selected season name
  const selectedSeasonName = selectedSeason
    ? seasons.find((s) => s.id === selectedSeason)?.name || "Unknown Season"
    : "All Time";

  // Check if the selected season is the current active season
  const isCurrentSeasonSelected = selectedSeason === currentSeason?.id;

  // Sort Dropdown Label
  const getSortByLabel = () => {
    switch (sortBy) {
      case "endSeason":
        return "Final SR";
      case "matches":
        return "Matches Won";
      case "peak":
        return "Peak SR";
      case "rank":
      default:
        return "Current Rank";
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 mt-10 flex flex-col space-y-8">
      {/* Header and Back Button */}
      <PageHeading pageTitle="Rankings"></PageHeading>

      {/* Cards Container */}
      <div className="flex flex-col gap-4 pt-4">
        {hasPlayersWithMinimumGames ? (
          sortedPlayers.map((player, index) => (
            <NameCard
              key={player.id}
              rank={index + 1}
              player={player}
              sortBy={sortBy}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium">No Rankings Available</h3>
            <p className="text-base-content/70 mt-2">
              {selectedSeason
                ? `No players with the minimum 5 games in ${selectedSeasonName}.`
                : "Players need at least 5 ranked games to appear in the rankings."}
            </p>
          </div>
        )}
      </div>

      {/* Sort Dropdowns */}
      <div className="w-full flex justify-center px-4 gap-4">
        {/* Sort by Type Dropdown */}
        <div className="dropdown dropdown-hover">
          <div tabIndex={0} role="button" className="btn btn-outline w-40">
            {getSortByLabel()}
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
            {isCurrentSeasonSelected && (
              <li>
                <a onClick={() => handleClick("rank")}>Current Rank</a>
              </li>
            )}
            <li>
              <a onClick={() => handleClick("matches")}>Matches Won</a>
            </li>
            <li>
              <a onClick={() => handleClick("peak")}>Peak SR</a>
            </li>
            {!isCurrentSeasonSelected && (
              <li>
                <a onClick={() => handleClick("endSeason")}>Final SR</a>
              </li>
            )}
          </ul>
        </div>

        {/* Season Dropdown */}
        <div className="dropdown dropdown-hover dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-outline w-36">
            {selectedSeasonName}
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
            {seasonsWithMatches.map((season) => (
              <li key={season.id}>
                <a onClick={() => handleSeasonChange(season.id)}>
                  {season.name}
                  {season.isActive && " (Current)"}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
