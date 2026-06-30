# Contenu des diapositives — Soutenance CDA

> **Format :** ~45 slides · 40 min de présentation · 40 min de questions jury  
> **Rythme cible :** ~1 min par slide en moyenne  
> Chaque section `---` correspond à une diapositive.

---

## SLIDE 1 — Page de garde

**Titre :** QW-App — Application de gestion de la conformité LCB-FT

| | |
|---|---|
| Damien Paszkiewicz | |
| Formation CDA — Niveau 6 | MyDigitalSchool Angers |
| Stage : Cabinet QW | 2025–2026 |

---

## SLIDE 2 — Sommaire

1. Introduction
2. Parcours & projets réalisés
3. Contexte — Cabinet QW
4. Objectifs & périmètre
5. **Conception**
   - Méthodologie de travail & Outils
   - Acteurs & rôles (RBAC)
   - Base de données — MCD / MLD
   - Architecture technique
   - Choix technologiques
6. **Réalisation Backend**
   - Architecture
   - Authentification & guards
   - Migration · Entity · Seed
   - Create Client
   - Algorithme de scoring
7. **Réalisation Frontend**
   - Structure & routing
   - Protection des routes & proxy
   - Flux complet d'une requête
8. **Sécurité & Infrastructure**
   - Sécurité & conformité RGPD
   - Gestion des documents
   - Infrastructure de déploiement · Cartographie
   - Reverse proxy multi-applications
   - Pipeline CI/CD · Tests
9. **VPS monitor**
10. **Bilan**
    - Difficultés rencontrées & solutions
    - Compétences acquises (référentiel CDA)
    - Bilan & perspectives
    - Conclusion

---

## SLIDE 3 — Introduction

**Projets académiques :**
- My Digital Project — projet transverse pluridisciplinaire (design, cyber, dev, marketing)
- Travaux pratiques académiques
- Association sportive Saint Barth Volley — app web pour une association sportive bénévole

**Projets personnels :**
- Plateforme de déploiement multi-applications (pour VPS)
- Refactoring d'un Bot Discord
- Jeu de dé

**Stage :**
- Cabinet QW — Application LCB-FT (projet principal de ce dossier)

---

## SLIDE 4 — Parcours & projets réalisés

**Structure :** Cabinet d'expert comptable en conformité réglementaire et gestion des risques

**Activité :** Accompagnement des entreprises sur leurs obligations LCB-FT
> Lutte contre le Blanchiment de Capitaux et le Financement du Terrorisme

**Obligations réglementaires du cabinet :**
- Identifier et vérifier l'identité des clients (KYC — Know Your Customer)
- Évaluer et surveiller le niveau de risque de chaque dossier
- Conserver un historique des actions (traçabilité réglementaire)
- Signaler les opérations suspectes si nécessaire (Tracfin)

**Situation au démarrage du stage :**
- Gestion via fichiers **Excel** et documents partagés
- Pas d'outil centralisé ni de traçabilité formelle
- Données personnelles et financières peu protégées

---

## SLIDE 5 — Contexte — Cabinet QW

**Objectif principal :** Concevoir et développer une application web responsive de gestion de la conformité LCB-FT

**MVP livré :**
- ✅ Gestion des clients & dossiers (CRUD complet)
- ✅ KYC — structuration des données de connaissance client
- ✅ Scoring des risques — algorithme de calcul pondéré
- ✅ Gestion documentaire — upload, stockage, accès sécurisé
- ✅ Authentification JWT + gestion des rôles RBAC
- ✅ Audit trail — journalisation de toutes les actions

**Hors périmètre (explicitement exclu) :**
- ❌ Dashboards analytiques avancés
- ❌ Intégrations externes (OFAC, GAFI, API SIREN)
- ❌ Mise en production réelle (environnement de test uniquement)

**Contraintes :** durée du stage · RGPD · MVP prioritaire

---

## SLIDE 6 — Objectifs & périmètre

> **Comment centraliser, sécuriser et tracer la gestion des dossiers de conformité LCB-FT dans un outil unique et maintenable ?**

**Points douloureux identifiés :**

| Problème | Impact concret |
|---|---|
| Données dispersées (Excel, email, Drive) | Consolidation difficile, risque d'incohérences |
| Pas de traçabilité | Impossible de suivre l'historique des décisions |
| Données sensibles non sécurisées | Risque RGPD, données personnelles exposées |
| Processus non structurés | Qualité du suivi variable selon le collaborateur |
| Pas de gestion des rôles | N'importe qui accède à tout |

---

## SLIDE 7 — Conception

> _Section — diapositive de transition_

---

## SLIDE 8 — Méthodologie de travail & Outils

**Outils utilisés au quotidien :**

| Catégorie | Outils |
|---|---|
| Versioning & collaboration | GitHub — Issues, Pull Requests, GitHub Actions, branch protection |
| Éditeur | VS Code + ESLint, Prettier, GitLens, Docker |
| API & test | Insomnia, Supertest (e2e) |
| Conception | draw.io (cartographies), Merise (MCD/MLD) |
| Infra locale | Docker Desktop, Docker Compose |
| Communication | Documentation écrite, Teams, Whatsapp |

**Approche de développement — itérative par nature :**

