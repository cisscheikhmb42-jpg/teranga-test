"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { WHATSAPP_URL } from "@/lib/site";

type Etat =
  | { statut: "repos" }
  | { statut: "envoi" }
  | { statut: "ok"; donnees: Record<string, string> }
  | { statut: "erreur"; message: string };

type Props = {
  type: "demande" | "testeur";
  bouton: string;
  titreConfirmation: string;
  texteConfirmation: string;
  // Contenu ajouté sous le message de confirmation (reçoit les réponses envoyées).
  apresConfirmation?: (donnees: Record<string, string>) => ReactNode;
  children: ReactNode;
};

// Enveloppe commune aux deux formulaires : elle envoie les champs à notre
// route serveur /api/envoi (jamais directement à Google) et affiche le résultat.
export function Formulaire({
  type,
  bouton,
  titreConfirmation,
  texteConfirmation,
  apresConfirmation,
  children,
}: Props) {
  const [etat, setEtat] = useState<Etat>({ statut: "repos" });

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const donnees = Object.fromEntries(
      [...new FormData(e.currentTarget)].map(([cle, v]) => [cle, String(v)]),
    );
    setEtat({ statut: "envoi" });

    try {
      const reponse = await fetch("/api/envoi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...donnees, type }),
      });
      const resultat = await reponse.json();
      if (resultat.ok) {
        setEtat({ statut: "ok", donnees });
      } else {
        setEtat({
          statut: "erreur",
          message:
            resultat.error ||
            "L'envoi n'a pas abouti. Réessayez dans un instant.",
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

  if (etat.statut === "ok") {
    return (
      <div className="space-y-6">
        <div
          role="status"
          className="rounded-xl border-2 border-valide bg-carte p-5"
        >
          <h2 className="text-2xl font-extrabold text-valide-texte">
            {titreConfirmation}
          </h2>
          <p className="mt-2">{texteConfirmation}</p>
        </div>
        {apresConfirmation?.(etat.donnees)}
        <p>
          <Link href="/" className="underline underline-offset-4">
            Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} className="space-y-5">
      {children}

      {/* Champ anti-spam : invisible pour les humains, il doit rester vide. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Ne remplissez pas ce champ
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {etat.statut === "erreur" && (
        <div
          role="alert"
          className="rounded-xl border-2 border-bug bg-carte p-4"
        >
          <p className="font-bold text-bug-texte">
            Votre formulaire n&apos;a pas été envoyé.
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
        disabled={etat.statut === "envoi"}
        className="bouton bouton-signal w-full sm:w-auto"
      >
        {etat.statut === "envoi" ? "Envoi en cours…" : bouton}
      </button>
    </form>
  );
}

type ChampProps = {
  nom: string;
  label: string;
  aide?: string;
  facultatif?: boolean;
};

function Etiquette({ nom, label, aide, facultatif }: ChampProps) {
  return (
    <>
      <label htmlFor={nom} className="block font-bold">
        {label}
        {facultatif && (
          <span className="font-normal text-doux"> (facultatif)</span>
        )}
      </label>
      {aide && (
        <p id={`${nom}-aide`} className="text-sm text-doux">
          {aide}
        </p>
      )}
    </>
  );
}

export function ChampTexte({
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  ...p
}: ChampProps & {
  type?: string;
  inputMode?: "text" | "tel" | "url" | "email";
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Etiquette {...p} />
      <input
        id={p.nom}
        name={p.nom}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={!p.facultatif}
        maxLength={300}
        aria-describedby={p.aide ? `${p.nom}-aide` : undefined}
        className="champ"
      />
    </div>
  );
}

export function ChampChoix({
  options,
  libelles = {},
  defaut = "",
  ...p
}: ChampProps & {
  options: readonly string[];
  // Texte affiché à la place de la valeur (la valeur reste celle envoyée).
  libelles?: Record<string, string>;
  defaut?: string;
}) {
  return (
    <div className="space-y-1">
      <Etiquette {...p} />
      <select
        id={p.nom}
        name={p.nom}
        required={!p.facultatif}
        defaultValue={defaut}
        aria-describedby={p.aide ? `${p.nom}-aide` : undefined}
        className="champ"
      >
        <option value="" disabled>
          Choisir…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {libelles[o] ?? o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ChampMessage(p: ChampProps) {
  return (
    <div className="space-y-1">
      <Etiquette {...p} />
      <textarea
        id={p.nom}
        name={p.nom}
        rows={4}
        required={!p.facultatif}
        maxLength={2000}
        aria-describedby={p.aide ? `${p.nom}-aide` : undefined}
        className="champ"
      />
    </div>
  );
}
