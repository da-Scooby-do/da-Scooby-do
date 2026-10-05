/*
# Add request_type and site-visit fields to project_requests

## Overview
Extends the existing project_requests table to support 5 distinct service request types:
project_execution, contracting, engineering, project_management, site_visit.
Also adds site-visit-specific fields (preferred_visit_date, notes) and
project execution fields (project_name, scope_of_work, expected_start_date, expected_duration)
that were already columns but not being populated.

## Modified Tables

### project_requests (ALTER TABLE ADD COLUMN)
- request_type (text) — Type of service request: 'project_execution', 'contracting', 'engineering', 'project_management', 'site_visit'. Defaults to 'project_execution'.
- preferred_visit_date (text) — Preferred date for site visit (site_visit requests only). Nullable.
- notes (text) — Additional notes for the request. Nullable.

## Security
- No new tables created — existing RLS policies on project_requests remain unchanged.
- The public_insert_project_requests policy already allows anon+authenticated INSERT with WITH CHECK (status = 'new').
- The staff_read/update/delete policies already exist.
- No RLS policy changes needed — new columns are automatically accessible under existing policies.
*/

ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'project_execution';
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS preferred_visit_date text;
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS notes text;
