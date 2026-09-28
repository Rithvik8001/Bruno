-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('DRAFT', 'CLAIMING', 'FINALIZED');

-- CreateEnum
CREATE TYPE "SplitMethod" AS ENUM ('ITEMS', 'EVEN', 'SHARES', 'PERCENT', 'AMOUNT');

-- CreateEnum
CREATE TYPE "TipKind" AS ENUM ('NONE', 'PERCENT', 'AMOUNT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('VENMO', 'CASH', 'PAYPAL', 'BANK', 'OTHER');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('BILL_CREATED', 'BILL_UPDATED', 'BILL_FINALIZED', 'BILL_DELETED', 'ITEM_CLAIMED', 'ITEM_UNCLAIMED', 'MEMBER_JOINED', 'MEMBER_LEFT', 'SETTLEMENT_RECORDED', 'SETTLEMENT_CONFIRMED', 'SETTLEMENT_CANCELLED');

-- CreateTable
CREATE TABLE "person" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "tint" TEXT NOT NULL,
    "email" TEXT,
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_token" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tint" TEXT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_member" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "group_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill" (
    "id" TEXT NOT NULL,
    "groupId" TEXT,
    "title" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "payerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'DRAFT',
    "splitMethod" "SplitMethod" NOT NULL DEFAULT 'ITEMS',
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "tipKind" "TipKind" NOT NULL DEFAULT 'NONE',
    "tipValue" INTEGER NOT NULL DEFAULT 0,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "slug" TEXT NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_participant" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "shares" INTEGER NOT NULL DEFAULT 1,
    "percentBps" INTEGER,
    "amountCents" INTEGER,

    CONSTRAINT "bill_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_item" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceCents" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim" (
    "id" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement" (
    "id" TEXT NOT NULL,
    "groupId" TEXT,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "note" TEXT,
    "recordedById" TEXT NOT NULL,
    "status" "SettlementStatus" NOT NULL,
    "autoConfirmAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "undoUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_event" (
    "id" TEXT NOT NULL,
    "groupId" TEXT,
    "billId" TEXT,
    "actorId" TEXT,
    "type" "ActivityType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_userId_key" ON "person"("userId");

-- CreateIndex
CREATE INDEX "person_mergedIntoId_idx" ON "person"("mergedIntoId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_token_tokenHash_key" ON "guest_token"("tokenHash");

-- CreateIndex
CREATE INDEX "guest_token_personId_idx" ON "guest_token"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "group_slug_key" ON "group"("slug");

-- CreateIndex
CREATE INDEX "group_createdById_idx" ON "group"("createdById");

-- CreateIndex
CREATE INDEX "group_member_personId_idx" ON "group_member"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "group_member_groupId_personId_key" ON "group_member"("groupId", "personId");

-- CreateIndex
CREATE UNIQUE INDEX "bill_slug_key" ON "bill"("slug");

-- CreateIndex
CREATE INDEX "bill_groupId_occurredAt_idx" ON "bill"("groupId", "occurredAt");

-- CreateIndex
CREATE INDEX "bill_payerId_idx" ON "bill"("payerId");

-- CreateIndex
CREATE INDEX "bill_createdById_idx" ON "bill"("createdById");

-- CreateIndex
CREATE INDEX "bill_participant_personId_idx" ON "bill_participant"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "bill_participant_billId_personId_key" ON "bill_participant"("billId", "personId");

-- CreateIndex
CREATE INDEX "line_item_billId_position_idx" ON "line_item"("billId", "position");

-- CreateIndex
CREATE INDEX "claim_personId_idx" ON "claim"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "claim_lineItemId_personId_key" ON "claim"("lineItemId", "personId");

-- CreateIndex
CREATE INDEX "settlement_groupId_idx" ON "settlement"("groupId");

-- CreateIndex
CREATE INDEX "settlement_fromId_idx" ON "settlement"("fromId");

-- CreateIndex
CREATE INDEX "settlement_toId_idx" ON "settlement"("toId");

-- CreateIndex
CREATE INDEX "settlement_recordedById_idx" ON "settlement"("recordedById");

-- CreateIndex
CREATE INDEX "activity_event_groupId_createdAt_idx" ON "activity_event"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_event_billId_createdAt_idx" ON "activity_event"("billId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_event_actorId_idx" ON "activity_event"("actorId");

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_token" ADD CONSTRAINT "guest_token_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group" ADD CONSTRAINT "group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_participant" ADD CONSTRAINT "bill_participant_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_participant" ADD CONSTRAINT "bill_participant_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_item" ADD CONSTRAINT "line_item_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim" ADD CONSTRAINT "claim_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "line_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim" ADD CONSTRAINT "claim_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_toId_fkey" FOREIGN KEY ("toId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_event" ADD CONSTRAINT "activity_event_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_event" ADD CONSTRAINT "activity_event_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_event" ADD CONSTRAINT "activity_event_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "group" ADD CONSTRAINT "group_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "bill" ADD CONSTRAINT "bill_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "bill" ADD CONSTRAINT "bill_money_check" CHECK ("taxCents" >= 0 AND "tipValue" >= 0 AND "discountCents" >= 0 AND "totalCents" >= 0);
ALTER TABLE "bill" ADD CONSTRAINT "bill_tip_check" CHECK ("tipKind" <> 'NONE' OR "tipValue" = 0);

ALTER TABLE "bill_participant" ADD CONSTRAINT "bill_participant_shares_check" CHECK ("shares" >= 1);
ALTER TABLE "bill_participant" ADD CONSTRAINT "bill_participant_percent_check" CHECK ("percentBps" IS NULL OR "percentBps" BETWEEN 0 AND 10000);
ALTER TABLE "bill_participant" ADD CONSTRAINT "bill_participant_amount_check" CHECK ("amountCents" IS NULL OR "amountCents" >= 0);

ALTER TABLE "line_item" ADD CONSTRAINT "line_item_quantity_check" CHECK ("quantity" >= 1);
ALTER TABLE "line_item" ADD CONSTRAINT "line_item_price_check" CHECK ("priceCents" >= 0);

ALTER TABLE "settlement" ADD CONSTRAINT "settlement_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_amount_check" CHECK ("amountCents" > 0);
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_parties_check" CHECK ("fromId" <> "toId");

ALTER TABLE "person" ADD CONSTRAINT "person_merge_check" CHECK ("mergedIntoId" IS NULL OR "mergedIntoId" <> "id");

ALTER TABLE "person" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "guest_token" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "group" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "group_member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bill_participant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "line_item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "claim" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settlement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_event" ENABLE ROW LEVEL SECURITY;
