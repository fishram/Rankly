import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { NextRequest } from "next/server";

// GET: Fetch player stats for a specific season
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const seasonId = url.searchParams.get("seasonId");

    if (!seasonId) {
      return NextResponse.json(
        { error: "Season ID is required" },
        { status: 400 }
      );
    }

    await prisma.$connect();

    // Get all players with their season stats
    const playerStats = await prisma.player.findMany({
      where: {
        isActive: true,
      },
      include: {
        seasonStats: {
          where: {
            seasonId: parseInt(seasonId),
          },
        },
      },
    });

    // Format response to include season-specific data AND filter out players with no matches
    const formattedPlayers = playerStats
      .map((player) => {
        const seasonStat = player.seasonStats[0];

        // If no season stats or no matches played, return null (will be filtered out)
        if (!seasonStat || (seasonStat.wins === 0 && seasonStat.losses === 0)) {
          return null;
        }

        return {
          id: player.id,
          name: player.name,
          isActive: player.isActive,
          // Use season-specific stats if available, otherwise use default values
          eloScore: seasonStat
            ? seasonStat.finalElo || player.eloScore
            : player.eloScore,
          highestElo: seasonStat ? seasonStat.highestElo : player.highestElo,
          wins: seasonStat ? seasonStat.wins : player.wins,
          losses: seasonStat ? seasonStat.losses : player.losses,
          // Include season-specific fields
          initialElo: seasonStat ? seasonStat.initialElo : 1000,
          finalElo: seasonStat ? seasonStat.finalElo : null,
        };
      })
      .filter(
        (player): player is NonNullable<typeof player> => player !== null
      );

    return NextResponse.json(formattedPlayers);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching player season stats:", errorMessage);

    return NextResponse.json(
      { error: "Failed to fetch player season stats" },
      { status: 500 }
    );
  }
}
