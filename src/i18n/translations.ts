export type Language = 'ar' | 'en';

export interface Translation {
  // Header
  nav: {
    home: string;
    equipment: string;
    contracting: string;
    about: string;
    contact: string;
  };
  cta: {
    orderEquipment: string;
    browseEquipment: string;
    requestQuote: string;
    contactUs: string;
    orderService: string;
  };

  // Hero
  hero: {
    headline: string;
    subtext: string;
    primaryCta: string;
    secondaryCta: string;
    badge: string;
  };

  // Equipment categories
  equipment: {
    sectionTitle: string;
    sectionSubtitle: string;
    categories: { name: string; image: string }[];
  };

  // Why SAHAB
  whySahab: {
    sectionTitle: string;
    sectionSubtitle: string;
    items: { title: string; description: string; icon: string }[];
  };

  // Rental process
  rentalProcess: {
    sectionTitle: string;
    sectionSubtitle: string;
    steps: { title: string; description: string }[];
  };

  // Contracting
  contracting: {
    sectionTitle: string;
    sectionSubtitle: string;
    services: { title: string; description: string }[];
    cta: string;
  };

  // Company
  company: {
    sectionTitle: string;
    paragraph1: string;
    paragraph2: string;
    stats: { value: string; label: string }[];
  };

  // Final CTA
  finalCta: {
    title: string;
    subtitle: string;
    button1: string;
    button2: string;
  };

  // Footer
  footer: {
    companyNameAr: string;
    companyNameEn: string;
    quickLinks: string;
    contactInfo: string;
    phone: string;
    email: string;
    address: string;
    cr: string;
    vat: string;
    country: string;
    copyright: string;
    rights: string;
  };

  // Theme
  theme: {
    light: string;
    dark: string;
  };
}

