import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Eye, X, Package, HardHat, Loader2, AlertCircle, User, Building2, Phone, Mail, Calendar, MapPin, FileText, History, UserCheck, type LucideIcon } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useRental } from '@/rental/RentalContext';
import { useProject } from '@/project/ProjectContext';
import { useEmployee } from '@/admin/EmployeeContext';
import { useCatalogData } from '@/catalog/useCatalogData';
import { useQuotation } from '@/quotation/QuotationContext';
import DBQuotationForm from '@/quotation/components/DBQuotationForm';
import TermsAcceptanceBadge from './TermsAcceptanceBadge';
import { supabase } from '@/lib/supabase';
import { statusLabels as rentalStatusLabels, statusColors as rentalStatusColors, durationLabels, allStatuses as allRentalStatuses, responsiblePartyLabels } from '@/rental/types';
import type { RentalRequestRow, RentalRequestStatus } from '@/rental/types';
import { dbStatusLabels, dbStatusColors, allProjectDBStatuses, serviceCategoryLabels, expectedStartLabels } from '@/project/types';
import type { ProjectRequestRow, ProjectRequestDBStatus } from '@/project/types';

type RequestType = 'rental' | 'project';

interface UnifiedRequest {
  id: string;
  type: RequestType;
  reference: string;
  customerName: string;
  companyName: string | null;
  phone: string;
  email: string | null;
  serviceOrEquipment: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  rawRental?: RentalRequestRow;
  rawProject?: ProjectRequestRow;
}

interface StatusHistoryRow {
  id: string;
  request_type: string;
  request_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_by_name: string | null;
  created_at: string;
}

