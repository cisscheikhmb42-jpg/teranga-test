"use client";

import { useEffect, useRef, useState } from "react";
import { PHRASE_ROBOT, Scores } from "@/components/Scores";
import type { Diagnostic } from "@/lib/diagnostic";

type Etat =
  | { statut: "analyse" }
  | { statut: "pret"; diagnostic: Diagnostic }
  | { statut: "echec"; message: string };

/**
 * Affiché après l'envoi d'une demande « Site web » ou « SaaS » : lance tout seul
 * l'analyse automatique du lien et affiche le résultat quand il arrive.
 */
export function PreDiagnostic({ lien, whatsapp }: { lien: string; whatsapp: string }) {
  const [etat, setEtat] = useState<Etat>({ statut: "analyse" });
  const lance = useRef(false);

  useEffect(() => {
    // Une seule analyse, même si React monte le composant deux fois en développement.
    if (lance.current) return;
    lance.current = true;

    fetch("/api/diagnostic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lien, whatsapp }),
    })
      .then((reponse) => reponse.json())
      .then((resultat) =>
        setEtat(
          resultat.ok
            ? { statut: "pret", diagnostic: resultat.diagnostic }
            : { statut: "echec", message: resultat.error ?? "" },
        ),
      )
      .catch(() => setEtat({ statut: "echec", message: "" }));
  }, [lien, whatsapp]);

  return (
    <section
      aria-labelledby="titre-diagnostic"
      className="rounded-xl border border-trait bg-surface p-4 sm:p-5"
    >
      <h2 id="titre-diagnostic" className="text-2xl font-extrabold">
        Pré-diagnostic gratuit de votre site
      </h2>

      {etat.statut === "analyse" && (
        <div role="status" className="mt-3">
          <p>
            <strong>Analyse en cours…</strong> Un robot de Google ouvre votre
            site comme le ferait un téléphone moyen sur une connexion mobile.
            Cela prend 30 à 60 secondes : gardez cette page ouverte.
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-trait">
            <div className="barre-attente h-full w-1/3 rounded-full bg-signal" />
          </div>
        </div>
      )}

      {etat.statut === "echec" && (
        <div role="status" className="mt-3 space-y-2">
          <p>
            <strong>Le pré-diagnostic automatique n&apos;a pas pu se faire.</strong>{" "}
            {etat.message}
          </p>
          <p>
            Ce n&apos;est pas grave : votre demande est bien enregistrée, vous
            n&apos;avez rien à refaire.
          </p>
        </div>
      )}

      {etat.statut === "pret" && (
        <div role="status" className="mt-4 space-y-5">
          <p className="break-all text-sm text-doux">
            Adresse analysée : {etat.diagnostic.lien}
          </p>
          <Scores scores={etat.diagnostic} />

          <div>
            <h3 className="text-xl font-bold">
              {etat.diagnostic.problemes.length > 0
                ? "Les principaux problèmes repérés"
                : "Aucun problème important repéré par le robot"}
            </h3>
            <ol className="mt-3 space-y-3">
              {etat.diagnostic.problemes.map((p, i) => (
                <li
                  key={p.titre}
                  className="flex gap-3 rounded-xl border border-trait bg-carte p-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-signal font-titre font-extrabold text-nuit">
                    {i + 1}
                  </span>
                  <span>
                    <strong className="block">{p.titre}</strong>
                    <span className="text-doux">{p.explication}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <p className="border-l-4 border-signal pl-3 font-bold">{PHRASE_ROBOT}</p>
        </div>
      )}
    </section>
  );
}
