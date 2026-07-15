-- AlterTable
ALTER TABLE "User" ADD COLUMN "accountName" TEXT;
ALTER TABLE "User" ADD COLUMN "accountNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "bankName" TEXT;
ALTER TABLE "User" ADD COLUMN "sepayWebhookSecret" TEXT;

-- CreateTable
CREATE TABLE "SepayTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gateway" TEXT NOT NULL,
    "transactionDate" DATETIME NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "transferType" TEXT NOT NULL,
    "transferAmount" REAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SepayTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
