// Route serveur : reçoit les formulaires du site et les transmet au script
// Google Apps Script. L'URL du script reste ici, côté serveur : le navigateur
// ne la voit jamais.

const CHAMPS = {
  demande: {
    requis: ["nom", "application", "lien", "typeApp", "formule", "whatsapp"],
    facultatifs: ["email", "message"],
  },
  testeur: {
    requis: ["nom", "ville", "telephone", "android", "whatsapp", "disponibilite"],
    facultatifs: [],
  },
} as const;

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
};

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

  const type = corps.type;
  if (type !== "demande" && type !== "testeur") {
    return refus("Formulaire inconnu. Rechargez la page et réessayez.", 400);
  }

  // Anti-spam : un humain ne voit pas ce champ. S'il est rempli, c'est un robot :
  // on répond « ok » sans rien enregistrer pour ne pas l'aider à s'adapter.
  if (typeof corps.website === "string" && corps.website.trim() !== "") {
    return Response.json({ ok: true });
  }

  const texte = (cle: string) =>
    typeof corps[cle] === "string" ? (corps[cle] as string).trim().slice(0, 2000) : "";

  const { requis, facultatifs } = CHAMPS[type];
  const donnees: Record<string, string> = { type };
  for (const cle of [...requis, ...facultatifs]) donnees[cle] = texte(cle);

  const manquant = requis.find((cle) => donnees[cle] === "");
  if (manquant) {
    return refus(`Il manque ${LIBELLES[manquant]}. Complétez ce champ puis renvoyez le formulaire.`, 400);
  }
  if (donnees.whatsapp.replace(/\D/g, "").length < 9) {
    return refus(
      "Le numéro WhatsApp semble incomplet. Vérifiez qu'il contient au moins 9 chiffres, puis renvoyez le formulaire.",
      400,
    );
  }

  const url = process.env.GOOGLE_SCRIPT_URL;
  if (!url) {
    console.error("GOOGLE_SCRIPT_URL n'est pas définie.");
    return refus(
      "Le site n'est pas encore relié à notre tableau d'enregistrement. Écrivez-nous directement sur WhatsApp.",
      500,
    );
  }

  try {
    const reponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(donnees),
      signal: AbortSignal.timeout(20_000),
    });
    const resultat = await reponse.json();
    if (resultat?.ok === true) return Response.json({ ok: true });

    console.error("Le script Google a refusé l'envoi :", resultat?.error);
    return refus(
      "L'enregistrement a échoué de notre côté. Réessayez dans une minute : vos réponses sont conservées.",
      502,
    );
  } catch (erreur) {
    console.error("Échec de l'appel au script Google :", erreur);
    return refus(
      "Notre service d'enregistrement ne répond pas. Réessayez dans une minute : vos réponses sont conservées.",
      502,
    );
  }
}
