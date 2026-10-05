import { ScrollText } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export default function AuditLogPage() {
  const { lang } = useApp();
  const ar = lang === 'ar';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
          <ScrollText size={28} className="text-yellow-accent" />
          {ar ? 'سجل التدقيق' : 'Audit Log'}
        </h1>
        <p className="text-base-muted text-sm">{ar ? 'سجل التدقيق' : 'Audit Log'}</p>
      </div>

      {/* Audit log not yet implemented */}
      <div className="card-industrial p-12 text-center">
        <ScrollText size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
        <p className="text-sm text-base-muted">{ar ? 'سجل التدقيق غير متاح حالياً' : 'Audit log is not yet available'}</p>
      </div>
    </div>
  );
}
