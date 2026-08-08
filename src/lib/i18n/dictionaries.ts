import type { Locale } from "./config";

export function interpolate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

export type Dictionary = {
  header: {
    unitLabel: string;
    bookNow: string;
    cart: string;
    language: string;
    /** Rótulo acessível do ícone que leva ao cartão fidelidade. */
    loyalty: string;
  };
  hero: {
    leadingLine: string;
    tagline1: string;
    tagline2: string;
    openBadge: string;
    viewProducts: string;
    bookWith: string;
    subtext: string;
  };
  cta: {
    book: string;
    /** Botão fixo, para quem já tem cartão: leva ao cartão. */
    points: string;
    /** Botão fixo, para quem ainda não tem: leva ao programa. */
    getPoints: string;
  };
  footer: {
    since: string;
    unitLabel: string;
    navigate: string;
    home: string;
    social: string;
    hours: string;
    rights: string;
    privacy: string;
    terms: string;
    madeIn: string;
  };
  home: {
    tagline: string;
    title: string;
    subtitle: string;
    noUnitsTitle: string;
    noUnitsDesc: string;
  };
  marquee: string[];
  stats: {
    years: string;
  };
  homeLanding: {
    h1: string;
    intro: string;
    chooseUnit: string;
    chooseUnitSubtitle: string;
    servicesEyebrow: string;
    servicesTitle: string;
    servicesSubtitle: string;
    services: string[];
    unitsEyebrow: string;
    unitsTitle: string;
    unitsSubtitle: string;
    viewUnit: string;
    viewTeam: string;
    viewContact: string;
    hoursTitle: string;
  };
  whyUs: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    features: { title: string; desc: string }[];
  };
  team: {
    eyebrow: string;
    title: string;
    subtitle: string;
    viewAll: string;
    specialistIn: string;
    defaultSpeciality: string;
  };
  shop: {
    eyebrow: string;
    title: string;
    subtitle: string;
    soldOut: string;
  };
  barbeirosPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    comingSoon: string;
  };
  barberDetail: {
    back: string;
    bookIntro: string;
  };
  contato: {
    eyebrow: string;
    title: string;
    subtitleWithAddress: string;
    subtitleNoAddress: string;
    address: string;
    phone: string;
    whatsapp: string;
    social: string;
    notSet: string;
    mapsLink: string;
    whatsappLink: string;
    hoursTitle: string;
    closed: string;
    days: {
      mon: string;
      tue: string;
      wed: string;
      thu: string;
      fri: string;
      sat: string;
      sun: string;
    };
  };
  productDetail: {
    back: string;
    share: string;
    whatsappNote: string;
    otherProducts: string;
    shareWhatsapp: string;
    shareFacebook: string;
    sharePinterest: string;
  };
  cart: {
    eyebrow: string;
    title: string;
    empty: string;
    viewProducts: string;
    remove: string;
    decrease: string;
    increase: string;
    each: string;
    summary: string;
    subtotal: string;
    total: string;
    checkout: string;
    clearCart: string;
    confirmNote: string;
    whatsappNotConfigured: string;
  };
  productActions: {
    decrease: string;
    increase: string;
    addToCart: string;
    addedToCart: string;
    viewCart: string;
  };
  cookieBanner: {
    message: string;
    policyLink: string;
    reject: string;
    accept: string;
    dialogLabel: string;
  };
};

