import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { Season } from "@/app/hooks/useFetchSeasons";

interface SeasonContextType {
  seasons: Season[];
  currentSeason: Season | null;
  loading: boolean;
  error: string | null;
  refreshSeasons: () => void;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshSeasons = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    async function fetchSeasons() {
      try {
        setLoading(true);
        const res = await fetch("/api/seasons");
        if (!res.ok) {
          throw new Error("Failed to fetch seasons");
        }
        const data = await res.json();
        setSeasons(data);

        // Set current season
        const activeSeason = data.find((season: Season) => season.isActive);
        if (activeSeason) {
          setCurrentSeason(activeSeason);
        }
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
  }, [refreshKey]);

  return (
    <SeasonContext.Provider
      value={{
        seasons,
        currentSeason,
        loading,
        error,
        refreshSeasons,
      }}
    >
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const context = useContext(SeasonContext);
  if (context === undefined) {
    throw new Error("useSeason must be used within a SeasonProvider");
  }
  return context;
}
