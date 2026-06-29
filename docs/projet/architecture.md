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

**Stack :** Node.js 20, NestJS 11, TypeScript, TypeORM, PostgreSQL, Redis, JWT

### Structure

```
backend/src/
├── app.module.ts       # Module racine
├── app.controller.ts   # Contrôleur racine
├── app.service.ts      # Service racine
└── main.ts             # Point d'entrée (port via env PORT)
```

### Dépendances clés

| Package | Usage |
|---|---|
| `@nestjs/typeorm` + `pg` | ORM PostgreSQL |
| `@nestjs/jwt` + `passport-jwt` | Authentification JWT |
| `cache-manager-ioredis` + `ioredis` | Cache Redis |
| `class-validator` + `class-transformer` | Validation des DTOs |
| `bcrypt` | Hashage des mots de passe |

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

---

## Frontend — Next.js

**Stack :** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, Zod

### Structure

```
frontend/src/
├── app/              # App Router Next.js
│   ├── layout.tsx    # Layout racine
│   └── page.tsx      # Page d'accueil
└── components/       # Composants réutilisables
```

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

## Base de données & Cache

| Service | Technologie | Usage |
|---|---|---|
| PostgreSQL 16 | Base de données relationnelle | Données applicatives via TypeORM |
| Redis 7 | Cache in-memory | Sessions, cache applicatif |

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
