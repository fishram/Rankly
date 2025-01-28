import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { prisma } from "../../../../../lib/prisma";

export async function PUT(request: Request) {
  try {
    await prisma.$connect();
    const session = await getServerSession(authOptions);
    console.log("Current session in API:", session);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();
    const { name } = data;
    console.log("Received update request for name:", name);

    if (!name || typeof name !== "string") {
      return new NextResponse("Invalid name", { status: 400 });
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        username: name,
        NOT: {
          email: session.user.email,
        },
      },
    });
    console.log("Existing user check result:", existingUser);

    if (existingUser) {
      return new NextResponse("Username already taken", { status: 400 });
    }

    // First, verify current state
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { players: true },
    });
    console.log("Current user state:", currentUser);

    // Update the user's name and their associated players
    console.log("Attempting to update user with email:", session.user.email);
    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        username: name,
        players: {
          updateMany: {
            where: {
              userId: session.user.id,
            },
            data: {
              name: name,
            },
          },
        },
      },
      include: {
        players: true,
      },
    });
    console.log("Update result:", updatedUser);

    // Verify the update
    const verifyUpdate = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { players: true },
    });
    console.log("Verification after update:", verifyUpdate);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user settings:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
