import type { Metadata } from "next";
import { ChampChoix, ChampTexte, Formulaire } from "@/components/Formulaire";
import { DISPONIBILITES, VERSIONS_ANDROID } from "@/lib/site";

export const metadata: Metadata = {
  title: "Devenir testeur",
  description:
    "Testez des applications sur votre téléphone et soyez rémunéré pour chaque mission.",
};

export default function Testeur() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:py-14">
      <h1 className="text-4xl font-extrabold tracking-tight">
        Devenir testeur
      </h1>
      <p className="mb-8 mt-3 text-doux">
        Vous testez des applications sur votre propre téléphone et vous êtes
        rémunéré pour chaque mission. Inscrivez-vous : nous vous écrivons sur
        WhatsApp quand une mission correspond à votre téléphone.
      </p>
      <Formulaire
        type="testeur"
        bouton="M'inscrire comme testeur"
        titreConfirmation="Inscription bien reçue."
        texteConfirmation="Nous vous écrivons sur WhatsApp dès qu'une mission correspond à votre téléphone."
      >
        <ChampTexte nom="nom" label="Nom complet" autoComplete="name" />
        <ChampTexte nom="ville" label="Ville" placeholder="Dakar" />
        <ChampTexte
          nom="telephone"
          label="Modèle de téléphone"
          placeholder="Tecno Spark 10"
        />
        <ChampChoix
          nom="android"
          label="Version d'Android"
          aide="Elle se trouve dans Paramètres, puis « À propos du téléphone »."
          options={VERSIONS_ANDROID}
        />
        <ChampTexte
          nom="whatsapp"
          label="Numéro WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="77 123 45 67"
        />
        <ChampChoix
          nom="disponibilite"
          label="Disponibilité"
          options={DISPONIBILITES}
        />
      </Formulaire>
    </div>
  );
}
