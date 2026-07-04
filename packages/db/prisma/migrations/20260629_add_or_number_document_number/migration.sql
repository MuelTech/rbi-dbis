-- AlterTable: Add or_number to orders table
ALTER TABLE `orders` ADD COLUMN `or_number` VARCHAR(20) NOT NULL;

-- CreateIndex: Add unique constraint on or_number
CREATE UNIQUE INDEX `orders_or_number_key` ON `orders`(`or_number`);

-- AlterTable: Add document_number to documents table
ALTER TABLE `documents` ADD COLUMN `document_number` VARCHAR(20) NOT NULL;

-- CreateIndex: Add unique constraint on document_number
CREATE UNIQUE INDEX `documents_document_number_key` ON `documents`(`document_number`);
