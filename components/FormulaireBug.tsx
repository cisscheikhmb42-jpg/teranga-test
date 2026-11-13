"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { GRAVITES, WHATSAPP_URL } from "@/lib/site";

const CLE_CODE = "teranga-test:code-mission";
const TAILLE_MAX = 3 * 1024 * 1024; // 3 Mo

type Etat =
  | { statut: "repos" }
  | { statut: "envoi"; etape: string }
  | { statut: "ok"; numero: number }
  | { statut: "erreur"; message: string };

/**
 * Réduit une photo dans le navigateur avant l'envoi : une capture de téléphone
 * de 4 Mo ressort à quelques centaines de Ko, ce qui passe sur une connexion lente.
 */
async function compresser(fichier: File): Promise<{ data: string; type: string }> {
  const image = await createImageBitmap(fichier);

  for (const [cote, qualite] of [[1600, 0.75], [1200, 0.6], [900, 0.5]]) {
    const echelle = Math.min(1, cote / Math.max(image.width, image.height));
    const toile = document.createElement("canvas");
    toile.width = Math.round(image.width * echelle);
    toile.height = Math.round(image.height * echelle);
    toile.getContext("2d")!.drawImage(image, 0, 0, toile.width, toile.height);

    const blob = await new Promise<Blob | null>((fini) =>
      toile.toBlob(fini, "image/jpeg", qualite),
    );
    if (blob && blob.size <= TAILLE_MAX) {
      const adresse = await new Promise<string>((fini, echec) => {
        const lecteur = new FileReader();
        lecteur.onload = () => fini(String(lecteur.result));
        lecteur.onerror = () => echec(lecteur.error);
        lecteur.readAsDataURL(blob);
      });
      // Forme attendue par le script : « data:image/jpeg;base64,… ».
      return { data: adresse, type: "image/jpeg" };
    }
  }
  throw new Error("image trop lourde");
}

