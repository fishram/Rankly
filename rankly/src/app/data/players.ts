import { Player } from "../types/player";

let players: Player[] = [
  { id: "1", name: "Alice", eloScore: 1500 },
  { id: "2", name: "Bob", eloScore: 1500 },
];

export function getAllPlayers(): Player[] {
  return players;
}
