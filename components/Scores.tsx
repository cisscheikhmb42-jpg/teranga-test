import type { ScoresDiagnostic } from "@/lib/rapport";

type Ton = "bon" | "moyen" | "faible";

const STYLE: Record<Ton, { texte: string; bord: string; mot: string }> = {
  bon: { texte: "text-valide-texte", bord: "border-t-valide", mot: "Bon" },
  moyen: { texte: "text-alerte-texte", bord: "border-t-alerte", mot: "À améliorer" },
  faible: { texte: "text-bug-texte", bord: "border-t-bug", mot: "Faible" },
};

// Mêmes seuils que Google : vert à partir de 90, orange à partir de 50, rouge en dessous.
const tonNote = (n: number): Ton => (n >= 90 ? "bon" : n >= 50 ? "moyen" : "faible");
const tonTemps = (s: number): Ton => (s <= 2.5 ? "bon" : s <= 4 ? "moyen" : "faible");

/** Les 4 notes sur 100 et le temps d'affichage principal du pré-diagnostic. */
export function Scores({ scores }: { scores: ScoresDiagnostic }) {
  const notes = [
    ["Performance mobile", scores.performance],
    ["Accessibilité", scores.accessibilite],
    ["Bonnes pratiques", scores.bonnesPratiques],
    ["SEO", scores.seo],
  ] as const;

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {notes.map(([nom, note]) => {
          const style = typeof note === "number" ? STYLE[tonNote(note)] : null;
          return (
            <div
              key={nom}
              className={`ne-pas-couper flex flex-col-reverse rounded-xl border border-t-4 border-trait bg-carte p-3 ${style?.bord ?? ""}`}
            >
              <dt className="text-sm leading-tight text-doux">{nom}</dt>
              <dd className="mb-1">
                <span
                  className={`font-titre text-4xl font-extrabold tabular-nums ${style?.texte ?? ""}`}
                >
                  {typeof note === "number" ? note : "–"}
                </span>
                <span className="text-sm text-doux"> /100</span>
                {style && (
                  <span className={`block text-sm font-bold ${style.texte}`}>
                    {style.mot}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {typeof scores.lcp === "number" && (
        <p className="rounded-xl border border-trait bg-carte p-3">
          Temps d&apos;affichage principal :{" "}
          <strong
            className={`font-titre text-xl tabular-nums ${STYLE[tonTemps(scores.lcp)].texte}`}
          >
            {scores.lcp.toLocaleString("fr-FR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}{" "}
            s
          </strong>{" "}
          <span className={`font-bold ${STYLE[tonTemps(scores.lcp)].texte}`}>
            ({STYLE[tonTemps(scores.lcp)].mot.toLowerCase()})
          </span>
          <span className="block text-sm text-doux">
            C&apos;est le temps qu&apos;il faut pour que l&apos;essentiel de la
            page soit visible sur un téléphone moyen. Un bon site reste sous 2,5
            secondes.
          </span>
        </p>
      )}
    </div>
  );
}

export const PHRASE_ROBOT =
  "Ce pré-diagnostic est automatique. Nos testeurs humains vérifient ce qu'un robot ne peut pas tester : inscription, commande, paiement.";
