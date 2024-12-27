import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    await prisma.$connect();
    // Get the first settings record or create it if it doesn't exist
    const settings = await prisma.settings.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        kFactor: 50
      }
    });

    return NextResponse.json({ kFactor: settings.kFactor });
  } catch (error) {
    console.error("Error fetching K-factor:", error);
    return NextResponse.json(
      { error: "Failed to fetch K-factor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req: Request) {
  try {
    await prisma.$connect();
    const { kFactor: newKFactor } = await req.json();

    if (typeof newKFactor !== 'number' || newKFactor < 1 || newKFactor > 100) {
      return NextResponse.json(
        { error: "K-factor must be a number between 1 and 100" },
        { status: 400 }
      );
    }

    const settings = await prisma.settings.upsert({
      where: { id: "default" },
      update: { kFactor: newKFactor },
      create: {
        id: "default",
        kFactor: newKFactor
      }
    });

    return NextResponse.json({ kFactor: settings.kFactor });
  } catch (error) {
    console.error("Error updating K-factor:", error);
    return NextResponse.json(
      { error: "Failed to update K-factor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 