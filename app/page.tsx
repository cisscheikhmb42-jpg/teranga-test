import Link from "next/link";
import { RapportDeBug } from "@/components/RapportDeBug";
import { FORMULES, WHATSAPP_URL } from "@/lib/site";

const ETAPES = [
  {
    titre: "Vous nous écrivez",
    texte:
      "Par le formulaire ou sur WhatsApp. Vous nous donnez le lien de l'application et ce que vous voulez vérifier.",
  },
  {
    titre: "On constitue l'équipe",
    texte:
      "Nous choisissons les testeurs selon votre public : modèles de téléphone, versions d'Android, villes.",
  },
  {
    titre: "Ils testent pour de vrai",
    texte:
      "Sur leurs propres téléphones, avec leur propre connexion, comme le feront vos clients.",
  },
  {
    titre: "Vous recevez le rapport",
    texte:
      "Chaque bug est décrit avec sa gravité, les étapes pour le reproduire, des captures et le téléphone utilisé.",
  },
];

const FAQ = [
  {
    question: "Qui sont les testeurs ?",
    reponse:
      "De vrais utilisateurs, rémunérés pour chaque mission. Pas des robots ni des comptes fictifs : des personnes qui utilisent votre application sur leur téléphone de tous les jours.",
  },
  {
    question: "Mon application est-elle en sécurité ?",
    reponse:
      "Seuls les testeurs choisis pour votre mission reçoivent l'accès, et uniquement pendant la durée du test. Votre application et vos rapports ne sont partagés avec personne d'autre. Si vous avez un accord de confidentialité, envoyez-le-nous.",
  },
  {
    question: "Quels types d'applications testez-vous ?",
    reponse:
      "Les applications Android (y compris en test fermé sur le Play Store), les logiciels en ligne (SaaS) et les sites web.",
  },
  {
    question: "Comment se passe le paiement ?",
    reponse:
      "Par Wave ou Orange Money : 50 % au démarrage du test, 50 % à la remise du rapport.",
  },
];

export default function Accueil() {
  return (
    <>
      {/* En-tête : promesse + exemple de rapport */}
      <section className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-10 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="mb-4 font-mono text-sm uppercase tracking-wide text-doux">
            Testing d&apos;applications · Dakar
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Vos bugs trouvés par nous, pas par vos premiers clients.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-doux">
            De vrais testeurs africains utilisent votre application Android,
            votre SaaS ou votre site web, trouvent les bugs et vous remettent
            un rapport clair.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/demande" className="bouton bouton-signal">
              Demander un test
            </Link>
            <Link href="/testeur" className="bouton bouton-contour">
              Devenir testeur
            </Link>
            <a href={WHATSAPP_URL} className="bouton bouton-contour">
              Écrire sur WhatsApp
            </a>
          </div>
        </div>
        <RapportDeBug />
      </section>

      {/* Le problème */}
      <section className="bg-surface">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Vous connaissez trop bien votre produit pour le tester.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-trait bg-carte p-5">
              <h3 className="text-xl font-bold">Vous savez où appuyer</h3>
              <p className="mt-2 text-doux">
                Vous avez conçu chaque écran, alors vous suivez toujours le bon
                chemin sans y penser. Un nouvel utilisateur appuie ailleurs, et
                c&apos;est là que ça casse.
              </p>
            </div>
            <div className="rounded-xl border border-trait bg-carte p-5">
              <h3 className="text-xl font-bold">
                Vos utilisateurs n&apos;ont pas votre téléphone
              </h3>
              <p className="mt-2 text-doux">
                Ils ont des téléphones d&apos;entrée de gamme et des connexions
                qui coupent, parfois en plein paiement. Nos testeurs aussi :
                c&apos;est pour ça qu&apos;ils trouvent ce que vous ne voyez pas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Tarifs
        </h2>
        <p className="mt-3 max-w-2xl text-doux">
          Prix de lancement. Paiement par Wave ou Orange Money. Pour publier sur
          le Play Store, Google exige 12 testeurs pendant 14 jours de test
          fermé : nous les fournissons.
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-3 md:items-stretch">
          {FORMULES.map((f) => (
            <li
              key={f.id}
              className={
                f.enAvant
                  ? "flex flex-col rounded-xl border-2 border-signal bg-nuit p-5 text-white md:order-none"
                  : "flex flex-col rounded-xl border border-trait bg-carte p-5"
              }
            >
              {f.enAvant && (
                <p className="mb-3 self-start rounded bg-signal px-2 py-1 font-mono text-xs font-bold uppercase tracking-wide text-nuit">
                  Le plus complet
                </p>
              )}
              <h3 className="text-2xl font-extrabold">{f.nom}</h3>
              <p className={f.enAvant ? "mt-1 text-brume" : "mt-1 text-doux"}>
                {f.resume}
              </p>
              <p className="mt-5 font-titre text-4xl font-extrabold tabular-nums">
                {f.prix}{" "}
                <span className="text-lg font-bold">FCFA</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2">
                {f.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className={
                        f.enAvant
                          ? "font-bold text-signal"
                          : "font-bold text-valide-texte"
                      }
                    >
                      ✓
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/demande?formule=${f.id}`}
                className={
                  f.enAvant
                    ? "bouton bouton-signal mt-6"
                    : "bouton bouton-contour mt-6"
                }
              >
                Choisir {f.nom}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Comment ça se passe */}
      <section className="bg-surface">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Comment ça se passe
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ETAPES.map((e, i) => (
              <li
                key={e.titre}
                className="rounded-xl border border-trait bg-carte p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-signal font-titre text-lg font-extrabold text-nuit">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-xl font-bold">{e.titre}</h3>
                <p className="mt-2 text-doux">{e.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Questions fréquentes
        </h2>
        <div className="mt-6 border-t border-trait">
          {FAQ.map((q) => (
            <details key={q.question} className="group border-b border-trait">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-titre text-lg font-bold [&::-webkit-details-marker]:hidden">
                {q.question}
                <span
                  aria-hidden="true"
                  className="text-2xl leading-none group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-5 text-doux">{q.reponse}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Appel final */}
      <section className="bg-nuit text-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Faites tester votre application avant vos clients.
          </h2>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/demande" className="bouton bouton-signal">
              Demander un test
            </Link>
            <Link href="/testeur" className="bouton bouton-contour">
              Devenir testeur
            </Link>
            <a href={WHATSAPP_URL} className="bouton bouton-contour">
              Écrire sur WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
