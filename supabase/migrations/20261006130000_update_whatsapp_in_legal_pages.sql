/*
# Use the WhatsApp business number in the legal pages

The privacy policy listed the call number as WhatsApp, and the terms said
"to be added later"; both now point to the WhatsApp number 0543231252.
*/

UPDATE legal_pages
SET content_ar = replace(replace(content_ar, 'واتساب: 0501121712', 'واتساب: 0543231252'), 'واتساب: يضاف لاحقًا', 'واتساب: 0543231252'),
    updated_at = now()
WHERE id IN ('privacy-policy', 'terms');
