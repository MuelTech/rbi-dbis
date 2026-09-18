-- Add structured validity to document types so the system can tell whether an
-- already-issued document of the same type is still within its validity.
-- NULL means the document type never expires.

ALTER TABLE `document_types` ADD COLUMN `validity_days` INTEGER NULL;

UPDATE `document_types` SET `validity_days` = 365
  WHERE `document_name` = 'Barangay Business Clearance';
UPDATE `document_types` SET `validity_days` = 180
  WHERE `document_name` = 'Barangay Clearance';
UPDATE `document_types` SET `validity_days` = 180
  WHERE `document_name` = 'Certificate of Residency';
UPDATE `document_types` SET `validity_days` = 365
  WHERE `document_name` = 'Barangay Certificate (FTJS)';
