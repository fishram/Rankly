import { useState, useEffect } from 'react';

export function useKFactor() {
  const [kFactor, setKFactor] = useState<number>(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKFactor() {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) {
          throw new Error('Failed to fetch K-factor');
        }
        const data = await res.json();
        setKFactor(data.kFactor);
      } catch (err: unknown) {
        console.error('Failed to fetch K-factor:', err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchKFactor();
  }, []);

  const updateKFactor = async (newKFactor: number) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kFactor: newKFactor }),
      });

      if (!res.ok) {
        throw new Error('Failed to update K-factor');
      }

      const data = await res.json();
      setKFactor(data.kFactor);
      return true;
    } catch (err: unknown) {
      console.error('Failed to update K-factor:', err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      return false;
    }
  };

  return { kFactor, loading, error, updateKFactor };
} 