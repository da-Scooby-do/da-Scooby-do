import { useEffect, useState } from 'react';
import { Package, Plus, ArrowRight, ArrowLeft, MapPin, Calendar, Truck, Fuel, Hash } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '@/customer/CustomerContext';
import { useRental } from '@/rental/RentalContext';
import { statusLabels, statusColors, durationLabels, responsiblePartyLabels } from '@/rental/types';
import type { RentalRequestRow } from '@/rental/types';
import RequestTracker, { RequestProgressBar } from '@/customer/components/RequestTracker';

/** The signed-in customer's equipment rental requests (from the database) with order progress. */
export default function MyRentalRequests() {
  const { lang, dir } = useApp();
  const ar = lang === 'ar';
  const { user } = useCustomer();
  const { requests, reload } = useRental();
  const [viewing, setViewing] = useState<RentalRequestRow | null>(null);

  useEffect(() => {
    reload();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const email = user?.email.toLowerCase().trim();
  const mine = requests.filter((r) => r.email && r.email.toLowerCase() === email);
  const fmt = (d: string) => new Date(d).toLocaleDateString(ar ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  const party = (p: RentalRequestRow['transport_by']) => (p ? (ar ? responsiblePartyLabels[p].ar : responsiblePartyLabels[p].en) : '—');

  if (viewing) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono text-yellow-accent">{viewing.request_reference}</div>
            <h1 className="text-xl lg:text-2xl font-black text-base-primary">{ar ? viewing.equipment_name_ar : viewing.equipment_name}</h1>
          </div>
          <button onClick={() => setViewing(null)} className="btn-secondary text-sm">
            {dir === 'rtl' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            {ar ? 'العودة' : 'Back'}
          </button>
        </div>
        <div className="grid lg:grid-cols-[1fr_20rem] gap-6 items-start">
          <div className="card-industrial p-5 space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusColors[viewing.status]}`}>{ar ? statusLabels[viewing.status].ar : statusLabels[viewing.status].en}</span>
              <span className="text-base-muted text-xs">{fmt(viewing.created_at)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2"><Calendar size={15} className="text-yellow-accent" /><span className="text-base-muted">{ar ? 'المدة:' : 'Period:'}</span> <b className="text-base-primary">{ar ? durationLabels[viewing.rental_period].ar : durationLabels[viewing.rental_period].en}</b></div>
              <div className="flex items-center gap-2"><MapPin size={15} className="text-yellow-accent" /><span className="text-base-muted">{ar ? 'الموقع:' : 'Location:'}</span> <b className="text-base-primary">{[viewing.project_city, viewing.project_location].filter(Boolean).join(' — ') || '—'}</b></div>
              <div className="flex items-center gap-2"><Hash size={15} className="text-yellow-accent" /><span className="text-base-muted">{ar ? 'عدد المعدات:' : 'Machines:'}</span> <b className="text-base-primary">{viewing.quantity ?? 1}</b></div>
              <div className="flex items-center gap-2"><Truck size={15} className="text-yellow-accent" /><span className="text-base-muted">{ar ? 'نقل المعدة:' : 'Transport:'}</span> <b className="text-base-primary">{party(viewing.transport_by)}</b></div>
              <div className="flex items-center gap-2"><Fuel size={15} className="text-yellow-accent" /><span className="text-base-muted">{ar ? 'الديزل:' : 'Diesel:'}</span> <b className="text-base-primary">{party(viewing.fuel_by)}</b></div>
            </div>
            {viewing.notes && <div className="p-3 rounded-lg bg-base border border-base text-base-primary">{viewing.notes}</div>}
          </div>
          <RequestTracker req={{ id: viewing.id, kind: 'rental', status: viewing.status }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1 flex items-center gap-2">
            <Package size={28} className="text-yellow-accent" />
            {ar ? 'طلبات التأجير' : 'My Rental Requests'}
          </h1>
          <p className="text-base-muted text-sm">{ar ? `${mine.length} طلب` : `${mine.length} requests`}</p>
        </div>
        <a href="#/catalog" className="btn-primary text-sm">
          <Plus size={16} />
          {ar ? 'طلب معدة جديدة' : 'New equipment request'}
        </a>
      </div>

      {mine.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <Package size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted mb-4">{ar ? 'لا توجد طلبات تأجير بعد' : 'No rental requests yet'}</p>
          <a href="#/catalog" className="btn-secondary text-sm inline-flex">{ar ? 'تصفح المعدات' : 'Browse equipment'}</a>
        </div>
      ) : (
        <div className="space-y-3">
          {mine.map((r) => (
            <button key={r.id} onClick={() => setViewing(r)} className="card-industrial p-5 w-full text-start hover-lift">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-mono font-bold text-yellow-accent mb-1">{r.request_reference}</div>
                  <div className="font-bold text-base-primary truncate">{ar ? r.equipment_name_ar : r.equipment_name}{(r.quantity ?? 1) > 1 && <span className="text-yellow-accent"> × {r.quantity}</span>}</div>
                  <div className="text-xs text-base-muted mt-1">{fmt(r.created_at)}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusColors[r.status]}`}>{ar ? statusLabels[r.status].ar : statusLabels[r.status].en}</span>
              </div>
              <RequestProgressBar req={{ id: r.id, kind: 'rental', status: r.status }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
