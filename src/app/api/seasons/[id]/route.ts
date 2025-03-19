import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

// GET: Fetch a specific season with detailed stats
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.$connect();
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid season ID" }, { status: 400 });
    }

    // Get the season with detailed information
    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        matches: {
          select: {
            id: true,
            date: true,
            player1: { select: { id: true, name: true } },
            player2: { select: { id: true, name: true } },
            winner: { select: { id: true, name: true } },
            player1EloChange: true,
            player2EloChange: true,
          },
          orderBy: { date: "desc" },
        },
        playerStats: {
          include: {
            player: { select: { id: true, name: true, isActive: true } },
          },
          orderBy: [{ finalElo: "desc" }, { initialElo: "desc" }],
        },
        _count: {
          select: {
            matches: true,
            playerStats: true,
          },
        },
      },
    });

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    return NextResponse.json(season);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`Error fetching season ${params.id}:`, errorMessage);

    return NextResponse.json(
      { error: "Failed to fetch season" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a season and all its related data
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.$connect();

    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid season ID" }, { status: 400 });
    }

    // Check if season exists
    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    // Only allow deletion of seasons with no matches
    if (season._count.matches > 0) {
      return NextResponse.json(
        { error: "Cannot delete a season with existing matches" },
        { status: 409 }
      );
    }

    // Delete in a transaction to ensure all related data is cleaned up
    await prisma.$transaction(async (tx) => {
      // First delete all player season stats for this season
      await tx.playerSeasonStats.deleteMany({
        where: { seasonId: id },
      });

      // Then delete the season itself
      await tx.season.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`Error deleting season ${params.id}:`, errorMessage);

    return NextResponse.json(
      { error: "Failed to delete season" },
      { status: 500 }
    );
  }
}
