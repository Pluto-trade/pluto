/*
  Warnings:

  - The values [ALLOW] on the enum `DecisionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [LARGE_ORDER,SUSPICIOUS_ACCOUNT,OTHER] on the enum `ProtectionReason` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DecisionType_new" AS ENUM ('CANCEL');
ALTER TABLE "ProtectionDecisions" ALTER COLUMN "decision" TYPE "DecisionType_new" USING ("decision"::text::"DecisionType_new");
ALTER TYPE "DecisionType" RENAME TO "DecisionType_old";
ALTER TYPE "DecisionType_new" RENAME TO "DecisionType";
DROP TYPE "public"."DecisionType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProtectionReason_new" AS ENUM ('STRONG_STALE', 'DEVIATION', 'DEVIATION_HIGH_VOL', 'DELAY', 'DELAY_HIGH_VOL');
ALTER TABLE "ProtectionDecisions" ALTER COLUMN "reason" TYPE "ProtectionReason_new" USING ("reason"::text::"ProtectionReason_new");
ALTER TYPE "ProtectionReason" RENAME TO "ProtectionReason_old";
ALTER TYPE "ProtectionReason_new" RENAME TO "ProtectionReason";
DROP TYPE "public"."ProtectionReason_old";
COMMIT;