```
Besoin identifié
    → Dev rapide pour valider le concept (sprint)
    → Ajout fonctionnalité
    → Nouveau cycle :
        Connaissance acquise en cours (Frameworks, sécurité, autre…)
        Refactoring pour aligner sur les bonnes pratiques
        Upgrade fonctionnalité → nouveau cycle
```

Développement en autonomie → Méthode agile adaptée.

---

## SLIDE 9 — Acteurs & rôles (RBAC)

**4 rôles avec des permissions distinctes**

| Rôle | Droits principaux |
|---|---|
| **Collaborateur** | Créer et modifier ses propres dossiers clients |
| **Responsable** | Valider les dossiers, superviser l'ensemble du portefeuille |
| **Expert-comptable** | Consulter tous les dossiers, analyse financière |
| **Admin** | Gestion des comptes, suppression (soft delete), configuration |

**Fonctionnalités par rôles :**

| Action | Collab | Resp | Expert | Admin |
|---|:---:|:---:|:---:|:---:|
| Créer un client | ✅ | ✅ | ✅ | ✅ |
| Lire tous les dossiers | ❌ | ✅ | ✅ | ✅ |
| Modifier le KYC | ✅ | ✅ | ✅ | ✅ |
| Valider un dossier | ❌ | ✅ | ✅ | ✅ |
| Supprimer (soft) | ❌ | ❌ | ❌ | ✅ |

---

## SLIDE 10 — Base de données — MCD

> _Visuel : MCD draw.io exporté en PNG_

---

## SLIDE 11 — Base de données — MLD

> _Visuel : MLD exporté en PNG_

---

## SLIDE 12 — Architecture technique

> _Visuel : cartographie technique (cartoTechnique.drawio)_

**Stack :**

| Couche | Technologie | Pourquoi |
|---|---|---|
| Frontend | Next.js + React 19 + Tailwind v4 | SSR, App Router, routing fichier |
| Backend | NestJS — API REST — TypeScript | Modulaire, robuste, testable |
| Base de données | PostgreSQL 16 + TypeORM | Relationnel, migrations, typage |
| Cache | Redis 7 | Scores en cache, TTL 1h |
| Fichiers | Stockage objet S3-compatible (EU) | RGPD, Presigned URLs |
| Serveur | VPS Linux — Nginx — Docker | Coût maîtrisé, contrôle total |

---

## SLIDE 13 — Choix technologiques

**Pourquoi Next.js plutôt qu'un SPA React classique ?**
- SSR natif → pas de flash de contenu non authentifié
- Middleware serveur → protection des routes **avant** le rendu
- Proxy API intégré → `BACKEND_URL` jamais exposé au navigateur

**Pourquoi PostgreSQL ?**
- Données structurées avec relations fortes (CLIENT ↔ KYC, FK multiples)
- Contraintes d'intégrité au niveau base (UNIQUE, FK, NOT NULL)
- Transactions ACID → cohérence indispensable pour des données réglementaires

**Pourquoi NestJS plutôt qu'Express brut ?**
- Architecture modulaire → code organisé par domaine métier
- Injection de dépendances → services testables unitairement
- Décorateurs `@Guard`, `@Roles` → sécurité déclarative et lisible

**Pourquoi JWT en cookie plutôt que localStorage ?**
- `localStorage` accessible par tout script JS → vulnérable au XSS
- Cookie `httpOnly` → inaccessible en JavaScript même en cas d'injection de script

---

## SLIDE 14 — Réalisation Backend

> _Section — diapositive de transition_

---

## SLIDE 15 — Backend — Architecture

**7 modules avec séparation des responsabilités :**

| Module | Controller | Service | Entité |
|---|---|---|---|
| AuthModule | `POST /auth/login` | Vérifie email & bcrypt, signe JWT | — |
| UsersModule | CRUD users | Gestion comptes & rôles | `User` |
| ClientsModule | CRUD clients | Cycle de vie, soft delete | `Client` |
| KycModule | Lecture/MAJ KYC | Structuration données | `Kyc` |
| DocumentsModule | Upload / download | Presigned URL | `Document` |
| ScoringModule | Calcul score | Algorithme & cache Redis | `RiskScore` |
| AuditModule | — (interne) | Log chaque action métier | `AuditLog` |

**Ordre de développement par ressource :**
1. **Migration** : Crée/modifie le schéma en base → `database/migrations/<timestamp>-NomMigration.ts`
2. **Entity** : Mappe la table en objet TypeScript → `<module>/entities/<nom>.entity.ts`
3. **Seed** : Peuple la base avec des données initiales → `database/seed.ts`
4. **DTO** : Valide et type le body des requêtes → `<module>/dto/create-<nom>.dto.ts`
5. **Service** : Contient la logique métier → `<module>/<nom>.service.ts`
6. **Controller** : Reçoit la requête HTTP, délègue au service → `<module>/<nom>.controller.ts`
7. **Page Next.js** : Affiche les données au client → `app/dashboard/<nom>/page.tsx`

---

## SLIDE 16 — Backend — Authentification & guards

**Flux de login :**

```
POST /api/auth/login { email, password }
  → UsersService.findByEmail()
  → bcrypt.compare(password, hash)     ← jamais le mdp en clair en base
  → si isActive: false → rejeté        ← avant même la vérification du hash
  → JwtService.sign({ id, role })      ← payload minimal
  → cookie qw_token (httpOnly, Secure)
```

