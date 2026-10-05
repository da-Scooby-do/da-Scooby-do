import { useState } from 'react';
import { Truck, Plus, Search, Eye } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useDelivery } from '../DeliveryContext';
import { useEmployee } from '../EmployeeContext';
import {
  deliveryStatusLabels, deliveryStatusColors, returnStatusLabels, returnStatusColors,
  allDeliveryStatuses,
  type DeliveryRecord, type DeliveryStatus,
} from '../delivery-types';
import DeliveryFormModal from './DeliveryFormModal';
import DeliveryDetailModal from './DeliveryDetailModal';

export default function DeliveriesPage() {
  const { lang } = useApp();
  const { deliveries } = useDelivery();
  const { can } = useEmployee();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<DeliveryRecord | null>(null);

  const ar = lang === 'ar';
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const filtered = deliveries.filter((d) => {
    const matchSearch = !search ||
      d.deliveryNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.companyName.toLowerCase().includes(search.toLowerCase()) ||
      d.unitCode.toLowerCase().includes(search.toLowerCase()) ||
      d.modelName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = [
    { labelAr: 'إجمالي', labelEn: 'Total', value: deliveries.length, color: 'text-base-primary' },
    { labelAr: 'مجدول', labelEn: 'Scheduled', value: deliveries.filter((d) => d.status === 'scheduled').length, color: 'text-blue-500' },
    { labelAr: 'قيد التوصيل', labelEn: 'In Transit', value: deliveries.filter((d) => d.status === 'in_transit').length, color: 'text-orange-500' },
    { labelAr: 'تم التسليم', labelEn: 'Delivered', value: deliveries.filter((d) => d.status === 'delivered').length, color: 'text-green-500' },
    { labelAr: 'متوقعة الإرجاع', labelEn: 'Expected Returns', value: deliveries.filter((d) => d.returnRecord && (d.returnRecord.status === 'expected' || d.returnRecord.status === 'scheduled')).length, color: 'text-purple-500' },
    { labelAr: 'قيد المراجعة', labelEn: 'Under Review', value: deliveries.filter((d) => d.returnRecord && d.returnRecord.status === 'under_review').length, color: 'text-yellow-accent' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
            <Truck size={28} className="text-yellow-accent" />
            {ar ? 'التسليم والاستلام' : 'Deliveries & Returns'}
          </h1>
          <p className="text-base-muted text-sm">{ar ? `${deliveries.length} سجل` : `${deliveries.length} records`}</p>
        </div>
        {can('rental_requests', 'create') && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus size={16} />
            {ar ? 'تسليم جديد' : 'New Delivery'}
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
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث برقم التسليم أو العقد أو العميل...' : 'Search by delivery #, contract, or customer...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
            {allDeliveryStatuses.map((s) => <option key={s} value={s}>{ar ? deliveryStatusLabels[s].ar : deliveryStatusLabels[s].en}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <Truck size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد سجلات' : 'No records'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <button key={d.id} onClick={() => setViewing(d)} className="card-industrial p-4 w-full text-start hover-lift">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-yellow-accent">{d.deliveryNumber}</span>
                    <span className="text-xs text-base-muted">• {ar ? 'عقد' : 'Contract'}: {d.contractNumber}</span>
                  </div>
                  <div className="text-sm font-bold text-base-primary">{d.modelName} → <span className="font-mono text-base-muted">{d.unitCode}</span></div>
                  <div className="text-xs text-base-muted">
                    {d.companyName || d.customerName} • {ar ? 'المشروع' : 'Project'}: {d.projectName || '—'} • {d.deliveryDate}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${deliveryStatusColors[d.status]}`}>
                    {ar ? deliveryStatusLabels[d.status].ar : deliveryStatusLabels[d.status].en}
                  </span>
                  {d.returnRecord && (
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${returnStatusColors[d.returnRecord.status]}`}>
                      {ar ? returnStatusLabels[d.returnRecord.status].ar : returnStatusLabels[d.returnRecord.status].en}
                    </span>
                  )}
                  <Eye size={16} className="text-base-muted" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <DeliveryFormModal onClose={() => setShowForm(false)} />
      )}

      {viewing && (
        <DeliveryDetailModal delivery={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
