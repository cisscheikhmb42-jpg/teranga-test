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
    const ligne = {
      type: "diagnostic",
      lien: diagnostic.lien,
      performance: diagnostic.performance,
      accessibilite: diagnostic.accessibilite,
      bonnesPratiques: diagnostic.bonnesPratiques,
      seo: diagnostic.seo,
      lcp: diagnostic.lcp ?? "",
      whatsapp,
    };
    // Journal : ce qui part vers le script (le numéro WhatsApp n'est pas recopié).
    console.log(
      "[diagnostic] envoi au script :",
      JSON.stringify({ ...ligne, whatsapp: whatsapp ? "(renseigné)" : "(vide)" }),
    );

    let enregistre = false;
    try {
      const enregistrement = await envoyerAuScript(ligne);
      enregistre = enregistrement.ok === true;
      if (!enregistre) {
        console.error(
          "[diagnostic] NON enregistré, le script a répondu :",
          enregistrement.error ?? JSON.stringify(enregistrement),
        );
      }
    } catch (erreur) {
      console.error("[diagnostic] NON enregistré, l'appel au script a échoué :", erreur);
    }

    // « enregistre » indique si la ligne a bien été ajoutée dans l'onglet Diagnostics.
    return Response.json({ ok: true, diagnostic, enregistre });
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
