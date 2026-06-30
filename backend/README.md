# QW-App — Backend

API REST **NestJS** de l'application de conformité LCB-FT QW-App. Voir la [documentation du projet](../docs/projet/) pour l'architecture, le modèle de données et les règles de sécurité.

---

## Stack

Node.js 20, NestJS 11, TypeScript, TypeORM, PostgreSQL 16, Redis, JWT (Passport), bcrypt.

## Structure actuelle

```
src/
├── auth/          # Login, JWT, guards (JwtAuthGuard, RolesGuard)
├── users/          # Comptes internes (RBAC)
├── clients/         # Dossiers clients
├── kyc/               # Fiche KYC (relation 1-1 avec Client)
├── documents/           # Upload et métadonnées des documents
├── scoring/               # Calcul du score de risque
├── prospects/               # Gestion des prospects
├── audit/                    # Journal d'audit
├── migrations/                 # Migrations TypeORM
└── database/                     # Seed
```

> Cette structure correspond à l'état actuel du code. Une migration vers le schéma cible à 14 entités (KYC fusionné dans `Client`, pipeline Kanban, questionnaire d'acceptation, missions, planning, obligations, opérations sensibles) est documentée dans [docs/projet/database.md](../docs/projet/database.md) et `docs/autre/workflow-backend.md` — pas encore appliquée au code.

## Installation et configuration

Voir [INSTALL.md](../INSTALL.md) à la racine du dépôt (le backend fait partie du monorepo npm workspaces).

## Scripts

```bash
npm run start          # démarrage standard
npm run start:dev      # mode watch (développement)
npm run start:prod     # mode production (dist/main.js)

npm run lint            # ESLint --fix
npm run format            # Prettier

npm test                  # tests unitaires (Jest)
npm run test:watch
npm run test:cov
npm run test:e2e          # tests end-to-end (Supertest)

npm run migration:generate -- -n NomMigration
npm run migration:run
npm run migration:revert

npm run seed               # peuple la base (admin + données de démo)
```

## Variables d'environnement

Voir `backend/.env.example`. Détail : [INSTALL.md](../INSTALL.md#3-configurer-les-variables-denvironnement).

## Sécurité

Toute modification touchant à l'authentification, aux guards RBAC ou au traitement des documents doit respecter les exigences de [docs/projet/security.md](../docs/projet/security.md).
