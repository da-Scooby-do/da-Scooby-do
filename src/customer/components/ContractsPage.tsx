import { useState, useEffect, useCallback } from 'react';
import { PenTool, Eye, Download, Clock, CheckCircle, AlertOctagon, Loader2, AlertCircle, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '../CustomerContext';
import { supabase } from '@/lib/supabase';
import { dbContractStatusLabels, dbContractStatusColors } from '@/contract/types';
import type { ContractRow, ContractDBStatus } from '@/contract/types';
import SignContractModal from './SignContractModal';

const canSign = (c: ContractRow) => !c.signed_at && (c.status === 'ready' || c.status === 'pending_signature');

export default function ContractsPage() {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const { user, company } = useCustomer();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ContractRow | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [signing, setSigning] = useState<{ contract: ContractRow; docUrl: string | null } | null>(null);
  const [signedNotice, setSignedNotice] = useState<string | null>(null);

  const loadContracts = useCallback(async () => {
    if (!user?.email) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setContracts((data as ContractRow[] | null) || []);
    } catch (err) {
      console.error('Failed to load contracts', err);
      setError('تعذر تحميل العقود / Could not load your contracts');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  const openView = async (c: ContractRow) => {
    setViewing(c);
    setDocUrl(null);
    if (c.document_path) {
      setDocLoading(true);
      try {
        const { data } = await supabase.storage.from('contract-documents').createSignedUrl(c.document_path, 3600);
        setDocUrl(data?.signedUrl || null);
      } catch { setDocUrl(null); } finally { setDocLoading(false); }
    }
  };

  const startSigning = async (c: ContractRow) => {
    let url: string | null = null;
    if (c.document_path) {
      try {
        const { data } = await supabase.storage.from('contract-documents').createSignedUrl(c.document_path, 3600);
        url = data?.signedUrl || null;
      } catch { url = null; }
    }
    setViewing(null);
    setSigning({ contract: c, docUrl: url });
  };

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };
  const fmtMoney = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1 flex items-center gap-2">
          <PenTool size={28} className="text-yellow-accent" />
          {ar ? 'العقود' : 'Contracts'}
        </h1>
        <p className="text-base-muted text-sm">{ar ? `${contracts.length} عقد` : `${contracts.length} contracts`}</p>
      </div>

      {signedNotice && (
        <div role="status" className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2 text-sm text-green-500">
          <CheckCircle size={16} /> {signedNotice}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-yellow-accent" /></div>
      ) : error ? (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={16} /> {error}
        </div>
      ) : contracts.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <PenTool size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد عقود' : 'No contracts'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <div key={c.id} className="card-industrial p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-base-muted">{c.contract_number}</span>
                    <span className="text-xs text-base-muted">• {fmtDate(c.start_date)}</span>
                    {c.signed_at && <span className="px-1.5 py-0.5 rounded text-xs bg-green-500/10 text-green-500 font-semibold">{ar ? 'موقّع' : 'Signed'}</span>}
                  </div>
                  <div className="text-sm text-base-muted">
                    {ar ? 'عرض السعر المرتبط' : 'Related Quotation'}: <span className="font-semibold text-base-primary">{c.quotation_reference || '—'}</span>
                  </div>
                  <div className="text-sm text-base-muted mt-0.5">{c.title || c.customer_name}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${dbContractStatusColors[c.status as ContractDBStatus]}`}>
                  {ar ? dbContractStatusLabels[c.status as ContractDBStatus].ar : dbContractStatusLabels[c.status as ContractDBStatus].en}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-base-muted">{ar ? 'قيمة العقد' : 'Contract Value'}</div>
                  <div className="text-lg font-black text-base-primary">{fmtMoney(c.contract_value)} <span className="text-xs font-normal text-base-muted">{c.currency}</span></div>
                </div>
                <div>
                  <div className="text-xs text-base-muted">{ar ? 'تاريخ البدء' : 'Start Date'}</div>
                  <div className="text-sm font-semibold text-base-primary flex items-center gap-1"><Clock size={12} /> {fmtDate(c.start_date)}</div>
                </div>
                <div>
                  <div className="text-xs text-base-muted">{ar ? 'تاريخ الانتهاء' : 'End Date'}</div>
                  <div className="text-sm font-semibold text-base-primary flex items-center gap-1"><Clock size={12} /> {fmtDate(c.end_date)}</div>
                </div>
              </div>

              {canSign(c) && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm text-orange-500 mb-3 flex items-center gap-2">
                  <AlertOctagon size={14} /> {ar ? 'العقد جاهز وبانتظار توقيعك' : 'This contract is ready and waiting for your signature'}
                </div>
              )}

              {c.status === 'active' && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-500 mb-3 flex items-center gap-2">
                  <CheckCircle size={14} /> {ar ? 'العقد ساري' : 'Contract is active'}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {canSign(c) && (
                  <button onClick={() => startSigning(c)} className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5">
                    <PenTool size={14} /> {ar ? 'توقيع العقد' : 'Sign contract'}
                  </button>
                )}
                <button onClick={() => openView(c)} className={`${canSign(c) ? 'btn-secondary' : 'btn-primary'} text-xs px-3 py-2 flex items-center gap-1.5`}>
                  <Eye size={14} /> {ar ? 'عرض العقد' : 'View Contract'}
                </button>
                {c.document_path && (
                  <button onClick={() => openView(c)} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5">
                    <Download size={14} /> {ar ? 'تحميل المستند' : 'Download Document'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail view modal */}
      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewing(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-base-primary">{viewing.contract_number}</h3>
                <p className="text-xs text-base-muted">{viewing.title || viewing.customer_name} • {fmtDate(viewing.start_date)}</p>
              </div>
              <button onClick={() => setViewing(null)} aria-label={ar ? 'إغلاق' : 'Close'} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1.5 rounded-md text-sm font-semibold ${dbContractStatusColors[viewing.status as ContractDBStatus]}`}>
                  {ar ? dbContractStatusLabels[viewing.status as ContractDBStatus].ar : dbContractStatusLabels[viewing.status as ContractDBStatus].en}
                </span>
              </div>

              {/* Contract info */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'بيانات العقد' : 'Contract Info'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'العنوان' : 'Title'}: </span><span className="font-semibold text-base-primary">{viewing.title || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold text-base-primary">{viewing.customer_name}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{viewing.company_name || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'قيمة العقد' : 'Value'}: </span><span className="font-semibold text-base-primary">{fmtMoney(viewing.contract_value)} {viewing.currency}</span></div>
                  <div><span className="text-base-muted">{ar ? 'البدء' : 'Start'}: </span><span className="font-semibold text-base-primary">{fmtDate(viewing.start_date)}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الانتهاء' : 'End'}: </span><span className="font-semibold text-base-primary">{fmtDate(viewing.end_date)}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الطلب' : 'Request'}: </span><span className="font-semibold text-base-primary">{viewing.request_reference || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'العرض' : 'Quotation'}: </span><span className="font-semibold text-base-primary">{viewing.quotation_reference || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'أمر الشراء' : 'PO'}: </span><span className="font-semibold text-base-primary">{viewing.po_number || '—'}</span></div>
                </div>
              </div>

              {/* Notes */}
              {viewing.notes && (
                <div>
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'ملاحظات' : 'Notes'}</h4>
                  <p className="text-sm text-base-primary">{viewing.notes}</p>
                </div>
              )}

              {/* Document */}
              {viewing.document_path && (
                <div className="pt-3 border-t border-base">
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'مستند العقد' : 'Contract Document'}</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-base-primary">{viewing.document_name || 'document'}</span>
                    {docLoading ? (
                      <Loader2 size={16} className="animate-spin text-base-muted" />
                    ) : docUrl ? (
                      <a href={docUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs flex items-center gap-1.5">
                        <Download size={14} /> {ar ? 'تحميل' : 'Download'}
                      </a>
                    ) : (
                      <span className="text-xs text-base-muted">{ar ? 'غير متاح' : 'Unavailable'}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Signature */}
              {viewing.signed_at && (
                <div className="pt-3 border-t border-base">
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'توقيع العميل' : 'Customer signature'}</h4>
                  <div className="flex flex-wrap items-center gap-4">
                    {viewing.signature_image && (
                      <img src={viewing.signature_image} alt={ar ? 'التوقيع' : 'Signature'} className="h-20 w-auto max-w-[240px] rounded-lg bg-white border border-base p-1" />
                    )}
                    <div className="text-sm">
                      <div className="font-semibold text-base-primary">{viewing.signed_by_name}{viewing.signed_by_title ? ` — ${viewing.signed_by_title}` : ''}</div>
                      <div className="text-xs text-base-muted">{new Date(viewing.signed_at).toLocaleString(ar ? 'ar-SA' : 'en-US')}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status info */}
              {viewing.status === 'active' && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-500 flex items-center gap-2">
                  <CheckCircle size={14} /> {ar ? 'العقد ساري المفعول' : 'Contract is active'}
                </div>
              )}
              {canSign(viewing) && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm text-orange-500 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2"><AlertOctagon size={14} /> {ar ? 'العقد بانتظار توقيعك' : 'Contract waiting for your signature'}</span>
                  <button onClick={() => startSigning(viewing)} className="btn-primary text-xs px-3 py-2"><PenTool size={14} /> {ar ? 'توقيع العقد' : 'Sign contract'}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {signing && (
        <SignContractModal
          contract={signing.contract}
          documentUrl={signing.docUrl}
          defaultName={company?.contactPerson || user?.fullName || ''}
          defaultTitle={company?.jobTitle || ''}
          onClose={() => setSigning(null)}
          onDone={() => {
            setSigning(null);
            setSignedNotice(ar ? 'تم توقيع العقد بنجاح. سيتواصل معك فريق سحاب لترتيب الدفع وتسليم المعدة.' : 'Contract signed. The SAHAB team will contact you about payment and delivery.');
            loadContracts();
          }}
        />
      )}
    </div>
  );
}
