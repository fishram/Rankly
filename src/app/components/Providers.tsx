'use client';

import { SessionProvider } from 'next-auth/react';
import { PlayerProvider } from '@/contexts/PlayerContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PlayerProvider>
        {children}
      </PlayerProvider>
    </SessionProvider>
  );
} 