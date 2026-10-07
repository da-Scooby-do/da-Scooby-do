import { useState } from 'react';
import { X, Upload, FileCheck2, Loader2, AlertCircle, ClipboardCheck } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import type { QuotationRow } from '@/quotation/types';

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

/** Customer uploads the purchase order for an accepted quotation. */
export default function PoUploadModal({
  quotation,
  userId,
  onClose,
  onDone,
}: {
  quotation: QuotationRow;
  userId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const pickFile = (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError(ar ? 'الملف يجب أن يكون PDF أو صورة (JPG / PNG / WEBP).' : 'The file must be a PDF or an image (JPG / PNG / WEBP).');
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(ar ? 'حجم الملف أكبر من 25 ميجابايت.' : 'The file is larger than 25 MB.');
      return;
    }
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNumber.trim()) {
      setError(ar ? 'أدخل رقم أمر الشراء.' : 'Enter the PO number.');
      return;
    }
    if (!file) {
      setError(ar ? 'أرفق ملف أمر الشراء.' : 'Attach the PO file.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf';
      const path = `customer/${userId}/${quotation.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('po-documents').upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { error: rpcErr } = await supabase.rpc('customer_submit_po', {
        p_quotation_id: quotation.id,
        p_po_number: poNumber.trim(),
        p_po_date: poDate || null,
        p_document_path: path,
        p_document_name: file.name,
        p_notes: notes.trim(),
      });
      if (rpcErr) throw rpcErr;
      onDone();
    } catch (err) {
      console.error('PO upload failed', err);
      const msg = err instanceof Error ? err.message : String((err as { message?: string })?.message || '');
      setError(
        /already submitted/i.test(msg)
          ? (ar ? 'تم رفع أمر شراء لهذا العرض مسبقاً.' : 'A PO was already uploaded for this quotation.')
          : (ar ? 'تعذر رفع أمر الشراء. حاول مرة أخرى.' : 'Could not upload the PO. Please try again.'),
      );
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
        aria-label={ar ? 'رفع أمر الشراء' : 'Upload purchase order'}
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in"
      >
        <div className="sticky top-0 z-10 bg-elevated border-b border-base p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center">
              <ClipboardCheck size={20} className="text-yellow-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-base-primary">{ar ? 'رفع أمر الشراء (PO)' : 'Upload purchase order (PO)'}</h3>
              <p className="text-xs text-base-muted font-mono">{quotation.quotation_reference}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={ar ? 'إغلاق' : 'Close'} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent hover:border-yellow-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-base-muted leading-relaxed">
            {ar
              ? 'بعد قبول عرض السعر، ارفع أمر الشراء الصادر من شركتك. سيراجعه فريق سحاب ثم يُصدر عقد التأجير للتوقيع.'
              : "After accepting the quotation, upload your company's purchase order. SAHAB will review it and then issue the rental contract for signing."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="po-number" className="block text-sm font-semibold text-base-primary mb-1.5">
                {ar ? 'رقم أمر الشراء' : 'PO number'} <span className="text-yellow-accent">*</span>
              </label>
              <input id="po-number" dir="ltr" className={inputClass} value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="PO-2026-001" maxLength={80} />
            </div>
            <div>
              <label htmlFor="po-date" className="block text-sm font-semibold text-base-primary mb-1.5">{ar ? 'تاريخ أمر الشراء' : 'PO date'}</label>
              <input id="po-date" type="date" dir="ltr" className={inputClass} value={poDate} onChange={(e) => setPoDate(e.target.value)} />
            </div>
          </div>

          <div>
            <span className="block text-sm font-semibold text-base-primary mb-1.5">
              {ar ? 'ملف أمر الشراء' : 'PO file'} <span className="text-yellow-accent">*</span>
            </span>
            <label className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-center ${file ? 'border-green-500/50 bg-green-500/5' : 'border-base hover:border-yellow-accent/50'}`}>
              {file ? <FileCheck2 size={26} className="text-green-500" /> : <Upload size={26} className="text-yellow-accent" />}
              <span className="text-sm font-semibold text-base-primary break-all">{file ? file.name : (ar ? 'اختر ملف PDF أو صورة' : 'Choose a PDF or image')}</span>
              <span className="text-xs text-base-muted">{file ? (file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`) : (ar ? 'حتى 25 ميجابايت' : 'Up to 25 MB')}</span>
              <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} />
            </label>
          </div>

          <div>
            <label htmlFor="po-notes" className="block text-sm font-semibold text-base-primary mb-1.5">{ar ? 'ملاحظات' : 'Notes'}</label>
            <textarea id="po-notes" rows={2} className={`${inputClass} resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
            <button type="button" onClick={onClose} className="btn-secondary justify-center">{ar ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" disabled={saving} className="btn-primary justify-center disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {ar ? 'رفع أمر الشراء' : 'Upload PO'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
