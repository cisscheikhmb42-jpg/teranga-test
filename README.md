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

## Où modifier quoi

| Je veux changer…                         | Fichier                          |
| ---------------------------------------- | -------------------------------- |
| Le numéro WhatsApp, les prix, les formules | `lib/site.ts`                    |
| Les textes de l'accueil, la FAQ          | `app/page.tsx`                   |
| L'exemple de rapport de bug              | `components/RapportDeBug.tsx`    |
| Le formulaire « Demander un test »       | `app/demande/page.tsx`           |
| Le formulaire « Devenir testeur »        | `app/testeur/page.tsx`           |
| Les couleurs                             | `app/globals.css`                |
