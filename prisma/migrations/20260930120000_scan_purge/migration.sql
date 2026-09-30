-- AlterTable
ALTER TABLE "receipt_scan" ADD COLUMN "purgedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "receipt_scan_status_createdAt_idx" ON "receipt_scan"("status", "createdAt");
