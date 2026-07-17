-- AlterTable: Add avatar column to User
ALTER TABLE "User" ADD COLUMN "avatar" TEXT;

-- AlterTable: Add avatar and fundManagerId columns to Group
ALTER TABLE "Group" ADD COLUMN "avatar" TEXT;
ALTER TABLE "Group" ADD COLUMN "fundManagerId" TEXT;

-- AddForeignKey: Group.fundManagerId -> User
ALTER TABLE "Group" ADD CONSTRAINT "Group_fundManagerId_fkey" FOREIGN KEY ("fundManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: FundAllocation
CREATE TABLE "FundAllocation" (
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

-- AddForeignKey: FundAllocation.groupId -> Group
ALTER TABLE "FundAllocation" ADD CONSTRAINT "FundAllocation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: FundAllocation.fromUserId -> User
ALTER TABLE "FundAllocation" ADD CONSTRAINT "FundAllocation_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: FundAllocation.toUserId -> User
ALTER TABLE "FundAllocation" ADD CONSTRAINT "FundAllocation_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
