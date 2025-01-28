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

    // Create the match
    const match = await prisma.$transaction(async (tx) => {
      // Get current player data
      const currentPlayer1 = await tx.player.findUnique({
        where: { id: player1Id },
      });
      const currentPlayer2 = await tx.player.findUnique({
        where: { id: player2Id },
      });

      if (!currentPlayer1 || !currentPlayer2) {
        throw new Error("Players not found");
      }

      // Update player1
      await tx.player.update({
        where: { id: player1Id },
        data: {
          eloScore: newPlayer1Elo,
          highestElo: Math.max(newPlayer1Elo, currentPlayer1.highestElo),
          wins: winnerId === player1Id ? { increment: 1 } : currentPlayer1.wins,
          losses:
            winnerId !== player1Id ? { increment: 1 } : currentPlayer1.losses,
        },
      });

      // Update player2
      await tx.player.update({
        where: { id: player2Id },
        data: {
          eloScore: newPlayer2Elo,
          highestElo: Math.max(newPlayer2Elo, currentPlayer2.highestElo),
          wins: winnerId === player2Id ? { increment: 1 } : currentPlayer2.wins,
          losses:
            winnerId !== player2Id ? { increment: 1 } : currentPlayer2.losses,
        },
      });

      // Create the match record
      return await tx.match.create({
        data: {
          player1Id,
          player2Id,
          winnerId,
          date,
        },
        include: {
          player1: true,
          player2: true,
          winner: true,
        },
      });
    });

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json(
      { error: "Failed to create match" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    await prisma.$connect();
    const matches = await prisma.match.findMany({
      include: {
        player1: true,
        player2: true,
        winner: true,
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
        where: { id: match.player1.id },
        data: {
          eloScore: player1Elo, // Use the provided previous Elo
          wins:
            match.winnerId === match.player1.id
              ? { decrement: 1 }
              : match.player1.wins,
          losses:
            match.winnerId !== match.player1.id
              ? { decrement: 1 }
              : match.player1.losses,
        },
      });

      // Update player2 stats with previous Elo
      await tx.player.update({
        where: { id: match.player2.id },
        data: {
          eloScore: player2Elo, // Use the provided previous Elo
          wins:
            match.winnerId === match.player2.id
              ? { decrement: 1 }
              : match.player2.wins,
          losses:
            match.winnerId !== match.player2.id
              ? { decrement: 1 }
              : match.player2.losses,
        },
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error undoing match:", error);
    return NextResponse.json(
      { error: "Failed to undo match" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
