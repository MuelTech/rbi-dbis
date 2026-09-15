-- CreateTable
CREATE TABLE `session_state` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'global',
    `sessions_valid_after` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
