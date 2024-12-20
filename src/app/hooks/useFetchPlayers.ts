import { useEffect, useState } from "react";
import { Player } from "../types/player";

export function useFetchPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, isLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await fetch("/api/players");
        if (!res.ok) {
          throw new Error("Failed to fetch players");
        }
        const data = await res.json();
        setPlayers(data);
      } catch (err: any) {
        console.error("Failed to fetch players:", err);
        setError(err.message);
      } finally {
        isLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  return { players, loading, error, setPlayers };
}
