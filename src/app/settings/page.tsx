"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useFetchPlayers } from "../hooks/useFetchPlayers";
import { Player } from "../types/player";
import { useKFactor } from "../hooks/useKFactor";
import ErrorDisplay from "../components/ErrorDisplay";

export default function Page() {
  const { players, setPlayers, loading: playersLoading, error } = useFetchPlayers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [startingElo, setStartingElo] = useState("1000");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState("");
  const [editElo, setEditElo] = useState("");
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { kFactor: initialKFactor, updateKFactor, loading: kFactorLoading } = useKFactor();
  const [kFactor, setKFactor] = useState(50);
  const [showKFactorConfirm, setShowKFactorConfirm] = useState(false);

  useEffect(() => {
    setKFactor(initialKFactor);
  }, [initialKFactor]);

  const handleAddPlayer = async () => {
    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playerName,
          eloScore: parseInt(startingElo),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add player");
      }

      const newPlayer = await response.json();
      setPlayers([...players, newPlayer]);
      setDialogOpen(false);
      setPlayerName("");
      setStartingElo("1000");
    } catch (error) {
      console.error("Error adding player:", error);
    }
  };

  const handleUpdatePlayer = async () => {
    if (!selectedPlayer) return;

    try {
      const response = await fetch("/api/players", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedPlayer.id,
          name: editName || undefined,
          eloScore: editElo ? parseInt(editElo) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update player");
      }

      const updatedPlayer = await response.json();
      setPlayers(players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
      setEditDialogOpen(false);
      resetEditForm();
    } catch (error) {
      console.error("Error updating player:", error);
    }
  };

  const handleDeletePlayer = async () => {
    if (!selectedPlayer) return;

    try {
      const response = await fetch("/api/players", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: parseInt(selectedPlayer.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete player");
      }

      setPlayers(players.filter(p => p.id !== selectedPlayer.id));
      setEditDialogOpen(false);
      resetEditForm();
    } catch (error) {
      console.error("Error deleting player:", error);
    }
  };

  const resetEditForm = () => {
    setSelectedPlayer(null);
    setEditName("");
    setEditElo("");
  };

  if (playersLoading || kFactorLoading) return null;
  if (error) {
    return (
      <div className="max-w-md mx-auto py-4 px-4 mt-10">
        <ErrorDisplay error={error} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 px-5 mt-10 flex flex-col space-y-8">
      {/* Heading and Back Link */}
      <div className="w-full flex flex-row justify-between items-center px-4">
        <h1 className="text-4xl font-bold">Settings</h1>
        <Link href="./" className="btn btn-outline px-4">
          Back
        </Link>
      </div>

      {/* Player Management Section */}
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">Player Management</h2>
        

        {/* Player List */}
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>ELO</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>{player.eloScore}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        setSelectedPlayer(player);
                        setEditName(player.name);
                        setEditElo(player.eloScore.toString());
                        setEditDialogOpen(true);
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
                {/* Add Player Button */}
                <button
          className="btn btn-primary w-2/5"
          onClick={() => setDialogOpen(true)}
        >
          New Player
        </button>
      </div>

      {/* K-Factor Settings Section */}
      {!kFactorLoading && (
        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-bold">ELO Settings</h2>
          <div className="form-control">
            <label className="label">
              <span className="label-text">K-Factor (1-100)</span>
              <span className="label-text-alt">Controls how much ELO changes after each match</span>
            </label>
            <div className="flex gap-4">
              <input
                type="range"
                min="1"
                max="100"
                value={kFactor}
                onChange={(e) => setKFactor(parseInt(e.target.value))}
                className="range range-primary flex-grow"
              />
              <input
                type="number"
                min="1"
                max="100"
                value={kFactor}
                onChange={(e) => setKFactor(parseInt(e.target.value))}
                className="input input-bordered w-20"
              />
            </div>
            <button
              className="btn btn-primary mt-4"
              onClick={async () => {
                const success = await updateKFactor(kFactor);
                if (success) {
                  setShowKFactorConfirm(true);
                }
              }}
            >
              Save K-Factor
            </button>
          </div>
        </div>
      )}

      {/* Add Player Dialog */}
      <dialog className={`modal ${dialogOpen ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Add New Player</h3>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Player Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter player name"
              className="input input-bordered w-full"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>
          <div className="form-control w-full mt-4">
            <label className="label">
              <span className="label-text">Starting ELO</span>
            </label>
            <input
              type="number"
              placeholder="1000"
              className="input input-bordered w-full"
              value={startingElo}
              onChange={(e) => setStartingElo(e.target.value)}
            />
          </div>
          <div className="modal-action">
            <button className="btn" onClick={() => setDialogOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddPlayer}
              disabled={!playerName || !startingElo}
            >
              Add Player
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setDialogOpen(false)}>close</button>
        </form>
      </dialog>

      {/* Edit Player Dialog */}
      <dialog className={`modal ${editDialogOpen ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Edit Player</h3>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Player Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter player name"
              className="input input-bordered w-full"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="form-control w-full mt-4">
            <label className="label">
              <span className="label-text">ELO Score</span>
            </label>
            <input
              type="number"
              placeholder="Enter ELO score"
              className="input input-bordered w-full"
              value={editElo}
              onChange={(e) => setEditElo(e.target.value)}
            />
          </div>
          <div className="modal-action">
            <button className="btn" onClick={() => {
              setEditDialogOpen(false);
              resetEditForm();
            }}>
              Cancel
            </button>
            <button
              className="btn btn-error w-3/12"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </button>
            <button
              className="btn btn-primary btn-md w-4/12"
              onClick={() => setShowUpdateConfirm(true)}
              disabled={!editName && !editElo}
            >
              Update
            </button>
          </div>
        </div>
      </dialog>

      {/* Update Confirmation Dialog */}
      <dialog className={`modal ${showUpdateConfirm ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Confirm Update</h3>
          <p className="py-4">Are you sure you want to update this player?</p>
          <div className="modal-action">
            <button 
              className="btn" 
              onClick={() => setShowUpdateConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                handleUpdatePlayer();
                setShowUpdateConfirm(false);
              }}
            >
              Confirm Update
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setShowUpdateConfirm(false)}>close</button>
        </form>
      </dialog>

      {/* Delete Confirmation Dialog */}
      <dialog className={`modal ${showDeleteConfirm ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Confirm Delete</h3>
          <p className="py-4">Are you sure you want to delete this player? This action cannot be undone.</p>
          <div className="modal-action">
            <button 
              className="btn" 
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-error"
              onClick={() => {
                handleDeletePlayer();
                setShowDeleteConfirm(false);
              }}
            >
              Delete Player
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setShowDeleteConfirm(false)}>close</button>
        </form>
      </dialog>

      {/* K-Factor Update Confirmation Dialog */}
      <dialog className={`modal ${showKFactorConfirm ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">K-Factor Updated</h3>
          <p className="py-4">The K-Factor has been successfully updated to {kFactor}.</p>
          <div className="modal-action">
            <button
              className="btn btn-primary"
              onClick={() => setShowKFactorConfirm(false)}
            >
              Okay
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setShowKFactorConfirm(false)}>close</button>
        </form>
      </dialog>
    </div>
  );
}
