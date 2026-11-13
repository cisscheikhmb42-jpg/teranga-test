# Teranga Test

Site de Teranga Test, service de testing d'applications basé à Dakar.
Construit avec Next.js (App Router), TypeScript et Tailwind CSS.

## Lancer le site sur son ordinateur

```bash
npm install
```

```bash
npm run dev
```

Puis ouvrir http://localhost:3000.

## Formulaires

Les formulaires `/demande` et `/testeur` appellent la route serveur `app/api/envoi/route.ts`,
qui transmet les réponses au script Google Apps Script (enregistrement dans Google Sheets).

L'adresse du script se règle dans la variable d'environnement `GOOGLE_SCRIPT_URL` :

- en local : dans le fichier `.env.local` (jamais envoyé sur GitHub) ;
- en ligne : dans Vercel, Settings → Environment Variables.

Le script lui-même est dans `apps-script/Code.gs` : c'est une copie de référence,
à coller dans la Google Sheet (Extensions → Apps Script). Après chaque changement,
publier une nouvelle version du déploiement existant pour garder la même URL
(Déployer → Gérer les déploiements → crayon → Nouvelle version).

## Pages

| Adresse            | Pour qui  | Rôle                                                        |
| ------------------ | --------- | ----------------------------------------------------------- |
| `/demande`         | Clients   | Demander un test, puis pré-diagnostic automatique du site   |
| `/testeur`         | Testeurs  | S'inscrire comme testeur                                    |
| `/signaler`        | Testeurs  | Signaler un bug pendant une mission (`/signaler?code=CODE`) |
| `/rapport/CODE`    | Clients   | Rapport en direct d'une mission                             |

## Pré-diagnostic automatique

Après une demande « Site web » ou « SaaS », le site interroge Google PageSpeed
Insights. La variable `PAGESPEED_API_KEY` est facultative : sans elle, Google
limite le nombre d'analyses.

## Où modifier quoi

| Je veux changer…                         | Fichier                          |
| ---------------------------------------- | -------------------------------- |
| Le numéro WhatsApp, les prix, les formules | `lib/site.ts`                    |
| Les textes de l'accueil, la FAQ          | `app/page.tsx`                   |
| L'exemple de rapport de bug              | `components/RapportDeBug.tsx`    |
| Le formulaire « Demander un test »       | `app/demande/page.tsx`           |
| Le formulaire « Devenir testeur »        | `app/testeur/page.tsx`           |
| Les couleurs                             | `app/globals.css`                |
| Le formulaire « Signaler un bug »        | `components/FormulaireBug.tsx`   |
| La page de rapport client                | `app/rapport/[code]/page.tsx`    |
| Les explications du pré-diagnostic       | `lib/diagnostic.ts`              |
| Le script Google Sheets                  | `apps-script/Code.gs`            |
