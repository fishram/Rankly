import { createContext, useContext, useState, ReactNode } from 'react';

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
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

    return (
        <PlayerContext.Provider value={{ currentPlayer, setCurrentPlayer }}>
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