export default function RequestsCenter() {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const { requests: rentalRequests, loading: rentalLoading, error: rentalError, updateStatus: updateRentalStatus, updateAssignedTo: updateRentalAssigned } = useRental();
  const { dbRequests: projectRequests, dbLoading: projectLoading, dbError: projectError, updateDBStatus: updateProjectStatus, updateDBAssignedTo: updateProjectAssigned } = useProject();
  const { employees } = useEmployee();
  const { categories, brands, models } = useCatalogData();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [viewing, setViewing] = useState<UnifiedRequest | null>(null);
  const [history, setHistory] = useState<StatusHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingAssigned, setSavingAssigned] = useState(false);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const { can } = useEmployee();

  // Combine into unified list
  const unified: UnifiedRequest[] = useMemo(() => {
    const rentals: UnifiedRequest[] = rentalRequests.map((r) => ({
      id: r.id,
      type: 'rental' as const,
      reference: r.request_reference,
      customerName: r.customer_name,
      companyName: r.company_name,
      phone: r.phone,
      email: r.email,
      serviceOrEquipment: ar ? r.equipment_name_ar : r.equipment_name,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      rawRental: r,
    }));
    const projects: UnifiedRequest[] = projectRequests.map((p) => ({
      id: p.id,
      type: 'project' as const,
      reference: p.request_reference,
      customerName: p.customer_name,
      companyName: p.company_name,
      phone: p.phone,
      email: p.email,
      serviceOrEquipment: ar
        ? (serviceCategoryLabels[p.service_category]?.ar || p.service_type)
        : (serviceCategoryLabels[p.service_category]?.en || p.service_type),
      status: p.status,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      rawProject: p,
    }));
    return [...rentals, ...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rentalRequests, projectRequests, ar]);

  // Available status options based on type filter
  const availableStatuses = useMemo(() => {
    if (typeFilter === 'rental') return allRentalStatuses.map((s) => ({ value: s, label: ar ? rentalStatusLabels[s].ar : rentalStatusLabels[s].en }));
    if (typeFilter === 'project') return allProjectDBStatuses.map((s) => ({ value: s, label: ar ? dbStatusLabels[s].ar : dbStatusLabels[s].en }));
    // Combined — show rental statuses (the more common ones)
    return allRentalStatuses.map((s) => ({ value: s, label: ar ? rentalStatusLabels[s].ar : rentalStatusLabels[s].en }));
  }, [typeFilter, ar]);

  const filtered = useMemo(() => {
    return unified.filter((r) => {
      const matchSearch = !search ||
        r.reference.toLowerCase().includes(search.toLowerCase()) ||
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (r.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
        r.phone.includes(search) ||
        r.serviceOrEquipment.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || r.type === typeFilter;
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchDate = !dateFilter || r.createdAt.split('T')[0] === dateFilter;
      return matchSearch && matchType && matchStatus && matchDate;
    });
  }, [unified, search, typeFilter, statusFilter, dateFilter]);

  // Summary counters
  const counts = useMemo(() => {
    const total = unified.length;
    const newCount = unified.filter((r) => r.status === 'new').length;
    const reviewingCount = unified.filter((r) => r.status === 'reviewing' || r.status === 'under_review').length;
    const awaitingPoCount = unified.filter((r) => r.status === 'awaiting_po').length;
    const projectCount = unified.filter((r) => r.type === 'project').length;
    const rentalCount = unified.filter((r) => r.type === 'rental').length;
    return { total, newCount, reviewingCount, awaitingPoCount, projectCount, rentalCount };
  }, [unified]);

  const loading = rentalLoading || projectLoading;
  const error = rentalError || projectError;

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const formatDate = (ts: string) => {
    try { return new Date(ts).toLocaleDateString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return ts; }
  };

  const formatDateTime = (ts: string) => {
    try { return new Date(ts).toLocaleString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return ts; }
  };

  const getStatusLabel = (r: UnifiedRequest) => {
    if (r.type === 'rental') return ar ? rentalStatusLabels[r.status as RentalRequestStatus].ar : rentalStatusLabels[r.status as RentalRequestStatus].en;
    return ar ? dbStatusLabels[r.status as ProjectRequestDBStatus].ar : dbStatusLabels[r.status as ProjectRequestDBStatus].en;
  };

  const getStatusColor = (r: UnifiedRequest) => {
    if (r.type === 'rental') return rentalStatusColors[r.status as RentalRequestStatus];
    return dbStatusColors[r.status as ProjectRequestDBStatus];
  };

  const loadHistory = async (r: UnifiedRequest) => {
    setHistoryLoading(true);
    setHistory([]);
    try {
      const { data, error: histError } = await supabase
        .from('request_status_history')
        .select('*')
        .eq('request_type', r.type)
        .eq('request_id', r.id)
        .order('created_at', { ascending: false });
      if (histError) throw histError;
      setHistory((data as StatusHistoryRow[] | null) || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openDetails = (r: UnifiedRequest) => {
    setViewing(r);
    loadHistory(r);
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!viewing) return;
    setSavingStatus(true);
    try {
      if (viewing.type === 'rental') {
        await updateRentalStatus(viewing.id, newStatus as RentalRequestStatus);
      } else {
        await updateProjectStatus(viewing.id, newStatus as ProjectRequestDBStatus);
      }
      setViewing({ ...viewing, status: newStatus });
      loadHistory(viewing);
    } catch {
      // error shown via context
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAssign = async (assignedTo: string | null) => {
    if (!viewing) return;
    setSavingAssigned(true);
    try {
      if (viewing.type === 'rental') {
        await updateRentalAssigned(viewing.id, assignedTo);
      } else {
        await updateProjectAssigned(viewing.id, assignedTo);
      }
    } catch {
      // error shown via context
    } finally {
      setSavingAssigned(false);
    }
  };

  const currentAssignedTo = viewing?.rawRental?.assigned_to || viewing?.rawProject?.assigned_to || null;

  // Detail modal: rental
  const renderRentalDetails = (r: RentalRequestRow) => {
    const model = models.find((m) => m.id === r.equipment_model_id);
    const brand = model ? brands.find((b) => b.id === model.brandId) : null;
    const category = model ? categories.find((c) => c.id === model.categoryId) : null;
    return (
      <>
        <Section title={ar ? 'العميل' : 'Customer'} icon={User}>
          <Field label={ar ? 'الاسم' : 'Name'} value={r.customer_name} />
          <Field label={ar ? 'الشركة' : 'Company'} value={r.company_name || '—'} />
          <Field label={ar ? 'الجوال' : 'Phone'} value={r.phone} ltr />
          <Field label={ar ? 'البريد' : 'Email'} value={r.email || '—'} ltr />
        </Section>
        <Section title={ar ? 'المعدات' : 'Equipment'} icon={Package}>
          <Field label={ar ? 'المعدات' : 'Equipment'} value={ar ? r.equipment_name_ar : r.equipment_name} />
          {category && <Field label={ar ? 'الفئة' : 'Category'} value={ar ? category.nameAr : category.nameEn} />}
          {brand && <Field label={ar ? 'الماركة' : 'Brand'} value={ar ? brand.nameAr : brand.nameEn} />}
          {model && <Field label={ar ? 'الموديل' : 'Model'} value={ar ? model.nameAr : model.nameEn} />}
        </Section>
        <Section title={ar ? 'الإيجار' : 'Rental'} icon={Calendar}>
          <Field label={ar ? 'مدة الإيجار' : 'Rental Period'} value={ar ? durationLabels[r.rental_period].ar : durationLabels[r.rental_period].en} />
          <Field label={ar ? 'تاريخ البدء' : 'Start Date'} value={r.requested_start_date || '—'} />
          <Field label={ar ? 'نقل المعدة' : 'Transport'} value={r.transport_by ? (ar ? responsiblePartyLabels[r.transport_by].ar : responsiblePartyLabels[r.transport_by].en) : '—'} />
          <Field label={ar ? 'الديزل' : 'Diesel'} value={r.fuel_by ? (ar ? responsiblePartyLabels[r.fuel_by].ar : responsiblePartyLabels[r.fuel_by].en) : '—'} />
          <Field label={ar ? 'الموقع' : 'Project Location'} value={[r.project_city, r.project_location].filter(Boolean).join(' — ') || '—'} />
          {r.notes && <Field label={ar ? 'ملاحظات' : 'Notes'} value={r.notes} />}
        </Section>
      </>
    );
  };

  // Detail modal: project
  const renderProjectDetails = (p: ProjectRequestRow) => (
    <>
      <Section title={ar ? 'العميل' : 'Customer'} icon={User}>
        <Field label={ar ? 'الاسم' : 'Name'} value={p.customer_name} />
        <Field label={ar ? 'الشركة' : 'Company'} value={p.company_name || '—'} />
        <Field label={ar ? 'الجوال' : 'Phone'} value={p.phone} ltr />
        <Field label={ar ? 'البريد' : 'Email'} value={p.email || '—'} ltr />
      </Section>
      <Section title={ar ? 'الخدمة' : 'Service'} icon={HardHat}>
        <Field label={ar ? 'فئة الخدمة' : 'Service Category'} value={serviceCategoryLabels[p.service_category] ? (ar ? serviceCategoryLabels[p.service_category].ar : serviceCategoryLabels[p.service_category].en) : p.service_category} />
        <Field label={ar ? 'نوع الخدمة' : 'Service Type'} value={p.service_type} />
      </Section>
      <Section title={ar ? 'المشروع' : 'Project'} icon={MapPin}>
        <Field label={ar ? 'الوصف' : 'Description'} value={p.project_description} />
        <Field label={ar ? 'المدينة' : 'City'} value={p.city} />
        {p.district && <Field label={ar ? 'الحي' : 'District'} value={p.district} />}
        {p.project_type && <Field label={ar ? 'نوع المشروع' : 'Project Type'} value={p.project_type} />}
        {p.estimated_budget && <Field label={ar ? 'الميزانية التقديرية' : 'Estimated Budget'} value={p.estimated_budget} />}
        {p.expected_start && <Field label={ar ? 'البدء المتوقع' : 'Expected Start'} value={expectedStartLabels[p.expected_start] ? (ar ? expectedStartLabels[p.expected_start].ar : expectedStartLabels[p.expected_start].en) : p.expected_start} />}
      </Section>
    </>
  );

  const statusesForDropdown = viewing?.type === 'rental'
    ? allRentalStatuses.map((s) => ({ value: s, label: ar ? rentalStatusLabels[s].ar : rentalStatusLabels[s].en }))
    : allProjectDBStatuses.map((s) => ({ value: s, label: ar ? dbStatusLabels[s].ar : dbStatusLabels[s].en }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
          <FileText size={28} className="text-yellow-accent" />
          {ar ? 'الطلبات' : 'Requests Center'}
        </h1>
        <p className="text-base-muted text-sm">{ar ? 'إدارة موحدة لجميع الطلبات الواردة' : 'Unified management for all incoming requests'}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Summary counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Counter label={ar ? 'إجمالي الطلبات' : 'Total'} value={counts.total} color="text-base-primary" />
        <Counter label={ar ? 'الجديدة' : 'New'} value={counts.newCount} color="text-yellow-accent" />
        <Counter label={ar ? 'قيد المراجعة' : 'Reviewing'} value={counts.reviewingCount} color="text-blue-500" />
        <Counter label={ar ? 'بانتظار PO' : 'Awaiting PO'} value={counts.awaitingPoCount} color="text-orange-500" />
        <Counter label={ar ? 'تأجير معدات' : 'Equipment Rental'} value={counts.rentalCount} color="text-cyan-500" icon={<Package size={14} />} />
        <Counter label={ar ? 'مشاريع وخدمات' : 'Project/Service'} value={counts.projectCount} color="text-teal-500" icon={<HardHat size={14} />} />
      </div>

      {/* Filters */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث برقم الطلب، الاسم، الشركة، الجوال...' : 'Search by reference, name, company, phone...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <select className={`${inputClass} ps-10`} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setStatusFilter('all'); }}>
              <option value="all">{ar ? 'كل الأنواع' : 'All types'}</option>
              <option value="rental">{ar ? 'تأجير معدات' : 'Equipment Rental'}</option>
              <option value="project">{ar ? 'مشروع / خدمة' : 'Project / Service'}</option>
            </select>
          </div>
          <div className="relative">
            <Filter size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <select className={`${inputClass} ps-10`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
              {availableStatuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <input type="date" className={inputClass} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-yellow-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <FileText size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد طلبات' : 'No requests'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <button key={`${r.type}-${r.id}`} onClick={() => openDetails(r)} className="card-industrial p-4 w-full text-start hover-lift">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono font-bold text-yellow-accent">{r.reference}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                      r.type === 'rental' ? 'bg-cyan-500/10 text-cyan-500' : 'bg-teal-500/10 text-teal-500'
                    }`}>
                      {r.type === 'rental' ? (ar ? 'تأجير' : 'Rental') : (ar ? 'مشروع' : 'Project')}
                    </span>
                    <span className="text-xs text-base-muted">• {formatDate(r.createdAt)}</span>
                  </div>
                  <div className="text-sm font-bold text-base-primary">{r.serviceOrEquipment}</div>
                  <div className="text-xs text-base-muted">
                    {r.customerName} • {r.companyName || '—'} • {r.phone}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusColor(r)}`}>
                    {getStatusLabel(r)}
                  </span>
                  <Eye size={16} className="text-base-muted" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewing(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-yellow-accent font-mono">{viewing.reference}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    viewing.type === 'rental' ? 'bg-cyan-500/10 text-cyan-500' : 'bg-teal-500/10 text-teal-500'
                  }`}>
                    {viewing.type === 'rental' ? (ar ? 'تأجير معدات' : 'Equipment Rental') : (ar ? 'مشروع / خدمة' : 'Project / Service')}
                  </span>
                </div>
                <p className="text-xs text-base-muted">{viewing.customerName} • {formatDate(viewing.createdAt)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {viewing.rawRental && renderRentalDetails(viewing.rawRental)}
              {viewing.rawProject && renderProjectDetails(viewing.rawProject)}

              {/* Request info */}
              <Section title={ar ? 'الطلب' : 'Request'} icon={FileText}>
                <Field label={ar ? 'المرجع' : 'Reference'} value={viewing.reference} />
                <Field label={ar ? 'الحالة' : 'Status'} value={getStatusLabel(viewing)} />
                <Field label={ar ? 'تاريخ الإنشاء' : 'Created'} value={formatDate(viewing.createdAt)} />
                <Field label={ar ? 'آخر تحديث' : 'Updated'} value={formatDate(viewing.updatedAt)} />
              </Section>

              <TermsAcceptanceBadge
                accepted={viewing.rawRental?.terms_accepted ?? viewing.rawProject?.terms_accepted}
                acceptedAt={viewing.rawRental?.terms_accepted_at ?? viewing.rawProject?.terms_accepted_at}
                lang={lang}
              />

              {/* Assignment */}
              <div className="pt-3 border-t border-base">
                <label className="block text-xs font-semibold text-base-muted mb-1.5 flex items-center gap-1">
                  <UserCheck size={12} />
                  {ar ? 'المسؤول عن الطلب' : 'Assigned To'}
                </label>
                <div className="flex items-center gap-2">
                  <select className={inputClass} value={currentAssignedTo || ''} onChange={(e) => handleAssign(e.target.value || null)} disabled={savingAssigned}>
                    <option value="">{ar ? '— غير محدد —' : '— Unassigned —'}</option>
                    {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                  </select>
                  {savingAssigned && <Loader2 size={16} className="animate-spin text-yellow-accent" />}
                </div>
              </div>

              {/* Status change */}
              <div className="pt-3 border-t border-base">
                <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تغيير الحالة' : 'Change Status'}</label>
                <div className="flex items-center gap-2">
                  <select className={inputClass} value={viewing.status} onChange={(e) => handleChangeStatus(e.target.value)} disabled={savingStatus}>
                    {statusesForDropdown.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  {savingStatus && <Loader2 size={16} className="animate-spin text-yellow-accent" />}
                </div>
              </div>

              {/* Create Quotation button */}
              {(can('quotations', 'create') || can('quotations', 'manage')) && (
                <div className="pt-3 border-t border-base">
                  <button onClick={() => setShowQuotationForm(true)} className="btn-primary text-sm flex items-center gap-2">
                    <FileText size={16} />
                    {ar ? 'إنشاء عرض سعر' : 'Create Quotation'}
                  </button>
                </div>
              )}

              {/* Status history */}
              <div className="pt-3 border-t border-base">
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-3 flex items-center gap-1.5">
                  <History size={14} />
                  {ar ? 'سجل الحالات' : 'Status History'}
                </h4>
                {historyLoading ? (
                  <div className="flex items-center gap-2 text-sm text-base-muted">
                    <Loader2 size={14} className="animate-spin" />
                    {ar ? 'جاري التحميل...' : 'Loading...'}
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-base-muted">{ar ? 'لا يوجد سجل' : 'No history yet'}</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div key={h.id} className="flex items-start gap-3 text-sm p-2 rounded-lg bg-base border border-base">
                        <div className="flex flex-col items-center pt-0.5">
                          <div className="w-2 h-2 rounded-full bg-yellow-accent" />
                          {h !== history[history.length - 1] && <div className="w-0.5 h-full bg-base mt-1" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-base-primary">
                            {h.previous_status ? (
                              <>
                                {viewing.type === 'rental'
                                  ? (ar ? rentalStatusLabels[h.previous_status as RentalRequestStatus]?.ar : rentalStatusLabels[h.previous_status as RentalRequestStatus]?.en)
                                  : (ar ? dbStatusLabels[h.previous_status as ProjectRequestDBStatus]?.ar : dbStatusLabels[h.previous_status as ProjectRequestDBStatus]?.en)
                                }
                                <span className="text-base-muted mx-1">→</span>
                                {viewing.type === 'rental'
                                  ? (ar ? rentalStatusLabels[h.new_status as RentalRequestStatus]?.ar : rentalStatusLabels[h.new_status as RentalRequestStatus]?.en)
                                  : (ar ? dbStatusLabels[h.new_status as ProjectRequestDBStatus]?.ar : dbStatusLabels[h.new_status as ProjectRequestDBStatus]?.en)
                                }
                              </>
                            ) : (
                              <span>{ar ? 'تم إنشاء الطلب' : 'Request created'}: {viewing.type === 'rental'
                                ? (ar ? rentalStatusLabels[h.new_status as RentalRequestStatus]?.ar : rentalStatusLabels[h.new_status as RentalRequestStatus]?.en)
                                : (ar ? dbStatusLabels[h.new_status as ProjectRequestDBStatus]?.ar : dbStatusLabels[h.new_status as ProjectRequestDBStatus]?.en)
                              }</span>
                            )}
                          </div>
                          <div className="text-xs text-base-muted">
                            {h.changed_by_name && <span>{ar ? 'بواسطة' : 'By'}: {h.changed_by_name} • </span>}
                            {formatDateTime(h.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create quotation from request */}
      {showQuotationForm && viewing && (
        <DBQuotationForm
          requestType={viewing.type}
          request={viewing.rawRental || viewing.rawProject!}
          onClose={() => setShowQuotationForm(false)}
          onSaved={() => setShowQuotationForm(false)}
        />
      )}
    </div>
  );
}

// ─── Helper components ───────────────────────────────────────
function Counter({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
  return (
    <div className="card-industrial p-3 sm:p-4">
      <div className={`text-2xl font-black ${color} flex items-center gap-1.5`}>
        {value}
        {icon}
      </div>
      <div className="text-xs text-base-muted mt-0.5">{label}</div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1.5">
        {Icon && <Icon size={14} />}
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div>
      <div className="text-xs text-base-muted mb-0.5">{label}</div>
      <div className="font-semibold text-base-primary" dir={ltr ? 'ltr' : undefined}>{value}</div>
    </div>
  );
}
