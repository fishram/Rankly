"use client";

import { useState, useEffect } from "react";
import { Player, Season } from "@prisma/client";
import ErrorDisplay from "../components/ErrorDisplay";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PageHeading from "../components/page_heading";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"players" | "seasons">("players");
  const [players, setPlayers] = useState<Player[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingElo, setEditingElo] = useState<{ [key: number]: number }>({});

  // New season form state
  const [showNewSeasonForm, setShowNewSeasonForm] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState("");
  const [newSeasonStartDate, setNewSeasonStartDate] = useState("");
  const [resetOption, setResetOption] = useState<
    "complete" | "partial" | "none"
  >("complete");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/");
    }
  }, [status, router, session?.user?.isAdmin]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch players
        const playersRes = await fetch("/api/players?includeInactive=true");
        if (!playersRes.ok) throw new Error("Failed to fetch players");
        const playersData = await playersRes.json();
        setPlayers(playersData);

        // Fetch seasons
        const seasonsRes = await fetch("/api/seasons");
        if (!seasonsRes.ok) throw new Error("Failed to fetch seasons");
        const seasonsData = await seasonsRes.json();
        setSeasons(seasonsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const togglePlayerStatus = async (playerId: number) => {
    try {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      const res = await fetch(`/api/players/${playerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !player.isActive,
        }),
      });

      if (!res.ok) throw new Error("Failed to update player status");

      // Update local state
      setPlayers(
        players.map((p) =>
          p.id === playerId ? { ...p, isActive: !p.isActive } : p
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const updatePlayerElo = async (playerId: number) => {
    try {
      const newElo = editingElo[playerId];
      if (newElo === undefined) return;

      const res = await fetch("/api/players", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: playerId,
          eloScore: newElo,
        }),
      });

      if (!res.ok) throw new Error("Failed to update player Elo");

      // Update local state
      setPlayers(
        players.map((p) => (p.id === playerId ? { ...p, eloScore: newElo } : p))
      );

      // Clear editing state
      const newEditingElo = { ...editingElo };
      delete newEditingElo[playerId];
      setEditingElo(newEditingElo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Handle creating a new season
  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      // Validate form
      if (!newSeasonName.trim()) {
        setFormError("Please enter a season name");
        return;
      }

      if (!newSeasonStartDate) {
        setFormError("Please select a start date");
        return;
      }

      // Submit to API
      const response = await fetch("/api/seasons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSeasonName.trim(),
          startDate: newSeasonStartDate,
          resetOption: resetOption,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create season");
      }

      // Add new season to state
      const newSeason = await response.json();
      setSeasons([newSeason, ...seasons]);

      // Reset form
      setNewSeasonName("");
      setNewSeasonStartDate("");
      setResetOption("complete");
      setShowNewSeasonForm(false);

      // Refresh data to get updated seasons and player stats
      const playersRes = await fetch("/api/players?includeInactive=true");
      if (playersRes.ok) {
        const playersData = await playersRes.json();
        setPlayers(playersData);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle ending a season
  const handleEndSeason = async () => {
    if (
      !confirm(
        "Are you sure you want to end the current active season? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // Find the active season
      const activeSeason = seasons.find((season) => season.isActive);

      if (!activeSeason) {
        throw new Error("No active season found");
      }

      const response = await fetch(`/api/seasons`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: activeSeason.id,
          endDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to end season");
      }

      // Update the seasons list
      const updatedSeason = await response.json();
      setSeasons(
        seasons.map((s) => (s.id === updatedSeason.id ? updatedSeason : s))
      );

      // Refresh player data to get updated stats
      const playersRes = await fetch("/api/players?includeInactive=true");
      if (playersRes.ok) {
        const playersData = await playersRes.json();
        setPlayers(playersData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  if (error)
    return (
      <ErrorDisplay error={error} onRetry={() => window.location.reload()} />
    );
  if (!session?.user) return null;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="pt-12 pb-8">
        <PageHeading pageTitle="Admin Panel"></PageHeading>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="tabs tabs-boxed">
          <a
            className={`tab tab-lg ${
              activeTab === "players" ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab("players")}
          >
            Player Management
          </a>
          <a
            className={`tab tab-lg ${
              activeTab === "seasons" ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab("seasons")}
          >
            Season Management
          </a>
        </div>
      </div>

      {/* Player Management Section */}
      {activeTab === "players" && (
        <div className="overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4 ml-4">Current Players</h2>
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Elo</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr
                  key={player.id}
                  className={!player.isActive ? "opacity-50" : ""}
                >
                  <td>{player.name}</td>
                  <td>{player.isActive ? "Active" : "Inactive"}</td>
                  <td>
                    {editingElo[player.id] !== undefined ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editingElo[player.id]}
                          onChange={(e) =>
                            setEditingElo({
                              ...editingElo,
                              [player.id]: parseInt(e.target.value),
                            })
                          }
                          className="input input-bordered input-sm w-24"
                        />
                        <button
                          onClick={() => updatePlayerElo(player.id)}
                          className="btn btn-sm btn-success"
                          disabled={
                            editingElo[player.id] === undefined ||
                            isNaN(editingElo[player.id])
                          }
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            const newEditingElo = { ...editingElo };
                            delete newEditingElo[player.id];
                            setEditingElo(newEditingElo);
                          }}
                          className="btn btn-sm btn-error"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        {player.eloScore}
                        <button
                          onClick={() =>
                            setEditingElo({
                              ...editingElo,
                              [player.id]: player.eloScore,
                            })
                          }
                          className="btn btn-sm btn-ghost"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </td>
                  <td>{player.wins}</td>
                  <td>{player.losses}</td>
                  <td>
                    <button
                      onClick={() => togglePlayerStatus(player.id)}
                      className={`btn btn-sm ${
                        player.isActive ? "btn-error" : "btn-success"
                      }`}
                    >
                      {player.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Season Management Section */}
      {activeTab === "seasons" && (
        <div>
          <div className="flex justify-center gap-3">
            <button
              className="btn btn-accent mb-4 ml-3 px-8"
              onClick={() => setShowNewSeasonForm(!showNewSeasonForm)}
            >
              {showNewSeasonForm ? "Cancel" : "Create Season"}
            </button>

            {seasons.some((season) => season.isActive) && (
              <button
                className="btn btn-warning mb-4 px-8"
                onClick={handleEndSeason}
              >
                End Season
              </button>
            )}
          </div>

          {/* New Season Form */}
          {showNewSeasonForm && (
            <div className="card bg-base-200 shadow-xl mb-6">
              <div className="card-body">
                <h3 className="card-title text-xl mb-4">Create New Season</h3>

                {formError && (
                  <div className="alert alert-error mb-4">
                    <div>
                      <span>{formError}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCreateSeason}>
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text">Season Name</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="e.g., Spring 2023"
                      value={newSeasonName}
                      onChange={(e) => setNewSeasonName(e.target.value)}
                    />
                  </div>

                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text">Start Date</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered"
                      value={newSeasonStartDate}
                      onChange={(e) => setNewSeasonStartDate(e.target.value)}
                    />
                  </div>

                  <div className="form-control mb-6">
                    <label className="label">
                      <span className="label-text">ELO Reset Option</span>
                    </label>

                    <div className="space-y-3">
                      <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-4">
                          <input
                            type="radio"
                            name="reset-option"
                            className="radio"
                            checked={resetOption === "complete"}
                            onChange={() => setResetOption("complete")}
                          />
                          <div>
                            <p className="font-medium">
                              Complete Reset (All players start at 1000)
                            </p>
                            <p className="text-sm opacity-70">
                              All players will start the new season with an ELO
                              of 1000
                            </p>
                          </div>
                        </label>
                      </div>

                      <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-4">
                          <input
                            type="radio"
                            name="reset-option"
                            className="radio"
                            checked={resetOption === "partial"}
                            onChange={() => setResetOption("partial")}
                          />
                          <div>
                            <p className="font-medium">
                              Partial Reset (Weighted approach)
                            </p>
                            <p className="text-sm opacity-70">
                              Players will start with: (CurrentELO + 1000) / 2
                            </p>
                          </div>
                        </label>
                      </div>

                      <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-4">
                          <input
                            type="radio"
                            name="reset-option"
                            className="radio"
                            checked={resetOption === "none"}
                            onChange={() => setResetOption("none")}
                          />
                          <div>
                            <p className="font-medium">
                              No Reset (Continue with current ELO)
                            </p>
                            <p className="text-sm opacity-70">
                              Players will keep their current ELO for the new
                              season
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={formLoading}
                    >
                      {formLoading ? (
                        <>
                          <span className="loading loading-spinner loading-sm mr-2"></span>
                          Creating Season...
                        </>
                      ) : (
                        "Create Season"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {seasons.length === 0 ? (
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <p className="text-center text-xl">
                  No seasons created yet. Create your first season!
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th style={{ minWidth: "110px" }}>Name</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {seasons.map((season) => (
                    <tr
                      key={season.id}
                      className={!season.isActive ? "opacity-70" : ""}
                    >
                      <td className="font-bold">{season.name}</td>
                      <td>
                        <span
                          className={`badge ${
                            season.isActive ? "badge-success" : "badge-neutral"
                          }`}
                        >
                          {season.isActive ? "Active" : "Ended"}
                        </span>
                      </td>
                      <td>{new Date(season.startDate).toLocaleDateString()}</td>
                      <td>
                        {season.endDate
                          ? new Date(season.endDate).toLocaleDateString()
                          : "Ongoing"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
