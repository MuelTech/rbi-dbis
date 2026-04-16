-- households
ALTER TABLE `households` ADD COLUMN `display_id` INT NULL;
SET @seq = 0;
UPDATE `households` SET `display_id` = (@seq := @seq + 1) ORDER BY `created_at` ASC;
ALTER TABLE `households` MODIFY COLUMN `display_id` INT NOT NULL AUTO_INCREMENT, ADD UNIQUE INDEX `households_display_id_key`(`display_id`);

-- families
ALTER TABLE `families` ADD COLUMN `display_id` INT NULL;
SET @seq = 0;
UPDATE `families` SET `display_id` = (@seq := @seq + 1) ORDER BY `created_at` ASC;
ALTER TABLE `families` MODIFY COLUMN `display_id` INT NOT NULL AUTO_INCREMENT, ADD UNIQUE INDEX `families_display_id_key`(`display_id`);

-- residents
ALTER TABLE `residents` ADD COLUMN `display_id` INT NULL;
SET @seq = 0;
UPDATE `residents` SET `display_id` = (@seq := @seq + 1) ORDER BY `created_at` ASC;
ALTER TABLE `residents` MODIFY COLUMN `display_id` INT NOT NULL AUTO_INCREMENT, ADD UNIQUE INDEX `residents_display_id_key`(`display_id`);

-- documents
ALTER TABLE `documents` ADD COLUMN `display_id` INT NULL;
SET @seq = 0;
UPDATE `documents` SET `display_id` = (@seq := @seq + 1) ORDER BY `created_at` ASC;
ALTER TABLE `documents` MODIFY COLUMN `display_id` INT NOT NULL AUTO_INCREMENT, ADD UNIQUE INDEX `documents_display_id_key`(`display_id`);

-- orders
ALTER TABLE `orders` ADD COLUMN `display_id` INT NULL;
SET @seq = 0;
UPDATE `orders` SET `display_id` = (@seq := @seq + 1) ORDER BY `created_at` ASC;
ALTER TABLE `orders` MODIFY COLUMN `display_id` INT NOT NULL AUTO_INCREMENT, ADD UNIQUE INDEX `orders_display_id_key`(`display_id`);
