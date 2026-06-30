# Architecture

## Vue d'ensemble

QW App est un monorepo **npm workspaces** composé d'un backend NestJS et d'un frontend Next.js, déployés via Docker sur un VPS.

```
qw-app/
├── backend/          # API REST — NestJS
├── frontend/         # Interface — Next.js
├── deployment/       # Docker & scripts de déploiement
├── docs/             # Documentation
└── package.json      # Racine monorepo (workspaces)
```

---

## Backend — NestJS

**Stack :** Node.js 20, NestJS 11, TypeScript, TypeORM, PostgreSQL, Redis, JWT, OVHcloud Object Storage (S3-compatible)

### Structure

```
backend/src/
├── app.module.ts            # Module racine
├── app.controller.ts        # Contrôleur racine
├── app.service.ts           # Service racine
├── main.ts                  # Point d'entrée (port via env PORT)
├── common/
│   └── enums/                # Enums partagés (Role, StatutKanban, NiveauRisque…)
├── auth/                      # Login, JWT, guards
├── users/                     # Comptes internes (RBAC)
├── prospects/                  # Pipeline Kanban
├── questionnaires/              # Questionnaire d'acceptation (LAB)
├── clients/                     # Dossier client (KYC fusionné)
├── beneficiaires/                # Bénéficiaires effectifs (UBO)
├── contacts/                     # Contacts tiers du client
├── missions/                     # Missions cabinet ↔ client
├── lettres-mission/               # Lettres de mission versionnées
├── documents/                     # Métadonnées documents (stockage OVHcloud Object Storage)
├── scoring/                       # Évaluation de risque ARPEC
├── planning/                      # Diligences planifiées
├── obligations/                   # Suivi des obligations réglementaires
├── operations-sensibles/          # Opérations atypiques / Tracfin
└── audit/                         # Journal d'audit (INSERT-ONLY)
```

> Détail des 14 entités et de leurs relations : [database.md](./database.md).

### Dépendances clés

| Package | Usage |
|---|---|
| `@nestjs/typeorm` + `pg` | ORM PostgreSQL |
| `@nestjs/jwt` + `passport-jwt` | Authentification JWT (cookie HttpOnly) |
| `cache-manager-ioredis` + `ioredis` | Cache Redis |
| `class-validator` + `class-transformer` | Validation des DTOs |
| `bcrypt` | Hashage des mots de passe |
| `@aws-sdk/client-s3` (SDK S3, compatible OVHcloud) | Stockage des documents (pièces d'identité, Kbis, lettres de mission) |

### Variables d'environnement

| Variable | Description |
|---|---|
| `PORT` | Port d'écoute (défaut : 3000) |
| `DB_HOST` | Hôte PostgreSQL |
| `DB_PORT` | Port PostgreSQL |
| `DB_USERNAME` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | Mot de passe PostgreSQL |
| `DB_DATABASE` | Nom de la base |
| `REDIS_HOST` | Hôte Redis |
| `REDIS_PORT` | Port Redis |
| `JWT_SECRET` | Clé secrète JWT |
| `OVH_S3_ENDPOINT` | Endpoint régional OVHcloud Object Storage (ex. `s3.gra.io.cloud.ovh.net`) |
| `OVH_S3_REGION` | Région OVHcloud (ex. `gra`) |
| `OVH_S3_ACCESS_KEY` | Clé d'accès du compte de service OVHcloud |
| `OVH_S3_SECRET_KEY` | Secret associé |
| `OVH_S3_BUCKET` | Bucket de stockage des documents |

> Détail des exigences de sécurité (JWT cookie, chiffrement documents, RGPD) : [security.md](./security.md).

---

## Frontend — Next.js

**Stack :** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, Zod

### Structure

```
frontend/src/
├── app/
│   ├── layout.tsx              # Layout racine
│   ├── login/                  # Connexion
│   └── dashboard/
│       ├── prospects/          # Pipeline Kanban + fiche prospect + questionnaire LAB
│       ├── clients/            # Liste + fiche client (9 onglets : infos, KYC, UBO,
│       │                       #   contacts, scoring, missions, planning, obligations, opérations)
│       ├── cartographie/       # Cartographie globale des risques
│       ├── obligations/        # Tableau global des obligations
│       ├── operations-sensibles/ # Vue globale des opérations sensibles
│       ├── planning/           # Planning cabinet
│       └── admin/users/        # Gestion des utilisateurs (admin)
├── components/
│   ├── ui/                     # Composants shadcn/ui
│   ├── layout/                 # AppSidebar, SiteHeader, NavMain…
│   └── features/               # KanbanBoard, ClientHeader, ArpecForm, DocumentUpload…
├── hooks/
│   ├── useAuth.ts               # Protection des pages
│   └── useRole.ts                # Droits RBAC côté UI
└── types/
    └── index.ts                  # Types partagés (Role, Client, Prospect, ScoreRisque…)
```

> Détail des routes, zonings d'écran et ordre d'implémentation par sprint : `docs/autre/workflow-frontend.md`.

### Dépendances clés

| Package | Usage |
|---|---|
| `@radix-ui/*` | Composants UI accessibles |
| `tailwindcss` | Styles utilitaires |
| `recharts` | Graphiques |
| `zod` | Validation des schémas |
| `sonner` | Notifications toast |
| `@tabler/icons-react` | Icônes |

### Configuration production

`next.config.ts` :
- `basePath: '/qw-app'` — préfixe de toutes les routes et assets en production
- Rewrite `/api/:path*` → `http://qw-app-backend:3001/api/:path*` — proxy vers le backend via le réseau Docker

---

## Communication Frontend ↔ Backend

```
Browser
  │
  └── GET /qw-app/...        → nginx → Next.js:3006
  └── GET /qw-app/api/...    → nginx → Next.js:3006
                                          └── rewrite → qw-app-backend:3001 (réseau Docker)
```

Les appels API depuis le browser passent par Next.js (rewrite serveur), qui les proxifie vers le backend. Le backend n'est jamais exposé directement à l'extérieur.

---

## Base de données, cache & stockage

| Service | Technologie | Hébergement | Usage |
|---|---|---|---|
| PostgreSQL 16 | Base de données relationnelle | VPS (Docker) | Données applicatives via TypeORM (14 entités) |
| Redis 7 | Cache in-memory | VPS (Docker) | Sessions, cache applicatif |
| OVHcloud Object Storage | Stockage objet S3-compatible | Prestataire externe managé (France) | Documents KYC, lettres de mission — chiffrés AES-256, accès via URL pré-signée |

> Les documents sensibles (pièces d'identité, Kbis, lettres de mission) ne sont **pas** stockés sur le VPS applicatif : ils sont confiés à un prestataire de stockage objet managé. Un hébergement maison sur le même serveur que l'application n'offre ni les certifications, ni les garanties de disponibilité/sauvegarde attendues pour des données aussi sensibles — voir [security.md](./security.md) pour la justification complète.

---

## Outillage

| Outil | Usage |
|---|---|
| Husky | Hooks Git pre-commit et commit-msg |
| commitlint | Validation du format des commits (Conventional Commits) |
| lint-staged | Lint + format sur les fichiers stagés uniquement |
| Prettier | Formatage du code |
| ESLint | Analyse statique |
| concurrently | Lancement simultané backend + frontend en développement |
