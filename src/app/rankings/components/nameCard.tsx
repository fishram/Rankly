interface NameCardProps {
  rank: number;
  player: {
    id: string;
    name: string;
    eloScore: number;
    wins: number;
    highestElo: number;
  };
  sortBy: "rank" | "matches" | "peak";
}

export default function NameCard({ rank, player, sortBy }: NameCardProps) {
  const getValue = () => {
    switch (sortBy) {
      case "matches":
        return `${player.wins} wins`;
      case "peak":
        return `${player.highestElo} SR`;
      case "rank":
      default:
        return `${player.eloScore} SR`;
    }
  };

  const getCardStyle = () => {
    switch (rank) {
      case 1:
        return "card shadow-xl w-full bg-gradient-to-r from-green-600 to-green-400 text-black w-11/12 mx-auto";
      default:
        return "card bg-base-200 shadow-xl w-11/12 mx-auto";
    }
  };

  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return "text-2xl font-bold tracking-wider w-8";
      default:
        return "text-xl font-semibold w-8";
    }
  };

  const getNameStyle = () => {
    switch (rank) {
      case 1:
        return "text-xl font-bold";
      default:
        return "text-xl font-medium";
    }
  };

  return (
    <div className={getCardStyle()}>
      <div className="card-body p-5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={getRankStyle()}>{rank}</div>
          <div className={getNameStyle()}>{player.name}</div>
        </div>
        <div className="text-xl font-bold">{getValue()}</div>
      </div>
    </div>
  );
}
