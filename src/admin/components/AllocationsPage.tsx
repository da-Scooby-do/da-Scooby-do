import { useState } from 'react';
import { Shuffle, Plus, Search, Eye, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAllocation } from '../AllocationContext';
import { useEmployee } from '../EmployeeContext';
import {
  allocationStatusLabels, allocationStatusColors, allAllocationStatuses,
  type EquipmentAllocation, type AllocationStatus,
} from '../allocation-types';
import AllocationFormModal from './AllocationFormModal';
import AllocationDetailModal from './AllocationDetailModal';

export default function AllocationsPage() {
  const { lang } = useApp();
  const { allocations } = useAllocation();
  const { can } = useEmployee();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<EquipmentAllocation | null>(null);

  const ar = lang === 'ar';
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const filtered = allocations.filter((a) => {
    const matchSearch = !search ||
      a.allocationNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.companyName.toLowerCase().includes(search.toLowerCase()) ||
      a.unitCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = [
    { labelAr: 'إجمالي', labelEn: 'Total', value: allocations.length, color: 'text-base-primary' },
    { labelAr: 'بانتظار', labelEn: 'Pending', value: allocations.filter((a) => a.status === 'pending').length, color: 'text-orange-500' },
    { labelAr: 'محجوز', labelEn: 'Reserved', value: allocations.filter((a) => a.status === 'reserved').length, color: 'text-blue-500' },
    { labelAr: 'مخصّص', labelEn: 'Allocated', value: allocations.filter((a) => a.status === 'allocated').length, color: 'text-green-500' },
    { labelAr: 'ملغي', labelEn: 'Cancelled', value: allocations.filter((a) => a.status === 'cancelled').length, color: 'text-red-500' },
    { labelAr: 'مُحرر', labelEn: 'Released', value: allocations.filter((a) => a.status === 'released').length, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
            <Shuffle size={28} className="text-yellow-accent" />
            {ar ? 'تخصيص المعدات' : 'Equipment Allocations'}
          </h1>
          <p className="text-base-muted text-sm">{ar ? `${allocations.length} تخصيص` : `${allocations.length} allocations`}</p>
        </div>
        {can('rental_requests', 'create') && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus size={16} />
            {ar ? 'تخصيص معدة' : 'New Allocation'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="card-industrial p-4">
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-base-muted mt-1">{ar ? stat.labelAr : stat.labelEn}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث برقم التخصيص أو العقد أو العميل...' : 'Search by allocation #, contract, or customer...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
            {allAllocationStatuses.map((s) => <option key={s} value={s}>{ar ? allocationStatusLabels[s].ar : allocationStatusLabels[s].en}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <Shuffle size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد تخصيصات' : 'No allocations'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alloc) => (
            <button key={alloc.id} onClick={() => setViewing(alloc)} className="card-industrial p-4 w-full text-start hover-lift">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-yellow-accent">{alloc.allocationNumber}</span>
                    <span className="text-xs text-base-muted">• {ar ? 'عقد' : 'Contract'}: {alloc.contractNumber}</span>
                  </div>
                  <div className="text-sm font-bold text-base-primary">{alloc.modelName} → <span className="font-mono text-base-muted">{alloc.unitCode}</span></div>
                  <div className="text-xs text-base-muted">
                    {alloc.companyName || alloc.customerName} • {ar ? 'المشروع' : 'Project'}: {alloc.projectName || '—'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-base-muted text-end">
                    <div>{alloc.startDate} → {alloc.expectedEndDate}</div>
                    <div>{ar ? 'المسؤول' : 'Assigned'}: {alloc.assignedEmployeeName}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${allocationStatusColors[alloc.status]}`}>
                    {ar ? allocationStatusLabels[alloc.status].ar : allocationStatusLabels[alloc.status].en}
                  </span>
                  <Eye size={16} className="text-base-muted" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <AllocationFormModal onClose={() => setShowForm(false)} />
      )}

      {viewing && (
        <AllocationDetailModal allocation={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
