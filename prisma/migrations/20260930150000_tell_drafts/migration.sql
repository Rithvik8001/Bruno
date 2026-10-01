-- CreateEnum
CREATE TYPE "TellDraftStatus" AS ENUM ('DRAFTING', 'SUCCEEDED', 'FAILED', 'CONSUMED', 'DISCARDED');

-- CreateTable
CREATE TABLE "tell_draft" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "text" TEXT,
    "timeZone" TEXT NOT NULL,
    "status" "TellDraftStatus" NOT NULL DEFAULT 'DRAFTING',
    "failure" TEXT,
    "result" JSONB,
    "answers" JSONB,
    "model" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "tell_draft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tell_draft_personId_status_startedAt_idx" ON "tell_draft"("personId", "status", "startedAt");

-- CreateIndex
CREATE INDEX "tell_draft_status_createdAt_idx" ON "tell_draft"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "tell_draft" ADD CONSTRAINT "tell_draft_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tell_draft" ADD CONSTRAINT "tell_draft_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tell_draft" ENABLE ROW LEVEL SECURITY;
