/*
# Seed staff roles

Creates the system roles with permission matrices:
- owner: full access to all modules
- equipment_manager: equipment + images + categories + brands (no user management)
- operations: equipment view + availability changes (no create/edit/delete)
- content_manager: categories + brands edit only (no equipment delete, no user management)

Each role has a permissions JSONB array matching the existing Permission interface.
*/

INSERT INTO staff_roles (id, name_ar, name_en, description_ar, description_en, is_system, is_active, permissions) VALUES
(
  'role-owner',
  'المالك',
  'Owner / Super Admin',
  'صلاحيات كاملة على النظام',
  'Full system access',
  true,
  true,
  '[{"module":"equipment","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}},{"module":"equipment_images","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}},{"module":"categories","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}},{"module":"brands","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}},{"module":"projects","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}},{"module":"services","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}},{"module":"rental_requests","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}},{"module":"quotations","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}},{"module":"contracts","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}},{"module":"employees","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}},{"module":"company_settings","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}},{"module":"finance","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}},{"module":"reports","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}},{"module":"notifications","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO staff_roles (id, name_ar, name_en, description_ar, description_en, is_system, is_active, permissions) VALUES
(
  'role-equipment-manager',
  'مدير المعدات',
  'Equipment / Catalog Manager',
  'إدارة المعدات والصور والفئات والماركات',
  'Manage equipment, images, categories, and brands',
  true,
  true,
  '[{"module":"equipment","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":false}},{"module":"equipment_images","actions":{"view":true,"create":true,"edit":true,"delete":true,"manage":true}},{"module":"categories","actions":{"view":true,"create":true,"edit":true,"delete":false,"manage":false}},{"module":"brands","actions":{"view":true,"create":true,"edit":true,"delete":false,"manage":false}},{"module":"projects","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"services","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"rental_requests","actions":{"view":true,"create":false,"edit":true,"delete":false,"manage":false}},{"module":"quotations","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"contracts","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"employees","actions":{"view":false,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"company_settings","actions":{"view":false,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"finance","actions":{"view":false,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"reports","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"notifications","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO staff_roles (id, name_ar, name_en, description_ar, description_en, is_system, is_active, permissions) VALUES
(
  'role-operations',
  'العمليات',
  'Operations',
  'عرض المعدات وتغيير التوفر والحالة',
  'View equipment and change availability/status',
  true,
  true,
  '[{"module":"equipment","actions":{"view":true,"create":false,"edit":true,"delete":false,"manage":false}},{"module":"equipment_images","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"categories","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"brands","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"projects","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"services","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"rental_requests","actions":{"view":true,"create":false,"edit":true,"delete":false,"manage":false}},{"module":"quotations","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"contracts","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"employees","actions":{"view":false,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"company_settings","actions":{"view":false,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"finance","actions":{"view":false,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"reports","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"notifications","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO staff_roles (id, name_ar, name_en, description_ar, description_en, is_system, is_active, permissions) VALUES
(
  'role-content-manager',
  'مدير المحتوى',
  'Content Manager',
  'تعديل معلومات الفئات والماركات والمحتوى',
  'Edit category, brand, and content information',
  true,
  true,
  '[{"module":"equipment","actions":{"view":true,"create":false,"edit":true,"delete":false,"manage":false}},{"module":"equipment_images","actions":{"view":true,"create":false,"edit":true,"delete":false,"manage":false}},{"module":"categories","actions":{"view":true,"create":false,"edit":true,"delete":false,"manage":false}},{"module":"brands","actions":{"view":true,"create":false,"edit":true,"delete":false,"manage":false}},{"module":"projects","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"services","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"rental_requests","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"quotations","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"contracts","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"employees","actions":{"view":false,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"company_settings","actions":{"view":false,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"finance","actions":{"view":false,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"reports","actions":{"view":false,"create":false,"edit":false,"delete":false,"manage":false}},{"module":"notifications","actions":{"view":true,"create":false,"edit":false,"delete":false,"manage":false}}]'::jsonb
) ON CONFLICT (id) DO NOTHING;
