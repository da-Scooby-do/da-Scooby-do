import { useState } from 'react';
import { CalendarClock, Search, MapPin } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '../AdminContext';
import { useEquipmentUnit } from '../EquipmentUnitContext';
import { useAllocation } from '../AllocationContext';
import {
  unitStatusLabels, unitStatusColors, conditionLabels, conditionColors,
  allUnitStatuses,
  type UnitStatus,
} from '../equipment-unit-types';
import { allocationStatusLabels, allocationStatusColors } from '../allocation-types';

export default function UnitAvailabilityPage() {
  const { lang } = useApp();
  const { models } = useAdmin();
  const { units } = useEquipmentUnit();
  const { allocationsByUnit } = useAllocation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const ar = lang === 'ar';
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const filtered = units.filter((u) => {
    const model = models.find((m) => m.id === u.modelId);
    const matchSearch = !search ||
      u.unitId.toLowerCase().includes(search.toLowerCase()) ||
      (model?.name_en ?? '').toLowerCase().includes(search.toLowerCase()) ||
      u.currentRegion.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
          <CalendarClock size={28} className="text-yellow-accent" />
          {ar ? 'توفر الوحدات' : 'Unit Availability'}
        </h1>
        <p className="text-base-muted text-sm">{ar ? `${units.length} وحدة` : `${units.length} units`}</p>
      </div>

      {/* Filters */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث برقم الوحدة أو الموديل أو المنطقة...' : 'Search by unit, model, or region...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
            {allUnitStatuses.map((s) => <option key={s} value={s}>{ar ? unitStatusLabels[s].ar : unitStatusLabels[s].en}</option>)}
          </select>
        </div>
      </div>

      {/* Units availability */}
      {filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <CalendarClock size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد وحدات' : 'No units'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((unit) => {
            const model = models.find((m) => m.id === unit.modelId);
            const activeAllocations = allocationsByUnit(unit.id);
            return (
              <div key={unit.id} className="card-industrial p-5 space-y-3">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono font-bold text-yellow-accent">{unit.unitId}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${unitStatusColors[unit.status]}`}>
                        {ar ? unitStatusLabels[unit.status].ar : unitStatusLabels[unit.status].en}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${conditionColors[unit.condition]}`}>
                        {ar ? conditionLabels[unit.condition].ar : conditionLabels[unit.condition].en}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-base-primary">{model ? (ar ? model.name_ar : model.name_en) : '—'} • {unit.year}</div>
                    <div className="text-xs text-base-muted flex items-center gap-1">
                      <MapPin size={12} /> {unit.currentRegion}, {unit.currentCity} — {unit.currentLocation}
                    </div>
                  </div>
                  <div className="text-xs text-base-muted text-end">
                    <div>{ar ? 'متاح من' : 'Available From'}: <span className="font-semibold text-base-primary">{unit.availableFrom || '—'}</span></div>
                    <div>{ar ? 'العقد الحالي' : 'Current Contract'}: <span className="font-semibold text-base-primary">{unit.currentContractReference || '—'}</span></div>
                  </div>
                </div>

                {/* Active allocations */}
                {activeAllocations.length > 0 ? (
                  <div className="pt-3 border-t border-base">
                    <div className="text-xs font-bold text-base-muted uppercase mb-2">{ar ? 'الحجوزات النشطة' : 'Active Reservations'}</div>
                    <div className="space-y-1.5">
                      {activeAllocations.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-base border border-base">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-yellow-accent">{a.allocationNumber}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${allocationStatusColors[a.status]}`}>
                              {ar ? allocationStatusLabels[a.status].ar : allocationStatusLabels[a.status].en}
                            </span>
                          </div>
                          <div className="text-xs text-base-muted">
                            {a.startDate} → {a.expectedEndDate} • {a.companyName || a.customerName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-base">
                    <div className="text-xs text-green-500 font-semibold flex items-center gap-1">
                      <CalendarClock size={12} />
                      {ar ? 'لا توجد حجوزات نشطة - الوحدة متاحة' : 'No active reservations - Unit is available'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
