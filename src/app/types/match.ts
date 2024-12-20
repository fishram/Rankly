import { Player } from "./player";

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  winner: Player;
  date: Date;
  notes?: string;
}
