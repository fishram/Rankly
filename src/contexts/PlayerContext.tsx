import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useFetchPlayers } from '@/app/hooks/useFetchPlayers';

interface Player {
    id: string;
    name: string;
    eloScore: number;
    highestElo: number;
    wins: number;
    losses: number;
    userId?: string;
    isActive: boolean;
}

interface PlayerContextType {
    currentPlayer: Player | null;
    setCurrentPlayer: (player: Player | null) => void;
    loading: boolean;
    error: string | null;
    refreshPlayers: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const { data: session } = useSession();
    const { players, loading, error } = useFetchPlayers(refreshKey);

    const refreshPlayers = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    useEffect(() => {
        if (players && session?.user?.username) {
            const userPlayer = players.find(p => p.name === session.user.username);
            if (userPlayer) {
                setCurrentPlayer(userPlayer);
            }
        }
    }, [players, session]);

    return (
        <PlayerContext.Provider value={{ 
            currentPlayer, 
            setCurrentPlayer,
            loading,
            error,
            refreshPlayers
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
}