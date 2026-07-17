-- =============================================================
-- Idempotent migration: add all columns/tables added since init
-- Safe to run multiple times (uses IF NOT EXISTS throughout)
-- =============================================================

-- AlterTable User: avatar (may already exist from init on some DBs)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar" TEXT;

-- AlterTable User: bank info (added in add_sepay_bank_info, safe here too)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sepayWebhookSecret" TEXT;

-- AlterTable Expense: category (was added directly to schema, never had a migration)
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Khác';

-- AlterTable Group: avatar and fundManagerId
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "fundManagerId" TEXT;

-- AddForeignKey: Group.fundManagerId -> User (safe if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Group_fundManagerId_fkey'
  ) THEN
    ALTER TABLE "Group" ADD CONSTRAINT "Group_fundManagerId_fkey"
      FOREIGN KEY ("fundManagerId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

-- CreateTable SepayTransaction (safe if already exists)
CREATE TABLE IF NOT EXISTS "SepayTransaction" (
    "id" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "transactionDate" TIMESTAMPTZ NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "transferType" TEXT NOT NULL,
    "transferAmount" DOUBLE PRECISION NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SepayTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: SepayTransaction.userId -> User (safe if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SepayTransaction_userId_fkey'
  ) THEN
    ALTER TABLE "SepayTransaction" ADD CONSTRAINT "SepayTransaction_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

-- CreateTable FundAllocation (safe if already exists)
CREATE TABLE IF NOT EXISTS "FundAllocation" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,

    CONSTRAINT "FundAllocation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: FundAllocation.groupId -> Group (safe if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FundAllocation_groupId_fkey'
  ) THEN
    ALTER TABLE "FundAllocation" ADD CONSTRAINT "FundAllocation_groupId_fkey"
      FOREIGN KEY ("groupId") REFERENCES "Group"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

-- AddForeignKey: FundAllocation.fromUserId -> User (safe if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FundAllocation_fromUserId_fkey'
  ) THEN
    ALTER TABLE "FundAllocation" ADD CONSTRAINT "FundAllocation_fromUserId_fkey"
      FOREIGN KEY ("fromUserId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

-- AddForeignKey: FundAllocation.toUserId -> User (safe if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FundAllocation_toUserId_fkey'
  ) THEN
    ALTER TABLE "FundAllocation" ADD CONSTRAINT "FundAllocation_toUserId_fkey"
      FOREIGN KEY ("toUserId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;