export const dictionaries: Record<Locale, Dictionary> = {
  pt: {
    header: {
      unitLabel: "Unidade",
      bookNow: "Agendar agora",
      cart: "Carrinho",
      language: "Idioma",
      loyalty: "Cartão fidelidade",
    },
    hero: {
      leadingLine: "Barbearia em Leiria",
      tagline1: "Cortes que ficam.",
      tagline2: "Estilo que dura.",
      openBadge: "Aberto hoje · 09:30 — 19:30",
      viewProducts: "Ver produtos",
      bookWith: "Agendar com {name}",
      subtext: "{years}+ anos de experiência, equipa premiada e produtos profissionais.",
    },
    cta: {
      book: "Agendar corte",
      points: "Os meus pontos",
      getPoints: "Obter pontos",
    },
    footer: {
      since: "Barbearia Brothers · Desde 2012",
      unitLabel: "Unidade",
      navigate: "Navegar",
      home: "Início",
      social: "Social",
      hours: "Seg — Sáb · 09:30 — 19:30",
      rights: "© {year} Barbearia Brothers. Todos os direitos reservados.",
      privacy: "Privacidade",
      terms: "Termos",
      madeIn: "Feito com ✂ em Leiria",
    },
    home: {
      tagline: "Desde 2012",
      title: "Escolha a sua unidade.",
      subtitle:
        "Agende online, conheça a equipa e veja os produtos disponíveis na unidade mais conveniente para si.",
      noUnitsTitle: "Nenhuma unidade ativa",
      noUnitsDesc:
        "Ainda não há unidades públicas disponíveis. Entre no painel administrativo para ativar ou criar uma unidade.",
    },
    homeLanding: {
      h1: "Barbearia em Leiria desde 2012",
      intro:
        "A Of Brothers é uma barbearia em Leiria com duas unidades. Corte, barba, degradê e acabamentos de precisão, por uma equipa certificada. Agende online em menos de um minuto.",
      chooseUnit: "Escolha a sua unidade",
      chooseUnitSubtitle:
        "Somos duas casas em Leiria. Escolha a mais perto de si para agendar, conhecer a equipa e ver os produtos.",
      servicesEyebrow: "01 — Serviços",
      servicesTitle: "O que fazemos.",
      servicesSubtitle:
        "Do corte clássico ao degradê moderno, com o tempo que cada detalhe exige.",
      services: [
        "Corte de cabelo",
        "Barba",
        "Degradê",
        "Sobrancelha",
        "Navalha",
        "Pigmentação",
      ],
      unitsEyebrow: "05 — Onde estamos",
      unitsTitle: "As nossas unidades em Leiria.",
      unitsSubtitle: "Moradas, horários e contactos das duas casas.",
      viewUnit: "Ver unidade",
      viewTeam: "Ver equipa",
      viewContact: "Contactos",
      hoursTitle: "Horário",
    },
    marquee: [
      "CORTE CLÁSSICO",
      "BARBA TERAPÊUTICA",
      "SOBRANCELHA",
      "DEGRADÊ",
      "NAVALHA",
      "PIGMENTAÇÃO",
    ],
    stats: {
      years: "anos abertos",
    },
    whyUs: {
      eyebrow: "02 — Porquê nós",
      titleLine1: "Mais do que um corte.",
      titleLine2: "Uma experiência.",
      subtitle:
        "Desde 2012 que ajudamos os homens de Leiria a sentirem-se bem na pele. Aqui não há pressa — há ritual.",
      features: [
        {
          title: "Mais de 13 anos de experiência",
          desc: "Abrimos em 2012 e nunca parámos. Milhares de clientes satisfeitos confirmam o que fazemos todos os dias.",
        },
        {
          title: "Equipa especializada",
          desc: "Barbeiros certificados em cortes modernos, degradê, barba e acabamentos de precisão. Cada detalhe conta.",
        },
        {
          title: "Marcação em 1 minuto",
          desc: "Agenda online pelo Buk quando quiseres. Sem esperas ao telefone, sem surpresas — só o teu horário reservado.",
        },
        {
          title: "Produtos profissionais",
          desc: "Usamos e vendemos as mesmas marcas de referência que os melhores salões de Portugal. Leva a experiência para casa.",
        },
      ],
    },
    team: {
      eyebrow: "03 — A equipa",
      title: "Os barbeiros desta unidade.",
      subtitle:
        "Escolhe um profissional e agenda diretamente. Cada barbeiro tem o seu estilo e a sua agenda.",
      viewAll: "Ver todos os barbeiros →",
      specialistIn: "Especialista em {speciality} com anos de experiência na unidade.",
      defaultSpeciality: "corte e barba",
    },
    shop: {
      eyebrow: "04 — Loja",
      title: "Produtos profissionais à venda.",
      subtitle:
        "Os mesmos produtos que usamos no salão. Encomenda via WhatsApp e levanta na unidade ou recebe em casa.",
      soldOut: "Esgotado",
    },
    barbeirosPage: {
      eyebrow: "A equipa",
      title: "Os nossos barbeiros.",
      subtitle:
        "Profissionais certificados com anos de experiência. Escolhe um e agenda diretamente online.",
      comingSoon: "Em breve a nossa equipa estará disponível aqui.",
    },
    barberDetail: {
      back: "Voltar aos barbeiros",
      bookIntro: "Agenda diretamente com {name} e escolhe o dia e hora que preferes.",
    },
    contato: {
      eyebrow: "Contacto",
      title: "Como nos encontrar.",
      subtitleWithAddress: "Estamos em {address}. Agende online ou fale connosco diretamente.",
      subtitleNoAddress: "Agende online ou fale connosco diretamente.",
      address: "Morada",
      phone: "Telefone",
      whatsapp: "WhatsApp",
      social: "Social",
      notSet: "A definir.",
      mapsLink: "Ver no Google Maps →",
      whatsappLink: "Falar no WhatsApp →",
      hoursTitle: "Horário",
      closed: "Fechado",
      days: {
        mon: "Segunda",
        tue: "Terça",
        wed: "Quarta",
        thu: "Quinta",
        fri: "Sexta",
        sat: "Sábado",
        sun: "Domingo",
      },
    },
    productDetail: {
      back: "Voltar aos produtos",
      share: "Partilhar:",
      whatsappNote: "✂ Encomendas confirmadas via WhatsApp. Levantamento na barbearia ou envio para casa.",
      otherProducts: "Outros produtos",
      shareWhatsapp: "Partilhar no WhatsApp",
      shareFacebook: "Partilhar no Facebook",
      sharePinterest: "Partilhar no Pinterest",
    },
    cart: {
      eyebrow: "Carrinho",
      title: "O seu pedido",
      empty: "O seu carrinho está vazio.",
      viewProducts: "Ver produtos",
      remove: "Remover",
      decrease: "Diminuir",
      increase: "Aumentar",
      each: "cada",
      summary: "Resumo",
      subtotal: "Subtotal",
      total: "Total",
      checkout: "Concluir via WhatsApp",
      clearCart: "Esvaziar carrinho",
      confirmNote: "Confirmamos disponibilidade e o melhor método de levantamento por WhatsApp.",
      whatsappNotConfigured: "WhatsApp não configurado para esta unidade.",
    },
    productActions: {
      decrease: "Diminuir",
      increase: "Aumentar",
      addToCart: "Adicionar ao carrinho",
      addedToCart: "Adicionado ao carrinho",
      viewCart: "Ver carrinho",
    },
    cookieBanner: {
      message: "Usamos cookies e análise de tráfego para melhorar a experiência.",
      policyLink: "Política de privacidade",
      reject: "Rejeitar",
      accept: "Aceitar todos",
      dialogLabel: "Consentimento de cookies",
    },
  },
  en: {
    header: {
      unitLabel: "Unit",
      bookNow: "Book now",
      cart: "Cart",
      language: "Language",
      loyalty: "Loyalty card",
    },
    hero: {
      leadingLine: "Barbershop in Leiria",
      tagline1: "Cuts that last.",
      tagline2: "Style that endures.",
      openBadge: "Open today · 9:30 AM — 7:30 PM",
      viewProducts: "View products",
      bookWith: "Book with {name}",
      subtext: "{years}+ years of experience, an award-winning team and professional products.",
    },
    cta: {
      book: "Book a haircut",
      points: "My points",
      getPoints: "Get points",
    },
    footer: {
      since: "Barbearia Brothers · Since 2012",
      unitLabel: "Unit",
      navigate: "Navigate",
      home: "Home",
      social: "Social",
      hours: "Mon — Sat · 9:30 AM — 7:30 PM",
      rights: "© {year} Barbearia Brothers. All rights reserved.",
      privacy: "Privacy",
      terms: "Terms",
      madeIn: "Made with ✂ in Leiria",
    },
    home: {
      tagline: "Since 2012",
      title: "Choose your unit.",
      subtitle:
        "Book online, meet the team and browse the products available at the unit most convenient for you.",
      noUnitsTitle: "No active units",
      noUnitsDesc:
        "There are no public units available yet. Log in to the admin panel to activate or create a unit.",
    },
    homeLanding: {
      h1: "Barbershop in Leiria since 2012",
      intro:
        "Of Brothers is a barbershop in Leiria with two locations. Haircuts, beard work, fades and precision finishes by a certified team. Book online in under a minute.",
      chooseUnit: "Choose your location",
      chooseUnitSubtitle:
        "We have two shops in Leiria. Pick the closest one to book, meet the team and browse products.",
      servicesEyebrow: "01 — Services",
      servicesTitle: "What we do.",
      servicesSubtitle:
        "From the classic cut to the modern fade, with the time each detail deserves.",
      services: [
        "Haircut",
        "Beard",
        "Fade",
        "Eyebrow",
        "Straight razor",
        "Pigmentation",
      ],
      unitsEyebrow: "05 — Where we are",
      unitsTitle: "Our locations in Leiria.",
      unitsSubtitle: "Addresses, opening hours and contacts for both shops.",
      viewUnit: "View location",
      viewTeam: "View team",
      viewContact: "Contact",
      hoursTitle: "Opening hours",
    },
    marquee: [
      "CLASSIC CUT",
      "THERAPEUTIC BEARD",
      "EYEBROW",
      "FADE",
      "STRAIGHT RAZOR",
      "PIGMENTATION",
    ],
    stats: {
      years: "years open",
    },
    whyUs: {
      eyebrow: "02 — Why us",
      titleLine1: "More than a haircut.",
      titleLine2: "An experience.",
      subtitle:
        "Since 2012 we've helped the men of Leiria feel good in their own skin. There's no rush here — only ritual.",
      features: [
        {
          title: "13+ years of experience",
          desc: "We opened in 2012 and never stopped. Thousands of satisfied clients confirm what we do every day.",
        },
        {
          title: "Specialised team",
          desc: "Barbers certified in modern cuts, fades, beards and precision finishes. Every detail counts.",
        },
        {
          title: "Book in 1 minute",
          desc: "Book online via Buk whenever you like. No waiting on the phone, no surprises — just your reserved slot.",
        },
        {
          title: "Professional products",
          desc: "We use and sell the same reference brands as the best salons in Portugal. Take the experience home.",
        },
      ],
    },
    team: {
      eyebrow: "03 — The team",
      title: "The barbers at this unit.",
      subtitle: "Pick a professional and book directly. Every barber has their own style and schedule.",
      viewAll: "See all barbers →",
      specialistIn: "Specialist in {speciality} with years of experience at the unit.",
      defaultSpeciality: "haircuts and beards",
    },
    shop: {
      eyebrow: "04 — Shop",
      title: "Professional products for sale.",
      subtitle: "The same products we use in the salon. Order via WhatsApp and pick up at the unit or get it delivered.",
      soldOut: "Sold out",
    },
    barbeirosPage: {
      eyebrow: "The team",
      title: "Our barbers.",
      subtitle: "Certified professionals with years of experience. Pick one and book directly online.",
      comingSoon: "Our team will be available here soon.",
    },
    barberDetail: {
      back: "Back to barbers",
      bookIntro: "Book directly with {name} and choose the day and time that suits you.",
    },
    contato: {
      eyebrow: "Contact",
      title: "How to find us.",
      subtitleWithAddress: "We're at {address}. Book online or talk to us directly.",
      subtitleNoAddress: "Book online or talk to us directly.",
      address: "Address",
      phone: "Phone",
      whatsapp: "WhatsApp",
      social: "Social",
      notSet: "To be set.",
      mapsLink: "View on Google Maps →",
      whatsappLink: "Chat on WhatsApp →",
      hoursTitle: "Hours",
      closed: "Closed",
      days: {
        mon: "Monday",
        tue: "Tuesday",
        wed: "Wednesday",
        thu: "Thursday",
        fri: "Friday",
        sat: "Saturday",
        sun: "Sunday",
      },
    },
    productDetail: {
      back: "Back to products",
      share: "Share:",
      whatsappNote: "✂ Orders confirmed via WhatsApp. Pick up at the barbershop or have it delivered.",
      otherProducts: "Other products",
      shareWhatsapp: "Share on WhatsApp",
      shareFacebook: "Share on Facebook",
      sharePinterest: "Share on Pinterest",
    },
    cart: {
      eyebrow: "Cart",
      title: "Your order",
      empty: "Your cart is empty.",
      viewProducts: "View products",
      remove: "Remove",
      decrease: "Decrease",
      increase: "Increase",
      each: "each",
      summary: "Summary",
      subtotal: "Subtotal",
      total: "Total",
      checkout: "Checkout via WhatsApp",
      clearCart: "Clear cart",
      confirmNote: "We'll confirm availability and the best pick-up method over WhatsApp.",
      whatsappNotConfigured: "WhatsApp is not configured for this unit.",
    },
    productActions: {
      decrease: "Decrease",
      increase: "Increase",
      addToCart: "Add to cart",
      addedToCart: "Added to cart",
      viewCart: "View cart",
    },
    cookieBanner: {
      message: "We use cookies and traffic analysis to improve your experience.",
      policyLink: "Privacy policy",
      reject: "Reject",
      accept: "Accept all",
      dialogLabel: "Cookie consent",
    },
  },
  fr: {
    header: {
      unitLabel: "Unité",
      bookNow: "Réserver",
      cart: "Panier",
      language: "Langue",
      loyalty: "Carte de fidélité",
    },
    hero: {
      leadingLine: "Barbier à Leiria",
      tagline1: "Des coupes qui durent.",
      tagline2: "Un style qui dure.",
      openBadge: "Ouvert aujourd'hui · 9h30 — 19h30",
      viewProducts: "Voir les produits",
      bookWith: "Réserver avec {name}",
      subtext: "{years}+ ans d'expérience, une équipe primée et des produits professionnels.",
    },
    cta: {
      book: "Réserver une coupe",
      points: "Mes points",
      getPoints: "Obtenir des points",
    },
    footer: {
      since: "Barbearia Brothers · Depuis 2012",
      unitLabel: "Unité",
      navigate: "Navigation",
      home: "Accueil",
      social: "Réseaux",
      hours: "Lun — Sam · 9h30 — 19h30",
      rights: "© {year} Barbearia Brothers. Tous droits réservés.",
      privacy: "Confidentialité",
      terms: "Conditions",
      madeIn: "Fait avec ✂ à Leiria",
    },
    home: {
      tagline: "Depuis 2012",
      title: "Choisissez votre unité.",
      subtitle:
        "Réservez en ligne, découvrez l'équipe et consultez les produits disponibles dans l'unité la plus proche de vous.",
      noUnitsTitle: "Aucune unité active",
      noUnitsDesc:
        "Aucune unité publique n'est disponible pour le moment. Connectez-vous au panneau d'administration pour activer ou créer une unité.",
    },
    homeLanding: {
      h1: "Barbier à Leiria depuis 2012",
      intro:
        "Of Brothers est un salon de barbier à Leiria avec deux adresses. Coupe, barbe, dégradé et finitions de précision par une équipe certifiée. Réservez en ligne en moins d'une minute.",
      chooseUnit: "Choisissez votre salon",
      chooseUnitSubtitle:
        "Nous avons deux salons à Leiria. Choisissez le plus proche pour réserver, découvrir l'équipe et voir les produits.",
      servicesEyebrow: "01 — Services",
      servicesTitle: "Ce que nous faisons.",
      servicesSubtitle:
        "De la coupe classique au dégradé moderne, avec le temps que chaque détail mérite.",
      services: [
        "Coupe de cheveux",
        "Barbe",
        "Dégradé",
        "Sourcils",
        "Rasoir",
        "Pigmentation",
      ],
      unitsEyebrow: "05 — Où nous trouver",
      unitsTitle: "Nos salons à Leiria.",
      unitsSubtitle: "Adresses, horaires et contacts des deux salons.",
      viewUnit: "Voir le salon",
      viewTeam: "Voir l'équipe",
      viewContact: "Contact",
      hoursTitle: "Horaires",
    },
    marquee: [
      "COUPE CLASSIQUE",
      "BARBE THÉRAPEUTIQUE",
      "SOURCILS",
      "DÉGRADÉ",
      "RASOIR",
      "PIGMENTATION",
    ],
    stats: {
      years: "ans d'activité",
    },
    whyUs: {
      eyebrow: "02 — Pourquoi nous",
      titleLine1: "Plus qu'une coupe.",
      titleLine2: "Une expérience.",
      subtitle:
        "Depuis 2012, nous aidons les hommes de Leiria à se sentir bien dans leur peau. Ici, pas de précipitation — juste un rituel.",
      features: [
        {
          title: "Plus de 13 ans d'expérience",
          desc: "Ouverts depuis 2012, nous n'avons jamais arrêté. Des milliers de clients satisfaits confirment ce que nous faisons chaque jour.",
        },
        {
          title: "Équipe spécialisée",
          desc: "Barbiers certifiés en coupes modernes, dégradés, barbe et finitions de précision. Chaque détail compte.",
        },
        {
          title: "Réservation en 1 minute",
          desc: "Réservez en ligne via Buk quand vous voulez. Pas d'attente au téléphone, pas de surprise — juste votre créneau réservé.",
        },
        {
          title: "Produits professionnels",
          desc: "Nous utilisons et vendons les mêmes marques de référence que les meilleurs salons du Portugal. Emportez l'expérience chez vous.",
        },
      ],
    },
    team: {
      eyebrow: "03 — L'équipe",
      title: "Les barbiers de cette unité.",
      subtitle: "Choisissez un professionnel et réservez directement. Chaque barbier a son propre style et son propre agenda.",
      viewAll: "Voir tous les barbiers →",
      specialistIn: "Spécialiste en {speciality} avec des années d'expérience dans l'unité.",
      defaultSpeciality: "coupe et barbe",
    },
    shop: {
      eyebrow: "04 — Boutique",
      title: "Produits professionnels en vente.",
      subtitle: "Les mêmes produits que nous utilisons au salon. Commandez via WhatsApp et récupérez à l'unité ou faites-vous livrer.",
      soldOut: "Épuisé",
    },
    barbeirosPage: {
      eyebrow: "L'équipe",
      title: "Nos barbiers.",
      subtitle: "Des professionnels certifiés avec des années d'expérience. Choisissez-en un et réservez directement en ligne.",
      comingSoon: "Notre équipe sera bientôt disponible ici.",
    },
    barberDetail: {
      back: "Retour aux barbiers",
      bookIntro: "Réservez directement avec {name} et choisissez le jour et l'heure qui vous conviennent.",
    },
    contato: {
      eyebrow: "Contact",
      title: "Comment nous trouver.",
      subtitleWithAddress: "Nous sommes à {address}. Réservez en ligne ou contactez-nous directement.",
      subtitleNoAddress: "Réservez en ligne ou contactez-nous directement.",
      address: "Adresse",
      phone: "Téléphone",
      whatsapp: "WhatsApp",
      social: "Réseaux",
      notSet: "À définir.",
      mapsLink: "Voir sur Google Maps →",
      whatsappLink: "Discuter sur WhatsApp →",
      hoursTitle: "Horaires",
      closed: "Fermé",
      days: {
        mon: "Lundi",
        tue: "Mardi",
        wed: "Mercredi",
        thu: "Jeudi",
        fri: "Vendredi",
        sat: "Samedi",
        sun: "Dimanche",
      },
    },
    productDetail: {
      back: "Retour aux produits",
      share: "Partager :",
      whatsappNote: "✂ Commandes confirmées via WhatsApp. Retrait au salon ou livraison à domicile.",
      otherProducts: "Autres produits",
      shareWhatsapp: "Partager sur WhatsApp",
      shareFacebook: "Partager sur Facebook",
      sharePinterest: "Partager sur Pinterest",
    },
    cart: {
      eyebrow: "Panier",
      title: "Votre commande",
      empty: "Votre panier est vide.",
      viewProducts: "Voir les produits",
      remove: "Retirer",
      decrease: "Diminuer",
      increase: "Augmenter",
      each: "chacun",
      summary: "Résumé",
      subtotal: "Sous-total",
      total: "Total",
      checkout: "Finaliser via WhatsApp",
      clearCart: "Vider le panier",
      confirmNote: "Nous confirmons la disponibilité et le meilleur mode de retrait par WhatsApp.",
      whatsappNotConfigured: "WhatsApp n'est pas configuré pour cette unité.",
    },
    productActions: {
      decrease: "Diminuer",
      increase: "Augmenter",
      addToCart: "Ajouter au panier",
      addedToCart: "Ajouté au panier",
      viewCart: "Voir le panier",
    },
    cookieBanner: {
      message: "Nous utilisons des cookies et l'analyse du trafic pour améliorer l'expérience.",
      policyLink: "Politique de confidentialité",
      reject: "Refuser",
      accept: "Tout accepter",
      dialogLabel: "Consentement aux cookies",
    },
  },
  es: {
    header: {
      unitLabel: "Unidad",
      bookNow: "Reservar ahora",
      cart: "Carrito",
      language: "Idioma",
      loyalty: "Tarjeta de fidelidad",
    },
    hero: {
      leadingLine: "Barbería en Leiria",
      tagline1: "Cortes que perduran.",
      tagline2: "Estilo que dura.",
      openBadge: "Abierto hoy · 9:30 — 19:30",
      viewProducts: "Ver productos",
      bookWith: "Reservar con {name}",
      subtext: "{years}+ años de experiencia, un equipo premiado y productos profesionales.",
    },
    cta: {
      book: "Reservar corte",
      points: "Mis puntos",
      getPoints: "Obtener puntos",
    },
    footer: {
      since: "Barbearia Brothers · Desde 2012",
      unitLabel: "Unidad",
      navigate: "Navegar",
      home: "Inicio",
      social: "Social",
      hours: "Lun — Sáb · 9:30 — 19:30",
      rights: "© {year} Barbearia Brothers. Todos los derechos reservados.",
      privacy: "Privacidad",
      terms: "Términos",
      madeIn: "Hecho con ✂ en Leiria",
    },
    home: {
      tagline: "Desde 2012",
      title: "Elige tu unidad.",
      subtitle:
        "Reserva en línea, conoce al equipo y descubre los productos disponibles en la unidad más conveniente para ti.",
      noUnitsTitle: "Ninguna unidad activa",
      noUnitsDesc:
        "Todavía no hay unidades públicas disponibles. Entra en el panel de administración para activar o crear una unidad.",
    },
    homeLanding: {
      h1: "Barbería en Leiria desde 2012",
      intro:
        "Of Brothers es una barbería en Leiria con dos locales. Corte, barba, degradado y acabados de precisión por un equipo certificado. Reserva online en menos de un minuto.",
      chooseUnit: "Elige tu local",
      chooseUnitSubtitle:
        "Tenemos dos locales en Leiria. Elige el más cercano para reservar, conocer al equipo y ver los productos.",
      servicesEyebrow: "01 — Servicios",
      servicesTitle: "Lo que hacemos.",
      servicesSubtitle:
        "Del corte clásico al degradado moderno, con el tiempo que cada detalle merece.",
      services: [
        "Corte de pelo",
        "Barba",
        "Degradado",
        "Cejas",
        "Navaja",
        "Pigmentación",
      ],
      unitsEyebrow: "05 — Dónde estamos",
      unitsTitle: "Nuestros locales en Leiria.",
      unitsSubtitle: "Direcciones, horarios y contactos de los dos locales.",
      viewUnit: "Ver local",
      viewTeam: "Ver equipo",
      viewContact: "Contacto",
      hoursTitle: "Horario",
    },
    marquee: [
      "CORTE CLÁSICO",
      "BARBA TERAPÉUTICA",
      "CEJAS",
      "DEGRADADO",
      "NAVAJA",
      "PIGMENTACIÓN",
    ],
    stats: {
      years: "años abiertos",
    },
    whyUs: {
      eyebrow: "02 — Por qué nosotros",
      titleLine1: "Más que un corte.",
      titleLine2: "Una experiencia.",
      subtitle:
        "Desde 2012 ayudamos a los hombres de Leiria a sentirse bien en su piel. Aquí no hay prisa — hay ritual.",
      features: [
        {
          title: "Más de 13 años de experiencia",
          desc: "Abrimos en 2012 y nunca paramos. Miles de clientes satisfechos confirman lo que hacemos cada día.",
        },
        {
          title: "Equipo especializado",
          desc: "Barberos certificados en cortes modernos, degradado, barba y acabados de precisión. Cada detalle cuenta.",
        },
        {
          title: "Reserva en 1 minuto",
          desc: "Reserva en línea a través de Buk cuando quieras. Sin esperas al teléfono, sin sorpresas — solo tu horario reservado.",
        },
        {
          title: "Productos profesionales",
          desc: "Usamos y vendemos las mismas marcas de referencia que los mejores salones de Portugal. Llévate la experiencia a casa.",
        },
      ],
    },
    team: {
      eyebrow: "03 — El equipo",
      title: "Los barberos de esta unidad.",
      subtitle: "Elige un profesional y reserva directamente. Cada barbero tiene su propio estilo y agenda.",
      viewAll: "Ver todos los barberos →",
      specialistIn: "Especialista en {speciality} con años de experiencia en la unidad.",
      defaultSpeciality: "corte y barba",
    },
    shop: {
      eyebrow: "04 — Tienda",
      title: "Productos profesionales a la venta.",
      subtitle: "Los mismos productos que usamos en el salón. Pide por WhatsApp y recoge en la unidad o recíbelo en casa.",
      soldOut: "Agotado",
    },
    barbeirosPage: {
      eyebrow: "El equipo",
      title: "Nuestros barberos.",
      subtitle: "Profesionales certificados con años de experiencia. Elige uno y reserva directamente online.",
      comingSoon: "Pronto nuestro equipo estará disponible aquí.",
    },
    barberDetail: {
      back: "Volver a los barberos",
      bookIntro: "Reserva directamente con {name} y elige el día y la hora que prefieras.",
    },
    contato: {
      eyebrow: "Contacto",
      title: "Cómo encontrarnos.",
      subtitleWithAddress: "Estamos en {address}. Reserva en línea o habla con nosotros directamente.",
      subtitleNoAddress: "Reserva en línea o habla con nosotros directamente.",
      address: "Dirección",
      phone: "Teléfono",
      whatsapp: "WhatsApp",
      social: "Social",
      notSet: "Por definir.",
      mapsLink: "Ver en Google Maps →",
      whatsappLink: "Hablar por WhatsApp →",
      hoursTitle: "Horario",
      closed: "Cerrado",
      days: {
        mon: "Lunes",
        tue: "Martes",
        wed: "Miércoles",
        thu: "Jueves",
        fri: "Viernes",
        sat: "Sábado",
        sun: "Domingo",
      },
    },
    productDetail: {
      back: "Volver a los productos",
      share: "Compartir:",
      whatsappNote: "✂ Pedidos confirmados por WhatsApp. Recogida en la barbería o envío a domicilio.",
      otherProducts: "Otros productos",
      shareWhatsapp: "Compartir en WhatsApp",
      shareFacebook: "Compartir en Facebook",
      sharePinterest: "Compartir en Pinterest",
    },
    cart: {
      eyebrow: "Carrito",
      title: "Tu pedido",
      empty: "Tu carrito está vacío.",
      viewProducts: "Ver productos",
      remove: "Quitar",
      decrease: "Disminuir",
      increase: "Aumentar",
      each: "cada uno",
      summary: "Resumen",
      subtotal: "Subtotal",
      total: "Total",
      checkout: "Finalizar por WhatsApp",
      clearCart: "Vaciar carrito",
      confirmNote: "Confirmamos disponibilidad y el mejor método de recogida por WhatsApp.",
      whatsappNotConfigured: "WhatsApp no está configurado para esta unidad.",
    },
    productActions: {
      decrease: "Disminuir",
      increase: "Aumentar",
      addToCart: "Añadir al carrito",
      addedToCart: "Añadido al carrito",
      viewCart: "Ver carrito",
    },
    cookieBanner: {
      message: "Usamos cookies y análisis de tráfico para mejorar la experiencia.",
      policyLink: "Política de privacidad",
      reject: "Rechazar",
      accept: "Aceptar todo",
      dialogLabel: "Consentimiento de cookies",
    },
  },
  de: {
    header: {
      unitLabel: "Filiale",
      bookNow: "Jetzt buchen",
      cart: "Warenkorb",
      language: "Sprache",
      loyalty: "Treuekarte",
    },
    hero: {
      leadingLine: "Barbershop in Leiria",
      tagline1: "Schnitte, die bleiben.",
      tagline2: "Stil, der hält.",
      openBadge: "Heute geöffnet · 9:30 — 19:30 Uhr",
      viewProducts: "Produkte ansehen",
      bookWith: "Mit {name} buchen",
      subtext: "{years}+ Jahre Erfahrung, ein preisgekröntes Team und professionelle Produkte.",
    },
    cta: {
      book: "Termin buchen",
      points: "Meine Punkte",
      getPoints: "Punkte sammeln",
    },
    footer: {
      since: "Barbearia Brothers · Seit 2012",
      unitLabel: "Filiale",
      navigate: "Navigation",
      home: "Startseite",
      social: "Social Media",
      hours: "Mo — Sa · 9:30 — 19:30 Uhr",
      rights: "© {year} Barbearia Brothers. Alle Rechte vorbehalten.",
      privacy: "Datenschutz",
      terms: "AGB",
      madeIn: "Gemacht mit ✂ in Leiria",
    },
    home: {
      tagline: "Seit 2012",
      title: "Wähle deine Filiale.",
      subtitle:
        "Buche online, lerne das Team kennen und entdecke die Produkte in der für dich passendsten Filiale.",
      noUnitsTitle: "Keine aktive Filiale",
      noUnitsDesc:
        "Es sind noch keine öffentlichen Filialen verfügbar. Melde dich im Admin-Bereich an, um eine Filiale zu aktivieren oder zu erstellen.",
    },
    homeLanding: {
      h1: "Barbershop in Leiria seit 2012",
      intro:
        "Of Brothers ist ein Barbershop in Leiria mit zwei Standorten. Haarschnitt, Bart, Fade und präzise Finishes von einem zertifizierten Team. Buchen Sie online in weniger als einer Minute.",
      chooseUnit: "Wählen Sie Ihren Standort",
      chooseUnitSubtitle:
        "Wir haben zwei Standorte in Leiria. Wählen Sie den nächstgelegenen, um zu buchen, das Team kennenzulernen und Produkte zu sehen.",
      servicesEyebrow: "01 — Leistungen",
      servicesTitle: "Was wir machen.",
      servicesSubtitle:
        "Vom klassischen Schnitt bis zum modernen Fade — mit der Zeit, die jedes Detail verdient.",
      services: [
        "Haarschnitt",
        "Bart",
        "Fade",
        "Augenbrauen",
        "Rasiermesser",
        "Pigmentierung",
      ],
      unitsEyebrow: "05 — Wo Sie uns finden",
      unitsTitle: "Unsere Standorte in Leiria.",
      unitsSubtitle: "Adressen, Öffnungszeiten und Kontakte beider Standorte.",
      viewUnit: "Standort ansehen",
      viewTeam: "Team ansehen",
      viewContact: "Kontakt",
      hoursTitle: "Öffnungszeiten",
    },
    marquee: [
      "KLASSISCHER SCHNITT",
      "BART-PFLEGE",
      "AUGENBRAUEN",
      "FADE",
      "RASIERMESSER",
      "PIGMENTIERUNG",
    ],
    stats: {
      years: "Jahre geöffnet",
    },
    whyUs: {
      eyebrow: "02 — Warum wir",
      titleLine1: "Mehr als ein Haarschnitt.",
      titleLine2: "Ein Erlebnis.",
      subtitle:
        "Seit 2012 helfen wir den Männern von Leiria, sich in ihrer Haut wohlzufühlen. Hier gibt es keine Eile — nur Ritual.",
      features: [
        {
          title: "Über 13 Jahre Erfahrung",
          desc: "Wir haben 2012 eröffnet und nie aufgehört. Tausende zufriedene Kunden bestätigen, was wir jeden Tag tun.",
        },
        {
          title: "Spezialisiertes Team",
          desc: "Barbiere zertifiziert in modernen Schnitten, Fades, Bart und Präzisionsfinish. Jedes Detail zählt.",
        },
        {
          title: "Termin in 1 Minute",
          desc: "Buche online über Buk, wann immer du möchtest. Kein Warten am Telefon, keine Überraschungen — nur dein reservierter Termin.",
        },
        {
          title: "Professionelle Produkte",
          desc: "Wir verwenden und verkaufen dieselben Referenzmarken wie die besten Salons Portugals. Nimm das Erlebnis mit nach Hause.",
        },
      ],
    },
    team: {
      eyebrow: "03 — Das Team",
      title: "Die Barbiere dieser Filiale.",
      subtitle: "Wähle einen Profi und buche direkt. Jeder Barbier hat seinen eigenen Stil und Terminplan.",
      viewAll: "Alle Barbiere ansehen →",
      specialistIn: "Spezialist für {speciality} mit langjähriger Erfahrung in der Filiale.",
      defaultSpeciality: "Haarschnitt und Bart",
    },
    shop: {
      eyebrow: "04 — Shop",
      title: "Professionelle Produkte im Verkauf.",
      subtitle: "Dieselben Produkte, die wir im Salon verwenden. Bestelle per WhatsApp und hole sie in der Filiale ab oder lass sie liefern.",
      soldOut: "Ausverkauft",
    },
    barbeirosPage: {
      eyebrow: "Das Team",
      title: "Unsere Barbiere.",
      subtitle: "Zertifizierte Profis mit langjähriger Erfahrung. Wähle einen aus und buche direkt online.",
      comingSoon: "Unser Team wird hier bald verfügbar sein.",
    },
    barberDetail: {
      back: "Zurück zu den Barbieren",
      bookIntro: "Buche direkt bei {name} und wähle den Tag und die Uhrzeit, die dir passen.",
    },
    contato: {
      eyebrow: "Kontakt",
      title: "So findest du uns.",
      subtitleWithAddress: "Wir sind in {address}. Buche online oder sprich direkt mit uns.",
      subtitleNoAddress: "Buche online oder sprich direkt mit uns.",
      address: "Adresse",
      phone: "Telefon",
      whatsapp: "WhatsApp",
      social: "Social Media",
      notSet: "Noch festzulegen.",
      mapsLink: "Auf Google Maps ansehen →",
      whatsappLink: "Auf WhatsApp schreiben →",
      hoursTitle: "Öffnungszeiten",
      closed: "Geschlossen",
      days: {
        mon: "Montag",
        tue: "Dienstag",
        wed: "Mittwoch",
        thu: "Donnerstag",
        fri: "Freitag",
        sat: "Samstag",
        sun: "Sonntag",
      },
    },
    productDetail: {
      back: "Zurück zu den Produkten",
      share: "Teilen:",
      whatsappNote: "✂ Bestellungen werden per WhatsApp bestätigt. Abholung im Salon oder Lieferung nach Hause.",
      otherProducts: "Weitere Produkte",
      shareWhatsapp: "Auf WhatsApp teilen",
      shareFacebook: "Auf Facebook teilen",
      sharePinterest: "Auf Pinterest teilen",
    },
    cart: {
      eyebrow: "Warenkorb",
      title: "Deine Bestellung",
      empty: "Dein Warenkorb ist leer.",
      viewProducts: "Produkte ansehen",
      remove: "Entfernen",
      decrease: "Verringern",
      increase: "Erhöhen",
      each: "je",
      summary: "Zusammenfassung",
      subtotal: "Zwischensumme",
      total: "Gesamt",
      checkout: "Über WhatsApp abschließen",
      clearCart: "Warenkorb leeren",
      confirmNote: "Wir bestätigen Verfügbarkeit und die beste Abholmethode per WhatsApp.",
      whatsappNotConfigured: "WhatsApp ist für diese Filiale nicht konfiguriert.",
    },
    productActions: {
      decrease: "Verringern",
      increase: "Erhöhen",
      addToCart: "In den Warenkorb",
      addedToCart: "Zum Warenkorb hinzugefügt",
      viewCart: "Warenkorb ansehen",
    },
    cookieBanner: {
      message: "Wir verwenden Cookies und Traffic-Analyse, um die Erfahrung zu verbessern.",
      policyLink: "Datenschutzrichtlinie",
      reject: "Ablehnen",
      accept: "Alle akzeptieren",
      dialogLabel: "Cookie-Zustimmung",
    },
  },
};
