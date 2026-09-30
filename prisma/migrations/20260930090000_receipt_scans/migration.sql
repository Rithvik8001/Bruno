-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('STARTER', 'MAIN', 'SIDE', 'DRINK', 'DESSERT', 'GROCERY', 'TRANSPORT', 'HOUSEHOLD', 'OTHER');

-- CreateEnum
CREATE TYPE "ReceiptScanStatus" AS ENUM ('PENDING', 'EXTRACTING', 'SUCCEEDED', 'FAILED', 'CONSUMED', 'DISCARDED');

-- AlterTable
ALTER TABLE "person" ADD COLUMN "plan" "Plan" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "line_item" ADD COLUMN "category" "ItemCategory";

-- AlterTable
ALTER TABLE "bill" ADD COLUMN "receiptScanId" TEXT;

-- CreateTable
CREATE TABLE "receipt_scan" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "timeZone" TEXT NOT NULL,
    "status" "ReceiptScanStatus" NOT NULL DEFAULT 'PENDING',
    "failure" TEXT,
    "result" JSONB,
    "model" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "receipt_scan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "receipt_scan_objectKey_key" ON "receipt_scan"("objectKey");

-- CreateIndex
CREATE INDEX "receipt_scan_personId_status_startedAt_idx" ON "receipt_scan"("personId", "status", "startedAt");

-- CreateIndex
CREATE INDEX "receipt_scan_groupId_createdAt_idx" ON "receipt_scan"("groupId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "bill_receiptScanId_key" ON "bill"("receiptScanId");

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_receiptScanId_fkey" FOREIGN KEY ("receiptScanId") REFERENCES "receipt_scan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_scan" ADD CONSTRAINT "receipt_scan_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_scan" ADD CONSTRAINT "receipt_scan_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "receipt_scan" ENABLE ROW LEVEL SECURITY;
