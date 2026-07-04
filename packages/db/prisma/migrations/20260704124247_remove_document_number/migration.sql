/*
  Warnings:

  - You are about to drop the column `document_number` on the `documents` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `documents_document_number_key` ON `documents`;

-- AlterTable
ALTER TABLE `documents` DROP COLUMN `document_number`;
