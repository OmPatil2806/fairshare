-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('INR', 'USD', 'EUR');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'INR';
