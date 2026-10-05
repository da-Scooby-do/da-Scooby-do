/*
# Add Snapchat link to site settings

Shown in the footer's "follow us" links next to X and LinkedIn when set.
*/

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS snapchat_url text NOT NULL DEFAULT '';
