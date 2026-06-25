-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE');

-- AlterTable: primary contact for company clients
ALTER TABLE "clients"
    ADD COLUMN "contactName" VARCHAR(120),
    ADD COLUMN "contactRole" VARCHAR(120),
    ADD COLUMN "contactEmail" VARCHAR(180);

-- AlterTable: next step + activity-driven stalled signal
ALTER TABLE "opportunities"
    ADD COLUMN "nextStep" VARCHAR(200),
    ADD COLUMN "nextStepDueAt" DATE,
    ADD COLUMN "lastActivityAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "type" "ActivityType" NOT NULL,
    "summary" VARCHAR(1000) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "authorName" VARCHAR(120) NOT NULL,
    "opportunityId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunities_nextStepDueAt_idx" ON "opportunities"("nextStepDueAt");

-- CreateIndex
CREATE INDEX "activities_opportunityId_occurredAt_idx" ON "activities"("opportunityId", "occurredAt");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