export function FormulaireBug() {
  const [etat, setEtat] = useState<Etat>({ statut: "repos" });
  const [etapes, setEtapes] = useState([""]);
  const formulaire = useRef<HTMLFormElement>(null);
  const champCode = useRef<HTMLInputElement>(null);
  // Numéro de l'étape qui vient d'être ajoutée : le curseur s'y place dès qu'elle s'affiche.
  const etapeAjoutee = useRef(-1);

  // Au chargement : on remet le code mission donné dans le lien (?code=…)
  // ou, à défaut, celui déjà utilisé sur cet appareil.
  useEffect(() => {
    const champ = champCode.current;
    if (!champ || champ.value) return;
    let code = new URLSearchParams(window.location.search).get("code");
    try {
      code = code || window.localStorage.getItem(CLE_CODE);
    } catch {
      // Stockage indisponible (navigation privée…) : le testeur tape son code.
    }
    if (code) champ.value = code.toUpperCase();
  }, []);

  function changerEtape(i: number, valeur: string) {
    setEtapes((liste) => liste.map((e, j) => (j === i ? valeur : e)));
  }

  function ajouterEtape() {
    etapeAjoutee.current = etapes.length;
    setEtapes((liste) => [...liste, ""]);
  }

  function retirerEtape(i: number) {
    setEtapes((liste) => liste.filter((_, j) => j !== i));
  }

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const champs = new FormData(e.currentTarget);
    const donnees: Record<string, unknown> = { type: "bug", etapes };
    for (const [cle, valeur] of champs) {
      if (typeof valeur === "string") donnees[cle] = valeur;
    }

    const photo = champs.get("capture");
    if (photo instanceof File && photo.size > 0) {
      setEtat({ statut: "envoi", etape: "Préparation de la capture…" });
      try {
        const { data, type } = await compresser(photo);
        donnees.capture = data;
        donnees.captureType = type;
      } catch {
        setEtat({
          statut: "erreur",
          message:
            "La capture d'écran n'a pas pu être lue ou reste trop lourde. Choisissez une autre image (JPEG ou PNG), ou retirez-la et envoyez le bug sans capture.",
        });
        return;
      }
    }

    setEtat({ statut: "envoi", etape: "Envoi en cours…" });
    try {
      const reponse = await fetch("/api/envoi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donnees),
      });
      const resultat = await reponse.json();
      if (resultat.ok) {
        try {
          window.localStorage.setItem(CLE_CODE, String(donnees.code).trim().toUpperCase());
        } catch {
          // Sans stockage, le code ne sera simplement pas mémorisé.
        }
        setEtat({ statut: "ok", numero: resultat.numero });
        window.scrollTo({ top: 0 });
      } else {
        setEtat({
          statut: "erreur",
          message: resultat.error || "L'envoi n'a pas abouti. Réessayez dans un instant.",
        });
      }
    } catch {
      setEtat({
        statut: "erreur",
        message:
          "Impossible de joindre le serveur. Vérifiez votre connexion Internet, puis appuyez de nouveau sur le bouton : vos réponses sont conservées.",
      });
    }
  }

  // Après un envoi réussi : on vide ce qui concerne le bug, on garde le testeur,
  // son code mission, son appareil et son navigateur.
  function autreBug() {
    const f = formulaire.current;
    if (f) {
      for (const nom of ["titre", "attendu", "obtenu", "capture"]) {
        const champ = f.elements.namedItem(nom);
        if (champ instanceof HTMLInputElement || champ instanceof HTMLTextAreaElement) {
          champ.value = "";
        }
      }
      f.querySelectorAll<HTMLInputElement>('input[name="gravite"]').forEach((r) => {
        r.checked = false;
      });
    }
    setEtapes([""]);
    setEtat({ statut: "repos" });
  }

  const envoiEnCours = etat.statut === "envoi";

  return (
    <>
      {etat.statut === "ok" && (
        <div role="status" className="rounded-xl border-2 border-valide bg-carte p-5">
          <h2 className="text-2xl font-extrabold text-valide-texte">
            Bug n° {etat.numero} enregistré
          </h2>
          <p className="mt-2">
            Merci. Nous le vérifions avant de le transmettre au client.
          </p>
          <button type="button" onClick={autreBug} className="bouton bouton-signal mt-4">
            Signaler un autre bug
          </button>
        </div>
      )}

      {/* Le formulaire reste en place (caché) après l'envoi pour garder les réponses du testeur. */}
      <form
        ref={formulaire}
        onSubmit={envoyer}
        hidden={etat.statut === "ok"}
        className="space-y-8"
      >
        <fieldset className="space-y-5">
          <legend className="mb-4 font-titre text-2xl font-extrabold">
            Vous et la mission
          </legend>
          <div className="space-y-1">
            <label htmlFor="code" className="block font-bold">
              Code mission
            </label>
            <p id="code-aide" className="text-sm text-doux">
              Les 8 caractères reçus sur WhatsApp. Il est gardé en mémoire sur
              cet appareil pour vos prochains bugs.
            </p>
            <input
              ref={champCode}
              id="code"
              name="code"
              required
              maxLength={12}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-describedby="code-aide"
              className="champ font-mono uppercase tracking-widest"
            />
          </div>
          <Champ nom="testeur" label="Votre nom" autoComplete="name" />
          <Champ
            nom="whatsappTesteur"
            label="Votre numéro WhatsApp"
            type="tel"
            autoComplete="tel"
            placeholder="77 123 45 67"
          />
          <Champ nom="appareil" label="Appareil" placeholder="Tecno Spark 10" />
          <Champ nom="navigateur" label="Navigateur" placeholder="Chrome" />
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mb-4 font-titre text-2xl font-extrabold">
            Le bug
          </legend>
          <Champ
            nom="titre"
            label="Titre du bug"
            aide="Une phrase qui dit ce qui ne marche pas."
            placeholder="Le bouton « Payer » ne réagit pas"
          />

          <fieldset>
            <legend className="mb-2 font-bold">Gravité</legend>
            <div className="space-y-2">
              {GRAVITES.map((g) => (
                <label
                  key={g.nom}
                  className="flex cursor-pointer gap-3 rounded-lg border-2 border-trait bg-carte p-3 has-checked:border-texte"
                >
                  <input
                    type="radio"
                    name="gravite"
                    value={g.nom}
                    required
                    className="mt-1 h-5 w-5 shrink-0 accent-nuit dark:accent-signal"
                  />
                  <span>
                    <span className="block font-bold">{g.nom}</span>
                    <span className="text-sm text-doux">{g.explication}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-bold">Étapes pour reproduire</legend>
            <p className="mb-2 text-sm text-doux">
              Ce que vous avez fait, dans l&apos;ordre, une action par étape.
            </p>
            <ol className="space-y-2">
              {etapes.map((etape, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nuit font-mono text-sm font-bold text-white dark:bg-signal dark:text-nuit"
                  >
                    {i + 1}
                  </span>
                  <textarea
                    rows={2}
                    ref={(champ) => {
                      if (champ && etapeAjoutee.current === i) {
                        etapeAjoutee.current = -1;
                        champ.focus();
                      }
                    }}
                    value={etape}
                    onChange={(e) => changerEtape(i, e.target.value)}
                    required={i === 0}
                    maxLength={500}
                    aria-label={`Étape ${i + 1}`}
                    className="champ"
                  />
                  {etapes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => retirerEtape(i)}
                      aria-label={`Retirer l'étape ${i + 1}`}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-trait text-2xl leading-none hover:border-doux"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={ajouterEtape}
              className="bouton bouton-contour mt-3"
            >
              + Ajouter une étape
            </button>
          </fieldset>

          <ChampLong
            nom="attendu"
            label="Résultat attendu"
            aide="Ce qui aurait dû se passer."
          />
          <ChampLong
            nom="obtenu"
            label="Résultat obtenu"
            aide="Ce qui s'est réellement passé."
          />

          <div className="space-y-1">
            <label htmlFor="capture" className="block font-bold">
              Capture d&apos;écran{" "}
              <span className="font-normal text-doux">(facultatif)</span>
            </label>
            <p id="capture-aide" className="text-sm text-doux">
              L&apos;image est allégée sur votre téléphone avant l&apos;envoi,
              pour économiser votre forfait.
            </p>
            <input
              id="capture"
              name="capture"
              type="file"
              accept="image/*"
              aria-describedby="capture-aide"
              className="champ file:mr-3 file:rounded file:border-0 file:bg-signal file:px-3 file:py-1 file:font-bold file:text-nuit"
            />
          </div>
        </fieldset>

        {/* Champ anti-spam : invisible pour les humains, il doit rester vide. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Ne remplissez pas ce champ
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {etat.statut === "erreur" && (
          <div role="alert" className="rounded-xl border-2 border-bug bg-carte p-4">
            <p className="font-bold text-bug-texte">
              Votre bug n&apos;a pas été enregistré.
            </p>
            <p className="mt-1">{etat.message}</p>
            <p className="mt-2">
              Si le problème continue,{" "}
              <a href={WHATSAPP_URL} className="underline underline-offset-4">
                écrivez-nous sur WhatsApp
              </a>
              .
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={envoiEnCours}
          className="bouton bouton-signal w-full sm:w-auto"
        >
          {envoiEnCours ? etat.etape : "Envoyer le bug"}
        </button>
      </form>
    </>
  );
}

type ChampProps = {
  nom: string;
  label: string;
  aide?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
};

function Champ({ nom, label, aide, type = "text", autoComplete, placeholder }: ChampProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={nom} className="block font-bold">
        {label}
      </label>
      {aide && (
        <p id={`${nom}-aide`} className="text-sm text-doux">
          {aide}
        </p>
      )}
      <input
        id={nom}
        name={nom}
        type={type}
        required
        maxLength={300}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-describedby={aide ? `${nom}-aide` : undefined}
        className="champ"
      />
    </div>
  );
}

function ChampLong({ nom, label, aide }: ChampProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={nom} className="block font-bold">
        {label}
      </label>
      {aide && (
        <p id={`${nom}-aide`} className="text-sm text-doux">
          {aide}
        </p>
      )}
      <textarea
        id={nom}
        name={nom}
        rows={2}
        required
        maxLength={1000}
        aria-describedby={aide ? `${nom}-aide` : undefined}
        className="champ"
      />
    </div>
  );
}
