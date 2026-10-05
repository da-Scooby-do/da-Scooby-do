import { useApp } from '@/contexts/AppContext';

export default function RentalProcess() {
  const { t, dir } = useApp();

  return (
    <section className="py-20 lg:py-28 bg-base relative overflow-hidden">
      {/* Industrial pattern */}
      <div className="absolute inset-0 industrial-pattern opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-14 lg:mb-20">
          <div className="inline-block mb-4">
            <span className="text-yellow-accent text-sm font-bold tracking-widest uppercase">
              {t.rentalProcess.sectionTitle}
            </span>
            <div className="h-0.5 w-12 bg-yellow-accent mx-auto mt-2" />
          </div>
          <h2 className="section-heading text-base-primary mb-4">
            {t.rentalProcess.sectionTitle}
          </h2>
          <p className="text-base-muted text-lg max-w-2xl mx-auto">
            {t.rentalProcess.sectionSubtitle}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border-base to-transparent" />

          {t.rentalProcess.steps.map((step, i) => (
            <div
              key={i}
              className="relative animate-fade-in-up"
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              {/* Step number circle */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-card border-2 border-base flex items-center justify-center hover:border-yellow-accent transition-all duration-300 group-hover:scale-105">
                    <span className="text-4xl font-black text-yellow-accent">
                      {i + 1}
                    </span>
                  </div>
                  {/* Yellow dot */}
                  <div className="absolute -top-1.5 ltr:-right-1.5 rtl:-left-1.5 w-4 h-4 rounded-full bg-yellow-accent border-2 border-base" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center px-2">
                <h3 className="text-lg font-bold text-base-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-base-muted text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow between steps (desktop) */}
              {i < t.rentalProcess.steps.length - 1 && (
                <div className={`hidden lg:block absolute top-12 ${dir === 'rtl' ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'}`}>
                  <div className="w-2 h-2 rounded-full bg-yellow-accent opacity-50" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
