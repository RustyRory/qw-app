# QW-App — Frontend

Interface **Next.js** de l'application de conformité LCB-FT QW-App. Voir la [documentation du projet](../docs/projet/) pour l'architecture et le détail des écrans.

---

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI, Zod, Recharts.

## Structure actuelle

```
src/
├── app/
│   ├── api/[...path]/   # Proxy interne vers le backend (route handler, pas un rewrite next.config.ts)
│   ├── login/
│   └── dashboard/
├── components/
│   ├── ui/                # Composants shadcn/ui
│   └── layout/              # AppSidebar, SiteHeader…
├── hooks/                     # useAuth…
├── lib/                         # Helpers (appels API…)
└── types/                         # Types TypeScript partagés
```

> Arborescence cible des routes (pipeline prospect Kanban, fiche client à 9 onglets, cartographie des risques…) : [docs/projet/workflow.md §5](../docs/projet/workflow.md), zonings d'écran détaillés dans `docs/autre/workflow-frontend.md`.

## Installation et configuration

Voir [INSTALL.md](../INSTALL.md) à la racine du dépôt (le frontend fait partie du monorepo npm workspaces).

## Scripts

```bash
npm run dev      # serveur de développement (0.0.0.0, hot reload)
npm run build    # build de production
npm run start    # serveur de production (après build)
npm run lint     # ESLint
```

## Communication avec le backend

Les appels API du navigateur passent par la route proxy interne `src/app/api/[...path]/route.ts` (`src/proxy.ts`), qui relaie la requête vers le backend NestJS. Le backend n'est jamais appelé directement depuis le client.

## Variables d'environnement

Voir `frontend/.env.example`. Détail : [INSTALL.md](../INSTALL.md#3-configurer-les-variables-denvironnement).

## Authentification

L'authentification repose sur un cookie JWT **HttpOnly** posé par le backend — jamais de token manipulé côté client. Voir [docs/projet/security.md](../docs/projet/security.md).
