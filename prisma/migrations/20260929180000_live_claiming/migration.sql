-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'BILL_CLAIMING_OPENED';
ALTER TYPE "ActivityType" ADD VALUE 'BILL_CLAIMED';
ALTER TYPE "ActivityType" ADD VALUE 'CLAIMS_REMINDED';

-- AlterTable
ALTER TABLE "bill" ADD COLUMN "claimCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "bill_claimCode_key" ON "bill"("claimCode");
