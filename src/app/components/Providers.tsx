"use client";

import { SessionProvider } from "next-auth/react";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { SeasonProvider } from "@/contexts/SeasonContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PlayerProvider>
        <SeasonProvider>{children}</SeasonProvider>
      </PlayerProvider>
    </SessionProvider>
  );
}
