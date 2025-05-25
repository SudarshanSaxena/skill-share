/*
  Warnings:

  - Changed the type of `currency` on the `Task` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "currency",
ADD COLUMN     "currency" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Currency";
