-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "eloScore" INTEGER NOT NULL DEFAULT 1000,
    "highestElo" INTEGER NOT NULL DEFAULT 1000,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "winnerId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "seasonId" INTEGER NOT NULL,
    "player1EloChange" INTEGER,
    "player2EloChange" INTEGER,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "kFactor" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSeasonStats" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "initialElo" INTEGER NOT NULL DEFAULT 1000,
    "finalElo" INTEGER,
    "highestElo" INTEGER NOT NULL DEFAULT 1000,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerSeasonStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_name_key" ON "Player"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Season_name_key" ON "Season"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonStats_playerId_seasonId_key" ON "PlayerSeasonStats"("playerId", "seasonId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonStats" ADD CONSTRAINT "PlayerSeasonStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonStats" ADD CONSTRAINT "PlayerSeasonStats_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
