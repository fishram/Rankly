import { NextResponse } from "next/server";
import { prisma }from "../../../../lib/prisma";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { NextRequest } from "next/server";

export async function GET(req: Request) {
  try {
    await prisma.$connect();
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error("Error fetching players:", {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      url: req.url
    });

    if (error instanceof Error && 
        (errorMessage.includes('Connection') || errorMessage.includes('timeout'))) {
      return NextResponse.json(
        { error: "Database connection error. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    await prisma.$connect();
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
        userId: token?.sub || null,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("Error creating player:", error);
    return NextResponse.json(
      { error: "Failed to create player" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req: NextRequest) {
  try {
    await prisma.$connect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, eloScore } = await req.json();

    if (!id || (!name && eloScore === undefined)) {
      return NextResponse.json(
        { error: "ID and at least one field to update are required" },
        { status: 400 }
      );
    }

    const player = await prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
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
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: Request) {
  try {
    await prisma.$connect();
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
  } finally {
    await prisma.$disconnect();
  }
}
