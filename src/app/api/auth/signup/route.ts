import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    await prisma.$connect();
    const { email, password, username } = await req.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Email, password, and username are required" },
        { status: 400 }
      );
    }

    // Check if user already exists (email)
    const existingUserEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Check if username is taken
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    // Check if player with that name already exists
    const existingPlayer = await prisma.player.findUnique({
      where: { name: username },
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: "Player with that name already exists" },
        { status: 400 }
      );
    }

    // Find the max player ID to avoid conflicts
    type MaxIdResult = { max_id: number | null };
    const maxPlayerIdResult = await prisma.$queryRaw<MaxIdResult[]>`
      SELECT MAX(id) as max_id FROM "Player"
    `;
    const maxPlayerId = maxPlayerIdResult[0]?.max_id || 0;
    console.log("Current max player ID:", maxPlayerId);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    // Create a player with explicit ID to avoid conflicts
    const player = await prisma.$executeRaw`
      INSERT INTO "Player" (id, name, "eloScore", "highestElo", wins, losses, "isActive", "userId")
      VALUES (${maxPlayerId + 1}, ${username}, 1000, 1000, 0, 0, true, ${
      user.id
    })
      RETURNING *
    `;

    console.log("Player created with raw SQL:", player);

    // Get the created player
    const createdPlayer = await prisma.player.findUnique({
      where: { name: username },
    });

    if (!createdPlayer) {
      throw new Error("Failed to create player");
    }

    // Find active season if any
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });

    // If there is an active season, create player season stats
    if (activeSeason && createdPlayer) {
      await prisma.playerSeasonStats.create({
        data: {
          playerId: createdPlayer.id,
          seasonId: activeSeason.id,
          initialElo: 1000,
          highestElo: 1000,
          wins: 0,
          losses: 0,
        },
      });
    }

    const result = {
      user,
      player: createdPlayer,
      season: activeSeason ? { id: activeSeason.id } : null,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(
      "Error in signup:",
      error instanceof Error ? error.message : String(error)
    );

    // More specific error message for unique constraint failures
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return NextResponse.json(
        {
          error: "A user or player with this information already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Error creating user: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
