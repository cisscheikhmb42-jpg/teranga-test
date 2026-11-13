// Une carte « rapport de bug » : utilisée en exemple sur l'accueil et pour
// chaque bug de la page de rapport client. Elle reste claire même en mode sombre,
// comme une feuille de papier.

const STYLE_GRAVITE: Record<string, string> = {
  Bloquant: "bg-bug text-white",
  Majeur: "bg-alerte text-white",
  Mineur: "bg-mineur text-white",
};

type Props = {
  numero: number;
  titre: string;
  gravite: string;
  etapes: string[];
  attendu: string;
  obtenu: string;
  appareil: string;
  navigateur?: string;
  /** Adresse de la capture d'écran, si elle existe. */
  capture?: string;
  suggestion?: string;
};

const etiquette =
  "font-mono text-xs uppercase tracking-wide text-nuit/70";

export function CarteBug({
  numero,
  titre,
  gravite,
  etapes,
  attendu,
  obtenu,
  appareil,
  navigateur,
  capture,
  suggestion,
}: Props) {
  return (
    <article className="ne-pas-couper overflow-hidden rounded-xl border-2 border-nuit bg-white text-nuit shadow-[6px_6px_0_0_#FFC93C]">
      <div className="flex items-center justify-between gap-3 border-b-2 border-nuit bg-brume px-4 py-2 font-mono text-xs uppercase tracking-wide">
        <span>Rapport de bug nº {String(numero).padStart(2, "0")}</span>
        <span
          className={`rounded px-2 py-1 font-bold ${STYLE_GRAVITE[gravite] ?? STYLE_GRAVITE.Mineur}`}
        >
          Gravité : {gravite || "non précisée"}
        </span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <h3 className="font-titre text-xl font-extrabold leading-tight sm:text-2xl">
          {titre}
        </h3>

        {etapes.length > 0 && (
          <div>
            <p className={`mb-2 ${etiquette}`}>Étapes pour reproduire</p>
            <ol className="space-y-2">
              {etapes.map((etape, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nuit font-mono text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{etape}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <dl className="grid gap-3 border-t border-nuit/15 pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className={etiquette}>Résultat attendu</dt>
            <dd className="font-bold text-valide">{attendu}</dd>
          </div>
          <div>
            <dt className={etiquette}>Résultat obtenu</dt>
            <dd className="font-bold text-bug">{obtenu}</dd>
          </div>
        </dl>

        {capture && (
          <div className="border-t border-nuit/15 pt-4">
            <p className={`mb-2 ${etiquette}`}>Capture d&apos;écran</p>
            {/* Image servie par notre route /api/capture : pas d'optimisation Next nécessaire. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capture}
              alt={`Capture d'écran du bug nº ${numero} : ${titre}`}
              className="max-h-[32rem] w-auto max-w-full rounded border border-nuit/20"
            />
          </div>
        )}

        {suggestion && (
          <div className="rounded-lg border-l-4 border-signal bg-brume p-3">
            <p className={`mb-1 ${etiquette}`}>Suggestion de correction</p>
            <p className="whitespace-pre-line leading-snug">{suggestion}</p>
          </div>
        )}
      </div>

      <div className="border-t-2 border-nuit bg-nuit px-4 py-2 font-mono text-xs text-white">
        Testé sur {[appareil, navigateur].filter(Boolean).join(", ")}
      </div>
    </article>
  );
}
