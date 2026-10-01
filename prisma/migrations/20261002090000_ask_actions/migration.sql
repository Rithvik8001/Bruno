-- AlterEnum
ALTER TYPE "AskStatus" ADD VALUE 'PROPOSED';

-- CreateEnum
CREATE TYPE "AskActionStatus" AS ENUM ('PROPOSED', 'EXECUTING', 'DONE', 'CANCELLED', 'FAILED', 'UNDONE');

-- CreateTable
CREATE TABLE "ask_action" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "questionId" TEXT,
    "threadId" TEXT,
    "kind" TEXT NOT NULL,
    "intent" JSONB NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" "AskActionStatus" NOT NULL DEFAULT 'PROPOSED',
    "result" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "ask_action_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ask_action_questionId_key" ON "ask_action"("questionId");

-- CreateIndex
CREATE INDEX "ask_action_personId_status_executedAt_idx" ON "ask_action"("personId", "status", "executedAt");

-- CreateIndex
CREATE INDEX "ask_action_createdAt_idx" ON "ask_action"("createdAt");

-- AddForeignKey
ALTER TABLE "ask_action" ADD CONSTRAINT "ask_action_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ask_action" ENABLE ROW LEVEL SECURITY;
