import { cacheLife } from "next/cache";
import { lireDuScript } from "@/lib/script";

export type Bug = {
  numero: number;
  titre: string;
  gravite: string;
  etapes: string;
  attendu: string;
  obtenu: string;
  appareil: string;
  navigateur: string;
  capture: boolean;
  suggestion: string;
};

export type ScoresDiagnostic = {
  performance: number | "";
  accessibilite: number | "";
  bonnesPratiques: number | "";
  seo: number | "";
  lcp: number | "" | null;
};

export type Rapport = {
  mission: {
    code: string;
    application: string;
    lien: string;
    type: string;
    formule: string;
    debut: string;
    fin: string;
    statut: string;
    resume: string;
  };
  bugs: Bug[];
  diagnostic: (ScoresDiagnostic & { date: string }) | null;
};

/** Un code mission : 8 lettres majuscules ou chiffres. */
export function codeValide(code: string) {
  return /^[A-Z0-9]{4,12}$/.test(code);
}

/**
 * Lit le rapport d'une mission dans Google Sheets, via le script.
 * Le résultat est gardé en mémoire 30 secondes et jamais plus de 60 :
 * la page affiche donc des données vieilles d'une minute au maximum.
 * Renvoie null si le code n'existe pas.
 */
export async function chargerRapport(code: string): Promise<Rapport | null> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 60 });

  if (!codeValide(code)) return null;

  const reponse = await lireDuScript({ action: "rapport", code });
  if (reponse.ok) {
    return {
      mission: reponse.mission as Rapport["mission"],
      bugs: (reponse.bugs as Bug[]) ?? [],
      diagnostic: (reponse.diagnostic as Rapport["diagnostic"]) ?? null,
    };
  }
  if (reponse.introuvable) return null;
  throw new Error(`Le script n'a pas renvoyé le rapport : ${reponse.error}`);
}
