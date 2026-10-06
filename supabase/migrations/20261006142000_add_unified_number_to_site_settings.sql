/*
# Unified National Number (الرقم الوطني الموحد)

Shown in the footer's company info next to the CR and VAT numbers.
*/

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS unified_number text NOT NULL DEFAULT '';
