import { useEffect, useState } from "react";
import { Player } from "../types/player";
import { getErrorMessage } from "../utils/errorHandling";

export function useFetchPlayerSeasonStats(seasonId: number | null) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      // Reset states
      setLoading(true);
      setError(null);

      // If no season ID, return empty array
      if (!seasonId) {
        setPlayers([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/players/seasonStats?seasonId=${seasonId}`
        );
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setPlayers(data);
      } catch (err: unknown) {
        console.error("Failed to fetch player season stats:", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchPlayers();
  }, [seasonId]);

  return { players, loading, error };
}
