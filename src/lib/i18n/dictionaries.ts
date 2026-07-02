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
  };
  hero: {
    leadingLine: string;
    openBadge: string;
    viewProducts: string;
    bookWith: string;
  };
  cta: {
    book: string;
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
};

export const dictionaries: Record<Locale, Dictionary> = {
  pt: {
    header: {
      unitLabel: "Unidade",
      bookNow: "Agendar agora",
      cart: "Carrinho",
      language: "Idioma",
    },
    hero: {
      leadingLine: "Barbearia em Leiria",
      openBadge: "Aberto hoje · 09:30 — 19:30",
      viewProducts: "Ver produtos",
      bookWith: "Agendar com {name}",
    },
    cta: {
      book: "Agendar corte",
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
  },
  en: {
    header: {
      unitLabel: "Unit",
      bookNow: "Book now",
      cart: "Cart",
      language: "Language",
    },
    hero: {
      leadingLine: "Barbershop in Leiria",
      openBadge: "Open today · 9:30 AM — 7:30 PM",
      viewProducts: "View products",
      bookWith: "Book with {name}",
    },
    cta: {
      book: "Book a haircut",
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
  },
  fr: {
    header: {
      unitLabel: "Unité",
      bookNow: "Réserver",
      cart: "Panier",
      language: "Langue",
    },
    hero: {
      leadingLine: "Barbier à Leiria",
      openBadge: "Ouvert aujourd'hui · 9h30 — 19h30",
      viewProducts: "Voir les produits",
      bookWith: "Réserver avec {name}",
    },
    cta: {
      book: "Réserver une coupe",
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
  },
  es: {
    header: {
      unitLabel: "Unidad",
      bookNow: "Reservar ahora",
      cart: "Carrito",
      language: "Idioma",
    },
    hero: {
      leadingLine: "Barbería en Leiria",
      openBadge: "Abierto hoy · 9:30 — 19:30",
      viewProducts: "Ver productos",
      bookWith: "Reservar con {name}",
    },
    cta: {
      book: "Reservar corte",
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
  },
  de: {
    header: {
      unitLabel: "Filiale",
      bookNow: "Jetzt buchen",
      cart: "Warenkorb",
      language: "Sprache",
    },
    hero: {
      leadingLine: "Barbershop in Leiria",
      openBadge: "Heute geöffnet · 9:30 — 19:30 Uhr",
      viewProducts: "Produkte ansehen",
      bookWith: "Mit {name} buchen",
    },
    cta: {
      book: "Termin buchen",
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
  },
};
