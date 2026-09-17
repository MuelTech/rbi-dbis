-- AlterTable
ALTER TABLE `residents` ADD COLUMN `registered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- Backfill the registration date from the row creation time for existing residents
UPDATE `residents` SET `registered_at` = `created_at`;
