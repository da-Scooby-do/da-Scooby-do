import { useEffect, useRef, useState } from 'react';
import { X, PenTool, Eraser, Loader2, AlertCircle, Download, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import type { ContractRow } from '@/contract/types';

const MAX_SIGNATURE_CHARS = 280_000;

/** Draw-to-sign pad. Ink is dark on a white card so it reads the same in both themes. */
function SignaturePad({ onChange, label, clearLabel }: { onChange: (dataUrl: string | null) => void; label: string; clearLabel: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hasInk = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#111827';
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
    const ctx = e.currentTarget.getContext('2d');
    if (ctx && last.current) {
      ctx.beginPath();
      ctx.arc(last.current.x, last.current.y, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();
    }
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    hasInk.current = true;
  };

  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    if (hasInk.current && canvasRef.current) onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    hasInk.current = false;
    onChange(null);
  };

  return (
    <div>
      <div className="relative rounded-xl border-2 border-dashed border-yellow-accent/40 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          aria-label={label}
          className="block w-full h-44 touch-none cursor-crosshair"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={up}
        />
        <span className="pointer-events-none absolute bottom-3 inset-x-6 border-b border-gray-300" />
      </div>
      <button type="button" onClick={clear} className="mt-2 text-xs text-base-muted hover:text-yellow-accent inline-flex items-center gap-1">
        <Eraser size={13} /> {clearLabel}
      </button>
    </div>
  );
}

export default function SignContractModal({
  contract,
  defaultName,
  defaultTitle,
  documentUrl,
  onClose,
  onDone,
}: {
  contract: ContractRow;
  defaultName: string;
  defaultTitle: string;
  documentUrl: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const [name, setName] = useState(defaultName);
  const [title, setTitle] = useState(defaultTitle);
  const [signature, setSignature] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const fmtMoney = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError(ar ? 'أدخل اسم الموقّع.' : "Enter the signer's name.");
    if (!signature) return setError(ar ? 'ارسم توقيعك في المربع.' : 'Draw your signature in the box.');
    if (signature.length > MAX_SIGNATURE_CHARS) return setError(ar ? 'التوقيع كبير جداً، امسحه ووقّع مرة أخرى.' : 'The signature is too large. Clear it and sign again.');
    if (!agreed) return setError(ar ? 'يجب الموافقة على شروط العقد قبل التوقيع.' : 'Please agree to the contract terms before signing.');
    setSaving(true);
    setError(null);
    try {
      const { error: rpcErr } = await supabase.rpc('customer_sign_contract', {
        p_contract_id: contract.id,
        p_name: name.trim(),
        p_title: title.trim(),
        p_signature: signature,
      });
      if (rpcErr) throw rpcErr;
      onDone();
    } catch (err) {
      console.error('Contract signing failed', err);
      setError(ar ? 'تعذر توقيع العقد. حدّث الصفحة وحاول مرة أخرى.' : 'Could not sign the contract. Refresh the page and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <form
        role="dialog"
        aria-modal="true"
        aria-label={ar ? 'توقيع العقد' : 'Sign contract'}
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in"
      >
        <div className="sticky top-0 z-10 bg-elevated border-b border-base p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center">
              <PenTool size={20} className="text-yellow-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-base-primary">{ar ? 'توقيع عقد التأجير' : 'Sign the rental contract'}</h3>
              <p className="text-xs text-base-muted font-mono">{contract.contract_number}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={ar ? 'إغلاق' : 'Close'} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent hover:border-yellow-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm p-4 rounded-xl bg-base border border-base">
            <div><div className="text-xs text-base-muted">{ar ? 'قيمة العقد' : 'Contract value'}</div><div className="font-bold text-base-primary">{fmtMoney(contract.contract_value)} {contract.currency}</div></div>
            <div><div className="text-xs text-base-muted">{ar ? 'أمر الشراء' : 'PO'}</div><div className="font-bold text-base-primary" dir="ltr">{contract.po_number || '—'}</div></div>
            <div><div className="text-xs text-base-muted">{ar ? 'البدء' : 'Start'}</div><div className="font-bold text-base-primary">{fmtDate(contract.start_date)}</div></div>
            <div><div className="text-xs text-base-muted">{ar ? 'الانتهاء' : 'End'}</div><div className="font-bold text-base-primary">{fmtDate(contract.end_date)}</div></div>
          </div>

          {documentUrl && (
            <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm justify-center w-full">
              <Download size={15} /> {ar ? 'اقرأ مستند العقد قبل التوقيع' : 'Read the contract document before signing'}
            </a>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="signer-name" className="block text-sm font-semibold text-base-primary mb-1.5">
                {ar ? 'اسم الموقّع' : 'Signer name'} <span className="text-yellow-accent">*</span>
              </label>
              <input id="signer-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </div>
            <div>
              <label htmlFor="signer-title" className="block text-sm font-semibold text-base-primary mb-1.5">{ar ? 'المسمى الوظيفي' : 'Job title'}</label>
              <input id="signer-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </div>
          </div>

          <div>
            <span className="block text-sm font-semibold text-base-primary mb-1.5">
              {ar ? 'التوقيع' : 'Signature'} <span className="text-yellow-accent">*</span>
            </span>
            <SignaturePad onChange={(d) => { setSignature(d); setError(null); }} label={ar ? 'وقّع هنا بإصبعك أو بالماوس' : 'Sign here with your finger or mouse'} clearLabel={ar ? 'مسح التوقيع' : 'Clear signature'} />
            <p className="text-xs text-base-muted mt-1">{ar ? 'وقّع داخل المربع بإصبعك أو بالماوس.' : 'Sign inside the box with your finger or mouse.'}</p>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-base cursor-pointer hover:border-yellow-accent/50">
            <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setError(null); }} className="mt-1 w-4 h-4 accent-yellow-accent shrink-0" />
            <span className="text-sm text-base-primary leading-relaxed">
              {ar
                ? 'أقر بأنني اطلعت على عقد التأجير وأوافق على جميع شروطه، وأن توقيعي الإلكتروني هذا ملزم لي وللجهة التي أمثلها.'
                : 'I have read the rental contract and agree to all its terms, and this electronic signature binds me and the company I represent.'}
            </span>
          </label>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary justify-center">{ar ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" disabled={saving} className="btn-primary justify-center disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {ar ? 'توقيع العقد' : 'Sign contract'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
