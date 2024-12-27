import { useEffect, useState } from "react";
import { Player } from "../types/player";
import { getErrorMessage } from '../utils/errorHandling';

export function useFetchPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await fetch("/api/players");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setPlayers(data);
      } catch (err: unknown) {
        console.error("Failed to fetch players:", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  return { players, loading, error, setPlayers };
}

export function useFetchAllPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await fetch("/api/players?includeInactive=true");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setPlayers(data);
      } catch (err: unknown) {
        console.error("Failed to fetch all players:", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  return { players, loading, error };
}
