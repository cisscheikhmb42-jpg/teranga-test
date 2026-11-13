// Communication avec le script Google Apps Script.
// Ce fichier ne s'exécute que sur le serveur : l'adresse du script
// (GOOGLE_SCRIPT_URL) n'arrive jamais dans le navigateur.

export class ScriptNonConfigure extends Error {}

function adresse() {
  const url = process.env.GOOGLE_SCRIPT_URL;
  if (!url) throw new ScriptNonConfigure("GOOGLE_SCRIPT_URL n'est pas définie.");
  return url;
}

export type ReponseScript = {
  ok?: boolean;
  error?: string;
  introuvable?: boolean;
  [cle: string]: unknown;
};

/** Enregistre une ligne (demande, testeur, bug, diagnostic). */
export async function envoyerAuScript(
  donnees: Record<string, unknown>,
): Promise<ReponseScript> {
  const reponse = await fetch(adresse(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(donnees),
    signal: AbortSignal.timeout(45_000),
  });
  return reponse.json();
}

/** Lit des données (rapport d'une mission, capture d'un bug). */
export async function lireDuScript(
  parametres: Record<string, string>,
): Promise<ReponseScript> {
  const url = new URL(adresse());
  for (const [cle, valeur] of Object.entries(parametres)) {
    url.searchParams.set(cle, valeur);
  }
  const reponse = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  return reponse.json();
}
