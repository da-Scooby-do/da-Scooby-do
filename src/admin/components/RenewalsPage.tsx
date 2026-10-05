import { useState, useMemo } from 'react';
import { RefreshCw, Plus, Search, Clock, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useRenewal } from '../RenewalContext';
import { useContract } from '@/contract/ContractContext';
import { useEmployee } from '../EmployeeContext';
import {
  renewalStatusLabels, renewalStatusColors, customerClassificationLabels, customerClassificationColors,
  daysUntilExpiry, expiryAlertLevel, expiryAlertColors,
  type ContractRenewal,
} from '../renewal-types';
import RenewalFormModal from './RenewalFormModal';
import RenewalDetailModal from './RenewalDetailModal';

export default function RenewalsPage() {
  const { lang } = useApp();
  const { renewals } = useRenewal();
  const { contracts } = useContract();
  const { can, currentEmployee } = useEmployee();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState<ContractRenewal | null>(null);

  const ar = lang === 'ar';
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const activeContracts = contracts.filter((c) => c.status === 'active');

  const filtered = useMemo(() => renewals.filter((r) => {
    const matchSearch = !search ||
      r.renewalNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.originalContractNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.companyName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  }), [renewals, search, statusFilter]);

  const stats = {
    total: renewals.length,
    pending: renewals.filter((r) => ['draft', 'pending_internal_review', 'quotation_required', 'pending_customer_approval'].includes(r.status)).length,
    active: renewals.filter((r) => r.status === 'active').length,
    rejected: renewals.filter((r) => r.status === 'rejected').length,
  };

  const statCards = [
    { labelAr: 'إجمالي التجديدات', labelEn: 'Total Renewals', value: stats.total, icon: RefreshCw, color: 'text-yellow-accent' },
    { labelAr: 'قيد المعالجة', labelEn: 'In Progress', value: stats.pending, icon: Clock, color: 'text-orange-500' },
    { labelAr: 'نشطة', labelEn: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-500' },
    { labelAr: 'مرفوضة', labelEn: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
            <RefreshCw size={28} className="text-yellow-accent" />
            {ar ? 'تجديد العقود' : 'Contract Renewals'}
          </h1>
          <p className="text-base-muted text-sm">{ar ? `${stats.total} تجديد` : `${stats.total} renewals`}</p>
        </div>
        {can('contracts', 'create') && activeContracts.length > 0 && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus size={16} />
            {ar ? 'تجديد جديد' : 'New Renewal'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card-industrial p-4">
              <div className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mb-2">
                <Icon size={18} className={s.color} />
              </div>
              <div className="text-xl font-black text-base-primary">{s.value}</div>
              <div className="text-xs text-base-muted">{ar ? s.labelAr : s.labelEn}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث...' : 'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
            {Object.entries(renewalStatusLabels).map(([key, val]) => (
              <option key={key} value={key}>{ar ? val.ar : val.en}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <RefreshCw size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{renewals.length === 0 ? (ar ? 'لا توجد تجديدات' : 'No renewals') : (ar ? 'لا توجد نتائج' : 'No results')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const days = daysUntilExpiry(r.currentEndDate);
            const alert = expiryAlertLevel(days);
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRenewal(r)}
                className="card-industrial p-4 flex items-center gap-4 w-full text-start hover-lift"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-yellow-accent">{r.renewalNumber}</span>
                    <span className="text-xs text-base-muted">• {ar ? 'عقد' : 'Contract'}: {r.originalContractNumber}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${customerClassificationColors[r.customerClassification]}`}>
                      {ar ? customerClassificationLabels[r.customerClassification].ar : customerClassificationLabels[r.customerClassification].en}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-base-primary truncate">{r.companyName || r.customerName}</div>
                  <div className="text-xs text-base-muted truncate">{r.equipmentModel} • {ar ? 'الكمية' : 'Qty'}: {r.quantity}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-base-muted">
                    <span>{ar ? 'الحالي' : 'Current'}: {r.currentStartDate} → {r.currentEndDate}</span>
                    {r.status === 'active' && alert !== 'none' && (
                      <span className={`flex items-center gap-1 ${expiryAlertColors[alert]}`}>
                        <AlertTriangle size={12} />
                        {ar ? `باقي ${days} يوم` : `${days} days left`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${renewalStatusColors[r.status]}`}>
                    {ar ? renewalStatusLabels[r.status].ar : renewalStatusLabels[r.status].en}
                  </span>
                  <span className="text-xs text-base-muted">{r.assignedEmployeeName}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showForm && <RenewalFormModal onClose={() => setShowForm(false)} />}
      {selectedRenewal && (
        <RenewalDetailModal
          renewal={selectedRenewal}
          onClose={() => setSelectedRenewal(null)}
        />
      )}
    </div>
  );
}
