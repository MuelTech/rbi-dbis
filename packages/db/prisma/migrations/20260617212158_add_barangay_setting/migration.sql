-- CreateTable
CREATE TABLE `barangay_settings` (
    `id` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- RedefineIndex
CREATE UNIQUE INDEX `households_block_id_brgy_household_no_key` ON `households`(`block_id`, `brgy_household_no`);
DROP INDEX `block_household_no` ON `households`;
