/*
  Warnings:

  - You are about to drop the column `communicationScore` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `problemSolvingScore` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `technicalScore` on the `evaluations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uniqueUrl]` on the table `candidate_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uniqueUrl]` on the table `recruiter_profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `communicationAvg` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `comprehensionScore` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryScore` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `flexibleThinking` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `informationAnalysis` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itSkills` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `negotiation` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `problemSolving` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommendedPositions` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vocabularyScore` to the `evaluations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InterviewMode" AS ENUM ('PRACTICE', 'ACTUAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EVALUATION_COMPLETED', 'NEW_RECOMMENDATION', 'APPLICATION_UPDATE', 'NEW_MESSAGE', 'SYSTEM');

-- DropIndex
DROP INDEX "idx_candidate_profiles_user_id";

-- DropIndex
DROP INDEX "idx_evaluations_created_at";

-- DropIndex
DROP INDEX "idx_evaluations_interview_id";

-- DropIndex
DROP INDEX "idx_evaluations_overall_score";

-- DropIndex
DROP INDEX "idx_interview_messages_created_at";

-- DropIndex
DROP INDEX "idx_interview_messages_interview_id";

-- DropIndex
DROP INDEX "idx_interviews_candidate_id";

-- DropIndex
DROP INDEX "idx_interviews_candidate_status";

-- DropIndex
DROP INDEX "idx_interviews_started_at";

-- DropIndex
DROP INDEX "idx_interviews_status";

-- DropIndex
DROP INDEX "idx_job_postings_created_at";

-- DropIndex
DROP INDEX "idx_job_postings_position";

-- DropIndex
DROP INDEX "idx_job_postings_recruiter_id";

-- DropIndex
DROP INDEX "idx_job_postings_status";

-- DropIndex
DROP INDEX "idx_job_postings_status_position";

-- DropIndex
DROP INDEX "idx_recruiter_profiles_company_name";

-- DropIndex
DROP INDEX "idx_recruiter_profiles_user_id";

-- AlterTable
ALTER TABLE "candidate_profiles" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "blogUrl" TEXT,
ADD COLUMN     "careerHistory" TEXT,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "portfolioUrl" TEXT,
ADD COLUMN     "portfolioWebUrl" TEXT,
ADD COLUMN     "profileImageUrl" TEXT,
ADD COLUMN     "projects" TEXT,
ADD COLUMN     "uniqueUrl" TEXT;

-- AlterTable
ALTER TABLE "evaluations" DROP COLUMN "communicationScore",
DROP COLUMN "problemSolvingScore",
DROP COLUMN "technicalScore",
ADD COLUMN     "communicationAvg" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "comprehensionScore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "deliveryScore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "flexibleThinking" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "informationAnalysis" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "itSkills" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "negotiation" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "problemSolving" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "recommendedPositions" TEXT NOT NULL,
ADD COLUMN     "vocabularyScore" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "interviews" ADD COLUMN     "elapsedSeconds" INTEGER,
ADD COLUMN     "isVoiceMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mode" "InterviewMode" NOT NULL DEFAULT 'PRACTICE',
ADD COLUMN     "timeLimitSeconds" INTEGER;

-- AlterTable
ALTER TABLE "recruiter_profiles" ADD COLUMN     "companyDescription" TEXT,
ADD COLUMN     "companyLogo" TEXT,
ADD COLUMN     "companyVision" TEXT,
ADD COLUMN     "uniqueUrl" TEXT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_profiles_uniqueUrl_key" ON "candidate_profiles"("uniqueUrl");

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_profiles_uniqueUrl_key" ON "recruiter_profiles"("uniqueUrl");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
