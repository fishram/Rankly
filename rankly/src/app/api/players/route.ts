import { getAllPlayers } from "@/app/data/players";

export async function GET() {
  return new Response(JSON.stringify(getAllPlayers()), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
