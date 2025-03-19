import { useEffect, useState } from "react";
import { Match } from "../types/match";

export function useFetchMatches(seasonId?: number, refreshKey: number = 0) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        // Add seasonId as a query parameter if provided
        const url = seasonId
          ? `/api/matches?seasonId=${seasonId}`
          : "/api/matches";

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Failed to fetch matches");
        }
        const data = await res.json();
        setMatches(data);
      } catch (err: unknown) {
        console.error("Failed to fetch matches:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [seasonId, refreshKey]);

  return { matches, loading, error };
}
