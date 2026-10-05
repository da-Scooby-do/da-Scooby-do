import { useState } from 'react';
import { Boxes, Plus, Search, Eye, Pencil, Archive, Filter } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '../AdminContext';
import { useEquipmentUnit } from '../EquipmentUnitContext';
import {
  unitStatusLabels, unitStatusColors, allUnitStatuses,
  type ActualEquipmentUnit, type UnitStatus,
} from '../equipment-unit-types';
import UnitForm from './UnitForm';
import UnitDetailModal from './UnitDetailModal';

export default function EquipmentUnitsPage() {
  const { lang } = useApp();
  const { models, categories, brands } = useAdmin();
  const { units, archiveUnit, setUnitStatus } = useEquipmentUnit();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ActualEquipmentUnit | null>(null);
  const [viewing, setViewing] = useState<ActualEquipmentUnit | null>(null);

  const ar = lang === 'ar';
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const getModelName = (modelId: string) => {
    const m = models.find((x) => x.id === modelId);
    return m ? (ar ? m.name_ar : m.name_en) : '—';
  };

  const getModelInfo = (modelId: string) => {
    const m = models.find((x) => x.id === modelId);
    if (!m) return { category: '—', brand: '—' };
    const cat = categories.find((c) => c.id === m.category_id);
    const brand = brands.find((b) => b.id === m.brand_id);
    return {
      category: cat ? (ar ? cat.name_ar : cat.name_en) : '—',
      brand: brand ? (ar ? brand.name_ar : brand.name_en) : '—',
    };
  };

  const regions = Array.from(new Set(units.map((u) => u.currentRegion).filter(Boolean)));

  const filtered = units.filter((u) => {
    const modelInfo = getModelInfo(u.modelId);
    const matchSearch = !search ||
      u.unitId.toLowerCase().includes(search.toLowerCase()) ||
      u.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      getModelName(u.modelId).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || modelInfo.category === categoryFilter || models.find((m) => m.id === u.modelId)?.category_id === categoryFilter;
    const matchBrand = brandFilter === 'all' || models.find((m) => m.id === u.modelId)?.brand_id === brandFilter;
    const matchModel = modelFilter === 'all' || u.modelId === modelFilter;
    const matchRegion = regionFilter === 'all' || u.currentRegion === regionFilter;
    return matchSearch && matchStatus && matchCategory && matchBrand && matchModel && matchRegion;
  });

  // Stats
  const stats = [
    { labelAr: 'إجمالي', labelEn: 'Total', value: units.length, color: 'text-base-primary' },
    { labelAr: 'متاح', labelEn: 'Available', value: units.filter((u) => u.status === 'available').length, color: 'text-green-500' },
    { labelAr: 'محجوز', labelEn: 'Reserved', value: units.filter((u) => u.status === 'reserved').length, color: 'text-blue-500' },
    { labelAr: 'مؤجر', labelEn: 'Rented', value: units.filter((u) => u.status === 'rented').length, color: 'text-purple-500' },
    { labelAr: 'تحت الفحص', labelEn: 'Under Inspection', value: units.filter((u) => u.status === 'under_inspection').length, color: 'text-orange-500' },
    { labelAr: 'تحت الصيانة', labelEn: 'Under Maintenance', value: units.filter((u) => u.status === 'under_maintenance').length, color: 'text-yellow-accent' },
  ];

  const handleEdit = (unit: ActualEquipmentUnit) => {
    setEditing(unit);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
            <Boxes size={28} className="text-yellow-accent" />
            {ar ? 'الوحدات الفعلية للمعدات' : 'Actual Equipment Units'}
          </h1>
          <p className="text-base-muted text-sm">{ar ? `${units.length} وحدة` : `${units.length} units`}</p>
        </div>
        <button onClick={handleAdd} className="btn-primary text-sm">
          <Plus size={16} />
          {ar ? 'إضافة وحدة' : 'Add Unit'}
        </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث برقم الوحدة أو التسلسلي...' : 'Search by unit ID or serial...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
            {allUnitStatuses.map((s) => <option key={s} value={s}>{ar ? unitStatusLabels[s].ar : unitStatusLabels[s].en}</option>)}
          </select>
          <select className={inputClass} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الفئات' : 'All categories'}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{ar ? c.name_ar : c.name_en}</option>)}
          </select>
          <select className={inputClass} value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الماركات' : 'All brands'}</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{ar ? b.name_ar : b.name_en}</option>)}
          </select>
          <select className={inputClass} value={modelFilter} onChange={(e) => setModelFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الموديلات' : 'All models'}</option>
            {models.map((m) => <option key={m.id} value={m.id}>{ar ? m.name_ar : m.name_en}</option>)}
          </select>
          <select className={inputClass} value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
            <option value="all">{ar ? 'كل المناطق' : 'All regions'}</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Units list */}
      {filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <Boxes size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد وحدات' : 'No units'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((unit) => {
            const modelInfo = getModelInfo(unit.modelId);
            return (
              <div key={unit.id} className="card-industrial p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-yellow-accent">{unit.unitId}</span>
                    <span className="text-xs text-base-muted">• {unit.year}</span>
                  </div>
                  <div className="text-sm font-bold text-base-primary">{getModelName(unit.modelId)}</div>
                  <div className="text-xs text-base-muted">
                    {modelInfo.brand} • {modelInfo.category} • {ar ? 'المنطقة' : 'Region'}: {unit.currentRegion || '—'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={unit.status}
                    onChange={(e) => setUnitStatus(unit.id, e.target.value as UnitStatus)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border-0 cursor-pointer ${unitStatusColors[unit.status]}`}
                  >
                    {allUnitStatuses.map((s) => <option key={s} value={s}>{ar ? unitStatusLabels[s].ar : unitStatusLabels[s].en}</option>)}
                  </select>
                  <div className="flex gap-1">
                    <button onClick={() => setViewing(unit)} className="p-1.5 rounded-lg text-base-muted hover:text-yellow-accent hover:bg-yellow-accent/10" title={ar ? 'عرض' : 'View'}>
                      <Eye size={16} />
                    </button>
                    <button onClick={() => handleEdit(unit)} className="p-1.5 rounded-lg text-base-muted hover:text-blue-500 hover:bg-blue-500/10" title={ar ? 'تعديل' : 'Edit'}>
                      <Pencil size={16} />
                    </button>
                    {unit.status !== 'archived' && (
                      <button onClick={() => archiveUnit(unit.id)} className="p-1.5 rounded-lg text-base-muted hover:text-orange-500 hover:bg-orange-500/10" title={ar ? 'أرشفة' : 'Archive'}>
                        <Archive size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <UnitForm existing={editing} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}

      {viewing && (
        <UnitDetailModal unit={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
