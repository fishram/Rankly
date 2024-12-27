import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      username: 'demo',
      password: await bcrypt.hash('demo123', 10),
    },
  });

  // Create some initial players
  const players = [
    { name: 'Magnus Carlsen', eloScore: 1200 },
    { name: 'Garry Kasparov', eloScore: 1150 },
    { name: 'Bobby Fischer', eloScore: 1100 },
    { name: 'Anatoly Karpov', eloScore: 1050 },
  ];

  for (const player of players) {
    await prisma.player.upsert({
      where: { name: player.name },
      update: {},
      create: {
        name: player.name,
        eloScore: player.eloScore,
        highestElo: player.eloScore,
      },
    });
  }

  // Create some sample matches
  const allPlayers = await prisma.player.findMany();
  
  for (let i = 0; i < allPlayers.length - 1; i++) {
    await prisma.match.create({
      data: {
        player1Id: allPlayers[i].id,
        player2Id: allPlayers[i + 1].id,
        winnerId: allPlayers[i].id,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Past few days
      },
    });
  }

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 