**Protection sur chaque endpoint :**

```typescript
@Roles(Role.RESPONSABLE, Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Patch(':id/validate')
validate(@Param('id') id: string) { ... }
```

- `JwtAuthGuard` → vérifie et décode le token Bearer, injecte `{ id, role }` dans la requête
- `RolesGuard` → vérifie que `user.role` est dans `@Roles(…)`
- Erreur → **401** (non authentifié) ou **403** (rôle insuffisant)

---

## SLIDE 17 — Backend — Migration

> `database/migrations/<timestamp>-NomMigration.ts`

La migration **versionne** le schéma SQL dans git. Elle est la seule source de vérité pour la structure de la BDD.

```typescript
export class CreateClient1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'client',
      columns: [
        { name: 'id',         type: 'uuid',      isPrimary: true, generationStrategy: 'uuid' },
        { name: 'first_name', type: 'varchar' },
        { name: 'email',      type: 'varchar',   isUnique: true },
        { name: 'ref',        type: 'varchar' },           // QW-2025-001
        { name: 'deleted_at', type: 'timestamp', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('client');                  // rollback possible
  }
}
```

```bash
npm run typeorm migration:generate -- -n CreateClient   # génère depuis les entités
npm run typeorm migration:run                           # applique
npm run typeorm migration:revert                        # rollback
```

⚠️ `synchronize: false` en production — la migration est l'unique source de vérité.

---

## SLIDE 18 — Backend — Entity

> `<module>/entities/<nom>.entity.ts`

L'entité mappe la table en objet TypeScript. TypeORM lit ses décorateurs pour générer les requêtes SQL.

```typescript
@Entity('client')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  ref: string;                          // QW-2025-001

  @OneToOne(() => Kyc, { cascade: true })
  @JoinColumn()
  kyc: Kyc;                             // relation 1-1, créée en même temps

  @ManyToOne(() => User)
  creator: User;                        // qui a créé ce dossier

  @DeleteDateColumn()
  deletedAt: Date | null;               // soft delete — rétention 5 ans LCB-FT

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

---

## SLIDE 19 — Backend — Seed

> `database/seed.ts`

Le seed peuple la base avec des données reproductibles pour les tests et la démonstration.

```typescript
async function seed(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);

  await userRepo.save([
    {
      email: 'admin@qwapp.fr',
      passwordHash: await bcrypt.hash('Admin1234!', 12),
      role: Role.ADMIN,
      isActive: true,
    },
    {
      email: 'collab@qwapp.fr',
      passwordHash: await bcrypt.hash('Collab1234!', 12),
      role: Role.COLLABORATEUR,
      isActive: true,
    },
  ]);
  console.log('Seed terminé ✓');
}
```

```bash
npm run seed
```

---

## SLIDE 20 — Backend — Create Client

**Exemple de CRUD complet — DTO → Service → Controller**

```typescript
// DTO
export class CreateClientDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsEmail()                email: string;
}

// Service
async create(dto: CreateClientDto, creatorId: string) {
  const ref = await this.generateRef();        // QW-2025-001
  const kyc = this.kycRepo.create({});         // fiche KYC vide liée
  const client = await this.clientRepo.save({ ...dto, ref, kyc, creatorId });
  await this.auditService.log(creatorId, 'CREATE', 'CLIENT', client.id);
  return client;
}

// Controller
@Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.EXPERT, Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Post()
create(@Body() dto: CreateClientDto, @Req() req) {
  return this.clientsService.create(dto, req.user.id);
}
```

---

## SLIDE 21 — Backend — Algorithme de scoring

**Calcul du niveau de risque LCB-FT (0 à 100 points)**

| Critère | Points |
|---|:---:|
| PEP — Personne Politiquement Exposée | +30 |
| Pays à haut risque (listes GAFI) | +25 |
| Secteur sensible (crypto, casino, forex, luxe, immobilier) | +20 |
| Chiffre d'affaires > 500 000 € | +10 |

**Niveaux de risque :**

| Score | Niveau | Action recommandée |
|:---:|---|---|
| 0 – 33 | 🟢 FAIBLE | Surveillance standard |
| 34 – 66 | 🟡 MOYEN | Diligences renforcées |
| 67 – 100 | 🔴 ÉLEVÉ | Vigilance accrue + signalement possible |

**Implémentation :**
- Résultat persisté en base avec horodatage (historique des réévaluations)
- Cache Redis : clé `scoring:<clientId>`, TTL 3 600 s
- Invalidation du cache à chaque mise à jour KYC

---

## SLIDE 22 — Réalisation Frontend

> _Section — diapositive de transition_

---

## SLIDE 23 — Frontend — Structure & routing

**App Router — pages développées :**

```
app/
├── login/                    → formulaire + redirection par rôle post-connexion
└── dashboard/
    ├── layout.tsx            → SidebarProvider + AppSidebar
    ├── clients/
    │   ├── page.tsx          → listing des clients
    │   ├── new/page.tsx      → formulaire de création
    │   └── [id]/page.tsx     → détail : KYC + scoring + docs + historique
    ├── scoring/page.tsx      → suivi des niveaux de risque
    ├── collaborateur/page.tsx
    ├── responsable/page.tsx
    └── admin/page.tsx
