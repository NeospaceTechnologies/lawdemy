-- AlterEnum
ALTER TYPE "WithdrawalStatus" ADD VALUE 'AWAITING_APPROVAL';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "takedownReason" TEXT,
ADD COLUMN     "takedownRevokes" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "takenDownAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CourseRating" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "captionsAssetId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "refundedKobo" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "refundedKobo" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "marks" JSONB,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'graded';

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "action" TEXT,
ADD COLUMN     "handledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "mfaAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SupportTicket" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totpEnabledAt" TIMESTAMP(3),
ADD COLUMN     "totpSecretEnc" TEXT,
ADD COLUMN     "walletFrozenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "SupportReply" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxonomyItem" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxonomyItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationRun" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "checked" INTEGER NOT NULL,
    "mismatches" JSONB NOT NULL,
    "runById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxonomyItem_kind_position_idx" ON "TaxonomyItem"("kind", "position");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyItem_kind_value_key" ON "TaxonomyItem"("kind", "value");

-- CreateIndex
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_captionsAssetId_fkey" FOREIGN KEY ("captionsAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportReply" ADD CONSTRAINT "SupportReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportReply" ADD CONSTRAINT "SupportReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
