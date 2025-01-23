import { useEffect, useState } from "react";
import { Match } from "../types/match";

export function useFetchMatches(refreshKey: number = 0) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, isLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch("/api/matches");
        if (!res.ok) {
          throw new Error("Failed to fetch matches");
        }
        const data = await res.json();
        setMatches(data);
      } catch (err: unknown) {
        console.error("Failed to fetch matches:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        isLoading(false);
      }
    }
    fetchMatches();
  }, [refreshKey]);

  return { matches, loading, error };
} 