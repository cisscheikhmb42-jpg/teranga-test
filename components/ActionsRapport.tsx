"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Bouton « Télécharger en PDF » (ouvre l'impression du navigateur, où l'on
 * choisit « Enregistrer au format PDF ») et mise à jour automatique du rapport
 * toutes les 60 secondes.
 */
export function ActionsRapport() {
  const router = useRouter();

  useEffect(() => {
    const minuterie = setInterval(() => {
      // Inutile de recharger un onglet que personne ne regarde.
      if (document.visibilityState === "visible") router.refresh();
    }, 60_000);
    return () => clearInterval(minuterie);
  }, [router]);

  return (
    <div className="print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="bouton bouton-signal"
      >
        Télécharger en PDF
      </button>
      <p className="mt-2 text-sm text-doux">
        Dans la fenêtre qui s&apos;ouvre, choisissez « Enregistrer au format
        PDF ». Cette page se met à jour toute seule chaque minute.
      </p>
    </div>
  );
}
