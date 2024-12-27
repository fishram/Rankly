export interface Player {
  id: string;
  name: string;
  eloScore: number;
  highestElo: number;
  wins: number;
  losses: number;
  userId?: string;
  isActive: boolean;
}
