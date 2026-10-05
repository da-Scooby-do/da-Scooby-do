import { useState, useEffect, useMemo } from 'react';
import { X, Save, Send, Plus, Trash2, FileText, Loader2, Copy } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useQuotation, type CreateQuotationPayload } from '@/quotation/QuotationContext';
import {
  computeItemTotal, computeQuotationTotals, defaultQuotationTerms,
  PO_REQUIREMENT_AR, PO_REQUIREMENT_EN, dbQuotationStatusLabels,
} from '@/quotation/types';
import type { QuotationRow, QuotationItemDB, QuotationWithItems, QuotationDBStatus } from '@/quotation/types';
import type { RentalRequestRow } from '@/rental/types';
import type { ProjectRequestRow } from '@/project/types';

interface Props {
  requestType: 'rental' | 'project';
  request: RentalRequestRow | ProjectRequestRow;
  existing?: QuotationWithItems;
  onClose: () => void;
  onSaved?: () => void;
}

interface FormItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount: number;
  tax_rate: number;
}

export default function DBQuotationForm({ requestType, request, existing, onClose, onSaved }: Props) {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const { createDBQuotation, updateDBQuotation, updateDBQuotationStatus } = useQuotation();

  const [items, setItems] = useState<FormItem[]>([]);
  const [vatRate, setVatRate] = useState(15);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState<Record<string, string>>({});
  const [sendImmediately, setSendImmediately] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  // Initialize from existing or from request
  useEffect(() => {
    if (existing) {
      setItems(existing.items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        discount: it.discount,
        tax_rate: it.tax_rate,
      })));
      setVatRate(existing.vat_rate);
      setDiscountAmount(existing.discount_amount);
      setExpiryDate(existing.expiry_date || '');
      setNotes(existing.notes || '');
      setTerms(existing.terms || {});
    } else {
      // Pre-fill from request
      if (requestType === 'rental') {
        const r = request as RentalRequestRow;
        setItems([{
          description: ar ? r.equipment_name_ar : r.equipment_name,
          quantity: 1,
          unit: ar ? 'وحدة' : 'unit',
          unit_price: 0,
          discount: 0,
          tax_rate: 0,
        }]);
      } else {
        const p = request as ProjectRequestRow;
        setItems([{
          description: p.project_description || p.service_type,
          quantity: 1,
          unit: ar ? 'مشروع' : 'project',
          unit_price: 0,
          discount: 0,
          tax_rate: 0,
        }]);
      }
      setTerms({
        validityPeriod: ar ? '30 يوم من تاريخ الإصدار' : '30 days from issue date',
        paymentTerms: '',
        poRequirement: ar ? PO_REQUIREMENT_AR : PO_REQUIREMENT_EN,
        specialConditions: '',
      });
    }
  }, [existing, requestType, request, ar]);

  const computedItems: QuotationItemDB[] = useMemo(() => {
    return items.map((it, idx) => ({
      id: `tmp-${idx}`,
      quotation_id: existing?.id || 'tmp',
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      unit_price: it.unit_price,
      discount: it.discount,
      tax_rate: it.tax_rate,
      total: computeItemTotal(it.quantity, it.unit_price, it.discount, it.tax_rate),
      sort_order: idx,
    }));
  }, [items, existing]);

  const totals = useMemo(() => {
    return computeQuotationTotals(computedItems, discountAmount, vatRate);
  }, [computedItems, discountAmount, vatRate]);

  const updateItem = (i: number, updates: Partial<FormItem>) => {
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, ...updates } : it));
  };

  const addItem = () => setItems((prev) => [...prev, { description: '', quantity: 1, unit: 'unit', unit_price: 0, discount: 0, tax_rate: 0 }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const canSave = items.length > 0 && items.every((it) => it.description.trim() !== '');

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const reqRef = (request as RentalRequestRow).request_reference || (request as ProjectRequestRow).request_reference || '';
      const payload: CreateQuotationPayload = {
        request_type: requestType,
        request_id: request.id,
        request_reference: reqRef,
        customer_name: (request as RentalRequestRow).customer_name,
        company_name: (request as RentalRequestRow).company_name || undefined,
        customer_phone: (request as RentalRequestRow).phone,
        customer_email: (request as RentalRequestRow).email || undefined,
        vat_rate: vatRate,
        expiry_date: expiryDate || undefined,
        notes: notes || undefined,
        discount_amount: discountAmount,
        terms,
        items: items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unit_price,
          discount: it.discount,
          tax_rate: it.tax_rate,
        })),
      };

      if (existing) {
        await updateDBQuotation(existing.id, {
          vat_rate: vatRate,
          expiry_date: expiryDate || null,
          notes: notes || null,
          discount_amount: discountAmount,
          terms,
        }, items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unit_price,
          discount: it.discount,
          tax_rate: it.tax_rate,
        })));
        if (sendImmediately) {
          await updateDBQuotationStatus(existing.id, 'sent');
        }
      } else {
        const created = await createDBQuotation(payload);
        if (sendImmediately && created) {
          await updateDBQuotationStatus(created.id, 'sent');
        }
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const isLocked = existing && (existing.status === 'sent' || existing.status === 'accepted' || existing.status === 'rejected' || existing.status === 'cancelled' || existing.status === 'expired');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-base-primary flex items-center gap-2">
              <FileText size={20} className="text-yellow-accent" />
              {existing
                ? (ar ? 'تعديل عرض السعر' : 'Edit Quotation')
                : (ar ? 'إنشاء عرض سعر' : 'Create Quotation')}
            </h3>
            {existing && (
              <p className="text-xs text-base-muted">
                {existing.quotation_reference} • {ar ? 'إصدار' : 'Version'} {existing.version}
                {isLocked && <span className="text-orange-500 font-semibold"> • {ar ? 'مقفل للتعديل' : 'Locked'}</span>}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Request info (read-only) */}
          <div className="card-industrial p-4 bg-black/5 dark:bg-white/5">
            <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'الطلب المرتبط' : 'Related Request'}</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-base-muted">{ar ? 'المرجع' : 'Reference'}: </span><span className="font-semibold text-base-primary">{(request as RentalRequestRow).request_reference || '—'}</span></div>
              <div><span className="text-base-muted">{ar ? 'النوع' : 'Type'}: </span><span className="font-semibold text-base-primary">{requestType === 'rental' ? (ar ? 'تأجير معدات' : 'Equipment Rental') : (ar ? 'مشروع / خدمة' : 'Project / Service')}</span></div>
              <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold text-base-primary">{(request as RentalRequestRow).customer_name}</span></div>
              <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{(request as RentalRequestRow).company_name || '—'}</span></div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass + ' mb-0'}>{ar ? 'البنود' : 'Items'}</label>
              {!isLocked && (
                <button onClick={addItem} className="text-xs text-yellow-accent hover:underline flex items-center gap-1">
                  <Plus size={12} /> {ar ? 'إضافة بند' : 'Add item'}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start p-2 rounded-lg bg-base border border-base">
                  <input className={`${inputClass} col-span-12 sm:col-span-4`} placeholder={ar ? 'الوصف' : 'Description'} value={item.description} disabled={isLocked} onChange={(e) => updateItem(i, { description: e.target.value })} />
                  <input type="number" min={0} step="any" className={`${inputClass} col-span-4 sm:col-span-2`} placeholder={ar ? 'كمية' : 'Qty'} value={item.quantity} disabled={isLocked} onChange={(e) => updateItem(i, { quantity: parseFloat(e.target.value) || 0 })} />
                  <input className={`${inputClass} col-span-4 sm:col-span-1`} placeholder={ar ? 'وحدة' : 'Unit'} value={item.unit} disabled={isLocked} onChange={(e) => updateItem(i, { unit: e.target.value })} />
                  <input type="number" min={0} step="any" className={`${inputClass} col-span-4 sm:col-span-2`} placeholder={ar ? 'سعر' : 'Price'} value={item.unit_price} disabled={isLocked} onChange={(e) => updateItem(i, { unit_price: parseFloat(e.target.value) || 0 })} />
                  <input type="number" min={0} step="any" className={`${inputClass} col-span-6 sm:col-span-1`} placeholder={ar ? 'خصم' : 'Disc'} value={item.discount} disabled={isLocked} onChange={(e) => updateItem(i, { discount: parseFloat(e.target.value) || 0 })} />
                  <input type="number" min={0} step="any" className={`${inputClass} col-span-5 sm:col-span-1`} placeholder={ar ? 'ضريبة%' : 'Tax%'} value={item.tax_rate} disabled={isLocked} onChange={(e) => updateItem(i, { tax_rate: parseFloat(e.target.value) || 0 })} />
                  <div className="col-span-6 sm:col-span-1 text-sm font-semibold text-base-primary text-center pt-2">{computeItemTotal(item.quantity, item.unit_price, item.discount, item.tax_rate).toLocaleString()}</div>
                  {!isLocked && (
                    <button onClick={() => removeItem(i)} className="col-span-1 p-2 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center justify-center">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pricing settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>{ar ? 'نسبة الضريبة %' : 'Tax Rate %'}</label>
              <input type="number" min={0} step="any" className={inputClass} value={vatRate} disabled={isLocked} onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'خصم إجمالي' : 'Total Discount'}</label>
              <input type="number" min={0} step="any" className={inputClass} value={discountAmount} disabled={isLocked} onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
              <input type="date" className={inputClass} value={expiryDate} disabled={isLocked} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
          </div>

          {/* Calculated totals */}
          <div className="p-4 rounded-lg bg-black/5 dark:bg-white/5 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-base-muted">{ar ? 'المجموع الفرعي' : 'Subtotal'}</span><span className="font-semibold text-base-primary">{totals.subtotal.toLocaleString()} {ar ? 'ر.س' : 'SAR'}</span></div>
            <div className="flex justify-between"><span className="text-base-muted">{ar ? `ضريبة القيمة المضافة ${vatRate}%` : `VAT ${vatRate}%`}</span><span className="font-semibold text-base-primary">{totals.taxAmount.toLocaleString()} {ar ? 'ر.س' : 'SAR'}</span></div>
            <div className="flex justify-between text-base font-black"><span>{ar ? 'الإجمالي' : 'Grand Total'}</span><span className="text-yellow-accent">{totals.total.toLocaleString()} {ar ? 'ر.س' : 'SAR'}</span></div>
          </div>

          {/* Terms */}
          <div>
            <h4 className="text-xs font-bold text-yellow-accent uppercase mb-3">{ar ? 'الشروط والأحكام' : 'Terms & Conditions'}</h4>
            <div className="space-y-3">
              {Object.entries(defaultQuotationTerms).map(([key, labels]) => (
                <div key={key}>
                  <label className={labelClass}>{ar ? labels.ar : labels.en}</label>
                  <textarea rows={1} className={`${inputClass} resize-none`} value={terms[key] || ''} disabled={isLocked} onChange={(e) => setTerms((prev) => ({ ...prev, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>{ar ? 'ملاحظات' : 'Notes'}</label>
            <textarea rows={2} className={`${inputClass} resize-none`} value={notes} disabled={isLocked} onChange={(e) => setNotes(e.target.value)} placeholder={ar ? 'ملاحظات إضافية...' : 'Additional notes...'} />
          </div>

          {/* Send option (only for draft/ready_to_send) */}
          {(!isLocked) && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sendImmediately} onChange={(e) => setSendImmediately(e.target.checked)} className="w-4 h-4 rounded accent-yellow-accent" />
              <span className="text-sm text-base-primary">{ar ? 'إرسال العرض للعميل فور الحفظ' : 'Send quotation to customer immediately after saving'}</span>
            </label>
          )}

          {/* Locked notice */}
          {isLocked && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-sm text-orange-500 flex items-center gap-2">
              <Copy size={14} />
              {ar ? 'هذا العرض تم إرساله ولا يمكن تعديله. استخدم "إنشاء نسخة جديدة" لعمل مراجعة.' : 'This quotation has been sent and cannot be edited. Use "Create Revision" to make a new version.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-elevated border-t border-base p-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
          {!isLocked && (
            <button onClick={handleSave} disabled={!canSave || saving} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <Loader2 size={16} className="animate-spin" /> : sendImmediately ? <Send size={16} /> : <Save size={16} />}
              {sendImmediately ? (ar ? 'حفظ وإرسال' : 'Save & Send') : (ar ? 'حفظ' : 'Save')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
