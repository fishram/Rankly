import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";



export async function GET() {
  try {
    const players = await prisma.player.findMany({
      select: {
        id: true,
        name: true,
        eloScore: true,
        highestElo: true,
        wins: true,
        losses: true,
      }
    });
    return NextResponse.json(players || []);
  } catch (_) {
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
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

export async function PUT(req: Request) {
  try {
    const { id, name, eloScore } = await req.json();

    if (!id || (!name && eloScore === undefined)) {
      return NextResponse.json(
        { error: "ID and at least one field to update are required" },
        { status: 400 }
      );
    }

    const updateData: { name?: string; eloScore?: number } = {};
    if (name) updateData.name = name;
    if (eloScore !== undefined) updateData.eloScore = eloScore;

    const player = await prisma.player.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(player);
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
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    await prisma.player.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Player deleted successfully" });
  } catch (error) {
    console.error("Error deleting player:", error);
    return NextResponse.json(
      { error: "Failed to delete player" },
      { status: 500 }
    );
  }
}
