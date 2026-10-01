-- AlterTable
ALTER TABLE "person" ADD COLUMN "defaultCurrency" CHAR(3) NOT NULL DEFAULT 'USD',
ADD COLUMN "deletedAt" TIMESTAMP(3);
