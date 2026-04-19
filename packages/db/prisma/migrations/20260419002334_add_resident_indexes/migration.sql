-- CreateIndex
CREATE INDEX `residents_status_type_idx` ON `residents`(`status_type`);

-- CreateIndex
CREATE INDEX `residents_sex_idx` ON `residents`(`sex`);

-- CreateIndex
CREATE INDEX `residents_is_voter_idx` ON `residents`(`is_voter`);

-- CreateIndex
CREATE INDEX `residents_last_name_idx` ON `residents`(`last_name`);

-- CreateIndex
CREATE INDEX `residents_first_name_idx` ON `residents`(`first_name`);

-- CreateIndex
CREATE INDEX `residents_created_at_idx` ON `residents`(`created_at`);
