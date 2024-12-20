import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET() {
  const players = await prisma.player.findMany({
    select: {
      id: true,
      name: true,
      eloScore: true,
    },
  });
  return NextResponse.json(players);
}
