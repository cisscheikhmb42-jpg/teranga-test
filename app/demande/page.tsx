import type { Metadata } from "next";
import { Suspense } from "react";
import {
  ChampChoix,
  ChampMessage,
  ChampTexte,
  Formulaire,
} from "@/components/Formulaire";
import { FORMULES, TYPES_APP } from "@/lib/site";

export const metadata: Metadata = {
  title: "Demander un test",
  description:
    "Décrivez votre application : nous vous recontactons sur WhatsApp pour lancer le test.",
};

const NOMS_FORMULES = FORMULES.map((f) => f.nom);
const PRIX_FORMULES = Object.fromEntries(
  FORMULES.map((f) => [f.nom, `${f.nom} — ${f.prix} FCFA`]),
);

function Champs({ formule = "" }: { formule?: string }) {
  return (
    <Formulaire
      type="demande"
      bouton="Envoyer ma demande"
      titreConfirmation="Demande bien reçue."
      texteConfirmation="Nous vous recontactons sur WhatsApp, au numéro que vous avez indiqué, pour organiser le test."
    >
      <ChampTexte nom="nom" label="Nom complet" autoComplete="name" />
      <ChampTexte nom="application" label="Nom de l'application" />
      <ChampTexte
        nom="lien"
        label="Lien"
        aide="Lien du Play Store, du test fermé ou du site web."
        inputMode="url"
        placeholder="https://"
      />
      <ChampChoix nom="typeApp" label="Type" options={TYPES_APP} />
      <ChampChoix
        nom="formule"
        label="Formule"
        options={NOMS_FORMULES}
        libelles={PRIX_FORMULES}
        defaut={formule}
      />
      <ChampTexte
        nom="whatsapp"
        label="Numéro WhatsApp"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="77 123 45 67"
      />
      <ChampTexte
        nom="email"
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        facultatif
      />
      <ChampMessage
        nom="message"
        label="Message"
        aide="Ce que vous voulez vérifier en priorité, une date limite…"
        facultatif
      />
    </Formulaire>
  );
}

// Si on arrive depuis un bouton « Choisir … » de l'accueil, la formule est déjà sélectionnée.
async function ChampsAvecFormule({
  searchParams,
}: {
  searchParams: Promise<{ formule?: string | string[] }>;
}) {
  const { formule } = await searchParams;
  const index = FORMULES.findIndex((f) => f.id === formule);
  return <Champs formule={index >= 0 ? NOMS_FORMULES[index] : ""} />;
}

export default function Demande({ searchParams }: PageProps<"/demande">) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:py-14">
      <h1 className="text-4xl font-extrabold tracking-tight">
        Demander un test
      </h1>
      <p className="mb-8 mt-3 text-doux">
        Décrivez votre application. Nous vous recontactons sur WhatsApp pour
        lancer le test.
      </p>
      <Suspense fallback={<Champs />}>
        <ChampsAvecFormule searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
