/*
  Warnings:

  - Added the required column `price` to the `Offer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "message" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;
