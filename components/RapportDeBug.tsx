import { CarteBug } from "@/components/CarteBug";

// Le visuel principal de l'accueil : un exemple de rapport de bug, tel que le client le reçoit.
export function RapportDeBug() {
  return (
    <figure className="w-full">
      <CarteBug
        numero={7}
        titre="Le paiement Wave échoue après la saisie du code"
        gravite="Bloquant"
        etapes={[
          "Ajouter un article au panier, puis choisir « Payer avec Wave ».",
          "Saisir le code secret Wave et valider.",
          "Revenir dans l'application : l'écran reste bloqué sur « Paiement en cours ».",
        ]}
        attendu="Commande confirmée"
        obtenu="Argent débité, commande non créée"
        appareil="Tecno Spark 10"
      />
      <figcaption className="mt-4 text-sm text-doux">
        Exemple de ce que vous recevez pour chaque bug trouvé.
      </figcaption>
    </figure>
  );
}
