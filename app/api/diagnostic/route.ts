// Route serveur du pré-diagnostic : lance l'analyse PageSpeed, enregistre le
// résultat dans l'onglet Diagnostics, et le renvoie à la page de confirmation.
import { analyser, DiagnosticImpossible, normaliserLien } from "@/lib/diagnostic";
import { envoyerAuScript } from "@/lib/script";

// L'analyse dure 30 à 60 secondes : on laisse au serveur le temps de la finir.
export const maxDuration = 120;

export async function POST(request: Request) {
  let corps: { lien?: unknown; whatsapp?: unknown };
  try {
    corps = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Demande illisible." }, { status: 400 });
  }

  const lien = typeof corps.lien === "string" ? normaliserLien(corps.lien) : null;
  if (!lien) {
    return Response.json(
      { ok: false, error: "Le lien indiqué n'est pas une adresse de site web : l'analyse automatique n'a pas pu démarrer." },
      { status: 400 },
    );
  }
  const whatsapp =
    typeof corps.whatsapp === "string" ? corps.whatsapp.trim().slice(0, 40) : "";

  try {
    const diagnostic = await analyser(lien);

    // L'enregistrement ne doit pas empêcher d'afficher le résultat.
    try {
      const enregistrement = await envoyerAuScript({
        type: "diagnostic",
        lien: diagnostic.lien,
        performance: diagnostic.performance,
        accessibilite: diagnostic.accessibilite,
        bonnesPratiques: diagnostic.bonnesPratiques,
        seo: diagnostic.seo,
        lcp: diagnostic.lcp ?? "",
        whatsapp,
      });
      if (!enregistrement.ok) {
        console.error("Diagnostic non enregistré :", enregistrement.error);
      }
    } catch (erreur) {
      console.error("Diagnostic non enregistré :", erreur);
    }

    return Response.json({ ok: true, diagnostic });
  } catch (erreur) {
    if (erreur instanceof DiagnosticImpossible) {
      return Response.json({ ok: false, error: erreur.message }, { status: 502 });
    }
    console.error("Diagnostic :", erreur);
    return Response.json(
      { ok: false, error: "L'analyse automatique a rencontré un problème." },
      { status: 500 },
    );
  }
}
