import type { Metadata } from "next";
import { Suspense } from "react";
import { FormulaireDemande } from "@/components/FormulaireDemande";

export const metadata: Metadata = {
  title: "Demander un test",
  description:
    "Décrivez votre application : nous vous recontactons sur WhatsApp pour lancer le test.",
};

// Si on arrive depuis un bouton « Choisir … » de l'accueil, la formule est déjà sélectionnée.
async function AvecFormule({
  searchParams,
}: {
  searchParams: Promise<{ formule?: string | string[] }>;
}) {
  const { formule } = await searchParams;
  return (
    <FormulaireDemande formule={typeof formule === "string" ? formule : undefined} />
  );
}

export default function Demande({ searchParams }: PageProps<"/demande">) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:py-14">
      <h1 className="text-4xl font-extrabold tracking-tight">
        Demander un test
      </h1>
      <p className="mb-8 mt-3 text-doux">
        Décrivez votre application. Nous vous recontactons sur WhatsApp pour
        lancer le test. Pour un site web ou un SaaS, vous recevez tout de suite
        un pré-diagnostic automatique gratuit.
      </p>
      <Suspense fallback={<FormulaireDemande />}>
        <AvecFormule searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
