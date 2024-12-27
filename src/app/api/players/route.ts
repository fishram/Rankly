import { NextResponse } from "next/server";
import { prisma }from "../../../../lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const players = await prisma.player.findMany({
      where: {
        isActive: includeInactive ? undefined : true
      },
      select: {
        id: true,
        name: true,
        eloScore: true,
        highestElo: true,
        wins: true,
        losses: true,
        userId: true,
        isActive: true,
      }
    });
    return NextResponse.json(players || []);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const { name, eloScore } = await req.json();

    if (!name || !eloScore) {
      return NextResponse.json(
        { error: "Name and ELO score are required" },
        { status: 400 }
      );
    }

    const player = await prisma.player.create({
      data: {
        name,
        eloScore,
        highestElo: eloScore,
        userId: token?.sub || null, // Associate player with current user
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("Error creating player:", error);
    return NextResponse.json(
      { error: "Failed to create player" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const { id, name, eloScore } = await req.json();

    if (!id || (!name && eloScore === undefined)) {
      return NextResponse.json(
        { error: "ID and at least one field to update are required" },
        { status: 400 }
      );
    }

    // Check if user owns this player or if player has no owner
    const player = await prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    if (player.userId && player.userId !== token?.sub) {
      return NextResponse.json(
        { error: "Unauthorized to modify this player" },
        { status: 403 }
      );
    }

    const updateData: { name?: string; eloScore?: number } = {};
    if (name) updateData.name = name;
    if (eloScore !== undefined) updateData.eloScore = eloScore;

    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedPlayer);
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('id');

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    const player = await prisma.player.update({
      where: { id: parseInt(playerId) },
      data: { isActive: false }
    });

    return NextResponse.json({ message: "Player marked as inactive", player });
  } catch (error) {
    console.error("Error marking player as inactive:", error);
    return NextResponse.json(
      { error: "Failed to mark player as inactive" },
      { status: 500 }
    );
  }
}
