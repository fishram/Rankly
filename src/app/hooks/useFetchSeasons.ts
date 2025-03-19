import { useEffect, useState } from "react";

export interface Season {
  id: number;
  name: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  _count?: {
    matches: number;
    playerStats: number;
  };
}

export function useFetchSeasons() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSeasons() {
      try {
        const res = await fetch("/api/seasons");
        if (!res.ok) {
          throw new Error("Failed to fetch seasons");
        }
        const data = await res.json();
        setSeasons(data);
      } catch (err: unknown) {
        console.error("Failed to fetch seasons:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchSeasons();
  }, []);

  return { seasons, loading, error };
}