```

**Design system :** shadcn/ui (Radix UI + Tailwind v4) + icônes Tabler

---

## SLIDE 24 — Frontend — Dashboard Admin

> _Visuel : capture d'écran du dashboard admin_

---

## SLIDE 25 — Frontend — Protection des routes & proxy

**Middleware Next.js (`proxy.ts`) — côté serveur, avant rendu :**

```typescript
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('qw_token')?.value;
  const payload = token ? decodeToken(token) : null;
  const isAuthenticated = !!payload && payload.exp * 1000 > Date.now();

  if (pathname === '/') {
    return isAuthenticated
      ? NextResponse.redirect(new URL(getDashboardPath(payload!.role), request.url))
      : NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

function getDashboardPath(role: string): string {
  const paths: Record<string, string> = {
    ADMIN:          '/dashboard/admin',
    RESPONSABLE:    '/dashboard/responsable',
    COLLABORATEUR:  '/dashboard/collaborateur',
  };
  return paths[role] ?? '/dashboard';
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],  // routes concernées uniquement
};
```

**Proxy API (`/api/[...path]/route.ts`) :**
- Toutes les requêtes API transitent par le serveur Next.js
- `BACKEND_URL` interne jamais exposé dans le navigateur
- `apiFetch` : lit le cookie → injecte `Authorization: Bearer <token>`

**Pourquoi créer un middleware ?**
- Un guard `useEffect` côté client → la page s'affiche une fraction de seconde avant la redirection (flash de contenu)
- Le middleware s'exécute **sur le serveur Edge** → aucun HTML n'est envoyé si non authentifié

---

## SLIDE 26 — Flux complet d'une requête

**`GET /api/clients` et `GET /api/clients/:id` — Diagramme de séquence**

```
1. Browser          → GET /dashboard/clients/abc-123
2. Middleware       → lit qw_token → payload valide → laisse passer
3. Page Next.js     → appelle apiFetch("/api/clients/abc-123")
4. Proxy Next.js    → forward → GET /clients/abc-123 (NestJS)
                       + Authorization: Bearer <token>
5. JwtAuthGuard     → vérifie signature JWT → user { id, role: COLLABORATEUR }
6. RolesGuard       → COLLABORATEUR autorisé sur cet endpoint ✅
7. ClientsService   → TypeORM → SELECT … WHERE id = ? AND deletedAt IS NULL
8. AuditService     → INSERT audit_logs (action=READ, entiteId=abc-123, …)
9. Response JSON    → page Next.js → rendu → navigateur
```

> _Visuel : diagramme de séquence_

---

## SLIDE 27 — Dashboard Admin — Clients

> _Visuel : capture d'écran de la liste des clients_

---

## SLIDE 28 — Sécurité & Infrastructure

> _Section — diapositive de transition_

---

## SLIDE 29 — Sécurité & conformité RGPD

**Sécurité applicative :**

| Menace | Protection |
|---|---|
| XSS | Cookie `httpOnly` + échappement natif React |
| Injection SQL | TypeORM — requêtes paramétrées exclusivement |
| Accès non autorisé | Double guard NestJS (JWT + RBAC) |
| CORS | Restreint à `FRONTEND_URL` uniquement |
| Énumération de comptes | Même message d'erreur email/mdp |

**Sécurité serveur :**
- SSH : clé uniquement, root désactivé
- UFW : ports 22, 80, 443 uniquement
- HTTPS : certificat TLS via Nginx

**RGPD :**
- Soft delete → rétention 5 ans (obligation LCB-FT)
- Minimisation des données collectées
- Audit trail complet sur toutes les actions (accountability)
- Documents : chiffrés au repos (AES-256 SSE) et en transit (TLS)

---

## SLIDE 30 — Gestion des documents

**Problématique :** fichiers sensibles — KYC, pièces d'identité, bilans financiers…

**Architecture : stockage objet S3-compatible hébergé en UE**

| Fournisseur | Localisation | Coût estimé |
|---|---|:---:|
| Scaleway Object Storage | Paris (France) | ~15–20 €/mois / 200 Go |
| Hetzner Object Storage | Nuremberg (Allemagne) | ~4 €/mois / 1 To |

**Fonctionnement (Presigned URLs) :**

```
Client → GET /api/documents/:id/download
Backend → vérifie JWT + rôle + appartenance dossier
        → INSERT audit_logs (action=READ)
        → génère Presigned URL (TTL 15 min)
        → retourne l'URL au client
Client → télécharge directement depuis S3
```

- Bucket **privé** — aucune URL permanente accessible
- Table `documents` : uniquement les **métadonnées** (pas le binaire en base)
- Deux buckets distincts `staging` / `prod` — aucune donnée réelle en test

---

## SLIDE 31 — Infrastructure & déploiement

**Architecture multi-applications sur un seul VPS :**

```
Internet → HTTPS → Nginx (reverse proxy)
                      ├── /qw-app/              → :3006 (Next.js)
                      ├── /collegelaboussole/   → :3007
                      ├── /saintbarthvolley/    → :3001
                      └── ...
