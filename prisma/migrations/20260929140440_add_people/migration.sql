/*
  Warnings:

  - You are about to drop the column `lastSeenAt` on the `guest_token` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `guest_token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `guest_token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `guest_token` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "guest_token_personId_idx";

-- AlterTable
ALTER TABLE "group_member" ADD COLUMN     "addedById" TEXT;

-- AlterTable
ALTER TABLE "guest_token" DROP COLUMN "lastSeenAt",
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "usedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "app_rate_limit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_rate_limit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "app_rate_limit_windowStart_idx" ON "app_rate_limit"("windowStart");

-- CreateIndex
CREATE INDEX "group_member_addedById_idx" ON "group_member"("addedById");

-- CreateIndex
CREATE INDEX "guest_token_personId_usedAt_idx" ON "guest_token"("personId", "usedAt");

-- CreateIndex
CREATE INDEX "guest_token_groupId_idx" ON "guest_token"("groupId");

-- AddForeignKey
ALTER TABLE "guest_token" ADD CONSTRAINT "guest_token_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_token" ADD CONSTRAINT "guest_token_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "app_rate_limit" ENABLE ROW LEVEL SECURITY;
