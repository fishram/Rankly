import { useEffect, useState } from "react";
import { Match } from "../types/match";

export function useFetchMatches() {
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
      } catch (err: any) {
        console.error("Failed to fetch matches:", err);
        setError(err.message);
      } finally {
        isLoading(false);
      }
    }
    fetchMatches();
  }, []);

  return { matches, loading, error };
} 