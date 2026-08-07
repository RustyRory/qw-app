# QW-App — Frontend

Interface **Next.js** de l'application de conformité LCB-FT QW-App. Voir la [documentation du projet](../docs/projet/) pour l'architecture et le détail des écrans.

---

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI, Zod, Recharts.

## Structure actuelle

```
src/
├── proxy.ts                    # Logique du proxy interne vers le backend
├── app/
│   ├── api/[...path]/          # Route handler proxy (utilise proxy.ts)
│   ├── login/
│   └── dashboard/
│       ├── prospects/          # Pipeline Kanban + vue tableau, fiche prospect, questionnaire LAB
│       │   └── [id]/
│       │       └── questionnaire/
│       ├── clients/            # Liste, création, fiche à onglets (infos, kyc, missions…)
│       ├── admin/users/        # Gestion des utilisateurs
│       ├── cartographie/       # Cartographie globale des risques
│       ├── obligations/        # Tableau global des obligations
│       ├── operations-sensibles/
│       ├── planning/
│       └── profil/
├── components/
│   ├── ui/                     # Composants shadcn/ui
│   ├── layout/                 # AppSidebar…
│   └── scoring-panel.tsx       # Panneau de score de risque (client + prospect)
├── hooks/
│   ├── useAuth.ts               # Session (cookie JWT), redirection, logout
│   └── useRole.ts                # Droits RBAC (`can.validerQuestionnaire`, `can.signerLettre`…)
├── lib/                             # Helpers (apiFetch, status, sirene…)
└── types/                             # Types TypeScript partagés
```

> Détail des écrans et du modèle de données : [docs/projet/workflow.md](../docs/projet/workflow.md) et [docs/projet/database.md](../docs/projet/database.md).

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
