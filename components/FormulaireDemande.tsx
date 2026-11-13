"use client";

import {
  ChampChoix,
  ChampMessage,
  ChampTexte,
  Formulaire,
} from "@/components/Formulaire";
import { PreDiagnostic } from "@/components/PreDiagnostic";
import { FORMULES, TYPES_APP } from "@/lib/site";

const NOMS_FORMULES = FORMULES.map((f) => f.nom);
const PRIX_FORMULES = Object.fromEntries(
  FORMULES.map((f) => [f.nom, `${f.nom} — ${f.prix} FCFA`]),
);

// Seuls les sites et les SaaS ont une adresse web que le robot peut analyser.
const TYPES_ANALYSABLES = ["Site web", "SaaS"];

/** `formule` : identifiant de la formule à présélectionner (ex. « lancement »). */
export function FormulaireDemande({ formule }: { formule?: string }) {
  const defaut = FORMULES.find((f) => f.id === formule)?.nom ?? "";

  return (
    <Formulaire
      type="demande"
      bouton="Envoyer ma demande"
      titreConfirmation="Demande bien reçue."
      texteConfirmation="Nous vous recontactons sur WhatsApp, au numéro que vous avez indiqué, pour organiser le test."
      apresConfirmation={(d) =>
        TYPES_ANALYSABLES.includes(d.typeApp) ? (
          <PreDiagnostic lien={d.lien} whatsapp={d.whatsapp} />
        ) : null
      }
    >
      <ChampTexte nom="nom" label="Nom complet" autoComplete="name" />
      <ChampTexte nom="application" label="Nom de l'application" />
      <ChampTexte
        nom="lien"
        label="Lien"
        aide="L'adresse de votre site web ou de votre SaaS (ou le lien de votre application)."
        inputMode="url"
        placeholder="https://"
      />
      <ChampChoix nom="typeApp" label="Type" options={TYPES_APP} />
      <ChampChoix
        nom="formule"
        label="Formule"
        options={NOMS_FORMULES}
        libelles={PRIX_FORMULES}
        defaut={defaut}
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
