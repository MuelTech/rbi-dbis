/*
  Warnings:

  - You are about to drop the column `field_name` on the `audit_trails` table. All the data in the column will be lost.
  - You are about to drop the column `new_value` on the `audit_trails` table. All the data in the column will be lost.
  - You are about to drop the column `old_value` on the `audit_trails` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `audit_trails` DROP COLUMN `field_name`,
    DROP COLUMN `new_value`,
    DROP COLUMN `old_value`,
    ADD COLUMN `changes` JSON NULL,
    ADD COLUMN `summary` VARCHAR(255) NULL;
