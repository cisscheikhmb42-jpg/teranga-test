// Le visuel principal de l'accueil : un exemple de rapport de bug, tel que le client le reçoit.
export function RapportDeBug() {
  return (
    <figure className="w-full">
      <div className="overflow-hidden rounded-xl border-2 border-nuit bg-white text-nuit shadow-[6px_6px_0_0_#FFC93C]">
        <div className="flex items-center justify-between gap-3 border-b-2 border-nuit bg-brume px-4 py-2 font-mono text-xs uppercase tracking-wide">
          <span>Rapport de bug nº 07</span>
          <span className="rounded bg-bug px-2 py-1 font-bold text-white">
            Gravité : bloquant
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <p className="font-titre text-xl font-extrabold leading-tight sm:text-2xl">
            Le paiement Wave échoue après la saisie du code
          </p>

          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-wide text-nuit/70">
              Étapes pour reproduire
            </p>
            <ol className="space-y-2">
              {[
                "Ajouter un article au panier, puis choisir « Payer avec Wave ».",
                "Saisir le code secret Wave et valider.",
                "Revenir dans l'application : l'écran reste bloqué sur « Paiement en cours ».",
              ].map((etape, i) => (
                <li key={etape} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nuit font-mono text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{etape}</span>
                </li>
              ))}
            </ol>
          </div>

          <dl className="grid gap-3 border-t border-nuit/15 pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-mono text-xs uppercase tracking-wide text-nuit/70">
                Résultat attendu
              </dt>
              <dd className="font-bold text-valide">Commande confirmée</dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase tracking-wide text-nuit/70">
                Résultat obtenu
              </dt>
              <dd className="font-bold text-bug">
                Argent débité, commande non créée
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-t-2 border-nuit bg-nuit px-4 py-2 font-mono text-xs text-white">
          Testé sur Tecno Spark 10
        </div>
      </div>
      <figcaption className="mt-4 text-sm text-doux">
        Exemple de ce que vous recevez pour chaque bug trouvé.
      </figcaption>
    </figure>
  );
}
