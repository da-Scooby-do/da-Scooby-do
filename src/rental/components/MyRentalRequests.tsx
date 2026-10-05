import { useState } from 'react';
import { Package, Plus, ArrowRight, ArrowLeft, X, MapPin } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '@/customer/CustomerContext';
import { useRental } from '@/rental/RentalContext';
import { statusLabels, statusColors, durationLabels, operatorLabels, dieselLabels, transportLabels } from '@/rental/types';
import type { RentalRequest, RentalRequestDraft } from '@/rental/types';
import RentalRequestForm from '@/rental/components/RentalRequestForm';

export default function MyRentalRequests() {
  const { lang, dir } = useApp();
  const { user, setView } = useCustomer();
  const { requestsByCustomer } = useRental();
  const [showForm, setShowForm] = useState(false);
  const [prefill, setPrefill] = useState<Partial<RentalRequestDraft> | undefined>(undefined);
  const [viewing, setViewing] = useState<RentalRequest | null>(null);

  const myRequests = user ? requestsByCustomer(user.id) : [];

  const startNewRequest = () => {
    const saved = sessionStorage.getItem('rentalDraft');
    if (saved) {
      setPrefill(JSON.parse(saved));
      sessionStorage.removeItem('rentalDraft');
    } else {
      setPrefill(undefined);
    }
    setShowForm(true);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary">
            {lang === 'ar' ? 'طلب تأجير معدات' : 'Equipment Rental Request'}
          </h1>
          <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">
            <X size={16} />
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
        <RentalRequestForm
          prefill={prefill}
          onComplete={() => { setShowForm(false); setView('rental-requests'); }}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  if (viewing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-base-primary">{viewing.requestNumber}</h1>
          <button onClick={() => setViewing(null)} className="btn-secondary text-sm">
            {dir === 'rtl' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            {lang === 'ar' ? 'العودة' : 'Back'}
          </button>
        </div>
        <div className="card-industrial p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusColors[viewing.status]}`}>
              {lang === 'ar' ? statusLabels[viewing.status].ar : statusLabels[viewing.status].en}
            </span>
            <span className="text-xs text-base-muted">{viewing.createdAt}</span>
          </div>

          {/* Equipment items */}
          <div>
            <h3 className="text-xs font-bold text-yellow-accent uppercase mb-2">{lang === 'ar' ? 'المعدات' : 'Equipment'} ({viewing.items.length})</h3>
            <div className="space-y-3">
              {viewing.items.map((it, i) => (
                <div key={i} className="p-3 rounded-lg bg-base border border-base">
                  <div className="text-xs text-base-muted mb-1">#{i + 1}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="text-xs text-base-muted">{lang === 'ar' ? 'الفئة' : 'Category'}</span><div className="text-sm font-semibold text-base-primary">{lang === 'ar' ? it.categoryNameAr : it.categoryNameEn}</div></div>
                    <div><span className="text-xs text-base-muted">{lang === 'ar' ? 'الماركة' : 'Brand'}</span><div className="text-sm font-semibold text-base-primary">{lang === 'ar' ? it.brandNameAr : it.brandNameEn}</div></div>
                    <div><span className="text-xs text-base-muted">{lang === 'ar' ? 'الموديل' : 'Model'}</span><div className="text-sm font-semibold text-base-primary">{lang === 'ar' ? it.modelNameAr : it.modelNameEn}</div></div>
                    <div><span className="text-xs text-base-muted">{lang === 'ar' ? 'الحجم/السعة' : 'Size/Capacity'}</span><div className="text-sm font-semibold text-base-primary">{lang === 'ar' ? it.variantLabelAr : it.variantLabelEn}</div></div>
                    <div><span className="text-xs text-base-muted">{lang === 'ar' ? 'الكمية' : 'Quantity'}</span><div className="text-sm font-semibold text-base-primary">{it.quantity}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-base" />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><span className="text-xs text-base-muted">{lang === 'ar' ? 'المدة' : 'Duration'}</span><div className="text-sm font-semibold text-base-primary">{lang === 'ar' ? durationLabels[viewing.duration].ar : durationLabels[viewing.duration].en}</div></div>
            <div><span className="text-xs text-base-muted">{lang === 'ar' ? 'تاريخ البدء' : 'Start Date'}</span><div className="text-sm font-semibold text-base-primary">{viewing.startDate}</div></div>
            <div><span className="text-xs text-base-muted">{lang === 'ar' ? 'المشغل' : 'Operator'}</span><div className="text-sm font-semibold text-base-primary">{lang === 'ar' ? operatorLabels[viewing.operator].ar : operatorLabels[viewing.operator].en}</div></div>
            <div><span className="text-xs text-base-muted">{lang === 'ar' ? 'الديزل' : 'Diesel'}</span><div className="text-sm font-semibold text-base-primary">{lang === 'ar' ? dieselLabels[viewing.diesel].ar : dieselLabels[viewing.diesel].en}</div></div>
            <div><span className="text-xs text-base-muted">{lang === 'ar' ? 'النقل' : 'Transport'}</span><div className="text-sm font-semibold text-base-primary">{lang === 'ar' ? transportLabels[viewing.transport].ar : transportLabels[viewing.transport].en}</div></div>
          </div>
          <div className="h-px bg-base" />
          <div>
            <div className="text-xs text-base-muted mb-1 flex items-center gap-1"><MapPin size={12} /> {lang === 'ar' ? 'المشروع' : 'Project'}</div>
            <div className="text-sm text-base-primary">{viewing.projectName} — {viewing.region}, {viewing.city}</div>
            <div className="text-sm text-base-muted">{viewing.siteLocation}</div>
          </div>
          {viewing.notes && (
            <div>
              <div className="text-xs text-base-muted mb-1">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</div>
              <div className="text-sm text-base-primary">{viewing.notes}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const itemSummary = (req: RentalRequest) => {
    const first = req.items[0];
    if (!first) return '—';
    const name = lang === 'ar' ? first.modelNameAr : first.modelNameEn;
    if (req.items.length === 1) return name;
    return `${name} +${req.items.length - 1}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
            <Package size={28} className="text-yellow-accent" />
            {lang === 'ar' ? 'طلبات تأجير المعدات' : 'Equipment Rental Requests'}
          </h1>
          <p className="text-base-muted text-sm">{lang === 'ar' ? `${myRequests.length} طلب` : `${myRequests.length} requests`}</p>
        </div>
        <button onClick={startNewRequest} className="btn-primary text-sm">
          <Plus size={16} />
          {lang === 'ar' ? 'طلب تأجير معدات' : 'New Rental Request'}
        </button>
      </div>

      {myRequests.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <Package size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted mb-4">{lang === 'ar' ? 'لا توجد طلبات تأجير' : 'No rental requests'}</p>
          <button onClick={startNewRequest} className="btn-primary">
            <Plus size={16} />
            {lang === 'ar' ? 'إنشاء طلب جديد' : 'Create New Request'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {myRequests.map((req) => (
            <button key={req.id} onClick={() => setViewing(req)} className="card-industrial p-5 w-full text-start hover-lift">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-base-muted">{req.requestNumber}</span>
                    <span className="text-xs text-base-muted">• {req.createdAt}</span>
                    {req.items.length > 1 && <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-accent/10 text-yellow-accent font-semibold">{req.items.length} {lang === 'ar' ? 'معدة' : 'items'}</span>}
                  </div>
                  <h3 className="text-base font-bold text-base-primary">{itemSummary(req)}</h3>
                  <div className="text-xs text-base-muted mt-0.5">
                    {req.items.map((it, i) => (
                      <span key={i}>{lang === 'ar' ? it.categoryNameAr : it.categoryNameEn}{i < req.items.length - 1 ? '، ' : ''}</span>
                    ))}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusColors[req.status]}`}>
                  {lang === 'ar' ? statusLabels[req.status].ar : statusLabels[req.status].en}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-base-muted">
                <span>{lang === 'ar' ? durationLabels[req.duration].ar : durationLabels[req.duration].en}</span>
                <span>{req.startDate}</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {req.region}, {req.city}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
