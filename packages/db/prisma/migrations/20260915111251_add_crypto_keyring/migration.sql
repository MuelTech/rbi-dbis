-- CreateTable
CREATE TABLE `crypto_keyring` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'global',
    `server_key` TEXT NOT NULL,
    `recovery_key` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
