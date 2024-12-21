import { NextResponse } from "next/server";

let kFactor = 50; // Default K-factor

export async function GET() {
  return NextResponse.json({ kFactor });
}

export async function PUT(req: Request) {
  try {
    const { kFactor: newKFactor } = await req.json();

    if (typeof newKFactor !== 'number' || newKFactor < 1 || newKFactor > 100) {
      return NextResponse.json(
        { error: "K-factor must be a number between 1 and 100" },
        { status: 400 }
      );
    }

    kFactor = newKFactor;
    return NextResponse.json({ kFactor });
  } catch (error) {
    console.error("Error updating K-factor:", error);
    return NextResponse.json(
      { error: "Failed to update K-factor" },
      { status: 500 }
    );
  }
} 