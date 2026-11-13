import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionsRapport } from "@/components/ActionsRapport";
import { CarteBug } from "@/components/CarteBug";
import { PHRASE_ROBOT, Scores } from "@/components/Scores";
import { chargerRapport, type Rapport } from "@/lib/rapport";
import { GRAVITES, WHATSAPP_URL } from "@/lib/site";

// Un rapport est privé : on demande à Google de ne pas le référencer.
export const metadata: Metadata = {
  title: "Rapport de test",
  robots: { index: false, follow: false },
};

const ORDRE: Record<string, number> = { Bloquant: 0, Majeur: 1, Mineur: 2 };

const STYLE_COMPTEUR: Record<string, string> = {
  Bloquant: "border-t-bug text-bug-texte",
  Majeur: "border-t-alerte text-alerte-texte",
  Mineur: "border-t-mineur text-doux",
};

const STYLE_STATUT: Record<string, string> = {
  "En cours": "bg-signal text-nuit",
  Terminé: "bg-valide text-white",
};

/** Découpe la cellule « Étapes » (une étape par ligne) et retire une numérotation tapée à la main. */
function listeEtapes(etapes: string) {
  return etapes
    .split("\n")
    .map((e) => e.replace(/^\s*\d+\s*[.)\-:]\s*/, "").trim())
    .filter(Boolean);
}

function Message({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{titre}</h1>
      <div className="mt-4 space-y-3 text-doux">{children}</div>
    </div>
  );
}

function ContenuRapport({ rapport }: { rapport: Rapport }) {
  const { mission, diagnostic } = rapport;
  const bugs = [...rapport.bugs].sort(
    (a, b) => (ORDRE[a.gravite] ?? 3) - (ORDRE[b.gravite] ?? 3) || a.numero - b.numero,
  );
  const dates =
    mission.debut && mission.fin
      ? `du ${mission.debut} au ${mission.fin}`
      : mission.debut
        ? `depuis le ${mission.debut}`
        : "à définir";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 px-4 py-10 sm:py-14 print:max-w-none print:space-y-6 print:p-0">
      <section className="space-y-6">
        <div>
          <p className="font-mono text-sm uppercase tracking-wide text-doux">
            Rapport de test · Teranga Test · Mission {mission.code}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {mission.application || "Votre application"}
          </h1>
          {mission.lien && (
            <p className="mt-2 break-all text-doux">{mission.lien}</p>
          )}
        </div>

        <dl className="grid gap-x-6 gap-y-3 rounded-xl border border-trait bg-surface p-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-doux">Formule</dt>
            <dd className="font-bold">{mission.formule || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-doux">Dates</dt>
            <dd className="font-bold">{dates}</dd>
          </div>
          <div>
            <dt className="text-sm text-doux">Statut de la mission</dt>
            <dd>
              <span
                className={`inline-block rounded px-2 py-0.5 font-bold ${STYLE_STATUT[mission.statut] ?? "bg-mineur text-white"}`}
              >
                {mission.statut || "—"}
              </span>
            </dd>
          </div>
        </dl>

        {mission.resume && (
          <div>
            <h2 className="text-2xl font-extrabold">Résumé</h2>
            <p className="mt-2 whitespace-pre-line">{mission.resume}</p>
          </div>
        )}

        <dl className="grid grid-cols-3 gap-3">
          {GRAVITES.map((g) => (
            <div
              key={g.nom}
              className={`flex flex-col-reverse rounded-xl border border-t-4 border-trait bg-carte p-3 ${STYLE_COMPTEUR[g.nom]}`}
            >
              <dt className="text-sm font-bold sm:text-base">{g.nom}</dt>
              <dd className="font-titre text-4xl font-extrabold tabular-nums sm:text-5xl">
                {bugs.filter((b) => b.gravite === g.nom).length}
              </dd>
            </div>
          ))}
        </dl>

        <ActionsRapport />
      </section>

      {diagnostic && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Pré-diagnostic automatique
            </h2>
            {diagnostic.date && (
              <p className="text-sm text-doux">Analyse du {diagnostic.date}.</p>
            )}
          </div>
          <Scores scores={diagnostic} />
          <p className="text-doux">{PHRASE_ROBOT}</p>
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-2xl font-extrabold sm:text-3xl">
          {bugs.length === 0
            ? "Bugs trouvés"
            : bugs.length === 1
              ? "1 bug trouvé"
              : `${bugs.length} bugs trouvés`}
        </h2>
        {bugs.length === 0 ? (
          <p className="rounded-xl border border-trait bg-surface p-4">
            Aucun bug n&apos;est publié pour le moment. Chaque bug signalé par
            nos testeurs est vérifié avant d&apos;apparaître ici.
          </p>
        ) : (
          <ul className="space-y-8 pr-1.5 print:space-y-6">
            {bugs.map((bug) => (
              <li key={bug.numero}>
                <CarteBug
                  numero={bug.numero}
                  titre={bug.titre}
                  gravite={bug.gravite}
                  etapes={listeEtapes(bug.etapes)}
                  attendu={bug.attendu}
                  obtenu={bug.obtenu}
                  appareil={bug.appareil}
                  navigateur={bug.navigateur}
                  suggestion={bug.suggestion}
                  capture={
                    bug.capture
                      ? `/api/capture?code=${mission.code}&n=${bug.numero}`
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

async function ChargementRapport({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  let rapport: Rapport | null;
  try {
    rapport = await chargerRapport(decodeURIComponent(code).trim().toUpperCase());
  } catch (erreur) {
    console.error("Rapport :", erreur);
    return (
      <Message titre="Rapport momentanément indisponible">
        <p>
          Nous n&apos;arrivons pas à lire le rapport pour l&apos;instant.
          Rechargez la page dans une minute.
        </p>
        <p>
          Si le problème continue,{" "}
          <a href={WHATSAPP_URL} className="underline underline-offset-4">
            écrivez-nous sur WhatsApp
          </a>
          .
        </p>
      </Message>
    );
  }

  if (!rapport) {
    return (
      <Message titre="Rapport introuvable, vérifiez votre lien">
        <p>
          Aucun rapport ne correspond à cette adresse. Reprenez le lien exact
          reçu sur WhatsApp : le code à la fin compte 8 caractères.
        </p>
        <p>
          Besoin d&apos;aide ?{" "}
          <a href={WHATSAPP_URL} className="underline underline-offset-4">
            Écrivez-nous sur WhatsApp
          </a>
          .
        </p>
      </Message>
    );
  }

  return <ContenuRapport rapport={rapport} />;
}

export default function PageRapport({ params }: PageProps<"/rapport/[code]">) {
  return (
    <Suspense
      fallback={
        <Message titre="Chargement du rapport…">
          <p>Lecture des derniers résultats.</p>
        </Message>
      }
    >
      <ChargementRapport params={params} />
    </Suspense>
  );
}
