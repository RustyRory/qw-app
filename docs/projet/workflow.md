# Workflow de développement — QW-app

Ce document décrit **l'intégralité des étapes** à suivre pour concevoir, développer, déployer et maintenir QW-app, de la configuration initiale jusqu'à la livraison.

---

## Sommaire

1. [Configuration de l'environnement](#1-configuration-de-lenvironnement)
2. [Initialisation du projet](#2-initialisation-du-projet)
3. [Base de données](#3-base-de-données)
4. [Backend — NestJS](#4-backend--nestjs)
5. [Frontend — Next.js](#5-frontend--nextjs)
6. [Sécurité](#6-sécurité)
7. [Tests](#7-tests)
8. [CI/CD — Intégration et déploiement continus](#8-cicd--intégration-et-déploiement-continus)
9. [Infrastructure serveur (VPS)](#9-infrastructure-serveur-vps)
10. [Git Flow et conventions](#10-git-flow-et-conventions)
11. [Ordre de développement recommandé (MVP)](#11-ordre-de-développement-recommandé-mvp)

---

## 1. Configuration de l'environnement

### 1.1 Prérequis locaux

- Node.js ≥ 20 LTS
- npm ≥ 10
- Docker + Docker Compose
- Git
- VS Code avec extensions : ESLint, Prettier, Docker, GitLens

```bash
node -v
npm -v
docker -v
```

### 1.2 Variables d'environnement

Créer un `.env` à la racine de chaque service (ne jamais committer) :

**Backend (`backend/.env`) :**
```env
DATABASE_URL=postgresql://qwuser:password@localhost:5432/qwapp
REDIS_URL=redis://localhost:6379
JWT_SECRET=<secret_fort_aléatoire>
JWT_EXPIRES_IN=1h
PORT=3001
NODE_ENV=development
```

**Frontend (`frontend/.env.local`) :**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Ajouter dans `.gitignore` :
```
.env
.env.local
```

Créer les fichiers exemples à committer :
- `backend/.env.example`
- `frontend/.env.example`

```env
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
PORT=
NODE_ENV=
```

### 1.3 Dossier deployment

Structure :
```
project-root/
│
├── backend/
├── frontend/
│
├── deployment/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── .env.example
│   │
│   ├── nginx/
│   │   └── nginx.conf
│   │
│   └── scripts/
│       ├── deploy.sh
│       ├── start.sh
│       └── backup.sh
│
├── .github/
│   └── workflows/
├── docs/
├── CHANGELOG.md
├── CONTRIBUTING.md
├── INSTALL.md
├── LICENSE
└── README.md
```

**`deployment/docker/`** — configuration Docker (compose, variables d'environnement de staging)

**`deployment/nginx/`** — reverse proxy exposant frontend et backend sous un même domaine

**`deployment/scripts/`** — scripts opérationnels (`deploy.sh`, `start.sh`, `backup.sh`)

### 1.4 Hooks locaux (Husky)

Husky, lint-staged et commitlint sont installés à la racine du monorepo (pas dans les workspaces).

#### Étape 1 : installer Husky

```bash
npm install husky --save-dev
npx husky init
```

#### Étape 2 : pre-commit (lint + format)

```bash
npm install lint-staged --save-dev
```

Créer `.lintstagedrc.cjs` à la racine (utilise le binaire ESLint de chaque workspace pour éviter les conflits de version) :

```javascript
const path = require('path');

const backendEslint = path.join(__dirname, 'backend/node_modules/.bin/eslint');
const frontendEslint = path.join(__dirname, 'frontend/node_modules/.bin/eslint');

module.exports = {
  'backend/**/*.{js,ts}': (files) => [
    `${backendEslint} --fix --config backend/eslint.config.mjs ${files.join(' ')}`,
    `prettier --write ${files.join(' ')}`,
  ],
  'frontend/**/*.{js,ts,tsx}': (files) => [
    `${frontendEslint} --fix --config frontend/eslint.config.mjs ${files.join(' ')}`,
    `prettier --write ${files.join(' ')}`,
  ],
};
```

`.husky/pre-commit` :
```bash
npx lint-staged
```

> Ne pas mettre la config `lint-staged` dans `package.json` — utiliser `.lintstagedrc.cjs` pour pouvoir utiliser la syntaxe fonction (nécessaire ici pour passer les chemins absolus).

#### Étape 3 : commit-msg (convention de commit)

```bash
npm install @commitlint/{config-conventional,cli} --save-dev
```

Créer `commitlint.config.js` à la racine :
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Autorise la majuscule pour le format "Fixes #12 - message"
    'subject-case': [0],
  },
};
```

`.husky/commit-msg` :
```bash
npx --no -- commitlint --edit "$1"
```

Format attendu des commits :
```
type(scope): Fixes #<issue> - description courte

Types : feat | fix | refactor | test | docs | chore | ci
Exemples :
  feat(auth): Fixes #12 - ajouter le guard JWT
  fix(scoring): Fixes #34 - corriger le calcul PEP
  docs(readme): Fixes #5 - mettre à jour les instructions d'installation
```

---

## 2. Initialisation du projet

### 2.1 Structure des dossiers

```
qw-app/
├── backend/                ← NestJS
├── frontend/               ← Next.js
├── deployment/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── .env.example
│   ├── nginx/
│   │   └── nginx.conf
│   └── scripts/
│       ├── deploy.sh
│       ├── start.sh
│       └── backup.sh
├── .github/
│   └── workflows/          ← CI/CD GitHub Actions
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── docs/
├── .lintstagedrc.cjs
├── commitlint.config.js
├── package.json            ← racine monorepo (workspaces)
├── CHANGELOG.md
├── CONTRIBUTING.md
├── INSTALL.md
├── LICENSE
└── README.md
```

### 2.2 Initialisation backend

```bash
npm i -g @nestjs/cli
nest new backend
cd backend
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install @nestjs/config class-validator class-transformer
npm install ioredis @nestjs/cache-manager cache-manager-ioredis
```

### 2.3 Initialisation frontend

```bash
npx create-next-app@latest frontend \
  --typescript --tailwind --app --src-dir
cd frontend
npm install zod sonner recharts
npm install @radix-ui/react-{avatar,checkbox,dialog,dropdown-menu,label,select,separator,slot,tabs,tooltip}
npm install class-variance-authority clsx tailwind-merge tw-animate-css
npm install @tabler/icons-react
```

### 2.4 Docker Compose local (développement)

Le fichier de développement se trouve dans `deployment/docker/docker-compose.yml` :

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: qwuser
      POSTGRES_PASSWORD: password
      POSTGRES_DB: qwapp
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  pgdata:
```

```bash
cd deployment/docker
docker compose up -d  # démarrer postgres + redis
```

> Le stockage de documents (OVHcloud Object Storage) n'est **pas** simulé en local par défaut : le backend de développement pointe directement vers un bucket OVHcloud dédié au développement (`OVH_S3_BUCKET=qw-app-dev`). C'est un prestataire externe managé, pas un service à faire tourner soi-même (voir [security.md](./security.md)).

---

## 3. Base de données

QW-app repose sur **14 entités** TypeORM (KYC fusionné dans `Client`, pipeline prospect, questionnaire d'acceptation, missions/lettres de mission, planning, obligations, opérations sensibles). Le détail complet — dictionnaire de données, MCD, MLD, enums, index, ordre des migrations — est documenté dans [database.md](./database.md) ; ce paragraphe ne couvre que les conventions d'implémentation TypeORM.

### 3.1 Conventions TypeORM

- Une entité par table dans `backend/src/<module>/entities/<nom>.entity.ts`
- Tous les ID : `@PrimaryGeneratedColumn('uuid')`
- Timestamps : `@CreateDateColumn()`, `@UpdateDateColumn()`
- Soft delete (`@DeleteDateColumn()`) sur `Client` et `Utilisateur` uniquement — rétention 5 ans (LCB-FT)
- `ScoreRisque` et `AuditLog` sont **INSERT-ONLY** : aucune méthode `update`/`delete` dans leurs services
- Mot de passe : stocker uniquement `passwordHash` (bcrypt, 12 rounds)
- Enums partagés centralisés dans `common/enums/index.ts` (`Role`, `StatutKanban`, `StatutClient`, `NiveauRisque`…)

### 3.2 Migrations

```bash
# Générer une migration après modification d'entité
npm run typeorm migration:generate -- -n NomMigration

# Appliquer les migrations
npm run typeorm migration:run

# Rollback
npm run typeorm migration:revert
```

### 3.3 Seed de données

Le seed est scindé en deux fichiers indépendants dans `backend/src/database/` :

| Fichier | Rôle |
|---|---|
| `seed-users.ts` | 3 comptes de test (`admin@qwconseil.fr`, `responsable@qwconseil.fr`, `collab@qwconseil.fr`). Idempotent, exporte `seedUsers()` réutilisable par les autres seeds. |
| `seed-data.ts` | Clients, prospects, questionnaires, scores de risque, missions, documents, planning, obligations, opérations sensibles. Exporte `seedData()`, appelle `seedUsers()` si besoin (peut donc être lancé seul). |
| `seed.ts` | Point d'entrée combiné : appelle `seedUsers()` puis `seedData()`. |

`seed-data.ts` couvre volontairement **toutes les valeurs des enums** métier plutôt qu'un seul cas nominal : les 7 statuts de `StatutClient`/`StatutKyc`/`ScreeningStatut` combinés sur plusieurs clients, les 7 étapes de `StatutKanban` sur plusieurs prospects, les 3 statuts de `StatutQuestionnaire`, et les 3 niveaux de `NiveauRisque` obtenus à la fois côté client et côté prospect — y compris le cas « aucun score » et un historique de plusieurs évaluations sur un même dossier. Le seed contourne la couche service (pas d'appel HTTP) : il appelle directement les fonctions pures `flagsFromClient`/`flagsFromQuestionnaire`/`computeAutoScore` de `auto-score.util.ts` pour rester cohérent avec l'algorithme réel plutôt que d'inventer des scores à la main.

```bash
npm run seed         # seed complet (users + data)
npm run seed:users   # comptes de test uniquement
npm run seed:data    # reste des données (relance seedUsers si nécessaire)
```

---

## 4. Backend — NestJS

### 4.1 Ordre de développement par ressource

Pour chaque module, toujours suivre cet ordre :

```
Migration → Entity → Seed → DTO → Service → Controller → Page Next.js
```

| Étape | Fichier | Rôle |
|-------|---------|------|
| **Migration** | `migrations/<timestamp>-NomMigration.ts` | Crée/modifie le schéma en base |
| **Entity** | `<module>/entities/<nom>.entity.ts` | Mappe la table en objet TypeScript (TypeORM) |
| **Seed** | `database/seed.ts` | Peuple la base avec des données initiales |
| **DTO** | `<module>/dto/create-<nom>.dto.ts` | Valide et type le body des requêtes (`class-validator`) |
| **Service** | `<module>/<nom>.service.ts` | Contient la logique métier, interagit avec la base |
| **Controller** | `<module>/<nom>.controller.ts` | Reçoit la requête HTTP, délègue au service |
| **Page Next.js** | `app/dashboard/<nom>/page.tsx` | Affiche les données au client |

---

### 4.2 Structure modulaire

```
backend/src/
├── common/enums/         ← Role, StatutKanban, StatutClient, NiveauRisque…
├── auth/                 ← AuthModule
├── users/                ← UsersModule
├── prospects/             ← ProspectsModule (pipeline Kanban)
├── questionnaires/         ← QuestionnairesModule (LAB)
├── clients/                ← ClientsModule (KYC fusionné)
├── beneficiaires/            ← BeneficiairesModule (UBO)
├── contacts/                  ← ContactsModule
├── missions/                   ← MissionsModule
├── documents/                   ← DocumentsModule (métadonnées, stockage OVHcloud Object Storage)
├── lettres-mission/               ← LettresMissionModule
├── scoring/                        ← ScoringModule (calcul automatique, client et prospect)
├── planning/                        ← PlanningModule
├── obligations/                      ← ObligationsModule
├── operations-sensibles/              ← OperationsSensiblesModule
├── audit/                              ← AuditModule
└── database/                            ← migrations, seed
```

> Référence complète des entités et de leurs relations : [database.md](./database.md). Le code détaillé de chaque entité/DTO/service est conservé dans `docs/mvp/workflow-backend.md`.

### 4.3 Ordre d'implémentation des modules

L'ordre suit les dépendances de clé étrangère (cf. [database.md §6](./database.md#6-ordre-des-migrations)) :

| # | Module | Routes API principales | Notes |
|---|--------|------------------------|-------|
| 1 | **Auth** | `POST /api/auth/login` | JWT en cookie HttpOnly, `RolesGuard` + `@Roles()`, message d'erreur uniforme, vérifie `isActive` |
| 2 | **Users** | `GET/POST/PATCH/DELETE /api/users` | Admin uniquement, `DELETE` = désactivation (`isActive=false`) |
| 3 | **Prospects** | `GET/POST/PATCH/DELETE /api/prospects`, `POST /:id/convertir` | Filtré par rôle (collaborateur = ses prospects). `PATCH` interdit si `statutKanban = CONVERTI` |
| 4 | **Questionnaires** | `POST /api/questionnaires`, `GET /prospect/:id`, `PATCH /:id/valider`, `/refuser` | 1-1 avec `Prospect` ; section 10 débloquée seulement si sections 1-9 complètes |
| 5 | **Clients** | `GET/POST/PATCH/DELETE /api/clients` | KYC fusionné dans l'entité ; `DELETE` = soft delete (admin) ; conversion prospect → client crée le `Client` avec `prospectId` |
| 6 | **Beneficiaires** | `POST /api/beneficiaires`, `GET /client/:id`, `DELETE /:id` | UBO, % détention 0-100 |
| 7 | **Contacts** | `POST /api/contacts`, `GET /client/:id`, `DELETE /:id` | Tiers (avocat, CAC, notaire…) |
| 8 | **Missions** | `POST/GET/PATCH/DELETE /api/missions`, `PATCH /:id/statut` | Type, statut, honoraires |
| 9 | **Documents** | `POST /api/documents` (upload vers OVHcloud Object Storage), `GET /:id/download` (URL pré-signée 15 min), `DELETE /:id` | Audit `CREATE`/`READ` à chaque opération |
| 10 | **Lettres de mission** | `POST /api/lettres-mission`, `GET ?missionId=`, `PATCH /:id/signer` | Versionnée, signature réservée à EXPERT_COMPTABLE/ADMIN |
| 11 | **Scoring** | `GET /client/:id`, `GET /client/:id/courant`, `GET /prospect/:id`, `GET /prospect/:id/courant` (lecture uniquement) | Voir 4.4 — calcul entièrement automatique, aucune route `POST`, INSERT-ONLY |
| 12 | **Planning** | `POST/GET/DELETE /api/planning`, `PATCH /:id/completer` | Diligences réglementaires ou manuelles |
| 13 | **Obligations** | `POST/GET /api/obligations`, `PATCH /:id/fait` | Suivi de conformité par client |
| 14 | **Opérations sensibles** | `POST/GET /api/operations-sensibles`, `PATCH /:id/classer`, `/tracfin` | Statut `SIGNALEE → EN_ANALYSE → CLASSEE/TRACFIN_DECLARE` |
| 15 | **Audit** | `GET /api/audit`, `GET /api/audit/:ressourceId` | `AuditService.log(userId, action, ressource, ressourceId, details)` injecté dans tous les autres services ; INSERT-ONLY |

### 4.4 Algorithme de scoring automatique

Un seul algorithme (`backend/src/scoring/auto-score.util.ts`) note **9 critères pondérés** repris de la grille officielle du cahier des charges (`docs/mvp/cahier-des-charges.md`, Module 4). Il n'y a plus aucune saisie manuelle de score dans l'application — seule la **source** des 9 critères change selon qu'on évalue un client ou un prospect :

| Critère | Poids | Prospect (réponses D1-D5) | Client (données réelles) |
|---|:---:|---|---|
| PPE | 30 | `D1_11` | `client.ppe` |
| Pays à risque (GAFI/UE) | 25 | `D3_1_1` / `D3_1_2` / `D3_1_3` | *(via le questionnaire du prospect d'origine, si connu)* |
| Secteur sensible (crypto, jeux, immobilier) | 20 | `D2_13`, `D2_26`, `D2_27`, ou seuil « risque élevé » sur `D2_2`/`D2_3`/`D2_5` | *(idem)* |
| CA annuel > 500 k€ | 10 | `prospect.chiffreAffaires` | `client.chiffreAffaires` |
| Espèces (change, transmission de fonds) | 15 | `D2_20` / `D2_21` | *(idem)* |
| Structure de propriété complexe/opaque | 15 | `D1_4` à `D1_8` | *(idem)* |
| Pays tiers à risque (fiscal ou sanctions) | 10 | `D3_2_1..3`, `D3_3_1..6` | *(idem)* |
| Personne morale + bénéficiaire/établissement lié à l'étranger | 10 | `typeEntite = PERSONNE_MORALE` et (`D3_1_2` ou `D3_2_2`) | `typeEntite = PERSONNE_MORALE` et un bénéficiaire effectif de nationalité non française |
| Alertes sources nationales (LIMPI) | 20 | jamais déclenché (pas de screening sur un prospect) | `client.screeningStatut = ALERTE` |

Les critères marqués *(idem)* n'ont pas d'équivalent direct dans les données client : ils sont comblés par le questionnaire d'acceptation du **prospect d'origine** (`client.prospect`) s'il existe, sinon restent à `false`. Un client créé directement (jamais passé par le pipeline prospect) ne peut donc déclencher que PPE / CA / screening / UBO étranger — le score maximal atteignable dans ce cas est mathématiquement plafonné (~45/100), ce qui est cohérent : sans questionnaire de risque rempli, on ne peut pas conclure à un risque géographique/sectoriel élevé.

**Point d'attention** : ces 9 poids totalisent 155 pts, pas 100 (incohérence de la grille source elle-même). Le score persisté est donc **normalisé** : `score = round(Σ(poids déclenchés) / 155 × 100)`, ce qui garantit un score toujours compris entre 0 et 100.

```
niveau = FAIBLE  si score ≤ 33
         MOYEN   si score ≤ 66
         ELEVE   sinon
```

**Déclenchement** — `ScoringService.recalculateForProspect(prospectId, userId)` et `recalculateForClient(clientId, userId)` centralisent tout le calcul (chargement du client/prospect, de ses bénéficiaires effectifs et du questionnaire d'origine le cas échéant) et sont appelés par les autres services :

| Événement | Service appelant |
|---|---|
| Création/modification du questionnaire d'acceptation | `QuestionnairesService.create` / `updateReponses` |
| Création/modification d'un client, résultat de screening | `ClientsService.create` / `update` / `updateScreening` |
| Ajout/modification/suppression d'un bénéficiaire effectif | `BeneficiairesService.create` / `update` / `remove` |
| Conversion d'un prospect en client | `ProspectsService.convertToClient` |

`ScoringModule` exporte `ScoringService` et est importé par `ClientsModule`, `BeneficiairesModule`, `QuestionnairesModule` et `ProspectsModule`. Chaque évaluation crée une nouvelle ligne dans `score_risque` (`reponses` en JSONB, `{ criteres: [...] }` dans les deux cas) ; le score courant est celui dont `created_at` est le plus récent. Il n'existe plus de route `POST /api/scoring` — seules les routes `GET /client/:id[/courant]` et `GET /prospect/:id[/courant]` subsistent, en lecture.

### 4.5 Pipes et validation globale

Dans `main.ts` :
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true }); // credentials: cookie JWT cross-origin en dev
app.use(cookieParser());
```

### 4.6 Cache Redis

- Clé de cache : `client:<uuid>` et `scoring:<uuid>`
- TTL : 5 minutes
- Invalidation : à chaque `PATCH` sur le client (champs KYC inclus, désormais fusionnés dans la même entité)

---

## 5. Frontend — Next.js

### 5.1 Arborescence des routes

```
/login

/dashboard
├── /                              ← Accueil — KPIs globaux
├── /prospects                     ← Pipeline Kanban
│   ├── /new                       ← Formulaire nouveau prospect
│   └── /[id]                      ← Fiche prospect
│       └── /questionnaire         ← Questionnaire d'acceptation (LAB)
├── /clients                       ← Liste des clients
│   ├── /new                       ← Formulaire nouveau client
│   └── /[id]                      ← Fiche client, 9 onglets :
│       (infos · kyc · beneficiaires · contacts · scoring ·
│        missions · planning · obligations · operations)
├── /cartographie                  ← Cartographie globale des risques
├── /obligations                   ← Tableau global des obligations
├── /operations-sensibles          ← Vue globale opérations sensibles
├── /planning                      ← Planning global cabinet
└── /admin/users
    ├── /new                       ← Créer un utilisateur
    └── /[id]                      ← Éditer un utilisateur
```

> Zonings d'écran détaillés pour chaque page : `docs/mvp/workflow-frontend.md`. Types TypeScript partagés (enums, entités) : à réécrire intégralement dans `frontend/src/types/index.ts` d'après le même fichier §3.

### 5.2 Structure des dossiers

```
frontend/src/
├── app/                     ← routes ci-dessus (App Router)
├── components/
│   ├── ui/                 ← composants shadcn/ui (Button, Card, Dialog…)
│   ├── layout/             ← AppSidebar, SiteHeader, NavMain…
│   └── features/           ← KanbanBoard, ClientHeader, ArpecForm, DocumentUpload…
├── hooks/
│   ├── useAuth.ts          ← protection des pages, expose { ready, role, logout }
│   └── useRole.ts          ← droits RBAC (`can.validerQuestionnaire`, `can.signerLettre`…)
├── lib/
│   └── apiFetch.ts         ← helper HTTP (cookie JWT envoyé automatiquement, gère 401)
└── types/
    └── index.ts            ← types TypeScript partagés
```

### 5.3 Ordre d'implémentation (sprints)

| Sprint | Contenu |
|---|---|
| **1 — Fondations** | Réécrire `types/index.ts`, mettre à jour `AppSidebar` et `useAuth` (enum `Role` en UPPERCASE), composants partagés (`StatusBadge`, `RiskBadge`, `KycBadge`, `PageHeader`, `EmptyState`, `ConfirmModal`) |
| **2 — Prospects (Kanban)** | `/dashboard/prospects` (`KanbanBoard` drag-and-drop), `/new` (formulaire + intégration SIRENE), `/[id]` (fiche), `/[id]/questionnaire` (LAB, 10 sections) |
| **3 — Client (fiche principale)** | `/dashboard/clients` (liste + filtres), `/new`, `/[id]` onglets Infos + KYC & Documents (`ClientHeader`, `DocumentUpload`, checklist KYC) |
| **4 — Client (onglets complémentaires)** | Onglets UBO (`BeneficiaireEffectif` CRUD), Contacts, Scoring (`ArpecForm` + `ScoreBar` + historique), Missions + Lettres de mission |
| **5 — Client (obligations + opérations)** | Onglets Planning, Obligations, Opérations sensibles |
| **6 — Vues globales** | `/dashboard` (KPIs), `/cartographie`, `/obligations`, `/operations-sensibles`, `/planning` |
| **7 — Administration** | `/admin/users` (liste), `/new`, `/[id]` |

### 5.4 Authentification côté frontend

L'authentification repose sur un **cookie JWT HttpOnly** (voir [security.md](./security.md)) — pas de token manipulé en JavaScript :

1. `useAuth(requiredRole?)` lit l'état de session via un appel `GET /api/auth/me` (le cookie est envoyé automatiquement par le navigateur), redirige vers `/login` si non authentifié ou vers `/dashboard` si rôle insuffisant, expose `{ ready, role, logout }`
2. `apiFetch(url, options)` appelle l'API avec `credentials: 'include'` ; sur 401, redirige vers `/login`
3. `LoginForm` appelle `POST /api/auth/login` — le serveur pose le cookie ; le frontend ne stocke jamais le JWT lui-même

---

## 6. Sécurité

Le détail des exigences (RBAC, authentification par cookie JWT HttpOnly, checklist backend/frontend, chiffrement des documents, RGPD) est centralisé dans [security.md](./security.md) pour éviter la duplication avec ce guide de workflow — s'y référer avant toute implémentation touchant à l'auth, aux droits ou aux documents.

---

## 7. Tests

### 7.1 Tests unitaires (Jest — backend)

Créer les fichiers `*.spec.ts` dans chaque module :

| Service | Cas à tester |
|---------|--------------|
| `ScoringService` | Calcul correct du score automatique (9 critères pondérés, /100) pour un client comme pour un prospect, et des niveaux associés (FAIBLE/MOYEN/ELEVE) |
| `auto-score.util` (pure) | Déclenchement correct de chacun des 9 critères, normalisation du score sur 100, cas « aucun critère déclenché » |
| `AuthService` | Login valide, mauvais mdp, compte inactif, pose du cookie JWT |
| `ClientsService` | Création (avec/sans prospect d'origine), soft delete, filtre par rôle |
| `ProspectsService` | Transitions de `statutKanban`, conversion en client (génération `Client` + `ref`) |
| `QuestionnairesService` | Déblocage de la section 10 uniquement si sections 1-9 complètes, contresignature si risque élevé |
| `AuditService` | Enregistrement correct d'une action (INSERT-ONLY) |

```bash
cd backend && npm test
npm run test:cov  # couverture de code
```

### 7.2 Tests end-to-end (Jest + Supertest)

Fichiers `*.e2e-spec.ts` dans `backend/test/` :

- Flux d'authentification complet (login → token → route protégée)
- CRUD clients avec vérification des droits par rôle
- Calcul et consultation des scores de risque
- Upload et téléchargement de document

Utiliser une base PostgreSQL de test dédiée (variable `DATABASE_URL_TEST`).

### 7.3 Lancement

```bash
npm test              # tests unitaires
npm run test:e2e      # tests end-to-end
npm run test:cov      # rapport de couverture
```

---

## 8. CI/CD — Intégration et déploiement continus

### 8.1 Architecture des workflows

Les workflows sont organisés en deux couches :

- **Workflows réutilisables** (`lint.yml`, `tests.yml`, `audit.yml`, `docker-build.yml`) : déclenchés via `workflow_call`, ne s'exécutent jamais seuls.
- **Workflows orchestrateurs** (`ci.yml`, `deploy.yml`, `release.yml`, `hotfix-release.yml`) : déclenchés par des événements GitHub, ils appellent les workflows réutilisables.
- **Workflows de validation PR** (`branch-name.yml`, `commit-msg.yml`, `structure.yml`) : déclenchés directement sur `pull_request`, légers et indépendants.

### 8.2 Tableau des workflows (`.github/workflows/`)

| Fichier | Déclencheur | Rôle |
|---------|-------------|------|
| `ci.yml` | PR vers `dev`, `staging`, `main` | Orchestrateur : appelle `lint.yml`, `tests.yml`, `audit.yml`, `docker-build.yml` en parallèle via `workflow_call` |
| `lint.yml` | `workflow_call` (appelé par `ci.yml`) | ESLint + Prettier sur backend et frontend |
| `tests.yml` | `workflow_call` (appelé par `ci.yml`) | Jest unitaires + e2e sur backend et frontend en parallèle via matrix |
| `audit.yml` | `workflow_call` (appelé par `ci.yml`) | `npm audit --audit-level=high` — bloque si vulnérabilité critique |
| `docker-build.yml` | `workflow_call` (appelé par `ci.yml`) | Vérifie que les images Docker backend et frontend se construisent sans erreur |
| `branch-name.yml` | PR | Vérifie le format du nom de branche : `feat/123-desc`, `fix/123-desc`, `hotfix/123-desc` |
| `commit-msg.yml` | PR | Vérifie le format et la présence du numéro d'issue : `type(scope): Fixes #<issue> - message` |
| `structure.yml` | PR vers `main` | Vérifie la présence de `README.md`, `CONTRIBUTING.md`, `INSTALL.md`, `LICENSE` |
| `deploy.yml` | Push sur `staging` | Déploiement automatique sur le VPS via SSH |
| `release.yml` | Push sur `main` depuis `dev` | Calcul SemVer mineur, tag Git, création GitHub Release |
| `hotfix-release.yml` | Push sur `main` depuis `hotfix/*` | Calcul SemVer patch, tag Git, ouverture automatique d'une PR de sync `main` → `dev` |


### 8.3 Workflow orchestrateur (`ci.yml`)

```yaml
# Déclenché sur toute PR vers dev, staging ou main
jobs:
  lint:
    uses: ./.github/workflows/lint.yml
  tests:
    uses: ./.github/workflows/tests.yml
  audit:
    uses: ./.github/workflows/audit.yml
  docker-build:
    uses: ./.github/workflows/docker-build.yml
```

Tous les jobs s'exécutent en parallèle. La PR est bloquée si l'un d'eux échoue.

### 8.4 Workflow de déploiement (`deploy.yml`)

```yaml
# Déclenché sur push vers staging
steps:
  - SSH vers VPS (clé stockée dans GitHub Secrets)
  - git pull origin staging
  - docker compose build clb-back clb-front
  - docker compose up -d --remove-orphans
  - docker image prune -f
  - Vérification : docker compose ps — tous les services doivent être "running"
  - En cas d'échec : docker compose rollback (retour à l'image précédente via tag Git)
```

### 8.5 Workflow de release (`release.yml`)

```yaml
# Déclenché sur push vers main (merge depuis dev)
steps:
  - Récupérer le dernier tag Git (ex. v1.2.0)
  - Incrémenter le mineur → v1.3.0
  - Créer le tag Git et pousser
  - Créer une GitHub Release avec le contenu de CHANGELOG.md
```

### 8.6 Workflow hotfix (`hotfix-release.yml`)

```yaml
# Déclenché sur push vers main (merge depuis hotfix/*)
steps:
  - Récupérer le dernier tag Git (ex. v1.3.0)
  - Incrémenter le patch → v1.3.1
  - Créer le tag Git et pousser
  - Créer une GitHub Release
  - Ouvrir automatiquement une PR de sync main → dev
```

### 8.7 Secrets GitHub à configurer

| Secret | Valeur |
|--------|--------|
| `VPS_HOST` | IP ou domaine du VPS |
| `VPS_USER` | Utilisateur SSH dédié |
| `VPS_SSH_KEY` | Clé privée SSH (sans passphrase) |
| `VPS_PORT` | Port SSH (défaut : 22) |
| `GITHUB_TOKEN` | Fourni automatiquement par GitHub Actions (pour créer les releases et PR) |

### 8.8 Rulesets GitHub

- Branches `main` et `dev` : **aucune fusion sans que tous les checks de `ci.yml` soient verts**
- Branche `main` : fusion uniquement depuis `dev` (release) ou `hotfix/*`
- Branche `dev` : fusion uniquement depuis `feat/*`, `fix/*`, ou `hotfix/*`

---

## 9. Infrastructure serveur (VPS)

### 9.1 Configuration initiale du VPS

```bash
# 1. Connexion et mise à jour
ssh root@<ip>
apt update && apt upgrade -y

# 2. Créer un utilisateur dédié (ne pas travailler en root)
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# 3. Copier la clé SSH publique
mkdir -p /home/deploy/.ssh
cat <clé_publique> >> /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys

# 4. Désactiver l'authentification par mot de passe SSH
nano /etc/ssh/sshd_config
# PasswordAuthentication no
# PermitRootLogin no
systemctl restart ssh

# 5. Configurer UFW (pare-feu)
ufw default deny incoming
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# 6. Installer Docker
apt install -y ca-certificates curl gnupg
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
# (ajouter le repo Docker et installer)
apt install -y docker-ce docker-compose-plugin

# 7. Installer Nginx
apt install -y nginx
systemctl enable nginx
```

### 9.2 Structure des dossiers sur le VPS

```
/home/deploy/
├── apps/
│   ├── qw-app/         ← clone du dépôt Git
│   │   ├── docker-compose.yml
│   │   ├── .env        ← variables d'environnement de staging
│   │   └── uploads/    ← stockage des documents uploadés
│   ├── cinemap/
│   ├── lucky7/
│   ├── saintbarth/
│   └── vps-monitor/
└── nginx/
    ├── nginx.conf
    └── conf.d/
        └── apps.conf
```

### 9.3 Configuration Nginx

```nginx
# /etc/nginx/conf.d/apps.conf
server {
    listen 80;
    server_name <domaine>;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name <domaine>;
    ssl_certificate /etc/letsencrypt/live/<domaine>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<domaine>/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;  # vps-monitor
    }
    location /qw-app/ {
        proxy_pass http://127.0.0.1:8004;
    }
    location /cinemap/ {
        proxy_pass http://127.0.0.1:8001;
    }
    # ... autres apps
}
```

### 9.4 Docker Compose de production

```yaml
# qw-app/docker-compose.yml (staging/production)
services:
  clb-front:
    build: ./frontend
    ports: ["8004:3000"]
    env_file: .env
    depends_on: [clb-back]

  clb-back:
    build: ./backend
    ports: ["3001:3001"]
    env_file: .env       # inclut les identifiants OVH_S3_* (prestataire externe, pas de service local)
    depends_on: [postgres, redis]

  postgres:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    env_file: .env

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

> Le stockage de documents n'apparaît pas dans ce `docker-compose.yml` : OVHcloud Object Storage est un service externe managé, accessible uniquement via les identifiants `OVH_S3_*` dans `.env` (voir [deployment.md](./deployment.md)).

### 9.5 Certificat SSL (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d <domaine>
# Renouvellement automatique via cron (géré par certbot)
```

---

## 10. Git Flow et conventions

### 10.1 Branches

| Branche | Rôle | Depuis |
|---------|------|--------|
| `main` | Version stable livrée | — |
| `dev` | Intégration des développements | `main` |
| `staging` | Environnement de test / déploiement | `dev` |
| `feat/<issue>-description` | Nouvelle fonctionnalité | `dev` |
| `fix/<issue>-description` | Correction de bug | `dev` |
| `hotfix/<issue>-description` | Correction urgente en production | `main` |

### 10.2 Format des commits

```
type(scope): Fixes #<issue> - description courte

Types : feat | fix | refactor | test | docs | chore | ci
Exemples :
  feat(auth): Fixes #12 - ajouter le guard JWT
  fix(scoring): Fixes #34 - corriger le calcul PEP
  docs(readme): Fixes #5 - mettre à jour les instructions d'installation
```

### 10.3 Flux de travail quotidien

```bash
# 1. Créer une branche depuis dev
git checkout dev && git pull
git checkout -b feat/42-creation-client

# 2. Développer, committer régulièrement
git add <fichiers>
git commit -m "feat(clients): Fixes #42 - ajouter la route POST /api/clients"

# 3. Pousser et ouvrir une Pull Request vers dev
git push origin feat/42-creation-client
# → Ouvrir PR sur GitHub → les CI s'exécutent automatiquement

# 4. Après validation CI + review → merger dans dev
# 5. Merger dev → staging pour déployer en staging
# 6. Merger dev → main pour créer une release (déclenche release.yml)
```

### 10.4 Versioning SemVer

- `x.Y.0` : merge de `dev` vers `main` (release.yml incrémente Y)
- `x.y.Z` : merge de `hotfix/*` vers `main` (hotfix-release.yml incrémente Z)
- Le `CHANGELOG.md` doit contenir une section `## [x.y.z]` avant chaque release

---

## 11. Ordre de développement recommandé (MVP)

Cette roadmap part de l'état actuel du backend (encore sur l'ancien schéma à 7 entités) vers la cible décrite dans [database.md](./database.md) et `docs/mvp/workflow-backend.md` / `workflow-frontend.md`.

### Phase A — Migration du schéma de données

| # | Étape | Livrable attendu |
|---|-------|-----------------|
| 1 | Suppression du module `kyc/` et des anciennes migrations | Base de dev réinitialisée |
| 2 | `common/enums/index.ts` | Tous les enums partagés (Role, StatutKanban, StatutClient…) |
| 3 | Réécriture des entités existantes (`User`, `Client`, `Prospect`, `Document`, `ScoreRisque`, `AuditLog`) | KYC fusionné dans `Client`, enums en UPPERCASE |
| 4 | Création des 8 nouvelles entités (Questionnaire, Beneficiaire, Contact, Mission, LettreMission, Planning, Obligation, OperationSensible) | 14 entités au total |
| 5 | Migration `V2Schema` (génération auto ou SQL manuel) | Schéma PostgreSQL à jour |
| 6 | Mise à jour `app.module.ts`, `data-source.ts`, `database/seed.ts` | Compte admin + collaborateur de test |

### Phase B — Modules backend (15)

| # | Module | Livrable attendu |
|---|--------|-----------------|
| 7 | Auth (cookie JWT HttpOnly) | `POST /api/auth/login` fonctionnel |
| 8 | Users | CRUD utilisateurs (admin) |
| 9 | Prospects | Pipeline Kanban, filtrage par rôle |
| 10 | Questionnaires | LAB 10 sections, validation/refus |
| 11 | Clients | KYC fusionné, conversion depuis prospect |
| 12 | Beneficiaires + Contacts | CRUD UBO et tiers |
| 13 | Missions + Lettres de mission | Création, signature, versioning |
| 14 | Documents | Upload/download via OVHcloud Object Storage, URL pré-signée |
| 15 | Scoring (ARPEC) | Calcul 4 dimensions + historique |
| 16 | Planning, Obligations, Opérations sensibles | CRUD + suivi de statut |
| 17 | Audit | Traçabilité de toutes les actions (INSERT-ONLY) |

### Phase C — Frontend (sprints 1 à 7, cf. §5.3)

| # | Étape | Livrable attendu |
|---|-------|-----------------|
| 18 | Sprint 1 — Fondations | Types, sidebar, `useAuth`/`useRole`, composants partagés |
| 19 | Sprint 2 — Prospects (Kanban) | Pipeline drag-and-drop + questionnaire LAB |
| 20 | Sprint 3 — Client (fiche principale) | Liste, création, onglets Infos + KYC/Documents |
| 21 | Sprint 4 — Client (onglets complémentaires) | UBO, Contacts, Scoring, Missions |
| 22 | Sprint 5 — Client (obligations + opérations) | Planning, Obligations, Opérations sensibles |
| 23 | Sprint 6 — Vues globales | Dashboard KPIs, cartographie, obligations, planning cabinet |
| 24 | Sprint 7 — Administration | Gestion des utilisateurs |

### Phase D — Qualité, CI/CD et mise en production

| # | Étape | Livrable attendu |
|---|-------|-----------------|
| 25 | Tests unitaires backend | Couverture des services critiques (scoring ARPEC, conversion prospect, questionnaire) |
| 26 | CI GitHub Actions | lint + tests + audit sur chaque PR |
| 27 | Config VPS + bucket OVHcloud Object Storage | Serveur accessible en HTTPS, bucket de production créé chez le prestataire |
| 28 | `docker-compose.yml` production | Images construites et déployables |
| 29 | Workflow `deploy.yml` | Déploiement automatique sur staging |
| 30 | Release 1.0.0 | Merge `dev` → `main` + tag Git |