export const translations: Record<Language, Translation> = {
  ar: {
    nav: {
      home: 'الرئيسية',
      equipment: 'تأجير المعدات',
      contracting: 'المقاولات والإنشاءات',
      about: 'من نحن',
      contact: 'تواصل معنا',
    },
    cta: {
      orderEquipment: 'اطلب معدة',
      browseEquipment: 'استعرض المعدات',
      requestQuote: 'اطلب عرض سعر',
      contactUs: 'تواصل معنا',
      orderService: 'اطلب خدمة للمشروع',
    },
    hero: {
      headline: 'حلول تأجير معدات موثوقة لمشاريعك',
      subtext:
        'نوفر معدات حديثة وخيارات تأجير مرنة للمشاريع والشركات في مختلف مناطق المملكة العربية السعودية.',
      primaryCta: 'استعرض المعدات',
      secondaryCta: 'اطلب عرض سعر',
      badge: 'معدات ومقاولات',
    },
    equipment: {
      sectionTitle: 'أنواع المعدات المتاحة للإيجار',
      sectionSubtitle: 'أسطول متنوع يغطي احتياجات مشاريعك في مختلف المواقع والظروف',
      categories: [
        { name: 'حفارات', image: 'https://cdn.phototourl.com/member/2026-09-26-7f656a4b-4cfe-4319-93dd-9fe4e0818893.png' },
        { name: 'شيولات', image: 'https://cdn.phototourl.com/member/2026-09-26-5ca84082-ae6d-4a95-856a-165aac541bd4.png' },
        { name: 'كرينات', image: 'https://cdn.phototourl.com/member/2026-09-26-d8713d70-4442-4e17-8515-6cd76947b9e2.png' },
        { name: 'لودرات بوم', image: 'https://cdn.phototourl.com/member/2026-09-26-bf1671cb-b1dd-4935-9d34-bf590069e8aa.png' },
        { name: 'بوبكات', image: 'https://cdn.phototourl.com/member/2026-09-26-06838365-ff22-4971-a12b-3c86b3fd298b.png' },
        { name: 'رافعات شوكية', image: 'https://cdn.phototourl.com/member/2026-09-26-c97b9806-ef2d-4954-a49b-bf074fa4e5ab.png' },
        { name: 'مان لفت', image: 'https://cdn.phototourl.com/member/2026-09-26-694de2be-9e72-423f-a912-2cf78cb6b01e.png' },
        { name: 'سيزر لفت', image: 'https://cdn.phototourl.com/member/2026-09-29-572cd484-e546-4924-8b6a-c5db21284e21.png' },
        { name: 'بوم ترك', image: 'https://cdn.phototourl.com/member/2026-09-26-962356d8-158b-4e56-9da8-e9d1432d3e81.png' },
        { name: 'سطحات وونش هيدروليك', image: 'https://cdn.phototourl.com/member/2026-09-26-67421973-9c82-44c0-9720-89ffd04ce523.png' },
      ],
    },
    whySahab: {
      sectionTitle: 'لماذا سحاب',
      sectionSubtitle: 'نلتزم بتقديم خدمة موثوقة تلبي متطلبات المشاريع المختلفة',
      items: [
        { title: 'معدات حديثة', description: 'أسطول حديث يخضع للصيانة الدورية لضمان الأداء والموثوقية في الموقع.', icon: 'truck' },
        { title: 'خيارات تأجير مرنة', description: 'إيجار يومي وأسبوعي وشهري حسب احتياج مشروعك مع إمكانية التمديد.', icon: 'calendar' },
        { title: 'تغطية في مناطق المملكة', description: 'نخدم المشاريع في مختلف مناطق المملكة العربية السعودية.', icon: 'map' },
        { title: 'خبرة في المعدات والمشاريع', description: 'فريق يمتلك المعرفة التقنية لمساعدتك في اختيار المعدة المناسبة.', icon: 'award' },
        { title: 'أسعار تنافسية', description: 'أسعار مدروسة تتناسب مع ميزانية مشروعك مع شفافية في التسعير.', icon: 'tag' },
        { title: 'خدمة للشركات والمشاريع', description: 'حلول مخصصة للشركات والمقاولين تخدم متطلبات المشاريع الكبرى.', icon: 'building' },
      ],
    },
    rentalProcess: {
      sectionTitle: 'كيف تطلب معدة',
      sectionSubtitle: 'أربع خطوات بسيطة تفصلك عن تجهيز مشروعك',
      steps: [
        { title: 'اختر المعدة', description: 'تصفح أنواع المعدات وحدد ما يناسب احتياج مشروعك.' },
        { title: 'أرسل طلبك', description: 'عبّء بيانات الطلب من خلال نموذج التواصل أو اتصل بنا مباشرة.' },
        { title: 'نستكمل العرض والتجهيز', description: 'نقوم بإعداد عرض السعر وتجهيز المعدة وفقاً لمتطلباتك.' },
        { title: 'تسليم المعدة للموقع', description: 'نسلّم المعدة في موقع المشروع في الموعد المتفق عليه.' },
      ],
    },
    contracting: {
      sectionTitle: 'المقاولات والإنشاءات',
      sectionSubtitle: 'خدمات مقاولات متكاملة تنفذ مشاريعك باحترافية وجودة عالية',
      services: [
        { title: 'المقاولات والإنشاءات', description: 'تنفيذ مشاريع إنشائية بمختلف أحجامها وفق المعايير المعتمدة.' },
        { title: 'الترميم والتجديد', description: 'أعمال الترميم وتجديد المباني القائمة لإعادة الحياة إليها.' },
        { title: 'أعمال التشطيبات', description: 'تشطيبات داخلية وخارجية بمستوى جودة عالٍ.' },
        { title: 'الخدمات المعمارية والهندسية', description: 'خدمات تصميم وإشراف هندسي تنقل رؤيتك إلى واقع.' },
      ],
      cta: 'اطلب خدمة للمشروع',
    },
    company: {
      sectionTitle: 'من نحن',
      paragraph1:
        'شركة سحاب للمقاولات وتأجير المعدات هي شركة سعودية تعمل في مجال تأجير المعدات الثقيلة وتقديم خدمات المقاولات والإنشاءات. نهدف إلى توفير حلول متكاملة للمشاريع والشركات في مختلف مناطق المملكة العربية السعودية.',
      paragraph2:
        'نعتمد على أسطول حديث من المعدات الثقيلة وفريق متخصص لضمان تقديم خدمة موثوقة وفعّالة تلبي احتياجات عملائنا وتساهم في إنجاح مشاريعهم.',
      stats: [
        { value: '+10', label: 'أنواع معدات' },
        { value: '24/7', label: 'دعم فني' },
        { value: 'كل المملكة', label: 'تغطية جغرافية' },
      ],
    },
    finalCta: {
      title: 'لديك مشروع؟ دعنا نساعدك في تجهيز احتياجاته.',
      subtitle: 'تواصل معنا اليوم للحصول على عرض سعر مخصص لمتطلبات مشروعك',
      button1: 'اطلب عرض سعر',
      button2: 'تواصل معنا',
    },
    footer: {
      companyNameAr: 'شركة سحاب للمقاولات وتأجير المعدات',
      companyNameEn: 'SAHAB Contracting & Equipment Rental',
      quickLinks: 'روابط سريعة',
      contactInfo: 'معلومات التواصل',
      phone: 'الهاتف',
      email: 'البريد الإلكتروني',
      address: 'العنوان',
      cr: 'س.ت',
      vat: 'ض.ق',
      country: 'المملكة العربية السعودية',
      copyright: '© 2023 شركة سحاب للمقاولات وتأجير المعدات',
      rights: 'جميع الحقوق محفوظة',
    },
    theme: {
      light: 'فاتح',
      dark: 'داكن',
    },
  },
  en: {
    nav: {
      home: 'Home',
      equipment: 'Equipment Rental',
      contracting: 'Contracting',
      about: 'About Us',
      contact: 'Contact',
    },
    cta: {
      orderEquipment: 'Order Equipment',
      browseEquipment: 'Browse Equipment',
      requestQuote: 'Request a Quote',
      contactUs: 'Contact Us',
      orderService: 'Request Project Service',
    },
    hero: {
      headline: 'Reliable Equipment Rental Solutions for Your Projects',
      subtext:
        'We provide modern equipment and flexible rental options for projects and companies across various regions of the Kingdom of Saudi Arabia.',
      primaryCta: 'Browse Equipment',
      secondaryCta: 'Request a Quote',
      badge: 'Equipment & Contracting',
    },
    equipment: {
      sectionTitle: 'Available Equipment for Rent',
      sectionSubtitle: 'A diverse fleet covering your project needs across various sites and conditions',
      categories: [
        { name: 'Excavators', image: 'https://cdn.phototourl.com/member/2026-09-26-7f656a4b-4cfe-4319-93dd-9fe4e0818893.png' },
        { name: 'Shovels', image: 'https://cdn.phototourl.com/member/2026-09-26-5ca84082-ae6d-4a95-856a-165aac541bd4.png' },
        { name: 'Cranes', image: 'https://cdn.phototourl.com/member/2026-09-26-d8713d70-4442-4e17-8515-6cd76947b9e2.png' },
        { name: 'Boom Loaders', image: 'https://cdn.phototourl.com/member/2026-09-26-bf1671cb-b1dd-4935-9d34-bf590069e8aa.png' },
        { name: 'Bobcat', image: 'https://cdn.phototourl.com/member/2026-09-26-06838365-ff22-4971-a12b-3c86b3fd298b.png' },
        { name: 'Forklifts', image: 'https://cdn.phototourl.com/member/2026-09-26-c97b9806-ef2d-4954-a49b-bf074fa4e5ab.png' },
        { name: 'Man Lift', image: 'https://cdn.phototourl.com/member/2026-09-26-694de2be-9e72-423f-a912-2cf78cb6b01e.png' },
        { name: 'Scissor Lift', image: 'https://cdn.phototourl.com/member/2026-09-29-572cd484-e546-4924-8b6a-c5db21284e21.png' },
        { name: 'Boom Truck', image: 'https://cdn.phototourl.com/member/2026-09-26-962356d8-158b-4e56-9da8-e9d1432d3e81.png' },
        { name: 'Flatbed & Hydraulic Winch', image: 'https://cdn.phototourl.com/member/2026-09-26-67421973-9c82-44c0-9720-89ffd04ce523.png' },
      ],
    },
    whySahab: {
      sectionTitle: 'Why SAHAB',
      sectionSubtitle: 'We are committed to delivering reliable service that meets diverse project requirements',
      items: [
        { title: 'Modern Equipment', description: 'A well-maintained fleet undergoing regular servicing to ensure on-site performance and reliability.', icon: 'truck' },
        { title: 'Flexible Rental Options', description: 'Daily, weekly, and monthly rentals tailored to your project needs with extension options.', icon: 'calendar' },
        { title: 'Kingdom-Wide Coverage', description: 'We serve projects across various regions of the Kingdom of Saudi Arabia.', icon: 'map' },
        { title: 'Equipment & Project Expertise', description: 'A team with the technical knowledge to help you choose the right equipment.', icon: 'award' },
        { title: 'Competitive Pricing', description: 'Well-considered pricing that fits your project budget with transparent quoting.', icon: 'tag' },
        { title: 'Corporate & Project Service', description: 'Customized solutions for companies and contractors serving large project requirements.', icon: 'building' },
      ],
    },
    rentalProcess: {
      sectionTitle: 'How to Order Equipment',
      sectionSubtitle: 'Four simple steps to get your project equipped',
      steps: [
        { title: 'Choose Equipment', description: 'Browse equipment types and select what suits your project needs.' },
        { title: 'Submit Your Request', description: 'Fill out the request form through our contact page or call us directly.' },
        { title: 'Quote & Preparation', description: 'We prepare your quote and get the equipment ready per your requirements.' },
        { title: 'Delivery to Site', description: 'We deliver the equipment to your project site on the agreed schedule.' },
      ],
    },
    contracting: {
      sectionTitle: 'Contracting & Construction',
      sectionSubtitle: 'Integrated contracting services delivering your projects with professionalism and high quality',
      services: [
        { title: 'Contracting & Construction', description: 'Executing construction projects of various sizes according to approved standards.' },
        { title: 'Renovation & Restoration', description: 'Renovation and restoration of existing buildings to bring them back to life.' },
        { title: 'Finishing Works', description: 'Interior and exterior finishing works at a high quality level.' },
        { title: 'Architectural & Engineering Services', description: 'Design and engineering supervision services that turn your vision into reality.' },
      ],
      cta: 'Request Project Service',
    },
    company: {
      sectionTitle: 'About Us',
      paragraph1:
        'SAHAB Contracting & Equipment Rental is a Saudi company operating in the heavy equipment rental and contracting services sector. We aim to provide integrated solutions for projects and companies across various regions of the Kingdom of Saudi Arabia.',
      paragraph2:
        'We rely on a modern fleet of heavy equipment and a specialized team to ensure reliable and efficient service that meets our clients needs and contributes to the success of their projects.',
      stats: [
        { value: '10+', label: 'Equipment Types' },
        { value: '24/7', label: 'Technical Support' },
        { value: 'Kingdom-Wide', label: 'Geographic Coverage' },
      ],
    },
    finalCta: {
      title: 'Have a project? Let us help you equip it.',
      subtitle: 'Contact us today to get a customized quote for your project requirements',
      button1: 'Request a Quote',
      button2: 'Contact Us',
    },
    footer: {
      companyNameAr: 'شركة سحاب للمقاولات وتأجير المعدات',
      companyNameEn: 'SAHAB Contracting & Equipment Rental',
      quickLinks: 'Quick Links',
      contactInfo: 'Contact Information',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      cr: 'CR',
      vat: 'VAT',
      country: 'Kingdom of Saudi Arabia',
      copyright: '© 2023 SAHAB Contracting & Equipment Rental',
      rights: 'All rights reserved',
    },
    theme: {
      light: 'Light',
      dark: 'Dark',
    },
  },
};
