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

### 1.3 Hooks locaux (Husky)

```bash
npx husky init
# pre-commit : lint-staged (ESLint + Prettier)
# commit-msg : validation du format type(scope): fixes #<issue> - message
```

---

## 2. Initialisation du projet

### 2.1 Structure des dossiers

```
qw-app/
├── backend/          ← NestJS
├── frontend/         ← Next.js
├── docker-compose.yml
├── .github/
│   └── workflows/    ← CI/CD GitHub Actions
├── docs/
├── CHANGELOG.md
├── CONTRIBUTING.md
├── INSTALL.md
└── LICENSE
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

### 2.4 Docker Compose local

```yaml
# docker-compose.yml (développement)
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
docker compose up -d  # démarrer postgres + redis
```

---

## 3. Base de données

### 3.1 Entités TypeORM

Créer une entité par table dans `backend/src/*/entities/` :

| Entité | Fichier | Relations |
|--------|---------|-----------|
| `User` | `users/entities/user.entity.ts` | OneToMany → Client, Document, RiskScore, AuditLog |
| `Client` | `clients/entities/client.entity.ts` | ManyToOne → User (createur, validateur), OneToOne → Kyc, OneToMany → Document, RiskScore |
| `Kyc` | `kyc/entities/kyc.entity.ts` | OneToOne → Client |
| `Document` | `documents/entities/document.entity.ts` | ManyToOne → Client, User |
| `RiskScore` | `scoring/entities/risk-score.entity.ts` | ManyToOne → Client, User |
| `AuditLog` | `audit/entities/audit-log.entity.ts` | ManyToOne → User |

Points clés :
- Tous les ID : `@PrimaryGeneratedColumn('uuid')`
- Timestamps : `@CreateDateColumn()`, `@UpdateDateColumn()`
- Soft delete : `@DeleteDateColumn()` sur `Client`
- Mot de passe : stocker uniquement `passwordHash` (bcrypt, 12 rounds)
- Relation 1-1 Kyc ↔ Client : `@JoinColumn()` + contrainte `UNIQUE` sur `id_client`

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

Créer `backend/src/database/seed.ts` avec :
- 1 compte admin (email + hash bcrypt)
- 1 compte collaborateur de test
- Quelques clients de démonstration avec KYC

```bash
npm run seed
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
| **Migration** | `database/migrations/<timestamp>-NomMigration.ts` | Crée/modifie le schéma en base |
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
├── auth/           ← AuthModule
├── users/          ← UsersModule
├── clients/        ← ClientsModule
├── kyc/            ← KycModule
├── documents/      ← DocumentsModule
├── scoring/        ← ScoringModule
├── audit/          ← AuditModule
├── common/         ← guards, decorators, pipes, interceptors
└── database/       ← migrations, seed
```

### 4.2 Ordre d'implémentation des modules

#### Étape 1 — AuthModule

1. Créer `UserEntity` avec enum `UserRole`
2. Implémenter `POST /api/auth/login` :
   - Vérifier email → retourner le même message d'erreur si email inconnu ou mdp incorrect (pas d'énumération)
   - Vérifier `isActive`
   - Comparer hash bcrypt
   - Mettre à jour `lastLoginAt`
   - Retourner JWT signé `{ id, role }`
3. Créer `JwtAuthGuard` (valide le Bearer token)
4. Créer `RolesGuard` (vérifie le rôle requis via `@Roles()`)
5. Créer décorateur `@Roles(...roles: UserRole[])`

#### Étape 2 — UsersModule

1. `GET /api/users` — liste (admin uniquement)
2. `POST /api/users` — créer un utilisateur (admin)
3. `PATCH /api/users/:id` — modifier un utilisateur (admin)
4. `DELETE /api/users/:id` — désactiver un compte (`isActive = false`, admin)

#### Étape 3 — ClientsModule

1. `POST /api/clients` — créer un client (collaborateur, responsable, admin)
   - Générer la référence `QW-YYYY-XXX`
   - Créer une fiche KYC vide associée
   - Enregistrer un audit `CREATE`
2. `GET /api/clients` — liste filtrée par rôle :
   - Collaborateur : uniquement ses propres dossiers (`id_createur`)
   - Responsable / Expert / Admin : tous les dossiers
3. `GET /api/clients/:id` — détail complet (KYC, documents, scores)
4. `PATCH /api/clients/:id` — modifier les informations du client
5. `PATCH /api/clients/:id/validate` — valider le dossier (responsable, admin)
6. `DELETE /api/clients/:id` — soft delete (admin uniquement)

#### Étape 4 — KycModule

1. `GET /api/kyc/:clientId` — consulter la fiche KYC
2. `PATCH /api/kyc/:clientId` — mettre à jour les données KYC
   - Enregistrer un audit `UPDATE`
   - Invalider le cache Redis du client

#### Étape 5 — DocumentsModule

1. `POST /api/documents/upload/:clientId` — uploader un fichier
   - Multer pour la réception du fichier
   - Stocker sur VPS dans `/uploads/clients/:clientId/`
   - Persister les métadonnées (nom, chemin, mime, taille)
   - Enregistrer un audit `CREATE`
2. `GET /api/documents/:clientId` — liste des documents d'un client
3. `GET /api/documents/file/:id` — télécharger un fichier (stream protégé)
   - Enregistrer un audit `READ`
4. `DELETE /api/documents/:id` — supprimer un document

#### Étape 6 — ScoringModule

1. `POST /api/scoring/:clientId` — calculer le score de risque
   - Lire les données KYC du client
   - Appliquer les critères pondérés :
     - PEP (`est_pep`) : +30 pts
     - Pays à haut risque LCB-FT (`pays_haut_risque`) : +25 pts
     - Secteur à risque (ex. crypto, casino) : +20 pts
     - Chiffre d'affaires élevé : +10 pts
   - Déterminer le niveau : `faible` (0-33) / `moyen` (34-66) / `élevé` (67-100)
   - Persister le résultat avec `calculatedAt`
   - Mettre à jour le cache Redis
   - Enregistrer un audit `CREATE`
2. `GET /api/scoring/:clientId` — historique des scores

#### Étape 7 — AuditModule

Le service d'audit est injecté dans tous les autres services. Il est rarement appelé directement via HTTP.

1. `AuditService.log(userId, action, entiteType, entiteId, details)` — méthode interne
2. `GET /api/audit` — consulter les logs (responsable, admin)
3. `GET /api/audit/:entiteId` — logs d'une entité spécifique

### 4.3 Pipes et validation globale

Dans `main.ts` :
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
app.enableCors({ origin: process.env.FRONTEND_URL });
```

### 4.4 Cache Redis

- Clé de cache : `client:<uuid>` et `scoring:<uuid>`
- TTL : 5 minutes
- Invalidation : à chaque `PATCH` sur le client ou le KYC

---

## 5. Frontend — Next.js

### 5.1 Structure App Router

```
frontend/src/
├── app/
│   ├── layout.tsx          ← layout racine
│   ├── page.tsx            ← redirection vers /login ou /dashboard
│   ├── login/
│   │   └── page.tsx        ← formulaire de connexion
│   └── dashboard/
│       ├── layout.tsx      ← layout protégé (vérifie useAuth)
│       ├── page.tsx        ← vue globale + SectionCards
│       ├── clients/
│       │   ├── page.tsx    ← liste des clients
│       │   ├── new/page.tsx← formulaire création
│       │   └── [id]/
│       │       └── page.tsx← fiche client (KYC, docs, scores)
│       ├── scoring/
│       │   └── page.tsx    ← suivi des risques
│       └── admin/
│           └── page.tsx    ← gestion utilisateurs (admin uniquement)
├── components/
│   ├── ui/                 ← composants shadcn/ui (Button, Card, Dialog…)
│   ├── layout/             ← AppSidebar, SiteHeader, NavMain…
│   └── features/           ← ClientForm, KycForm, ScoringCard…
├── hooks/
│   └── useAuth.ts          ← protection des pages, expose { ready, role, logout }
├── lib/
│   └── apiFetch.ts         ← helper HTTP (injecte JWT, gère 401)
└── types/
    └── index.ts            ← types TypeScript partagés
```

### 5.2 Ordre d'implémentation des pages

#### Étape 1 — Authentification

1. Créer `useAuth(requiredRole?)` :
   - Lire token + rôle dans `localStorage`
   - Rediriger vers `/login` si absent
   - Rediriger vers `/dashboard` si rôle insuffisant
   - Exposer `{ ready, role, logout }`
2. Créer `apiFetch(url, options)` :
   - Injecter `Authorization: Bearer <token>`
   - Sur 401 : supprimer token + rôle, rediriger vers `/login`
3. Créer `LoginForm` :
   - `POST /api/auth/login`
   - Stocker token + rôle dans `localStorage`
   - Rediriger vers `/dashboard`

#### Étape 2 — Layout du dashboard

1. `dashboard/layout.tsx` : appeler `useAuth()`, afficher `<AppSidebar>` + `<SidebarInset>`
2. `AppSidebar` : navigation principale avec `NavMain` (liens + icônes Tabler)
3. `NavUser` : avatar + rôle + bouton déconnexion
4. `SiteHeader` : titre de page + breadcrumb

#### Étape 3 — Dashboard (vue globale)

1. `SectionCards` : charger en parallèle via `Promise.allSettled` :
   - Nombre total de clients
   - Répartition par statut (en cours / validé / rejeté)
   - Répartition par niveau de risque
2. Tableau des derniers clients avec statut et score

#### Étape 4 — Gestion des clients

1. Page liste : tableau filtrable + bouton "Nouveau client"
2. Formulaire création : champs obligatoires (prénom, nom, email) + optionnels
3. Fiche client :
   - Onglet "Informations" : données du client + modification
   - Onglet "KYC" : formulaire KYC éditable
   - Onglet "Documents" : upload + liste + téléchargement
   - Onglet "Scoring" : historique des scores + bouton "Recalculer"
   - Onglet "Audit" : historique des actions (responsable / admin)
4. Bouton "Valider le dossier" (responsable / admin uniquement)

#### Étape 5 — Page scoring

- Vue globale des risques : filtrage par niveau (faible / moyen / élevé)
- Graphique Recharts : répartition des niveaux de risque

#### Étape 6 — Administration (admin uniquement)

- Liste des utilisateurs
- Formulaire création / modification d'un utilisateur
- Activation / désactivation d'un compte

---

## 6. Sécurité

### 6.1 Backend

- [ ] Mots de passe hashés avec bcrypt (12 rounds minimum)
- [ ] JWT signé avec secret fort en variable d'environnement (`JWT_SECRET`)
- [ ] Même message d'erreur pour email inconnu et mauvais mot de passe
- [ ] `isActive = false` → refus de connexion avant vérification du mot de passe
- [ ] `JwtAuthGuard` sur toutes les routes protégées
- [ ] `RolesGuard` + `@Roles()` pour les routes soumises à des droits spécifiques
- [ ] `ValidationPipe` global (whitelist + forbidNonWhitelisted)
- [ ] CORS restreint à l'URL du frontend
- [ ] Rate limiting sur `/api/auth/login` (ex. 10 req/min par IP)
- [ ] Requêtes SQL via TypeORM uniquement (pas de requêtes brutes avec données utilisateur)
- [ ] Accès aux fichiers uniquement via l'API (pas d'URL directe publique)

### 6.2 Frontend

- [ ] Aucun secret dans le code client
- [ ] Validation des formulaires côté client (Zod) avant envoi
- [ ] Affichage des erreurs serveur dans les formulaires
- [ ] Blocage du rendu tant que `useAuth.ready === false` (pas de flash de contenu)
- [ ] Token stocké dans `localStorage` (acceptable pour MVP, à migrer vers `httpOnly cookie` en production)

### 6.3 RGPD

- [ ] Soft delete sur `Client` (`deletedAt`) — conservation 5 ans (obligation LCB-FT)
- [ ] `AuditLog` pour toute action sur des données personnelles
- [ ] Pas de données personnelles dans les logs applicatifs (console, fichiers)
- [ ] Minimisation : collecter uniquement les données nécessaires au KYC

---

## 7. Tests

### 7.1 Tests unitaires (Jest — backend)

Créer les fichiers `*.spec.ts` dans chaque module :

| Service | Cas à tester |
|---------|--------------|
| `ScoringService` | Calcul correct selon critères KYC (PEP, pays risque, secteur) |
| `AuthService` | Login valide, mauvais mdp, compte inactif |
| `ClientsService` | Création, soft delete, filtre par rôle |
| `AuditService` | Enregistrement correct d'une action |

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

### 8.1 Workflows GitHub Actions (`.github/workflows/`)

| Fichier | Déclencheur | Rôle |
|---------|-------------|------|
| `ci.yml` | PR vers `dev`, `staging`, `main` | Orchestrateur : lance lint, tests, audit en parallèle |
| `lint.yml` | PR | ESLint + Prettier (backend et frontend) |
| `tests.yml` | PR | Jest (backend et frontend en parallèle via matrix) |
| `audit.yml` | PR | `npm audit --audit-level=high` — bloque si vulnérabilité critique |
| `branch-name.yml` | PR | Vérifie le format : `feat/123-desc`, `fix/123-desc`, `hotfix/123-desc` |
| `commit-msg.yml` | PR | Vérifie : `type(scope): Fixes #<issue> - message` |
| `ticket.yml` | PR | Vérifie qu'un numéro d'issue est référencé |
| `structure.yml` | PR | Vérifie la présence de `README.md`, `CONTRIBUTING.md`, `INSTALL.md`, `LICENSE` |
| `deploy.yml` | Push sur `staging` | Déploiement automatique sur le VPS |
| `release.yml` | Merge `dev` → `main` | Calcul SemVer mineur, tag Git, GitHub Release |
| `hotfix-release.yml` | Merge `hotfix/*` → `main` | Calcul SemVer patch, tag Git, PR de sync `main` → `dev` |

### 8.2 Workflow de déploiement (`deploy.yml`)

```yaml
# Déclenché sur push vers staging
steps:
  - SSH vers VPS (clé stockée dans GitHub Secrets)
  - git pull origin staging
  - docker compose build clb-back clb-front
  - docker compose up -d --remove-orphans
  - docker image prune -f
  - Vérification : docker compose ps (tous les services doivent être "running")
```

### 8.3 Secrets GitHub à configurer

| Secret | Valeur |
|--------|--------|
| `VPS_HOST` | IP ou domaine du VPS |
| `VPS_USER` | Utilisateur SSH dédié |
| `VPS_SSH_KEY` | Clé privée SSH (sans passphrase) |
| `VPS_PORT` | Port SSH (défaut : 22) |

### 8.4 Rulesets GitHub

- Branches `main` et `dev` : **aucune fusion sans que tous les checks CI soient verts**
- Branche `main` : fusion uniquement depuis `dev` (release) ou `hotfix/*`

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
    env_file: .env
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

| # | Étape | Livrable attendu |
|---|-------|-----------------|
| 1 | Config Docker Compose local | PostgreSQL + Redis démarrés |
| 2 | Entités TypeORM + migrations | Schéma BDD créé |
| 3 | Seed de données | Comptes admin + collaborateur de test |
| 4 | AuthModule (login + JWT) | `POST /api/auth/login` fonctionnel |
| 5 | Guards (JwtAuthGuard + RolesGuard) | Routes protégées |
| 6 | UsersModule | CRUD utilisateurs (admin) |
| 7 | ClientsModule (CRUD) | Gestion des dossiers clients |
| 8 | KycModule | Fiches KYC éditables |
| 9 | ScoringModule | Calcul et historique des scores |
| 10 | DocumentsModule | Upload + téléchargement sécurisé |
| 11 | AuditModule | Traçabilité de toutes les actions |
| 12 | Page login (frontend) | Connexion + redirection |
| 13 | Layout dashboard + useAuth | Navigation protégée |
| 14 | Page dashboard (vue globale) | SectionCards + liste clients |
| 15 | Pages clients (liste + fiche) | CRUD complet |
| 16 | Formulaire KYC | Édition inline dans la fiche client |
| 17 | Onglet documents | Upload + liste + téléchargement |
| 18 | Onglet scoring | Affichage + recalcul |
| 19 | Page admin | Gestion des utilisateurs |
| 20 | Tests unitaires backend | Couverture des services critiques |
| 21 | CI GitHub Actions | lint + tests + audit sur chaque PR |
| 22 | Config VPS + Nginx | Serveur accessible en HTTPS |
| 23 | docker-compose.yml production | Images construites et déployables |
| 24 | Workflow deploy.yml | Déploiement automatique sur staging |
| 25 | Release 1.0.0 | Merge dev → main + tag Git |
