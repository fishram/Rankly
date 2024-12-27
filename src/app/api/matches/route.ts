import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { player1Id, player2Id, winnerId, newPlayer1Elo, newPlayer2Elo, date } = await req.json();

    // Verify player1 belongs to the authenticated user
    const player1 = await prisma.player.findUnique({
      where: { id: player1Id },
      select: { userId: true }
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
      const currentPlayer1 = await tx.player.findUnique({ where: { id: player1Id } });
      const currentPlayer2 = await tx.player.findUnique({ where: { id: player2Id } });

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
          losses: winnerId !== player1Id ? { increment: 1 } : currentPlayer1.losses,
        },
      });

      // Update player2
      await tx.player.update({
        where: { id: player2Id },
        data: {
          eloScore: newPlayer2Elo,
          highestElo: Math.max(newPlayer2Elo, currentPlayer2.highestElo),
          wins: winnerId === player2Id ? { increment: 1 } : currentPlayer2.wins,
          losses: winnerId !== player2Id ? { increment: 1 } : currentPlayer2.losses,
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
  }
}

export async function GET() {
  const matches = await prisma.match.findMany({
    include: {
      player1: true,
      player2: true,
      winner: true,
    },
    orderBy: {
      date: 'desc'
    }
  });
  
  return NextResponse.json(matches);
}