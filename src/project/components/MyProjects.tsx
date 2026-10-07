import { useEffect, useState } from 'react';
import { HardHat, Plus, ArrowRight, ArrowLeft, MapPin, FileText } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '@/customer/CustomerContext';
import { useProject } from '@/project/ProjectContext';
import { dbStatusLabels, dbStatusColors, serviceCategoryLabels } from '@/project/types';
import type { ProjectRequestRow } from '@/project/types';
import RequestTracker, { RequestProgressBar } from '@/customer/components/RequestTracker';

/** The signed-in customer's project / service requests (from the database) with order progress. */
export default function MyProjects() {
  const { lang, dir } = useApp();
  const ar = lang === 'ar';
  const { user } = useCustomer();
  const { dbRequests, dbReload } = useProject();
  const [viewing, setViewing] = useState<ProjectRequestRow | null>(null);

  useEffect(() => {
    dbReload();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const email = user?.email.toLowerCase().trim();
  const mine = dbRequests.filter((r) => r.email && r.email.toLowerCase() === email);
  const fmt = (d: string) => new Date(d).toLocaleDateString(ar ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  const statusLabel = (s: ProjectRequestRow['status']) => (dbStatusLabels[s] ? (ar ? dbStatusLabels[s].ar : dbStatusLabels[s].en) : s);
  const category = (c: string) => (serviceCategoryLabels[c] ? (ar ? serviceCategoryLabels[c].ar : serviceCategoryLabels[c].en) : c);

  if (viewing) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono text-yellow-accent">{viewing.request_reference}</div>
            <h1 className="text-xl lg:text-2xl font-black text-base-primary">{category(viewing.service_category)} — {viewing.service_type}</h1>
          </div>
          <button onClick={() => setViewing(null)} className="btn-secondary text-sm">
            {dir === 'rtl' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            {ar ? 'العودة' : 'Back'}
          </button>
        </div>
        <div className="grid lg:grid-cols-[1fr_20rem] gap-6 items-start">
          <div className="card-industrial p-5 space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${dbStatusColors[viewing.status] || 'bg-base text-base-muted'}`}>{statusLabel(viewing.status)}</span>
              <span className="text-base-muted text-xs">{fmt(viewing.created_at)}</span>
            </div>
            <div className="flex items-center gap-2"><MapPin size={15} className="text-yellow-accent" /><b className="text-base-primary">{[viewing.city, viewing.district].filter(Boolean).join(' — ')}</b></div>
            <div className="flex items-start gap-2"><FileText size={15} className="text-yellow-accent mt-0.5" /><p className="text-base-primary leading-relaxed">{viewing.project_description}</p></div>
          </div>
          <RequestTracker req={{ id: viewing.id, kind: 'project', status: viewing.status }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1 flex items-center gap-2">
            <HardHat size={28} className="text-yellow-accent" />
            {ar ? 'طلبات المشاريع' : 'My Project Requests'}
          </h1>
          <p className="text-base-muted text-sm">{ar ? `${mine.length} طلب` : `${mine.length} requests`}</p>
        </div>
        <a href="#/services/contracting" className="btn-primary text-sm">
          <Plus size={16} />
          {ar ? 'طلب مشروع جديد' : 'New project request'}
        </a>
      </div>

      {mine.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <HardHat size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد طلبات مشاريع بعد' : 'No project requests yet'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mine.map((p) => (
            <button key={p.id} onClick={() => setViewing(p)} className="card-industrial p-5 w-full text-start hover-lift">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-mono font-bold text-yellow-accent mb-1">{p.request_reference}</div>
                  <div className="font-bold text-base-primary truncate">{category(p.service_category)} — {p.service_type}</div>
                  <div className="text-xs text-base-muted mt-1">{p.city} · {fmt(p.created_at)}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${dbStatusColors[p.status] || 'bg-base text-base-muted'}`}>{statusLabel(p.status)}</span>
              </div>
              <RequestProgressBar req={{ id: p.id, kind: 'project', status: p.status }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
