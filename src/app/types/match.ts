import { Player } from "./player";
import { Season } from "../hooks/useFetchSeasons";

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  winner: Player;
  date: Date;
  notes?: string;
  season?: Season;
  seasonId?: number;
}
