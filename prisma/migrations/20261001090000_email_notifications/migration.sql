-- AlterTable
ALTER TABLE "person" ADD COLUMN "timeZone" TEXT,
ADD COLUMN "notifyBills" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notifyClaims" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notifyPayments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notifyWeekly" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notifyMonthly" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "email_log" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "known_device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "known_device_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_log_dedupeKey_key" ON "email_log"("dedupeKey");

-- CreateIndex
CREATE INDEX "email_log_personId_createdAt_idx" ON "email_log"("personId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "known_device_userId_fingerprint_key" ON "known_device"("userId", "fingerprint");

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "known_device" ADD CONSTRAINT "known_device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_log" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "known_device" ENABLE ROW LEVEL SECURITY;
