/*
  Warnings:

  - Changed the type of `experience` on the `Skill` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Skill" DROP COLUMN "experience",
ADD COLUMN     "experience" INTEGER NOT NULL;
