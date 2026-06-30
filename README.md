# QW-App

Application web de conformité anti-blanchiment (**LCB-FT**) pour cabinets d'experts-comptables, développée pour le Cabinet QW.

Centralise la gestion du pipeline prospect, des dossiers clients (KYC), de l'évaluation des risques, du questionnaire d'acceptation, des missions et de la conformité réglementaire — en remplacement de fichiers Excel et d'emails dispersés.

---

## Stack

| Couche | Technologie |
|---|---|
| Backend | NestJS 11 + TypeScript, TypeORM, PostgreSQL 16, Redis |
| Frontend | Next.js 16 + React 19, Tailwind CSS 4, Radix UI |
| Stockage documents | OVHcloud Object Storage (S3-compatible) |
| Infrastructure | Docker, nginx, VPS |

Détail complet de l'architecture, du modèle de données et de la sécurité : [docs/projet/](./docs/projet/).

---

## Démarrage rapide

```bash
npm install                 # dépendances (workspaces backend + frontend)
npm run infra:up            # PostgreSQL + Redis en local (Docker)
npm run dev                  # backend :3001 + frontend :3000
```

Voir [INSTALL.md](./INSTALL.md) pour la configuration complète (variables d'environnement, migrations, seed).

---

## Structure du dépôt

```
qw-app/
├── backend/          # API REST — NestJS (voir backend/README.md)
├── frontend/         # Interface — Next.js (voir frontend/README.md)
├── deployment/       # Docker, nginx, scripts de déploiement
├── docs/
│   ├── projet/       # Documentation de référence (architecture, BDD, sécurité, workflow)
│   └── autre/        # Notes de travail (cahier des charges, modélisation, CDA)
└── package.json      # Racine monorepo (npm workspaces)
```

---

## Documentation

| Document | Contenu |
|---|---|
| [INSTALL.md](./INSTALL.md) | Installation et configuration locale |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Git Flow, convention de commits, processus de PR |
| [docs/projet/projet.md](./docs/projet/projet.md) | Vue d'ensemble fonctionnelle, acteurs, RBAC |
| [docs/projet/architecture.md](./docs/projet/architecture.md) | Stack technique et structure des dossiers |
| [docs/projet/database.md](./docs/projet/database.md) | Modélisation Merise (MCD/MLD), 14 entités |
| [docs/projet/security.md](./docs/projet/security.md) | RBAC, authentification, RGPD, sécurité documents |
| [docs/projet/workflow.md](./docs/projet/workflow.md) | Guide de développement, CI/CD, roadmap |
| [docs/projet/deployment.md](./docs/projet/deployment.md) | Déploiement VPS |
| [CHANGELOG.md](./CHANGELOG.md) | Historique des versions |

---

## Licence

Tous droits réservés — voir [LICENSE](./LICENSE).
