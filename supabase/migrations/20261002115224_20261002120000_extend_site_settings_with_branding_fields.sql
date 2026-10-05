/*
# Extend site_settings with branding, social, and copyright fields

## Overview
Adds new columns to the existing site_settings singleton table to support:
- Language-aware logos (Arabic wordmark سحاب, English wordmark SAHAB)
- Saudi Business Platform logo (منصة الأعمال السعودية)
- Additional social media links (TikTok, YouTube)
- Editable copyright text (Arabic + English)

## Modified Tables

### site_settings (ALTER TABLE ADD COLUMN)
- logo_ar (text) — URL to Arabic logo asset, empty string default
- logo_en (text) — URL to English logo asset, empty string default
- business_platform_logo (text) — URL to Saudi Business Platform logo, empty string default
- tiktok_url (text) — TikTok profile URL, empty string default
- youtube_url (text) — YouTube channel URL, empty string default
- copyright_text_ar (text) — Arabic copyright bar text, empty string default (falls back to i18n default)
- copyright_text_en (text) — English copyright bar text, empty string default (falls back to i18n default)

## Security
- No new tables created — existing RLS policies on site_settings remain unchanged.
- Public SELECT policy (TO anon, authenticated) already in place — new columns are automatically readable.
- Staff UPDATE policy already in place — new columns are automatically editable by authorized staff.
- No RLS policy changes needed.
*/

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_ar text NOT NULL DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_en text NOT NULL DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS business_platform_logo text NOT NULL DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS tiktok_url text NOT NULL DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS youtube_url text NOT NULL DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS copyright_text_ar text NOT NULL DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS copyright_text_en text NOT NULL DEFAULT '';