```

**Services Docker — qw-app :**

| Conteneur | Image | Port hôte |
|---|---|:---:|
| `qw-app-frontend` | Build custom | 127.0.0.1:3006 |
| `qw-app-backend` | Build custom | 127.0.0.1:3008 |
| `qw-app-postgres` | `postgres:16-alpine` | interne uniquement |
| `qw-app-redis` | `redis:7-alpine` | interne uniquement |

---

## SLIDE 32 — Cartographie de déploiement

> _Visuel : cartographie de déploiement (cartoDeploiement.drawio)_

---

## SLIDE 33 — Nginx — Reverse proxy multi-applications (1/2)

**Un seul point d'entrée pour toutes les applications — zéro port exposé sauf 80 et 443**

```
Internet
    │ HTTPS :443
    ▼
Nginx (reverse proxy)
    ├── qw-app.domaine.fr      → 127.0.0.1:3006  (Next.js)
    ├── monitor.domaine.fr     → 127.0.0.1:3000  (vps-monitor)
    ├── saintbarthvolley.fr    → 127.0.0.1:3001
    └── cinemap.domaine.fr     → 127.0.0.1:3002

Tous les backends Docker bindés sur 127.0.0.1 uniquement — invisibles de l'extérieur
```

---

## SLIDE 34 — Nginx — Reverse proxy multi-applications (2/2)

**Configuration Nginx — qw-app :**

```nginx
server {
    listen 80;
    server_name qw-app.domaine.fr;
    return 301 https://$host$request_uri;      # HTTP → HTTPS forcé
}

