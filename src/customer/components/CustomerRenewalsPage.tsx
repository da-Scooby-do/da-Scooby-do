import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '../CustomerContext';
import { useRenewal } from '@/admin/RenewalContext';
import {
  renewalStatusLabels, renewalStatusColors, renewalPeriodLabels,
  type ContractRenewal,
} from '@/admin/renewal-types';

export default function CustomerRenewalsPage() {
  const { lang } = useApp();
  const { user } = useCustomer();
  const { renewalsByCustomer, customerAccept, customerReject } = useRenewal();
  const ar = lang === 'ar';
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const myRenewals = user ? renewalsByCustomer(user.id) : [];
  // Customer only sees renewals that have been sent to them
  const visibleRenewals = myRenewals.filter((r) =>
    ['pending_customer_approval', 'approved', 'rejected', 'contract_preparation', 'signed', 'active'].includes(r.status),
  );

  const handleAccept = (id: string) => customerAccept(id);
  const handleReject = (id: string) => {
    customerReject(id, rejectReason || (ar ? 'بدون سبب' : 'No reason'));
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
          <RefreshCw size={28} className="text-yellow-accent" />
          {ar ? 'تجديد العقود' : 'Contract Renewals'}
        </h1>
        <p className="text-base-muted text-sm">{ar ? `${visibleRenewals.length} عرض تجديد` : `${visibleRenewals.length} renewal offers`}</p>
      </div>

      {visibleRenewals.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <RefreshCw size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد عروض تجديد' : 'No renewal offers'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleRenewals.map((r) => (
            <div key={r.id} className="card-industrial p-5 space-y-4">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-yellow-accent">{r.renewalNumber}</span>
                    <span className="text-xs text-base-muted">• {ar ? 'عقد' : 'Contract'}: {r.originalContractNumber}</span>
                  </div>
                  <div className="text-sm font-bold text-base-primary">{r.equipmentModel}</div>
                  <div className="text-xs text-base-muted">{ar ? 'الكمية' : 'Quantity'}: {r.quantity}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${renewalStatusColors[r.status]}`}>
                  {ar ? renewalStatusLabels[r.status].ar : renewalStatusLabels[r.status].en}
                </span>
              </div>

              {/* Renewal offer details — customer-visible only */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-base-muted">{ar ? 'فترة التجديد' : 'Renewal Period'}: </span>
                  <span className="font-semibold text-base-primary">{ar ? renewalPeriodLabels[r.renewalPeriod].ar : renewalPeriodLabels[r.renewalPeriod].en}</span>
                </div>
                <div>
                  <span className="text-base-muted">{ar ? 'السعر' : 'Price'}: </span>
                  <span className="font-semibold text-base-primary">{r.pricing.total.toLocaleString()} {ar ? 'ر.س' : 'SAR'}</span>
                </div>
                <div>
                  <span className="text-base-muted">{ar ? 'البداية' : 'Start'}: </span>
                  <span className="font-semibold text-base-primary">{r.newStartDate}</span>
                </div>
                <div>
                  <span className="text-base-muted">{ar ? 'النهاية' : 'End'}: </span>
                  <span className="font-semibold text-base-primary">{r.newEndDate}</span>
                </div>
                <div>
                  <span className="text-base-muted">{ar ? 'المشغل' : 'Operator'}: </span>
                  <span className="font-semibold text-base-primary">{r.operator || '—'}</span>
                </div>
                <div>
                  <span className="text-base-muted">{ar ? 'الديزل' : 'Diesel'}: </span>
                  <span className="font-semibold text-base-primary">{r.diesel || '—'}</span>
                </div>
              </div>

              {/* Customer actions */}
              {r.status === 'pending_customer_approval' && (
                <div className="pt-3 border-t border-base">
                  {rejectingId === r.id ? (
                    <div className="space-y-3">
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none resize-none"
                        placeholder={ar ? 'سبب الرفض' : 'Rejection reason'}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleReject(r.id)} className="btn-secondary text-sm text-red-500">
                          <XCircle size={16} />
                          {ar ? 'تأكيد الرفض' : 'Confirm Reject'}
                        </button>
                        <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="btn-secondary text-sm">
                          {ar ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(r.id)} className="btn-primary text-sm flex items-center gap-2">
                        <CheckCircle size={16} />
                        {ar ? 'قبول' : 'Accept'}
                      </button>
                      <button onClick={() => setRejectingId(r.id)} className="btn-secondary text-sm text-red-500 flex items-center gap-2">
                        <XCircle size={16} />
                        {ar ? 'رفض' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {r.status === 'approved' && (
                <div className="pt-3 border-t border-base flex items-center gap-2 text-sm text-green-500">
                  <Clock size={16} />
                  {ar ? 'تم قبول التجديد، جاري تحضير العقد' : 'Renewal accepted, contract preparation in progress'}
                </div>
              )}
              {r.status === 'rejected' && (
                <div className="pt-3 border-t border-base">
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <XCircle size={16} />
                    {ar ? 'تم رفض التجديد' : 'Renewal rejected'}
                  </div>
                  {r.customerRejectionReason && (
                    <p className="text-xs text-base-muted mt-1">{r.customerRejectionReason}</p>
                  )}
                </div>
              )}
              {r.status === 'active' && r.newContractNumber && (
                <div className="pt-3 border-t border-base flex items-center gap-2 text-sm text-green-500">
                  <CheckCircle size={16} />
                  {ar ? `العقد الناتج: ${r.newContractNumber}` : `Resulting contract: ${r.newContractNumber}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
