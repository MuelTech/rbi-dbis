/*
  Warnings:

  - You are about to drop the column `form_data` on the `documents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `documents` DROP COLUMN `form_data`,
    ADD COLUMN `formData` JSON NULL;
