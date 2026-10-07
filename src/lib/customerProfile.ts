import { supabase } from '@/lib/supabase';
import type { CompanyProfile } from '@/customer/types';
import { emptyCompanyProfile } from '@/customer/types';

interface CustomerProfileRow {
  user_id: string;
  company_name: string;
  commercial_registration: string;
  national_unified_number: string;
  vat_number: string;
  company_phone: string;
  official_email: string;
  region: string;
  city: string;
  address: string;
  contact_person: string;
  job_title: string;
}

const toProfile = (r: CustomerProfileRow): CompanyProfile => ({
  companyName: r.company_name,
  commercialRegistration: r.commercial_registration,
  nationalUnifiedNumber: r.national_unified_number,
  vatNumber: r.vat_number,
  companyPhone: r.company_phone,
  officialEmail: r.official_email,
  region: r.region,
  city: r.city,
  address: r.address,
  contactPerson: r.contact_person,
  jobTitle: r.job_title,
});

/** The signed-in customer's company profile, or null if they haven't created one yet. */
export async function loadCompanyProfile(userId: string): Promise<CompanyProfile | null> {
  const { data, error } = await supabase.from('customer_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ? toProfile(data as CustomerProfileRow) : null;
}

export async function saveCompanyProfile(userId: string, p: CompanyProfile): Promise<void> {
  const { error } = await supabase.from('customer_profiles').upsert({
    user_id: userId,
    company_name: p.companyName.trim(),
    commercial_registration: p.commercialRegistration.trim(),
    national_unified_number: p.nationalUnifiedNumber.trim(),
    vat_number: p.vatNumber.trim(),
    company_phone: p.companyPhone.trim(),
    official_email: p.officialEmail.trim(),
    region: p.region.trim(),
    city: p.city.trim(),
    address: p.address.trim(),
    contact_person: p.contactPerson.trim(),
    job_title: p.jobTitle.trim(),
  });
  if (error) throw error;
}

/** Fields a customer must fill before their first request. */
export const REQUIRED_COMPANY_FIELDS: (keyof CompanyProfile)[] = ['companyName', 'commercialRegistration', 'companyPhone', 'city', 'contactPerson'];

export function missingCompanyFields(p: CompanyProfile): (keyof CompanyProfile)[] {
  return REQUIRED_COMPANY_FIELDS.filter((k) => !p[k].trim());
}

export const COMPANY_FIELDS: { key: keyof CompanyProfile; labelAr: string; labelEn: string; placeholder?: string; ltr?: boolean }[] = [
  { key: 'companyName', labelAr: 'اسم الشركة / المؤسسة', labelEn: 'Company Name' },
  { key: 'commercialRegistration', labelAr: 'السجل التجاري', labelEn: 'Commercial Registration', placeholder: '70xxxxxxxx', ltr: true },
  { key: 'nationalUnifiedNumber', labelAr: 'الرقم الوطني الموحد', labelEn: 'National Unified Number', placeholder: '70xxxxxxxx', ltr: true },
  { key: 'vatNumber', labelAr: 'الرقم الضريبي', labelEn: 'VAT Number', placeholder: '3xxxxxxxxxxxxx3', ltr: true },
  { key: 'companyPhone', labelAr: 'هاتف الشركة', labelEn: 'Company Phone', placeholder: '05xxxxxxxx', ltr: true },
  { key: 'officialEmail', labelAr: 'البريد الرسمي', labelEn: 'Official Email', placeholder: 'info@company.com', ltr: true },
  { key: 'region', labelAr: 'المنطقة', labelEn: 'Region' },
  { key: 'city', labelAr: 'المدينة', labelEn: 'City' },
  { key: 'address', labelAr: 'العنوان', labelEn: 'Address' },
  { key: 'contactPerson', labelAr: 'الشخص المسؤول', labelEn: 'Contact Person' },
  { key: 'jobTitle', labelAr: 'المسمى الوظيفي', labelEn: 'Job Title' },
];

export { emptyCompanyProfile };