server {
    listen 443 ssl;
    server_name qw-app.domaine.fr;

    ssl_certificate /etc/letsencrypt/live/domaine.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domaine.fr/privkey.pem;

    # Frontend Next.js
    location / {
        proxy_pass http://127.0.0.1:3006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**SSL — Let's Encrypt (certbot) :**
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d domaine.fr   # certificat gratuit, renouvelé automatiquement
```

**Reload sans interruption de service :**
```bash
nginx -t && kill -HUP $(cat /run/nginx.pid)
# Vérifie la config → recharge sans couper les connexions actives
# vps-monitor utilise cette commande pour les mises à jour dynamiques de routes
```

**Sécurité serveur :**

| Règle UFW | Ports ouverts |
|---|:---:|
| SSH | 22 |
| HTTP | 80 (redirection vers HTTPS) |
| HTTPS | 443 |
| **Tout le reste** | **bloqué** |

---

## SLIDE 35 — Pipeline CI/CD

**Intégration continue (CI) — hooks locaux (Husky) :**
- `pre-commit` → lint-staged (lint + Prettier sur les fichiers modifiés)
- `commit-msg` → commitlint (Conventional Commits)

**Déploiement continu (CD) — entièrement automatisé :**

```
Push → branche staging
  └→ GitHub Actions (staging.yml)
       └→ curl POST /api/webhook/deploy (Bearer token)
            └→ vps-monitor
                 ├→ git pull
                 ├→ docker compose build
                 ├→ docker compose up -d
                 └→ healthcheck HTTP (toutes les 2s, timeout 30s)
                      └→ success / failed + durée + logs WebSocket
```

**Branches Git (Git Flow simplifié) :**

| Branche | Rôle |
|---|---|
| `main` | Version stable |
| `staging` | Test + déploiement automatique VPS |
| `dev` | Intégration des développements |
| `feat/*` / `fix/*` | Fonctionnalités et correctifs |

---

## SLIDE 36 — Tests

**Stratégie : tests unitaires + tests e2e**

**Tests unitaires (Jest) avec mocks des dépendances :**

| Fichier | Ce qui est testé |
|---|---|
| `scoring.service.spec.ts` | Algorithme pondéré — 5 cas de figure |
| `clients.service.spec.ts` | CRUD + soft delete |
| `kyc.service.spec.ts` | Création et mise à jour KYC |
| `documents.service.spec.ts` | Upload de métadonnées |
| `audit.service.spec.ts` | Enregistrement des actions |

**Cas de test — scoring :**

| Situation | Score | Niveau |
|---|:---:|---|
| Aucun facteur | 0 | 🟢 FAIBLE |
| PEP seul | 30 | 🟢 FAIBLE |
| PEP + pays haut risque | 55 | 🟡 MOYEN |
| PEP + pays + secteur crypto | 75 | 🔴 ÉLEVÉ |
| Tous les critères | 85 | 🔴 ÉLEVÉ |

**Tests e2e :** SuperTest (`app.e2e-spec.ts`) — `/auth/login`, protections 401/403

**Rapport de couverture :** `npm run test:cov` → export LCOV/Clover

---

## SLIDE 37 — VPS monitor

> _Section — diapositive de transition_

---

## SLIDE 38 — vps-monitor — Projet transverse

> **TODO** — à compléter

> _Visuel : cartoVpsMonitor.drawio_

**Rôle dans ce projet :** vps-monitor orchestre le déploiement côté VPS

**Architecture :**
```
vps-monitor (Node.js / Express 5)
├── deploy.js    → pipeline git pull → build → healthcheck
├── nginx.js     → gestion dynamique Nginx (ajout/suppression routes)
├── docker.js    → opérations conteneurs via Dockerode
├── metrics.js   → CPU/RAM temps réel (Docker stats)
└── registry.js  → registre JSON des projets (apps.json)
```

**Fonctionnalités clés :**
- Registre des applications (`apps.json`) — persistant
- **Log streaming temps réel** via WebSocket (jeton à usage unique)
- Monitoring conteneurs : CPU, RAM, statut running/stopped
- Gestion Nginx dynamique sans redémarrage (`kill -HUP`)
- Webhook CD authentifié par Bearer token

**Pipeline de déploiement :**

```
Développeur
    │ git push origin staging
    ▼
GitHub Actions
    │ curl POST /api/webhook/deploy (Bearer token)
    ▼
vps-monitor
    ├→ git pull
    ├→ docker compose build
    ├→ docker compose up -d
    └→ healthcheck HTTP (toutes les 2s, timeout 30s)
         ├── success → 200 renvoyé à GitHub Actions ✅
         └── failed  → 500 — anciens conteneurs toujours en place ✅
```

**Applications gérées :** qw-app · CollegeLaBoussole · SaintBarthVolley · Lucky7 · CineMap · TP Vue

---

## SLIDE 39 — Bilan

> _Section — diapositive de transition_

---

## SLIDE 40 — Difficultés rencontrées & solutions

**Défi principal : apprentissage majoritairement en autonomie**

| Difficulté | Solution apportée |
|---|---|
| Token JWT en localStorage → vulnérable XSS | Migré vers cookie `httpOnly` |
| Déploiement SSH manuel chronophage | Pipeline webhook vps-monitor automatisé |
| Pas de protection des routes côté serveur | Middleware Next.js (`proxy.ts`) |
| Hésitations sur l'architecture initiale | Itérations successives + documentation des choix |
| Pas de feedback technique externe | Tests unitaires comme filet de sécurité |

**Ce que ça m'a appris :**
- Anticiper les enjeux de sécurité **dès la conception**, pas après
- La valeur des migrations versionnées vs `synchronize: true`
- Qu'une bonne infrastructure (vps-monitor) facilite le développement au quotidien

---

## SLIDE 41 — Compétences acquises (référentiel CDA) — 1/2

| Bloc CDA | Ce que j'ai mis en œuvre |
|---|---|
| **Installer et configurer son environnement de travail en fonction du projet** | Node.js 20 + Docker Compose (PostgreSQL + Redis) en local · VS Code + ESLint, Prettier, GitLens · Husky + commitlint + lint-staged · `.env` par service + `.env.example` commité |
| **Développer des interfaces utilisateur** | Next.js 16 + React 19 + Tailwind v4 + shadcn/ui (Radix UI) · App Router · Server & Client Components · Formulaires validés Zod + React Hook Form · Design responsive |
| **Développer des composants métier** | 7 modules NestJS (Auth, Clients, KYC, Scoring, Documents, Audit, Prospects) · Algorithme de scoring LCB-FT pondéré · Machine à états prospect → client · Guards RBAC déclaratifs |
| **Contribuer à la gestion d'un projet informatique** | GitHub Issues + branches `feat/<issue>` par fonctionnalité · PRs avec CI obligatoire · Git Flow (main / dev / staging) · `CONTRIBUTING.md`, `CHANGELOG.md`, `INSTALL.md` · Conventional Commits avec référence d'issue |
| **Analyser les besoins et maquetter une application** | Analyse du contexte cabinet QW (Excel → LCB-FT) · Définition du MVP et périmètre · Cartographies fonctionnelle + technique + déploiement (draw.io) · Merise : MCD → MLD → MPD |
| **Définir l'architecture logicielle d'une application** | Architecture 3-couches NestJS (Controller / Service / Repository) · Monolithe modulaire · BFF pattern (API Routes Next.js) · Choix justifiés : NestJS vs Express, PostgreSQL vs MongoDB, cookie vs localStorage |

---

## SLIDE 42 — Compétences acquises (référentiel CDA) — 2/2

| Bloc CDA | Ce que j'ai mis en œuvre |
|---|---|
| **Concevoir et mettre en place une base de données relationnelle** | PostgreSQL 16 · 7 entités, UUID, soft delete, relations 1-1 / 1-N / N-N · Migrations TypeORM versionnées (`synchronize: false`) · Index sur `statut` et `deleted_at` |
| **Développer des composants d'accès aux données SQL et NoSQL** | TypeORM (SQL) : migrations, repository pattern, QueryBuilder · Redis (NoSQL) : cache scoring TTL 3 600 s, invalidation sur PATCH KYC · Relations OneToOne / ManyToOne / OneToMany |
| **Préparer et exécuter les plans de tests d'une application** | Jest : tests unitaires avec mocks sur 5 services (Scoring, Clients, KYC, Documents, Audit) · 5 scénarios de scoring couverts · Supertest : e2e `/auth/login` + protections 401/403 · `npm run test:cov` → rapport LCOV |
| **Préparer et documenter le déploiement d'une application** | `README.md`, `INSTALL.md`, `CONTRIBUTING.md` · `docker-compose.yml` prod + `.env.example` · Scripts `deploy.sh` / `start.sh` / `backup.sh` · `workflow.md` complet (procédures de 0 au déploiement) |
| **Contribuer à la mise en production dans une démarche DevOps** | GitHub Actions : lint + tests + audit + docker-build en parallèle · Déploiement automatique via webhook vps-monitor sur push `staging` · Docker multi-stage (images légères) · Nginx reverse proxy + HTTPS Let's Encrypt · Monitoring CPU/RAM temps réel (vps-monitor) |

---

## SLIDE 43 — Bilan & perspectives

**Objectifs atteints :**
- MVP fonctionnel et déployé en environnement de test
- Pipeline CI/CD opérationnel de bout en bout
- Sécurité correcte (JWT + RBAC + RGPD)
- Infrastructure réutilisable pour d'autres projets (vps-monitor)

**Axes d'amélioration identifiés :**
- Cookie `Secure` + refresh token (expiration courte du JWT)
- Rate limiting sur `/auth/login`
- Tests e2e sur base de données de test dédiée
- Dashboards analytiques, alertes automatiques, imports CSV/Excel

**Perspectives :**
- Poursuite en Master développement full-stack — MyDigitalSchool Angers
- Rejoindre une équipe pour progresser au contact d'autres développeurs

---

## SLIDE 44 — Conclusion

> Ce projet couvre l'intégralité du cycle de vie d'une application :
> **besoin métier → conception → développement → sécurité → déploiement**

**Trois points forts à retenir :**

1. **Réponse à un besoin réel** — solution qui remplace des Excels dans un contexte réglementaire exigeant (LCB-FT)
2. **Stack moderne et cohérente** — Next.js + NestJS + PostgreSQL + Docker, chaque choix technologique justifié
3. **Infrastructure maîtrisée de bout en bout** — du code au serveur, y compris le pipeline de déploiement

---

## SLIDE 45 — Questions

**Merci pour votre attention.**

> Des questions ?

_damien.paszkiewicz@live.fr_

---
---

# Préparation aux 40 minutes de questions

> Avec 40 minutes de questions, le jury va aller très loin techniquement.  
> Ces réponses sont à connaître par cœur.

---

## Base de données

**Pourquoi UUID et pas un entier auto-incrémenté ?**
> Les UUIDs ne sont pas prédictibles : un attaquant ne peut pas deviner l'ID d'un autre client en incrémentant de 1. Essentiel pour des données réglementaires et financières sensibles.

**Qu'est-ce que le soft delete et pourquoi l'avoir choisi ?**
> Plutôt que de supprimer physiquement la ligne, on remplit `deleted_at`. L'obligation LCB-FT impose une conservation 5 ans après la fin de la relation. TypeORM gère ça nativement avec `@DeleteDateColumn()` — les requêtes `findOne` excluent automatiquement les soft-deleted.

**Pourquoi des migrations plutôt que `synchronize: true` ?**
> En production, `synchronize: true` peut modifier le schéma automatiquement et détruire des données (rename de colonne, drop de table…). Les migrations sont versionnées, relisables, réversibles. On sait exactement ce qui est exécuté sur chaque environnement.

**Pourquoi deux tables CLIENT et KYC séparées ?**
> La contrainte `UNIQUE` sur `kyc.id_client` impose la relation 1-1. On sépare les responsabilités : les données d'identité (KYC) évoluent indépendamment des données de dossier (statut, référence, validateur). Ça facilite aussi les droits : modifier le KYC sans toucher aux données de dossier.

**Qu'est-ce qu'un index et pourquoi en mettre sur `clients.statut` et `clients.deleted_at` ?**
> Un index accélère les requêtes `WHERE` sur la colonne indexée. `statut` est filtré constamment (lister les dossiers `en_cours`). `deleted_at` est utilisé par TypeORM pour exclure les soft-deleted. Sans index, PostgreSQL scanne toute la table à chaque requête.

---

## Sécurité

**Pourquoi cookie plutôt que localStorage pour le JWT ?**
> `localStorage` est accessible par tout JavaScript de la page — une attaque XSS peut voler le token. Un cookie `httpOnly` est inaccessible aux scripts JS côté client, même en cas d'injection. C'est la recommandation OWASP.

**Comment fonctionne le RBAC exactement ?**
> Deux guards en cascade. `JwtAuthGuard` (Passport-JWT) vérifie la signature du token et injecte `{ id, role }` dans la requête. `RolesGuard` lit `@Roles(Role.RESPONSABLE, Role.ADMIN)` et compare avec `user.role`. Si ça ne correspond pas → 403 Forbidden.

**Qu'est-ce qu'une Presigned URL ?**
> Le backend génère une URL signée cryptographiquement, valide 15 minutes. Le client télécharge directement depuis S3 sans repasser par le backend — évite de charger le serveur avec des transferts lourds. Après 15 min, l'URL est invalide même si elle fuite. Le bucket reste privé.

**Que se passe-t-il si le token JWT expire ?**
> Le middleware Next.js vérifie `payload.exp * 1000 > Date.now()` avant chaque page. `apiFetch` redirige vers `/login` sur tout retour 401. Session expirée proprement. Axe d'amélioration V2 : refresh token avec access token à courte durée de vie.

**Pourquoi le même message d'erreur pour email inconnu et mauvais mot de passe ?**
> Éviter l'énumération de comptes : des messages différents permettent à un attaquant de construire une liste d'emails valides.

**Qu'est-ce que le CORS et comment tu l'as configuré ?**
> Cross-Origin Resource Sharing — mécanisme du navigateur qui bloque les requêtes inter-origines. NestJS n'accepte que les requêtes venant de `FRONTEND_URL` (variable d'environnement). En pratique, seul le proxy Next.js peut appeler le backend.

---

## Architecture & choix techniques

**Pourquoi Next.js App Router et pas Pages Router ?**
> L'App Router permet les React Server Components, le middleware natif pour la protection des routes avant rendu, et une meilleure gestion du cache. C'est la direction actuelle de l'écosystème Next.js.

**Pourquoi NestJS et pas Express directement ?**
> NestJS impose une structure (modules, services, controllers, DTOs) qui évite le code spaghetti. L'injection de dépendances facilite les tests unitaires (mocks faciles). Pour 7 domaines métier distincts, c'est beaucoup plus maintenable.

**Pourquoi PostgreSQL plutôt que MongoDB ?**
> Données structurées avec relations fortes (CLIENT ↔ KYC, FK multiples). Contraintes d'intégrité au niveau base (UNIQUE, FK, NOT NULL). Transactions ACID — cohérence indispensable pour des données réglementaires.

**Pourquoi Redis pour le cache du scoring ?**
> Redis est en mémoire → latence microseconde vs millisecondes pour PostgreSQL. Le score est coûteux à recalculer et peu volatile — il change uniquement si le KYC est modifié. TTL 1h est un bon compromis fraîcheur/performance.

**Le backend est-il accessible depuis Internet ?**
> Non. Le backend tourne sur `:3008` bindé sur `127.0.0.1` — invisible depuis l'extérieur. Nginx ne route que le frontend. Toutes les requêtes API passent par le proxy Next.js.

**Qu'est-ce qu'un DTO ?**
> Data Transfer Object — classe TypeScript décorée avec `class-validator` qui définit la forme attendue du body d'une requête. Le `ValidationPipe` global valide automatiquement : types, longueurs, formats. `whitelist: true` supprime les champs non déclarés, `forbidNonWhitelisted: true` rejette la requête si un champ inconnu est présent.

---

## CI/CD & Infrastructure

**Pourquoi VPS et pas Vercel + Railway ou autre PaaS ?**
> Coût maîtrisé (~5€/mois pour 6 applications vs 30–50€ sur PaaS), contrôle total de la configuration réseau et serveur. Contrepartie : la maintenance de l'infra est à ma charge.

**Comment fonctionne le webhook de déploiement ?**
> GitHub Actions envoie un `POST /api/webhook/deploy` avec un `Authorization: Bearer <token>` (secret GitHub). vps-monitor vérifie le token, puis exécute localement : `git pull → docker compose build → docker compose up -d → healthcheck HTTP (2s/30s timeout)`.

**Que se passe-t-il si le build Docker échoue ?**
> vps-monitor retourne un statut `failed`. Les logs sont persistés et accessibles via WebSocket. Les anciens conteneurs continuent à tourner — le déploiement raté ne met pas hors service l'application existante.

**Pourquoi Docker et pas Node.js direct sur le VPS ?**
> Isolation des dépendances entre 6 applications (chacune a ses propres versions), reproductibilité exacte entre dev et staging, healthchecks et restart automatique natifs.

---

## Tests

**Pourquoi des mocks dans les tests unitaires ?**
> Pour isoler le service testé. Un test unitaire doit être rapide, déterministe, sans effets de bord. Une connexion PostgreSQL défaillante ne doit pas faire échouer le test de l'algorithme de scoring.

**Quelle est la limite des tests avec mocks ?**
> Les mocks peuvent diverger du comportement réel. Si le schéma change, les tests continuent de passer alors que l'app est cassée. D'où la nécessité de tests e2e avec une base dédiée — c'est un axe d'amélioration identifié.

---

## Métier & RGPD

**Qu'est-ce que le LCB-FT concrètement ?**
> Lutte contre le Blanchiment de Capitaux et le Financement du Terrorisme. Les professionnels assujettis ont l'obligation d'identifier leurs clients (KYC), d'évaluer leur niveau de risque, de surveiller les opérations et de déclarer les opérations suspectes à Tracfin.

**Qu'est-ce qu'un PEP ?**
> Personne Politiquement Exposée : personne exerçant ou ayant exercé une fonction publique importante (chef d'État, ministre, dirigeant d'organisme international…). La réglementation impose une vigilance renforcée — risque de corruption plus élevé.

**Pourquoi 5 ans de conservation des données ?**
> Obligation légale LCB-FT (article L.561-12 du Code monétaire et financier) : 5 ans à compter de la fin de la relation d'affaires. D'où le soft delete — on ne peut pas supprimer physiquement même si le client le demande.

**Comment tu concilies droit à l'effacement RGPD et obligation LCB-FT ?**
> L'obligation légale (article 17.3.b du RGPD) prime sur le droit à l'effacement. Le soft delete permet de masquer le dossier de l'interface sans le détruire. Après 5 ans, la suppression physique peut intervenir.

---

## Tips pour l'oral

- **Exporter les draw.io en PNG** avant de construire les slides : `cartoTechnique.drawio`, `cartoDeploiement.drawio`, `cartoVpsMonitor.drawio`, `mcd.drawio`
- **Préparer une démo** ou des captures d'écran annotées — le jury voudra voir l'application tourner
- **Assumer les limites** : "Je n'ai pas implémenté X, voici pourquoi, voici comment je le ferais en V2" vaut mieux qu'éluder
- **40 min de questions** : le jury reviendra sur chaque slide — avoir une réponse précise sur tous les "pourquoi ce choix ?"
- **Pour les questions imprévues** : si tu ne sais pas, dis-le honnêtement et explique comment tu chercherais
