"use client";

import { useFetchMatches } from "../hooks/useFetchMatches";
import { format } from "date-fns";
import ErrorDisplay from "../components/ErrorDisplay";
import { useState, useMemo, useEffect } from "react";
import PageHeading from "../components/page_heading";
import { useSeason } from "@/contexts/SeasonContext";

export default function MatchHistory() {
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<number | "all" | null>(
    null
  );
  const [matchesRefreshKey, setMatchesRefreshKey] = useState(0);
  const { seasons, currentSeason, loading: seasonsLoading } = useSeason();

  // Determine the actual season ID to use for fetching matches
  const seasonIdForFetch =
    selectedSeason === "all"
      ? undefined
      : selectedSeason || (currentSeason?.id ?? undefined);

  const {
    matches,
    loading: matchesLoading,
    error,
  } = useFetchMatches(seasonIdForFetch, matchesRefreshKey);

  const loading = matchesLoading || seasonsLoading;

  // Set default season to the active season when component mounts or currentSeason changes
  useEffect(() => {
    if (currentSeason && selectedSeason === null) {
      setSelectedSeason(currentSeason.id);
    }
  }, [currentSeason, selectedSeason]);

  // Force refetch when selectedSeason changes
  useEffect(() => {
    setMatchesRefreshKey((prev) => prev + 1);
  }, [selectedSeason]);

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
    if (!matches) return [];

    return matches.filter((match) => {
      // Filter by player if selected
      const playerMatch =
        !selectedPlayer ||
        match.player1.name === selectedPlayer ||
        match.player2.name === selectedPlayer;

      return playerMatch;
    });
  }, [matches, selectedPlayer]);

  const handleDropdownClick = (callback: () => void) => {
    const elem = document.activeElement as HTMLElement;
    if (elem) {
      elem.blur();
    }
    callback();
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
    <div className="max-w-2xl mx-auto py-4 px-4 mt-10 flex flex-col space-y-8 h-full">
      {/* Heading and Back Link */}
      <PageHeading pageTitle="History"></PageHeading>

      {/* Filters Dropdown Section */}
      <div className="w-full flex justify-center px-4 gap-4">
        {/* Player Filter Dropdown */}
        <div className="dropdown dropdown-hover">
          <div tabIndex={0} role="button" className="btn btn-accent w-44">
            {selectedPlayer || "All Players"}
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
                onClick={() => handleDropdownClick(() => setSelectedPlayer(""))}
              >
                All Players
              </a>
            </li>
            {players.map((player) => (
              <li key={player}>
                <a
                  onClick={() =>
                    handleDropdownClick(() => setSelectedPlayer(player))
                  }
                >
                  {player}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Season Filter Dropdown */}
        <div className="dropdown dropdown-hover">
          <div tabIndex={0} role="button" className="btn btn-primary w-36">
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
                  handleDropdownClick(() => setSelectedSeason("all"))
                }
              >
                All Seasons
              </a>
            </li>
            {seasons?.map((season) => (
              <li key={season.id}>
                <a
                  onClick={() =>
                    handleDropdownClick(() => setSelectedSeason(season.id))
                  }
                >
                  {season.name}
                  {season.isActive && " (Current)"}
                </a>
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
              <div className="text-sm opacity-70">
                {format(new Date(match.date), "MMM d, yyyy 'at' h:mm a")}
              </div>

              <div className="flex justify-between items-center">
                <div
                  className={`text-xl font-bold ${
                    match.winner.id === match.player1.id
                      ? "text-success"
                      : "text-error"
                  }`}
                >
                  {match.player1.name}
                </div>
                <div className="text-xl opacity-70">vs</div>
                <div
                  className={`text-xl font-bold ${
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
