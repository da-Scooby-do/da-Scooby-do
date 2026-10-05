import { Truck, RotateCcw, MapPin, Calendar } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '@/customer/CustomerContext';
import { useDelivery } from '@/admin/DeliveryContext';
import {
  deliveryStatusLabels, deliveryStatusColors, returnStatusLabels, returnStatusColors,
} from '@/admin/delivery-types';

export default function CustomerDeliveriesPage() {
  const { lang } = useApp();
  const { user } = useCustomer();
  const { deliveriesByCustomer } = useDelivery();
  const ar = lang === 'ar';

  // Customer only sees their own deliveries
  const myDeliveries = user ? deliveriesByCustomer(user.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
          <Truck size={28} className="text-yellow-accent" />
          {ar ? 'التسليم والاستلام' : 'Deliveries & Returns'}
        </h1>
        <p className="text-base-muted text-sm">{ar ? `${myDeliveries.length} سجل` : `${myDeliveries.length} records`}</p>
      </div>

      {myDeliveries.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <Truck size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد سجلات تسليم' : 'No delivery records'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myDeliveries.map((d) => (
            <div key={d.id} className="card-industrial p-5 space-y-3">
              {/* Customer-visible info only */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-yellow-accent">{d.deliveryNumber}</span>
                    <span className="text-xs text-base-muted">• {ar ? 'عقد' : 'Contract'}: {d.contractNumber}</span>
                  </div>
                  <div className="text-sm font-bold text-base-primary">{d.modelName}</div>
                  <div className="text-xs text-base-muted flex items-center gap-1">
                    <MapPin size={12} /> {d.projectName || '—'} • {d.location || '—'}
                  </div>
                  <div className="text-xs text-base-muted flex items-center gap-1 mt-0.5">
                    <Calendar size={12} /> {ar ? 'فترة الإيجار' : 'Rental Period'}: {d.rentalStart} → {d.rentalEnd}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${deliveryStatusColors[d.status]}`}>
                    {ar ? deliveryStatusLabels[d.status].ar : deliveryStatusLabels[d.status].en}
                  </span>
                  {d.returnRecord && (
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${returnStatusColors[d.returnRecord.status]}`}>
                      {ar ? returnStatusLabels[d.returnRecord.status].ar : returnStatusLabels[d.returnRecord.status].en}
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery date */}
              <div className="pt-2 border-t border-base text-xs text-base-muted">
                <span className="flex items-center gap-1">
                  <Truck size={12} />
                  {ar ? 'تاريخ التسليم' : 'Delivery Date'}: <span className="font-semibold text-base-primary">{d.deliveryDate}</span>
                </span>
              </div>

              {/* Return date if exists */}
              {d.returnRecord && (
                <div className="text-xs text-base-muted">
                  <span className="flex items-center gap-1">
                    <RotateCcw size={12} />
                    {ar ? 'تاريخ الاستلام' : 'Return Date'}: <span className="font-semibold text-base-primary">{d.returnRecord.returnDate}</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
