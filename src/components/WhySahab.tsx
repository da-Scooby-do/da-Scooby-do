import { Truck, Calendar, MapPin, Award, Tag, Building2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const iconMap: Record<string, typeof Truck> = {
  truck: Truck,
  calendar: Calendar,
  map: MapPin,
  award: Award,
  tag: Tag,
  building: Building2,
};

export default function WhySahab() {
  const { t } = useApp();

  return (
    <section className="py-20 lg:py-28 bg-elevated relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 ltr:right-0 rtl:left-0 w-96 h-96 bg-yellow-accent/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-14 lg:mb-20">
          <div className="inline-block mb-4">
            <span className="text-yellow-accent text-sm font-bold tracking-widest uppercase">
              {t.whySahab.sectionTitle}
            </span>
            <div className="h-0.5 w-12 bg-yellow-accent mx-auto mt-2" />
          </div>
          <h2 className="section-heading text-base-primary mb-4">
            {t.whySahab.sectionTitle}
          </h2>
          <p className="text-base-muted text-lg max-w-2xl mx-auto">
            {t.whySahab.sectionSubtitle}
          </p>
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.whySahab.items.map((item, i) => {
            const Icon = iconMap[item.icon] || Truck;
            return (
              <div
                key={i}
                data-tilt className="card-industrial p-6 lg:p-8 hover-lift group animate-fade-in-up"
                style={{ animationDelay: `${(i % 3) * 0.1}s` }}
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center mb-5 group-hover:bg-yellow-accent group-hover:scale-110 transition-all duration-300">
                  <Icon size={26} className="text-yellow-accent group-hover:text-black transition-colors" />
                </div>

                <h3 className="text-xl font-bold text-base-primary mb-2 group-hover:text-yellow-accent transition-colors">
                  {item.title}
                </h3>
                <p className="text-base-muted leading-relaxed">
                  {item.description}
                </p>

                {/* Accent corner */}
                <div className="mt-5 h-0.5 w-10 bg-yellow-accent/30 group-hover:w-20 transition-all duration-300" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
