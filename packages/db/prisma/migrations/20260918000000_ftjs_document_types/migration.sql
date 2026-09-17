-- FTJS type + retire unused document types

INSERT INTO `document_types` (`id`, `document_name`, `amount`, `is_system`)
SELECT UUID(), 'Barangay Certificate (FTJS)', 0, true
WHERE NOT EXISTS (
  SELECT 1 FROM `document_types` WHERE `document_name` = 'Barangay Certificate (FTJS)'
);

UPDATE `document_types`
SET `is_system` = true, `amount` = 0
WHERE `document_name` = 'Barangay Certificate (FTJS)';

UPDATE `document_types`
SET `is_system` = false
WHERE `document_name` IN ('Business Permit', 'Certificate of Residency');

DELETE dt FROM `document_types` dt
LEFT JOIN `documents` d ON d.`document_type_id` = dt.`id`
WHERE dt.`document_name` IN ('Business Permit', 'Certificate of Residency')
  AND d.`id` IS NULL;
