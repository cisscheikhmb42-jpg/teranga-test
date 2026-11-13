// Pré-diagnostic automatique : interroge Google PageSpeed Insights (mobile)
// et traduit le résultat en français simple.

export type Probleme = { titre: string; explication: string };

export type Diagnostic = {
  lien: string;
  performance: number;
  accessibilite: number;
  bonnesPratiques: number;
  seo: number;
  /** Temps d'affichage principal, en secondes. */
  lcp: number | null;
  problemes: Probleme[];
};

export class DiagnosticImpossible extends Error {}

const API =
  process.env.PAGESPEED_API_URL ??
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

// Chaque thème regroupe plusieurs contrôles techniques de Google qui
// reviennent, pour le propriétaire du site, au même problème.
const THEMES: Record<string, Probleme & { controles: string[] }> = {
  images: {
    titre: "Vos images sont trop lourdes",
    explication:
      "Avec une connexion lente, elles mettent longtemps à apparaître et consomment le forfait de vos visiteurs. Réduisez leur taille et enregistrez-les dans un format léger comme WebP.",
    controles: [
      "uses-optimized-images", "modern-image-formats", "uses-responsive-images",
      "offscreen-images", "image-delivery-insight", "efficient-animated-content",
    ],
  },
  javascript: {
    titre: "La page charge trop de code avant de réagir",
    explication:
      "Sur un téléphone d'entrée de gamme, la page reste figée quelques secondes : on appuie et rien ne se passe. Demandez à votre développeur de retirer le code inutile et de charger le reste plus tard.",
    controles: [
      "unused-javascript", "unminified-javascript", "bootup-time",
      "mainthread-work-breakdown", "legacy-javascript", "legacy-javascript-insight",
      "duplicated-javascript", "duplicated-javascript-insight", "total-blocking-time",
      "third-party-summary", "third-parties-insight", "interactive", "max-potential-fid",
    ],
  },
  blocage: {
    titre: "Des fichiers retardent l'affichage de la page",
    explication:
      "Le téléphone doit télécharger des fichiers de style ou de code avant de montrer quoi que ce soit : le visiteur regarde un écran blanc. Ces fichiers peuvent être allégés ou chargés après le contenu.",
    controles: [
      "render-blocking-resources", "render-blocking-insight", "unused-css-rules",
      "unminified-css", "first-contentful-paint", "speed-index",
    ],
  },
  serveur: {
    titre: "Votre serveur met du temps à répondre",
    explication:
      "Avant même de commencer à charger la page, le visiteur attend la réponse du serveur. Un hébergement plus rapide ou plus proche de vos visiteurs réduit cette attente.",
    controles: [
      "server-response-time", "document-latency-insight", "redirects",
      "uses-text-compression", "uses-rel-preconnect", "network-dependency-tree-insight",
      "modern-http-insight", "uses-http2",
    ],
  },
  cache: {
    titre: "Le téléphone retélécharge tout à chaque visite",
    explication:
      "Le site ne demande pas au téléphone de garder les images et les fichiers en mémoire. La deuxième visite est donc aussi lente que la première, et coûte autant de forfait.",
    controles: ["uses-long-cache-ttl", "cache-insight"],
  },
  principal: {
    titre: "Le contenu principal de la page apparaît tard",
    explication:
      "La grande image ou le grand titre du haut de page est ce que le visiteur attend de voir. Il faut le charger en priorité, avant le reste.",
    controles: [
      "largest-contentful-paint", "largest-contentful-paint-element", "lcp-lazy-loaded",
      "prioritize-lcp-image", "lcp-discovery-insight", "lcp-breakdown-insight",
    ],
  },
  stabilite: {
    titre: "La page bouge pendant le chargement",
    explication:
      "Des éléments se décalent quand les images ou les publicités arrivent : le visiteur appuie à côté du bouton qu'il visait. Réservez la place de chaque image à l'avance.",
    controles: [
      "cumulative-layout-shift", "layout-shifts", "cls-culprits-insight",
      "unsized-images", "non-composited-animations",
    ],
  },
  poids: {
    titre: "La page est trop lourde",
    explication:
      "Elle pèse plusieurs mégaoctets ou contient énormément d'éléments. Sur un forfait limité et un téléphone avec peu de mémoire, c'est lent et coûteux.",
    controles: ["total-byte-weight", "dom-size", "dom-size-insight"],
  },
  polices: {
    titre: "Le texte reste invisible pendant le chargement",
    explication:
      "Le site attend d'avoir téléchargé sa police d'écriture avant d'afficher le texte. Il peut afficher une police standard en attendant.",
    controles: ["font-display", "font-display-insight"],
  },
  contraste: {
    titre: "Certains textes sont difficiles à lire",
    explication:
      "La couleur du texte est trop proche de celle du fond. En plein soleil ou sur un écran peu lumineux, ces textes deviennent illisibles.",
    controles: ["color-contrast"],
  },
  descriptions: {
    titre: "Des images n'ont pas de description",
    explication:
      "Les personnes malvoyantes, et Google, ne savent pas ce que montrent ces images. Ajoutez une courte description à chacune.",
    controles: ["image-alt", "input-image-alt", "object-alt"],
  },
  noms: {
    titre: "Des boutons ou des liens n'ont pas de nom",
    explication:
      "Un bouton qui ne contient qu'une icône, ou un champ sans étiquette, est incompréhensible pour un lecteur d'écran. Donnez un nom clair à chaque bouton, lien et champ de formulaire.",
    controles: [
      "link-name", "button-name", "label", "select-name", "input-button-name",
      "aria-command-name", "aria-input-field-name", "aria-toggle-field-name", "frame-title",
    ],
  },
  doigts: {
    titre: "Des boutons sont trop petits ou trop serrés",
    explication:
      "Sur un petit écran, on appuie facilement sur le mauvais bouton. Agrandissez les zones cliquables et espacez-les.",
    controles: ["target-size", "tap-targets"],
  },
  petitEcran: {
    titre: "La page s'adapte mal aux petits écrans",
    explication:
      "Le texte est trop petit ou la page empêche de zoomer. Le visiteur doit pincer l'écran pour lire, ou n'y arrive pas du tout.",
    controles: ["meta-viewport", "viewport", "viewport-insight", "font-size", "content-width"],
  },
  structure: {
    titre: "La page est mal organisée pour les lecteurs d'écran",
    explication:
      "La langue de la page n'est pas indiquée, ou les titres ne se suivent pas dans l'ordre. Les personnes qui se font lire la page à voix haute s'y perdent.",
    controles: [
      "html-has-lang", "html-lang-valid", "heading-order", "document-title",
      "list", "listitem", "bypass", "landmark-one-main",
    ],
  },
  description: {
    titre: "La page n'a pas de description pour Google",
    explication:
      "C'est le petit texte affiché sous le titre dans les résultats de recherche. Sans lui, Google en invente un, souvent moins convaincant.",
    controles: ["meta-description"],
  },
  referencement: {
    titre: "Google a du mal à référencer la page",
    explication:
      "Quelque chose empêche Google de lire la page ou de suivre ses liens. Elle risque de ne pas apparaître dans les recherches.",
    controles: [
      "is-crawlable", "robots-txt", "http-status-code", "link-text",
      "crawlable-anchors", "canonical", "hreflang",
    ],
  },
  securite: {
    titre: "Le site n'est pas entièrement sécurisé",
    explication:
      "Une partie du site ne passe pas par une connexion protégée (HTTPS). Le navigateur peut afficher un avertissement qui fait fuir les visiteurs, surtout au moment de payer.",
    controles: ["is-on-https", "redirects-http"],
  },
  erreurs: {
    titre: "Le site produit des erreurs techniques",
    explication:
      "Le navigateur signale des erreurs pendant le chargement. Elles sont invisibles pour le visiteur, mais annoncent souvent une fonction qui ne marche pas.",
    controles: ["errors-in-console", "valid-source-maps", "inspector-issues"],
  },
  depasse: {
    titre: "Le site utilise des techniques dépassées",
    explication:
      "Certaines techniques utilisées vont cesser de fonctionner dans les navigateurs récents. Mieux vaut les remplacer avant qu'une partie du site ne casse.",
    controles: ["deprecations", "third-party-cookies", "no-document-write", "notification-on-start", "geolocation-on-start"],
  },
  imagesFloues: {
    titre: "Des images s'affichent floues ou déformées",
    explication:
      "Certaines images sont trop petites pour l'écran, ou étirées. Le site paraît moins sérieux.",
    controles: ["image-aspect-ratio", "image-size-responsive"],
  },
};

