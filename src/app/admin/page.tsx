"use client";

import { useState, useEffect } from "react";
import { Player } from "@prisma/client";
import ErrorDisplay from "../components/ErrorDisplay";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PageHeading from "../components/page_heading";

export default function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingElo, setEditingElo] = useState<{[key: number]: number}>({});
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
    const fetchPlayers = async () => {
      try {
        const res = await fetch("/api/players?includeInactive=true");
        if (!res.ok) throw new Error("Failed to fetch players");
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
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
        players.map((p) =>
          p.id === playerId ? { ...p, eloScore: newElo } : p
        )
      );
      
      // Clear editing state
      const newEditingElo = { ...editingElo };
      delete newEditingElo[playerId];
      setEditingElo(newEditingElo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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

      <div className="overflow-x-auto">
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
                        onChange={(e) => setEditingElo({
                          ...editingElo,
                          [player.id]: parseInt(e.target.value)
                        })}
                        className="input input-bordered input-sm w-24"
                      />
                      <button
                        onClick={() => updatePlayerElo(player.id)}
                        className="btn btn-sm btn-success"
                        disabled={editingElo[player.id] === undefined || isNaN(editingElo[player.id])}
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
                        onClick={() => setEditingElo({
                          ...editingElo,
                          [player.id]: player.eloScore
                        })}
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
    </div>
  );
}
