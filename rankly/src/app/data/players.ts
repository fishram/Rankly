import { Player } from "../types/player";

let players: Player[] = [
  { id: "1", name: "Fisher", eloScore: 1500, wins: 0, losses: 0 },
  { id: "2", name: "Bryce", eloScore: 1500, wins: 0, losses: 0 },
  { id: "3", name: "Aaron", eloScore: 1500, wins: 0, losses: 0 },
  { id: "4", name: "Cooper", eloScore: 1500, wins: 0, losses: 0 },
  { id: "5", name: "Jacob", eloScore: 1500, wins: 0, losses: 0 },
];

export function getAllPlayers(): Player[] {
  return players;
}
