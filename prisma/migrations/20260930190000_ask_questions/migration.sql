-- CreateEnum
CREATE TYPE "AskStatus" AS ENUM ('ASKING', 'ANSWERED', 'CLARIFY', 'DECLINED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ask_question" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "groupId" TEXT,
    "text" TEXT,
    "timeZone" TEXT NOT NULL,
    "status" "AskStatus" NOT NULL DEFAULT 'ASKING',
    "failure" TEXT,
    "outcome" TEXT,
    "trace" JSONB,
    "steps" INTEGER,
    "model" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ask_question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ask_question_personId_status_startedAt_idx" ON "ask_question"("personId", "status", "startedAt");

-- CreateIndex
CREATE INDEX "ask_question_personId_threadId_createdAt_idx" ON "ask_question"("personId", "threadId", "createdAt");

-- CreateIndex
CREATE INDEX "ask_question_status_createdAt_idx" ON "ask_question"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ask_question" ADD CONSTRAINT "ask_question_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ask_question" ADD CONSTRAINT "ask_question_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ask_question" ENABLE ROW LEVEL SECURITY;
