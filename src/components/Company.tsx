import { CheckCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export default function Company() {
  const { t } = useApp();

  return (
    <section id="about" className="py-20 lg:py-28 bg-base relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image side */}
          <div className="relative animate-fade-in">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src="https://images.pexels.com/photos/8961260/pexels-photo-8961260.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="SAHAB team at construction site"
                className="w-full h-[400px] lg:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Floating accent card */}
            <div className="absolute -bottom-6 ltr:-right-6 rtl:-left-6 bg-yellow-accent p-6 rounded-2xl shadow-2xl hidden sm:block">
              <div className="text-4xl font-black text-black mb-1">SAHAB</div>
              <div className="text-sm font-bold text-black/70">
                {t.footer.country}
              </div>
            </div>

            {/* Decorative border */}
            <div className="absolute -top-4 ltr:-left-4 rtl:-right-4 w-24 h-24 border-4 border-yellow-accent/30 rounded-2xl -z-10" />
          </div>

          {/* Text side */}
          <div className="animate-fade-in-up">
            <div className="inline-block mb-4">
              <span className="text-yellow-accent text-sm font-bold tracking-widest uppercase">
                {t.nav.about}
              </span>
              <div className="h-0.5 w-12 bg-yellow-accent mt-2" />
            </div>
            <h2 className="section-heading text-base-primary mb-6">
              {t.company.sectionTitle}
            </h2>

            <p className="text-base-muted text-lg leading-relaxed mb-4">
              {t.company.paragraph1}
            </p>
            <p className="text-base-muted text-lg leading-relaxed mb-8">
              {t.company.paragraph2}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {t.company.stats.map((stat, i) => (
                <div
                  key={i}
                  className="card-industrial p-4 lg:p-5 text-center hover-lift"
                >
                  <div className="text-2xl lg:text-3xl font-black text-yellow-accent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs lg:text-sm text-base-muted font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-3">
              {[t.whySahab.items[0].title, t.whySahab.items[1].title, t.whySahab.items[4].title].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-medium text-base-primary">
                  <CheckCircle size={18} className="text-yellow-accent" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
