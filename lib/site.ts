// Informations générales du site : à modifier ici, elles se répercutent partout.

// Numéro WhatsApp : indicatif 221 puis le numéro, sans espace ni +.
export const WHATSAPP_URL = "https://wa.me/221784558401";

export const FORMULES = [
  {
    id: "express",
    nom: "Test express",
    prix: "15 000",
    resume: "Pour savoir vite ce qui casse avant une mise en ligne.",
    points: ["5 testeurs", "3 jours de test", "Rapport avec captures d'écran"],
    enAvant: false,
  },
  {
    id: "playstore",
    nom: "Pack Play Store",
    prix: "20 000",
    resume: "Les 12 testeurs exigés par Google pour votre test fermé.",
    points: [
      "12 testeurs actifs",
      "14 jours de test fermé",
      "Suivi quotidien de l'activité",
    ],
    enAvant: false,
  },
  {
    id: "lancement",
    nom: "Pack lancement",
    prix: "30 000",
    resume: "Le test fermé Google et la chasse aux bugs, en une seule fois.",
    points: [
      "Tout le Pack Play Store",
      "Rapport complet des bugs trouvés",
      "Captures d'écran et étapes pour reproduire",
    ],
    enAvant: true,
  },
] as const;

export const TYPES_APP = ["Android", "SaaS", "Site web"] as const;

export const DISPONIBILITES = [
  "Quelques minutes par jour",
  "1 heure par jour",
  "Plus",
] as const;

export const VERSIONS_ANDROID = [
  "Android 15 ou plus",
  "Android 14",
  "Android 13",
  "Android 12",
  "Android 11",
  "Android 10",
  "Android 9 ou moins",
  "Je ne sais pas",
] as const;

export const GRAVITES = [
  {
    nom: "Bloquant",
    explication:
      "Impossible de continuer : on ne peut pas s'inscrire, commander ou payer.",
  },
  {
    nom: "Majeur",
    explication:
      "Une fonction importante marche mal, mais on arrive quand même à continuer.",
  },
  {
    nom: "Mineur",
    explication:
      "Un détail gênant : faute d'orthographe, affichage décalé, petite lenteur.",
  },
] as const;

export type Gravite = (typeof GRAVITES)[number]["nom"];
