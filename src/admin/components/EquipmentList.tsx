import { useState, useMemo } from 'react';
import { Search, Plus, Eye, EyeOff, Trash2, ArrowUp, ArrowDown, Pencil, Filter, Archive } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '../AdminContext';
import type { AdminModelRow } from '@/catalog/catalogApi';
import EquipmentForm from './EquipmentForm';

const availabilityLabels: Record<string, { ar: string; en: string }> = {
  available: { ar: 'متاح', en: 'Available' },
  unavailable: { ar: 'غير متاح', en: 'Unavailable' },
  rented: { ar: 'مؤجر', en: 'Rented' },
  maintenance: { ar: 'صيانة', en: 'Maintenance' },
};

const availabilityColors: Record<string, string> = {
  available: 'bg-green-500/10 text-green-500',
  unavailable: 'bg-orange-500/10 text-orange-500',
  rented: 'bg-purple-500/10 text-purple-500',
  maintenance: 'bg-yellow-accent/10 text-yellow-accent',
};

export default function EquipmentList() {
  const { lang, dir } = useApp();
  const {
    models, categories, brands, variants,
    deleteModel, archiveModel, toggleModelPublished, updateModelAvailability, reorderModel,
  } = useAdmin();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingModel, setEditingModel] = useState<AdminModelRow | null>(null);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    let result = [...models].sort((a, b) => a.display_order - b.display_order);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((m) =>
        m.name_ar.toLowerCase().includes(q) || m.name_en.toLowerCase().includes(q)
      );
    }
    if (catFilter) result = result.filter((m) => m.category_id === catFilter);
    if (brandFilter) result = result.filter((m) => m.brand_id === brandFilter);
    if (statusFilter === 'published') result = result.filter((m) => m.published);
    if (statusFilter === 'hidden') result = result.filter((m) => !m.published);
    if (statusFilter === 'archived') result = result.filter((m) => m.archived);
    return result;
  }, [models, search, catFilter, brandFilter, statusFilter]);

  const handleEdit = (model: AdminModelRow) => {
    setEditingModel(model);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingModel(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setError('');
      await deleteModel(id);
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      setError('');
      await archiveModel(id, true);
    } catch (e: any) {
      setError(e?.message || 'Failed to archive');
    }
  };

  const handleTogglePublished = async (model: AdminModelRow) => {
    try {
      setError('');
      await toggleModelPublished(model.id, !model.published);
    } catch (e: any) {
      setError(e?.message || 'Failed to toggle');
    }
  };

  const handleReorder = async (id: string, d: 'up' | 'down') => {
    try {
      setError('');
      await reorderModel(id, d);
    } catch (e: any) {
      setError(e?.message || 'Failed to reorder');
    }
  };

  const handleAvailabilityChange = async (id: string, status: string) => {
    try {
      setError('');
      await updateModelAvailability(id, status);
    } catch (e: any) {
      setError(e?.message || 'Failed to update availability');
    }
  };

  const getCatName = (id: string) => {
    const c = categories.find((c) => c.id === id);
    return c ? (lang === 'ar' ? c.name_ar : c.name_en) : '—';
  };
  const getBrandName = (id: string) => {
    const b = brands.find((b) => b.id === id);
    return b ? (lang === 'ar' ? b.name_ar : b.name_en) : '—';
  };
  const getVariantSummary = (model: AdminModelRow) => {
    const vList = variants.filter((v) => v.model_id === model.id && v.published);
    if (vList.length === 0) return '—';
    return vList.map((v) => (lang === 'ar' ? v.size_label_ar : v.size_label_en)).join('، ');
  };

  const availabilityOptions = ['available', 'unavailable', 'rented', 'maintenance'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1">
            {lang === 'ar' ? 'إدارة المعدات' : 'Equipment Management'}
          </h1>
          <p className="text-base-muted text-sm">
            {lang === 'ar' ? `${filtered.length} معدة` : `${filtered.length} models`}
          </p>
        </div>
        <button onClick={handleAdd} className="btn-primary text-sm">
          <Plus size={16} />
          {lang === 'ar' ? 'إضافة معدة' : 'Add Model'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card-industrial p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث عن معدة...' : 'Search models...'}
              className="w-full ps-9 pe-4 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none"
            />
          </div>
          {/* Category filter */}
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none"
          >
            <option value="">{lang === 'ar' ? 'كل الفئات' : 'All Categories'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{lang === 'ar' ? c.name_ar : c.name_en}</option>
            ))}
          </select>
          {/* Brand filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none"
          >
            <option value="">{lang === 'ar' ? 'كل الماركات' : 'All Brands'}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{lang === 'ar' ? b.name_ar : b.name_en}</option>
            ))}
          </select>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none"
          >
            <option value="">{lang === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            <option value="published">{lang === 'ar' ? 'منشور' : 'Published'}</option>
            <option value="hidden">{lang === 'ar' ? 'مخفي' : 'Hidden'}</option>
            <option value="archived">{lang === 'ar' ? 'مؤرشف' : 'Archived'}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card-industrial overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base bg-black/5 dark:bg-white/5">
                <th className="px-4 py-3 text-start font-semibold text-base-muted">#</th>
                <th className="px-4 py-3 text-start font-semibold text-base-muted">{lang === 'ar' ? 'الصورة' : 'Image'}</th>
                <th className="px-4 py-3 text-start font-semibold text-base-muted">{lang === 'ar' ? 'المعدة' : 'Equipment'}</th>
                <th className="px-4 py-3 text-start font-semibold text-base-muted hidden md:table-cell">{lang === 'ar' ? 'الفئة' : 'Category'}</th>
                <th className="px-4 py-3 text-start font-semibold text-base-muted hidden md:table-cell">{lang === 'ar' ? 'الماركة' : 'Brand'}</th>
                <th className="px-4 py-3 text-start font-semibold text-base-muted hidden lg:table-cell">{lang === 'ar' ? 'الأحجام' : 'Sizes'}</th>
                <th className="px-4 py-3 text-start font-semibold text-base-muted">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="px-4 py-3 text-start font-semibold text-base-muted hidden lg:table-cell">{lang === 'ar' ? 'التوفر' : 'Availability'}</th>
                <th className="px-4 py-3 text-start font-semibold text-base-muted hidden lg:table-cell">{lang === 'ar' ? 'السعر اليومي' : 'Daily Price'}</th>
                <th className="px-4 py-3 text-start font-semibold text-base-muted">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-base-muted">
                    <Filter size={32} className="mx-auto mb-2 opacity-30" />
                    {lang === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                  </td>
                </tr>
              ) : (
                filtered.map((model, i) => (
                  <tr key={model.id} className="border-b border-base hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-base-muted font-mono text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black flex-shrink-0">
                        {model.image && <img src={model.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-base-primary">{lang === 'ar' ? model.name_ar : model.name_en}</div>
                      <div className="text-xs text-base-muted">{lang === 'ar' ? model.name_en : model.name_ar}</div>
                      {model.archived && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-base-muted/10 text-base-muted text-[0.6rem] font-bold">
                          {lang === 'ar' ? 'مؤرشف' : 'Archived'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-base-muted hidden md:table-cell">{getCatName(model.category_id)}</td>
                    <td className="px-4 py-3 text-base-muted hidden md:table-cell">{getBrandName(model.brand_id)}</td>
                    <td className="px-4 py-3 text-base-muted hidden lg:table-cell max-w-[150px] truncate">{getVariantSummary(model)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${model.published ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                        {model.published ? (lang === 'ar' ? 'منشور' : 'Published') : (lang === 'ar' ? 'مخفي' : 'Hidden')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <select
                        value={model.availability || 'available'}
                        onChange={(e) => handleAvailabilityChange(model.id, e.target.value)}
                        className={`px-2 py-1 rounded-md text-xs font-semibold border-0 cursor-pointer ${availabilityColors[model.availability || 'available'] || 'bg-base-muted/10 text-base-muted'}`}
                      >
                        {availabilityOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {lang === 'ar' ? availabilityLabels[opt].ar : availabilityLabels[opt].en}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-base-muted hidden lg:table-cell">
                      {model.rental_info?.dailyPrice ? `${model.rental_info.dailyPrice} ${lang === 'ar' ? 'ر.س' : 'SAR'}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(model)} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent transition-colors" title={lang === 'ar' ? 'تعديل' : 'Edit'}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleTogglePublished(model)} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent transition-colors" title={lang === 'ar' ? 'نشر/إخفاء' : 'Publish/Hide'}>
                          {model.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        {!model.archived && (
                          <button onClick={() => handleReorder(model.id, dir === 'rtl' ? 'down' : 'up')} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent transition-colors" title={lang === 'ar' ? 'تحريك لأعلى' : 'Move up'}>
                            <ArrowUp size={14} />
                          </button>
                        )}
                        {!model.archived && (
                          <button onClick={() => handleReorder(model.id, dir === 'rtl' ? 'up' : 'down')} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent transition-colors" title={lang === 'ar' ? 'تحريك لأسفل' : 'Move down'}>
                            <ArrowDown size={14} />
                          </button>
                        )}
                        {!model.archived && (
                          <button
                            onClick={() => { if (confirm(lang === 'ar' ? 'هل أنت متأكد من أرشفة هذه المعدة؟' : 'Archive this model?')) handleArchive(model.id); }}
                            className="p-1.5 rounded-md hover:bg-blue-500/10 text-base-muted hover:text-blue-500 transition-colors"
                            title={lang === 'ar' ? 'أرشفة' : 'Archive'}
                          >
                            <Archive size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => { if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه المعدة؟' : 'Are you sure you want to delete this model?')) handleDelete(model.id); }}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-base-muted hover:text-red-500 transition-colors"
                          title={lang === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <EquipmentForm
          editingModel={editingModel}
          onClose={() => { setShowForm(false); setEditingModel(null); }}
        />
      )}
    </div>
  );
}
