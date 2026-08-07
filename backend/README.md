# QW-App — Backend

API REST **NestJS** de l'application de conformité LCB-FT QW-App. Voir la [documentation du projet](../docs/projet/) pour l'architecture, le modèle de données et les règles de sécurité.

---

## Stack

Node.js 20, NestJS 11, TypeScript, TypeORM, PostgreSQL 16, Redis, JWT (Passport), bcrypt.

## Structure actuelle

```
src/
├── common/                  # Enums partagés, guards, decorators, utils (dont l'automatisation kanban)
├── auth/                    # Login, JWT, guards (JwtAuthGuard, RolesGuard)
├── users/                   # Comptes internes (RBAC)
├── prospects/               # Pipeline Kanban prospect
├── questionnaires/          # Questionnaire d'acceptation LAB
├── clients/                 # Dossiers clients (KYC fusionné dans l'entité)
├── beneficiaires/           # Bénéficiaires effectifs (UBO)
├── contacts/                # Tiers liés au client
├── missions/                # Missions (rattachées à un client ou un prospect)
├── lettres-mission/         # Lettres de mission (versionnées, DocuSign)
├── docusign/                # Intégration DocuSign (envoi/statut/webhook)
├── documents/                # Upload et métadonnées des documents
├── scoring/                   # Calcul automatique du score de risque (client + prospect)
├── planning/                    # Étapes de planning/diligences
├── obligations/                   # Tableau des obligations réglementaires
├── operations-sensibles/            # Opérations atypiques (Tracfin)
├── audit/                             # Journal d'audit (INSERT-ONLY)
├── migrations/                          # Migrations TypeORM
└── database/                              # Seed
```

Détail des 14 entités, du modèle de données et de l'ordre des migrations : [docs/projet/database.md](../docs/projet/database.md).

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

npm run seed               # peuple la base (comptes de test + jeu de données complet)
npm run seed:users         # comptes de test uniquement
npm run seed:data          # reste des données uniquement (relance seed:users si nécessaire)
npm run seed:minimal       # 2 comptes de test seulement (admin + modérateur), base sinon vide
```

## Variables d'environnement

Voir `backend/.env.example`. Détail : [INSTALL.md](../INSTALL.md#3-configurer-les-variables-denvironnement).

## Sécurité

Toute modification touchant à l'authentification, aux guards RBAC ou au traitement des documents doit respecter les exigences de [docs/projet/security.md](../docs/projet/security.md).
