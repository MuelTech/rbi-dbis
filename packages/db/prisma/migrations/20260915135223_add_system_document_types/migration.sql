-- AlterTable
ALTER TABLE `document_types` ADD COLUMN `is_system` BOOLEAN NOT NULL DEFAULT false;

-- Seed required (system) document types so they always exist.
-- Insert-if-missing by name; existing rows (and their ids) are left untouched.
INSERT INTO `document_types` (`id`, `document_name`, `amount`, `is_system`)
SELECT UUID(), `defaults`.`name`, `defaults`.`amount`, true
FROM (
  SELECT 'Barangay Business Clearance' AS `name`, 500 AS `amount`
  UNION ALL SELECT 'Business Permit', 500
  UNION ALL SELECT 'Certificate of Indigency', 0
  UNION ALL SELECT 'Barangay Clearance', 200
  UNION ALL SELECT 'Certificate of Residency', 150
) AS `defaults`
LEFT JOIN `document_types` d ON d.`document_name` = `defaults`.`name`
WHERE d.`id` IS NULL;

-- Mark any pre-existing rows with these names as system types.
UPDATE `document_types`
SET `is_system` = true
WHERE `document_name` IN (
  'Barangay Business Clearance',
  'Business Permit',
  'Certificate of Indigency',
  'Barangay Clearance',
  'Certificate of Residency'
);

