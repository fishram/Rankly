import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { NextRequest } from "next/server";

// GET: Fetch all seasons
export async function GET() {
  try {
    await prisma.$connect();

    const seasons = await prisma.season.findMany({
      orderBy: {
        startDate: "desc",
      },
      include: {
        _count: {
          select: {
            matches: true,
            playerStats: true,
          },
        },
      },
    });

    return NextResponse.json(seasons || []);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching seasons:", errorMessage);

    return NextResponse.json(
      { error: "Failed to fetch seasons" },
      { status: 500 }
    );
  }
}

// POST: Create a new season
export async function POST(req: NextRequest) {
  try {
    await prisma.$connect();

    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, startDate, resetOption } = await req.json();

    // Validate required fields
    if (!name || !startDate) {
      return NextResponse.json(
        { error: "Season name and start date are required" },
        { status: 400 }
      );
    }

    // Check if there's already an active season
    const existingActiveSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });

    // Start a transaction to handle season creation and player stats initialization
    const newSeason = await prisma.$transaction(async (tx) => {
      // If there's an active season, end it
      if (existingActiveSeason) {
        // End the current active season
        await tx.season.update({
          where: { id: existingActiveSeason.id },
          data: {
            isActive: false,
            endDate: new Date(),
          },
        });

        // Get all active players
        const activePlayers = await tx.player.findMany({
          where: { isActive: true },
        });

        // Finalize player stats for the ending season
        for (const player of activePlayers) {
          const existingStats = await tx.playerSeasonStats.findFirst({
            where: {
              playerId: player.id,
              seasonId: existingActiveSeason.id,
            },
          });

          if (existingStats) {
            await tx.playerSeasonStats.update({
              where: { id: existingStats.id },
              data: {
                finalElo: player.eloScore,
              },
            });
          }
        }
      }

      // Create the new season
      const season = await tx.season.create({
        data: {
          name,
          startDate: new Date(startDate),
          isActive: true,
        },
      });

      // Get all active players to create season stats entries
      const activePlayers = await tx.player.findMany({
        where: { isActive: true },
      });

      // Apply the appropriate ELO reset based on resetOption
      for (const player of activePlayers) {
        let initialElo = 1000; // Default for complete reset

        if (resetOption === "partial") {
          // Partial reset formula: (current ELO + 1000) / 2
          initialElo = Math.round((player.eloScore + 1000) / 2);
        } else if (resetOption === "none") {
          // No reset: keep current ELO
          initialElo = player.eloScore;
        }

        // Create player season stats entry
        await tx.playerSeasonStats.create({
          data: {
            playerId: player.id,
            seasonId: season.id,
            initialElo,
            highestElo: initialElo,
            wins: 0,
            losses: 0,
          },
        });

        // Update player's ELO if we're resetting (complete or partial)
        if (resetOption !== "none") {
          await tx.player.update({
            where: { id: player.id },
            data: {
              eloScore: initialElo,
              // Only reset highest ELO if doing complete reset
              highestElo:
                resetOption === "complete" ? initialElo : player.highestElo,
            },
          });
        }
      }

      return season;
    });

    return NextResponse.json(newSeason);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating season:", errorMessage);

    return NextResponse.json(
      { error: "Failed to create season" },
      { status: 500 }
    );
  }
}

// PUT: Update a season (e.g., end an active season)
export async function PUT(req: NextRequest) {
  try {
    await prisma.$connect();

    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, endDate } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Season ID is required" },
        { status: 400 }
      );
    }

    // Find the season to update
    const season = await prisma.season.findUnique({
      where: { id: Number(id) },
    });

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    // Update season in a transaction to handle ending a season
    const updatedSeason = await prisma.$transaction(async (tx) => {
      // Update the season
      const updated = await tx.season.update({
        where: { id: Number(id) },
        data: {
          endDate: endDate ? new Date(endDate) : undefined,
          isActive: endDate ? false : season.isActive,
        },
      });

      // If ending a season, update player season stats with finalElo
      if (endDate && season.isActive) {
        // Get all players with stats in this season
        const playerStats = await tx.playerSeasonStats.findMany({
          where: { seasonId: Number(id) },
          select: {
            id: true,
            playerId: true,
          },
        });

        // Update each player's season stats with their final ELO
        for (const stat of playerStats) {
          const player = await tx.player.findUnique({
            where: { id: stat.playerId },
            select: { eloScore: true },
          });

          if (player) {
            await tx.playerSeasonStats.update({
              where: { id: stat.id },
              data: { finalElo: player.eloScore },
            });
          }
        }
      }

      return updated;
    });

    return NextResponse.json(updatedSeason);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating season:", errorMessage);

    return NextResponse.json(
      { error: "Failed to update season" },
      { status: 500 }
    );
  }
}
