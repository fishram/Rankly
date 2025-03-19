import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function POST() {
  try {
    await prisma.$connect();

    // Verify admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // First, get the current max ID value
    const maxIdResult = await prisma.$queryRaw<[{ max: number | null }]>`
      SELECT MAX(id) FROM "Match"
    `;
    const maxId = maxIdResult[0]?.max || 0;

    // Reset the Match sequence
    await prisma.$queryRaw`
      SELECT setval('"Match_id_seq"', ${maxId + 1}, false);
    `;

    return NextResponse.json({
      success: true,
      message: "Match table sequence has been reset",
      newSequenceValue: maxId + 1,
    });
  } catch (error) {
    console.error("Error fixing sequence:", error);
    return NextResponse.json(
      { error: "Failed to fix sequence" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
