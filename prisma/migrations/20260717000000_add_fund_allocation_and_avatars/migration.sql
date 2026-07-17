-- AlterTable: Add avatar column to User (safe if already exists)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar" TEXT;

-- AlterTable: Add avatar and fundManagerId columns to Group (safe if already exists)
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

-- CreateTable: FundAllocation (safe if already exists)
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
