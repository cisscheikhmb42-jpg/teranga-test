import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from "next/font/google";
import Link from "next/link";
import { WHATSAPP_URL } from "@/lib/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Teranga Test — vos bugs trouvés par de vrais testeurs, à Dakar",
    template: "%s — Teranga Test",
  },
  description:
    "De vrais testeurs africains testent votre application Android, votre SaaS ou votre site web et vous remettent un rapport clair. 12 testeurs pendant 14 jours pour le Play Store.",
};

export const viewport: Viewport = {
  themeColor: "#14213D",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${bricolage.variable} ${atkinson.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="ruban print:hidden" aria-hidden="true" />
        <header className="border-b border-trait print:hidden">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link
              href="/"
              className="font-titre text-xl font-extrabold tracking-tight"
            >
              Teranga Test
            </Link>
            <nav aria-label="Navigation principale" className="flex items-center gap-4">
              <Link
                href="/testeur"
                className="hidden underline-offset-4 hover:underline sm:inline"
              >
                Devenir testeur
              </Link>
              <Link href="/demande" className="bouton bouton-signal min-h-11! py-2!">
                Demander un test
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-trait bg-surface print:hidden">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="font-titre font-extrabold">Teranga Test</span>
              <span className="text-doux"> — testing d&apos;applications, Dakar, Sénégal.</span>
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              <li>
                <Link href="/demande" className="underline underline-offset-4">
                  Demander un test
                </Link>
              </li>
              <li>
                <Link href="/testeur" className="underline underline-offset-4">
                  Devenir testeur
                </Link>
              </li>
              <li>
                <Link href="/signaler" className="underline underline-offset-4">
                  Signaler un bug
                </Link>
              </li>
              <li>
                <a href={WHATSAPP_URL} className="underline underline-offset-4">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </footer>
      </body>
    </html>
  );
}
