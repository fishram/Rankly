import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    // Parse the request body
    const {
      player1Id,
      player2Id,
      winnerId,
      newPlayer1Elo,
      newPlayer2Elo,
      date,
      notes,
    } = await req.json();

    // Validate the input
    if (
      !player1Id ||
      !player2Id ||
      !winnerId ||
      !newPlayer1Elo ||
      !newPlayer2Elo ||
      !date
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Start a database transaction
    const result = await prisma.$transaction([
      // Update Player 1's Elo
      prisma.player.update({
        where: { id: player1Id },
        data: { eloScore: newPlayer1Elo },
      }),
      // Update Player 2's Elo
      prisma.player.update({
        where: { id: player2Id },
        data: { eloScore: newPlayer2Elo },
      }),
      // Log the match
      prisma.match.create({
        data: {
          player1Id,
          player2Id,
          winnerId,
          date: new Date(date),
          notes,
        },
      }),
    ]);

    return NextResponse.json(
      { message: "Match recorded successfully.", result },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "An error occurred while recording the match." },
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