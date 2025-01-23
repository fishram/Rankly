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
        return "card shadow-xl bg-accent text-accent-content w-11/12 mx-auto relative shadow-[0_0_15px_6px_rgba(74,222,128,0.5)]";
      case 2:
        return "card shadow-xl bg-secondary text-secondary-content w-11/12 mx-auto";
      case 3:
        return "card shadow-xl bg-primary text-primary-content w-11/12 mx-auto";
      default:
        return "card bg-base-200 shadow-xl w-11/12 mx-auto";
    }
  };

  const getRankStyle = () => {
    switch (rank) {
      case 1:
      case 2:
      case 3:
        return "text-2xl font-bold tracking-wider w-8";
      default:
        return "text-xl font-semibold w-8";
    }
  };

  const getNameStyle = () => {
    switch (rank) {
      case 1:
      case 2:
      case 3:
        return "text-xl font-bold";
      default:
        return "text-xl font-medium";
    }
  };

  return (
    <div className={getCardStyle()}>
      {rank === 1 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="assets/crown.png"
          alt="Crown"
          className="absolute -top-7 -left-5 w-12 h-12 transform -rotate-[35deg]"
        />
      )}
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
