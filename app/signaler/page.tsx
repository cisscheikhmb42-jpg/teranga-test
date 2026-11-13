import type { Metadata } from "next";
import { FormulaireBug } from "@/components/FormulaireBug";

export const metadata: Metadata = {
  title: "Signaler un bug",
  description: "Formulaire réservé aux testeurs Teranga Test en mission.",
  robots: { index: false, follow: false },
};

export default function Signaler() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:py-14">
      <h1 className="text-4xl font-extrabold tracking-tight">Signaler un bug</h1>
      <p className="mb-8 mt-3 text-doux">
        Réservé aux testeurs en mission. Un formulaire par bug : plus votre
        description est précise, plus le bug est facile à corriger.
      </p>
      <FormulaireBug />
    </div>
  );
}
