import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

export async function POST(req: Request) {
  try {
    await prisma.$connect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      player1Id,
      player2Id,
      winnerId,
      newPlayer1Elo,
      newPlayer2Elo,
      date,
    } = await req.json();

    // Verify player1 belongs to the authenticated user
    const player1 = await prisma.player.findUnique({
      where: { id: player1Id },
      select: { userId: true },
    });

    if (!player1 || player1.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only create matches where you are player1" },
        { status: 403 }
      );
    }

    // Get the active season
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });

    if (!activeSeason) {
      return NextResponse.json(
        {
          error:
            "No active season found. Please create a season before recording matches.",
        },
        { status: 400 }
      );
    }

    // Get current players to calculate ELO changes
    const currentPlayer1 = await prisma.player.findUnique({
      where: { id: player1Id },
    });
    const currentPlayer2 = await prisma.player.findUnique({
      where: { id: player2Id },
    });

    if (!currentPlayer1 || !currentPlayer2) {
      return NextResponse.json(
        { error: "One or both players not found" },
        { status: 404 }
      );
    }

    // Calculate ELO changes
    const player1EloChange = newPlayer1Elo - currentPlayer1.eloScore;
    const player2EloChange = newPlayer2Elo - currentPlayer2.eloScore;

    // Create the match with a retry mechanism
    let match;
    let retries = 0;
    const MAX_RETRIES = 3;

    while (retries < MAX_RETRIES) {
      try {
        match = await prisma.$transaction(async (tx) => {
          // Update player1
          await tx.player.update({
            where: { id: player1Id },
            data: {
              eloScore: newPlayer1Elo,
              highestElo: Math.max(newPlayer1Elo, currentPlayer1.highestElo),
              wins:
                winnerId === player1Id ? { increment: 1 } : currentPlayer1.wins,
              losses:
                winnerId !== player1Id
                  ? { increment: 1 }
                  : currentPlayer1.losses,
            },
          });

          // Update player2
          await tx.player.update({
            where: { id: player2Id },
            data: {
              eloScore: newPlayer2Elo,
              highestElo: Math.max(newPlayer2Elo, currentPlayer2.highestElo),
              wins:
                winnerId === player2Id ? { increment: 1 } : currentPlayer2.wins,
              losses:
                winnerId !== player2Id
                  ? { increment: 1 }
                  : currentPlayer2.losses,
            },
          });

          // Update player1's season stats
          const player1SeasonStats = await tx.playerSeasonStats.findFirst({
            where: {
              playerId: player1Id,
              seasonId: activeSeason.id,
            },
          });

          if (player1SeasonStats) {
            await tx.playerSeasonStats.update({
              where: { id: player1SeasonStats.id },
              data: {
                highestElo: Math.max(
                  newPlayer1Elo,
                  player1SeasonStats.highestElo
                ),
                wins:
                  winnerId === player1Id
                    ? { increment: 1 }
                    : player1SeasonStats.wins,
                losses:
                  winnerId !== player1Id
                    ? { increment: 1 }
                    : player1SeasonStats.losses,
              },
            });
          } else {
            // Create season stats if they don't exist (new player in this season)
            await tx.playerSeasonStats.create({
              data: {
                playerId: player1Id,
                seasonId: activeSeason.id,
                initialElo: currentPlayer1.eloScore,
                highestElo: newPlayer1Elo,
                wins: winnerId === player1Id ? 1 : 0,
                losses: winnerId !== player1Id ? 1 : 0,
              },
            });
          }

          // Update player2's season stats
          const player2SeasonStats = await tx.playerSeasonStats.findFirst({
            where: {
              playerId: player2Id,
              seasonId: activeSeason.id,
            },
          });

          if (player2SeasonStats) {
            await tx.playerSeasonStats.update({
              where: { id: player2SeasonStats.id },
              data: {
                highestElo: Math.max(
                  newPlayer2Elo,
                  player2SeasonStats.highestElo
                ),
                wins:
                  winnerId === player2Id
                    ? { increment: 1 }
                    : player2SeasonStats.wins,
                losses:
                  winnerId !== player2Id
                    ? { increment: 1 }
                    : player2SeasonStats.losses,
              },
            });
          } else {
            // Create season stats if they don't exist (new player in this season)
            await tx.playerSeasonStats.create({
              data: {
                playerId: player2Id,
                seasonId: activeSeason.id,
                initialElo: currentPlayer2.eloScore,
                highestElo: newPlayer2Elo,
                wins: winnerId === player2Id ? 1 : 0,
                losses: winnerId !== player2Id ? 1 : 0,
              },
            });
          }

          // Create the match record with season information
          return await tx.match.create({
            data: {
              player1Id,
              player2Id,
              winnerId,
              date,
              seasonId: activeSeason.id,
              player1EloChange,
              player2EloChange,
            },
            include: {
              player1: true,
              player2: true,
              winner: true,
              season: true,
            },
          });
        });

        // If we reach here, match was created successfully
        break;
      } catch (err) {
        // If it's a unique constraint error, retry
        if (
          err instanceof Error &&
          err.message.includes("Unique constraint failed on the fields")
        ) {
          retries++;
          // Wait a short time before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * Math.pow(2, retries))
          );

          if (retries >= MAX_RETRIES) {
            throw new Error(
              "Failed to create match after multiple attempts: " + err.message
            );
          }
        } else {
          // For other errors, just throw
          throw err;
        }
      }
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error(
      "Error creating match:",
      error instanceof Error ? error.message : String(error)
    );
    // Check for Prisma unique constraint error
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed on the fields")
    ) {
      return NextResponse.json(
        { error: "A match with this ID already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create match" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(req: Request) {
  try {
    await prisma.$connect();

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId");

    // Build the query
    const where = seasonId ? { seasonId: parseInt(seasonId) } : {};

    const matches = await prisma.match.findMany({
      where,
      include: {
        player1: true,
        player2: true,
        winner: true,
        season: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: Request) {
  try {
    await prisma.$connect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const matchIdStr = searchParams.get("id");
    const player1EloStr = searchParams.get("player1Elo");
    const player2EloStr = searchParams.get("player2Elo");

    if (!matchIdStr || !player1EloStr || !player2EloStr) {
      return NextResponse.json(
        { error: "Match ID and previous Elo scores are required" },
        { status: 400 }
      );
    }

    const matchId = parseInt(matchIdStr);
    const player1Elo = parseInt(player1EloStr);
    const player2Elo = parseInt(player2EloStr);

    if (isNaN(matchId) || isNaN(player1Elo) || isNaN(player2Elo)) {
      return NextResponse.json(
        { error: "Invalid match ID or Elo scores" },
        { status: 400 }
      );
    }

    // Get the match details and player data before deletion
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: {
          select: {
            id: true,
            wins: true,
            losses: true,
            userId: true,
          },
        },
        player2: {
          select: {
            id: true,
            wins: true,
            losses: true,
          },
        },
        season: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify the requesting user is player1 (who created the match)
    if (match.player1.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only undo matches where you are player1" },
        { status: 403 }
      );
    }

    // Delete the match and update player stats in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete the match
      await tx.match.delete({
        where: { id: matchId },
      });

      // Update player1 stats with previous Elo
      await tx.player.update({
        where: { id: match.player1Id },
        data: {
          eloScore: player1Elo,
          wins:
            match.winnerId === match.player1Id
              ? { decrement: 1 }
              : match.player1.wins,
          losses:
            match.winnerId !== match.player1Id
              ? { decrement: 1 }
              : match.player1.losses,
        },
      });

      // Update player2 stats with previous Elo
      await tx.player.update({
        where: { id: match.player2Id },
        data: {
          eloScore: player2Elo,
          wins:
            match.winnerId === match.player2Id
              ? { decrement: 1 }
              : match.player2.wins,
          losses:
            match.winnerId !== match.player2Id
              ? { decrement: 1 }
              : match.player2.losses,
        },
      });

      // Update player1's season stats
      const player1SeasonStats = await tx.playerSeasonStats.findFirst({
        where: {
          playerId: match.player1Id,
          seasonId: match.seasonId,
        },
      });

      if (player1SeasonStats) {
        await tx.playerSeasonStats.update({
          where: { id: player1SeasonStats.id },
          data: {
            wins:
              match.winnerId === match.player1Id
                ? { decrement: 1 }
                : player1SeasonStats.wins,
            losses:
              match.winnerId !== match.player1Id
                ? { decrement: 1 }
                : player1SeasonStats.losses,
            // Note: We don't adjust highestElo as we can't be sure if this was the match that set it
          },
        });
      }

      // Update player2's season stats
      const player2SeasonStats = await tx.playerSeasonStats.findFirst({
        where: {
          playerId: match.player2Id,
          seasonId: match.seasonId,
        },
      });

      if (player2SeasonStats) {
        await tx.playerSeasonStats.update({
          where: { id: player2SeasonStats.id },
          data: {
            wins:
              match.winnerId === match.player2Id
                ? { decrement: 1 }
                : player2SeasonStats.wins,
            losses:
              match.winnerId !== match.player2Id
                ? { decrement: 1 }
                : player2SeasonStats.losses,
            // Note: We don't adjust highestElo as we can't be sure if this was the match that set it
          },
        });
      }

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json(
      { error: "Failed to delete match" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
