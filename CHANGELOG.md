# Changelog

## [0.2.0] - 2026-06-30

### Backend — premiers modules métier

- Entités TypeORM et migration initiale : `User`, `Client`, `Kyc`, `Document`, `RiskScore`, `AuditLog`
- Seed de données : compte admin + compte collaborateur de test
- `AuthModule` : login JWT, `JwtAuthGuard`, `RolesGuard`
- `ClientsModule` : CRUD des dossiers clients
- `KycModule` : fiche KYC liée au client (relation 1-1)
- `DocumentsModule` : upload et téléchargement de documents
- `ScoringModule` : calcul du score de risque
- `AuditModule` : traçabilité des actions
- `UsersModule` : CRUD utilisateurs (admin)
- `ProspectsModule` : CRUD prospects + migration `AddProspect`
- `ValidationPipe` globale (`whitelist`, `forbidNonWhitelisted`, `transform`)

### Frontend — authentification et dashboard

- Page de connexion + hook `useAuth` (protection des pages, redirection)
- Layout dashboard protégé + `AppSidebar`
- Pages clients : liste, création, fiche détail
- Page admin : gestion des utilisateurs
- Proxy API interne (`src/app/api/[...path]/route.ts`) : plusieurs itérations pour fiabiliser le routage vers le backend (`basePath`, suppression de `trailingSlash` incompatible Turbopack, remplacement du rewrite Edge par une route catch-all, suppression des en-têtes hop-by-hop)

### Documentation

- Réécriture complète de `docs/projet/` (vue d'ensemble, architecture, base de données, sécurité, workflow, déploiement) suite aux retours du jury lors de la soutenance CDA : nouveau périmètre LCB-FT (pipeline prospect Kanban, KYC fusionné dans `Client`, questionnaire d'acceptation LAB, bénéficiaires effectifs, missions/lettres de mission, planning, obligations, opérations sensibles)
- Remplacement du stockage de documents auto-hébergé (Minio) par un prestataire externe managé (**OVHcloud Object Storage**), suite à la remarque du jury sur la sensibilité des pièces d'identité et données KYC
- Création des fichiers de gouvernance du dépôt : `README.md` (racine, backend, frontend, docs), `INSTALL.md`, `CONTRIBUTING.md`, `LICENSE` (propriétaire — tous droits réservés)

## [0.1.0] - 2026-05-29

### Initialisation du projet

- Initialisation du dépôt GitHub avec structure monorepo npm workspaces
- Configuration de l'environnement de développement : Husky, commitlint (conventional commits), lint-staged, Prettier, ESLint
- Correction hook Husky `commit-msg` : suppression de l'appel déprécié à `_/husky.sh` (incompatible Husky v10)

### Stack technique

- **Backend** : NestJS 11 + TypeScript, TypeORM, PostgreSQL, Redis, JWT, Passport
- **Frontend** : Next.js 16 + React 19, Tailwind CSS 4, Radix UI, Recharts, Zod
- Script `dev` racine via `concurrently` : backend sur le port 3001, frontend sur le port 3000

### Docker & déploiement

- Création du `Dockerfile` backend : build multi-stage NestJS (`npm install` → `nest build` → image de production)
- Création du `Dockerfile` frontend : build multi-stage Next.js avec `BACKEND_URL` injecté en ARG au moment du build pour les rewrites serveur
- Création du `deployment/docker-compose.yml` de production : services `qw-app-backend` (port interne 3001), `qw-app-frontend` (port 3006 exposé), `qw-app-postgres`, `qw-app-redis`
- Configuration `deployment/.env.example` avec les variables nécessaires (PostgreSQL, Redis, JWT, PORT)

### Intégration vps-monitor

- Enregistrement de l'app dans `apps.json` de vps-monitor : nom `qw-app`, chemin `/qw-app/`, port `3006`
- Déploiement via vps-monitor avec clonage sur la branche `staging`
- Configuration nginx : location `/qw-app/` → port 3006 avec préfixe conservé (`stripPrefix: false`)
- `basePath: '/qw-app'` ajouté dans `next.config.ts` en production pour que les assets `/_next/` soient routés correctement par nginx

### CI/CD

- Création du workflow GitHub Actions `.github/workflows/staging.yml` : déclenché sur push vers `staging`, appelle le webhook vps-monitor (`POST /api/webhook/deploy`) pour déclencher automatiquement le `git pull` + rebuild Docker