const THEME_DU_CONTROLE = new Map<string, string>();
for (const [theme, { controles }] of Object.entries(THEMES)) {
  for (const id of controles) THEME_DU_CONTROLE.set(id, theme);
}

type Controle = {
  title?: string;
  description?: string;
  score: number | null;
  scoreDisplayMode?: string;
  numericValue?: number;
  metricSavings?: Record<string, number>;
  details?: { overallSavingsMs?: number };
};

type Categorie = {
  score: number | null;
  auditRefs?: { id: string; weight?: number; group?: string }[];
};

type ReponsePageSpeed = {
  error?: { code?: number; message?: string };
  lighthouseResult?: {
    runtimeError?: { code?: string; message?: string };
    categories?: Record<string, Categorie>;
    audits?: Record<string, Controle>;
  };
};

/** Ajoute https:// si besoin et refuse ce qui n'est pas une adresse de site public. */
export function normaliserLien(saisie: string): string | null {
  const brut = saisie.trim();
  if (!brut) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(brut) ? brut : `https://${brut}`);
    if (!/^https?:$/.test(url.protocol)) return null;
    if (!url.hostname.includes(".") || /^[\d.]+$/.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

const sur100 = (c?: Categorie) => Math.round((c?.score ?? 0) * 100);

/** Retire la mise en forme des textes de Google (liens, code). */
function nettoyer(texte = "") {
  return texte
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`/g, "")
    .replace(/\s*En savoir plus[^.]*\.?/gi, "")
    .trim();
}

/** Choisit les problèmes les plus importants, un par thème. */
function choisirProblemes(
  categories: Record<string, Categorie>,
  controles: Record<string, Controle>,
): Probleme[] {
  const candidats = new Map<string, Probleme & { importance: number }>();

  for (const categorie of Object.values(categories)) {
    // Plus la note d'une catégorie est basse, plus ses problèmes comptent.
    const retard = Math.max(0.05, 1 - (categorie.score ?? 0));

    for (const ref of categorie.auditRefs ?? []) {
      const controle = controles[ref.id];
      if (!controle || controle.score === null || controle.score >= 0.9) continue;
      if (["notApplicable", "manual", "informative", "error"].includes(controle.scoreDisplayMode ?? "")) continue;

      const gain = controle.metricSavings ?? {};
      const secondesGagnees =
        ((gain.LCP ?? 0) + (gain.FCP ?? 0) + (controle.details?.overallSavingsMs ?? 0)) / 1000 +
        (gain.TBT ?? 0) / 300;
      // Le poids donné par Google ne sert pas pour les mesures de vitesse :
      // il note leur part dans la note, pas l'importance du problème.
      const mesure = ref.group === "metrics";
      const poids =
        1 + Math.min(3, secondesGagnees) + (mesure ? 0 : ((ref.weight ?? 0) / 10) * 3);
      // Les mesures générales (temps de chargement…) décrivent le symptôme :
      // on préfère montrer la cause quand Google la donne.
      const importance =
        retard * (1 - controle.score) * poids * (mesure ? 0.4 : 1);

      const theme = THEME_DU_CONTROLE.get(ref.id);
      const cle = theme ?? ref.id;
      const probleme = theme
        ? { titre: THEMES[theme].titre, explication: THEMES[theme].explication }
        : { titre: nettoyer(controle.title), explication: nettoyer(controle.description) };
      if (!probleme.titre) continue;

      const existant = candidats.get(cle);
      candidats.set(cle, {
        ...probleme,
        importance: (existant?.importance ?? 0) + importance,
      });
    }
  }

  return [...candidats.values()]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 3)
    .map(({ titre, explication }) => ({ titre, explication }));
}

/** Lance l'analyse PageSpeed (30 à 60 secondes) et renvoie le diagnostic. */
export async function analyser(lien: string): Promise<Diagnostic> {
  const url = new URL(API);
  url.searchParams.set("url", lien);
  url.searchParams.set("strategy", "mobile");
  url.searchParams.set("locale", "fr");
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) {
    url.searchParams.append("category", c);
  }
  if (process.env.PAGESPEED_API_KEY) {
    url.searchParams.set("key", process.env.PAGESPEED_API_KEY);
  }

  let reponse: Response;
  let resultat: ReponsePageSpeed;
  try {
    reponse = await fetch(url, { signal: AbortSignal.timeout(100_000) });
    resultat = await reponse.json();
  } catch {
    throw new DiagnosticImpossible(
      "Le service d'analyse de Google n'a pas répondu à temps.",
    );
  }

  if (reponse.status === 429) {
    throw new DiagnosticImpossible(
      "Le service d'analyse de Google est très demandé en ce moment.",
    );
  }
  const lighthouse = resultat.lighthouseResult;
  if (!reponse.ok || !lighthouse?.categories || !lighthouse.audits || lighthouse.runtimeError?.code === "NO_FCP") {
    console.error("PageSpeed :", reponse.status, resultat.error?.message ?? lighthouse?.runtimeError?.message);
    throw new DiagnosticImpossible(
      "Google n'a pas réussi à ouvrir cette adresse. Vérifiez que le lien est correct et que le site est accessible sans mot de passe.",
    );
  }

  const { categories, audits } = lighthouse;
  const lcpMs = audits["largest-contentful-paint"]?.numericValue;

  return {
    lien,
    performance: sur100(categories.performance),
    accessibilite: sur100(categories.accessibility),
    bonnesPratiques: sur100(categories["best-practices"]),
    seo: sur100(categories.seo),
    lcp: typeof lcpMs === "number" ? Math.round(lcpMs / 100) / 10 : null,
    problemes: choisirProblemes(categories, audits),
  };
}
