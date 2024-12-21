export default function calculateElo(
  player1Elo: number,
  player2Elo: number,
  winner: "player1" | "player2",
  kFactor: number
) {
  // Calculate expected scores
  const expectedScore1 =
    1 / (1 + Math.pow(10, (player2Elo - player1Elo) / 400));
  const expectedScore2 =
    1 / (1 + Math.pow(10, (player1Elo - player2Elo) / 400));

  // Actual scores based on winner
  const score1 = winner === "player1" ? 1 : 0;
  const score2 = winner === "player2" ? 1 : 0;

  // New Elo ratings
  const newPlayer1Elo = Math.round(player1Elo + kFactor * (score1 - expectedScore1));
  const newPlayer2Elo = Math.round(player2Elo + kFactor * (score2 - expectedScore2));

  // Return the new Elos and percentage changes
  const player1Change = newPlayer1Elo - player1Elo;
  const player2Change = newPlayer2Elo - player2Elo;

  return {
    newPlayer1Elo,
    newPlayer2Elo,
    player1Change,
    player2Change,
    player1WinProbability: Math.round(expectedScore1 * 100),
    player2WinProbability: Math.round(expectedScore2 * 100),
  };
}
