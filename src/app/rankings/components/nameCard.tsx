interface NameCardProps {
  rank: number;
  player: {
    id: string;
    name: string;
    eloScore: number;
    wins: number;
    highestElo: number;
  };
  sortBy: 'rank' | 'matches' | 'peak';
}

export default function NameCard({ rank, player, sortBy }: NameCardProps) {
  const getValue = () => {
    switch (sortBy) {
      case 'matches':
        return `${player.wins} wins`;
      case 'peak':
        return `${player.highestElo} SR`;
      case 'rank':
      default:
        return `${player.eloScore} SR`;
    }
  };

  const getCardStyle = () => {
    switch (rank) {
      case 1:
        return "card shadow-xl w-full bg-gradient-to-r from-yellow-600 to-yellow-400 text-black";
      case 2:
        return "card shadow-xl w-full bg-gradient-to-r from-slate-400 to-slate-300 text-black";
      case 3:
        return "card shadow-xl w-full bg-gradient-to-r from-amber-700 to-amber-600 text-black";
      default:
        return "card bg-base-200 shadow-xl w-full";
    }
  };

  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return "text-2xl font-extrabold w-8";
      case 2:
      case 3:
        return "text-xl font-bold w-8";
      default:
        return "text-xl font-bold w-8";
    }
  };

  return (
    <div className={getCardStyle()}>
      <div className="card-body p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={getRankStyle()}>{rank}</div>
          <div className="text-xl font-medium">{player.name}</div>
        </div>
        <div className="text-xl font-bold">{getValue()}</div>
      </div>
    </div>
  );
}
