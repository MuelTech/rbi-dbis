-- Step 1: Add the column as nullable, no constraints yet
ALTER TABLE `users` ADD COLUMN `display_id` INT NULL;

-- Step 2: Backfill existing rows with sequential values ordered by creation date
SET @seq = 0;
UPDATE `users` SET `display_id` = (@seq := @seq + 1) ORDER BY `created_at` ASC;

-- Step 3: Make it NOT NULL + AUTO_INCREMENT + UNIQUE
ALTER TABLE `users` MODIFY COLUMN `display_id` INT NOT NULL AUTO_INCREMENT, ADD UNIQUE INDEX `users_display_id_key`(`display_id`);
