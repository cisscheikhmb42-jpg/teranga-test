// Route serveur : reçoit les formulaires du site et les transmet au script
// Google Apps Script. L'URL du script reste ici, côté serveur : le navigateur
// ne la voit jamais.
import { envoyerAuScript, ScriptNonConfigure } from "@/lib/script";
import { GRAVITES } from "@/lib/site";

const CHAMPS = {
  demande: {
    requis: ["nom", "application", "lien", "typeApp", "formule", "whatsapp"],
    facultatifs: ["email", "message"],
  },
  testeur: {
    requis: ["nom", "ville", "telephone", "android", "whatsapp", "disponibilite"],
    facultatifs: [],
  },
  bug: {
    requis: ["code", "nom", "whatsapp", "titre", "gravite", "attendu", "obtenu", "appareil", "navigateur"],
    facultatifs: [],
  },
} as const;

type TypeFormulaire = keyof typeof CHAMPS;

const LIBELLES: Record<string, string> = {
  nom: "le nom complet",
  application: "le nom de l'application",
  lien: "le lien",
  typeApp: "le type",
  formule: "la formule",
  whatsapp: "le numéro WhatsApp",
  ville: "la ville",
  telephone: "le modèle de téléphone",
  android: "la version d'Android",
  disponibilite: "la disponibilité",
  code: "le code mission",
  titre: "le titre du bug",
  gravite: "la gravité",
  attendu: "le résultat attendu",
  obtenu: "le résultat obtenu",
  appareil: "l'appareil",
  navigateur: "le navigateur",
};

// 3 Mo d'image donnent environ 4 millions de caractères une fois encodés en base64.
const CAPTURE_MAX = 4_100_000;

function refus(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  let corps: Record<string, unknown>;
  try {
    corps = await request.json();
  } catch {
    return refus("Le formulaire est illisible. Rechargez la page et réessayez.", 400);
  }

  const type = corps.type as TypeFormulaire;
  if (typeof type !== "string" || !Object.hasOwn(CHAMPS, type)) {
    return refus("Formulaire inconnu. Rechargez la page et réessayez.", 400);
  }

  // Anti-spam : un humain ne voit pas ce champ. S'il est rempli, c'est un robot :
  // on répond « ok » sans rien enregistrer pour ne pas l'aider à s'adapter.
  if (typeof corps.website === "string" && corps.website.trim() !== "") {
    return Response.json({ ok: true });
  }

  const texte = (valeur: unknown) =>
    typeof valeur === "string" ? valeur.trim().slice(0, 2000) : "";

  const { requis, facultatifs } = CHAMPS[type];
  const donnees: Record<string, unknown> = { type };
  for (const cle of [...requis, ...facultatifs]) donnees[cle] = texte(corps[cle]);

  const manquant = requis.find((cle) => donnees[cle] === "");
  if (manquant) {
    return refus(`Il manque ${LIBELLES[manquant]}. Complétez ce champ puis renvoyez le formulaire.`, 400);
  }
  if (String(donnees.whatsapp).replace(/\D/g, "").length < 9) {
    return refus(
      "Le numéro WhatsApp semble incomplet. Vérifiez qu'il contient au moins 9 chiffres, puis renvoyez le formulaire.",
      400,
    );
  }

  if (type === "bug") {
    donnees.code = String(donnees.code).replace(/\s+/g, "").toUpperCase();
    if (!GRAVITES.some((g) => g.nom === donnees.gravite)) {
      return refus("Choisissez la gravité du bug : Bloquant, Majeur ou Mineur.", 400);
    }
    const etapes = Array.isArray(corps.etapes)
      ? corps.etapes
          // Une étape tient sur une ligne : dans la Sheet, chaque ligne est une étape.
          .map((e) => texte(e).replace(/\s*\n\s*/g, " "))
          .filter((e) => e !== "")
          .slice(0, 30)
      : [];
    if (etapes.length === 0) {
      return refus("Décrivez au moins une étape pour reproduire le bug.", 400);
    }
    donnees.etapes = etapes;

    if (typeof corps.capture === "string" && corps.capture !== "") {
      if (corps.capture.length > CAPTURE_MAX) {
        return refus("La capture d'écran est trop lourde (3 Mo maximum). Choisissez une image plus légère.", 400);
      }
      donnees.capture = corps.capture;
      donnees.captureType = texte(corps.captureType);
    }
  }

  try {
    const resultat = await envoyerAuScript(donnees);
    if (resultat?.ok === true) {
      return Response.json(
        type === "bug" ? { ok: true, numero: resultat.numero } : { ok: true },
      );
    }

    console.error("Le script Google a refusé l'envoi :", resultat?.error);
    // Pour un bug, le script explique lui-même le refus (code mission inconnu,
    // mission pas en cours…) : on transmet son explication au testeur.
    if (type === "bug" && typeof resultat?.error === "string" && resultat.error) {
      return refus(resultat.error, 400);
    }
    return refus(
      "L'enregistrement a échoué de notre côté. Réessayez dans une minute : vos réponses sont conservées.",
      502,
    );
  } catch (erreur) {
    if (erreur instanceof ScriptNonConfigure) {
      console.error(erreur.message);
      return refus(
        "Le site n'est pas encore relié à notre tableau d'enregistrement. Écrivez-nous directement sur WhatsApp.",
        500,
      );
    }
    console.error("Échec de l'appel au script Google :", erreur);
    return refus(
      "Notre service d'enregistrement ne répond pas. Réessayez dans une minute : vos réponses sont conservées.",
      502,
    );
  }
}
