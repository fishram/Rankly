import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function PUT(request: Request) {
  try {
    await prisma.$connect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isActive } = await request.json();
    const id = request.url.split('/').pop();
    const playerId = parseInt(id!);

    if (isActive === undefined) {
      return NextResponse.json(
        { error: "isActive status is required" },
        { status: 400 }
      );
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: { isActive },
    });

    return NextResponse.json(updatedPlayer);
  } catch (error) {
    console.error("Error updating player status:", error);
    return NextResponse.json(
      { error: "Failed to update player status" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
