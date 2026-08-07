# Changelog

## [0.4.0] - 2026-08-05

Finalisation du pipeline prospect → lettre de mission (branche `feat/145-planning`) : le questionnaire LAB, l'archivage des refus, la préparation de la lettre de mission et son circuit de validation sont désormais bouclés de bout en bout, avec les automatisations de statut kanban qui vont avec.

### Questionnaire d'acceptation (LAB)

- Boutons **« Tout cocher »** (Oui / Non) et **« Tout décocher »**, appliqués par module plutôt que globalement — chaque onglet (Caractéristiques clients, Activités et secteurs, Localisation, Nature mission, Opérations particulières) a ses trois actions
- **Réouverture** d'un questionnaire validé/refusé (`PATCH /api/questionnaires/:id/rouvrir`, réservé RESPONSABLE/EXPERT_COMPTABLE/ADMIN) pour la reprise annuelle LAB — l'ancien état (réponses, décision, auteur) est archivé dans `AuditLog` avant réinitialisation
- Scoring automatique : critère « secteur sensible » élargi aux négociants en biens de grande valeur (bijoutier, objets de luxe, véhicules/bateaux de luxe), aux néo-banques et aux opérations sur cryptoactifs du module 5 ; critère « pays tiers » élargi aux deux signaux transnationaux du module 5/4 (société hors UE sans justification, transmission de patrimoine transnationale) — ces questions n'avaient jusque-là aucun effet sur le score
- Seuils de niveau de risque resserrés : **MOYEN** à partir de 30 (au lieu de 34), **ÉLEVÉ** à partir de 60 (au lieu de 67)

### Automatisation du pipeline Kanban

- Un questionnaire **validé** fait avancer automatiquement le prospect en `LM_A_FAIRE`
- Un questionnaire **refusé** bascule automatiquement le prospect en `REFUSE` (jusque-là, il fallait une action manuelle séparée pour que ça se voie dans le Kanban)
- La **signature de l'expert-comptable** sur une lettre de mission fait avancer automatiquement le prospect en `LM_ENVOYEE`
- Ces transitions ne font jamais régresser un prospect déjà plus avancé, et n'affectent jamais un prospect déjà `CONVERTI` (`common/prospect-kanban.util.ts`)
- Statut kanban modifiable directement depuis la fiche prospect (dropdown d'en-tête + étapes cliquables dans le panneau « Étapes Kanban »), y compris pour revenir en arrière depuis `REFUSE` — jusque-là seul le drag-and-drop du board le permettait
- Statut kanban également modifiable en ligne depuis la vue tableau des prospects (menu déroulant par ligne, au lieu d'un badge en lecture seule)
- `CONVERTI` (« Clients LM validées ») est désormais un statut kanban comme les autres, toujours librement déplaçable (dropdown, tableau, drag-and-drop) — y compris pour en sortir un prospect déjà réellement converti. Le statut kanban ne déclenche jamais la conversion réelle (création du `Client`) ni n'en dépend ; seuls les autres champs (identité, assignation…) restent verrouillés une fois un `Client` réellement lié (`prospect.client`)
- Archivage automatique : un prospect resté en `REFUSE` plus de 7 jours est soft-delete par un job quotidien (`ProspectsService.archiverProspectsRefuses`, `@Cron`), après ajout du champ `refusedAt`

### Lettre de mission — préparation dès le prospect

- `Mission` et `LettreMission` peuvent désormais être rattachées à un **`Prospect`** en plus d'un `Client` (`id_client`/`id_prospect` exclusifs, contrainte `CHECK` en base) — la lettre de mission peut être préparée dès la validation LAB, avant conversion
- Nouveau circuit de validation à trois étapes, aligné sur les rôles : le **collaborateur** prépare/modifie (type, honoraires, répartition des travaux), le **responsable** valide (`PATCH /api/lettres-mission/:id/valider`, nouveaux champs `valideeParResponsable`/`valideeAt`/`id_valide_par`), puis l'**expert-comptable** signe (`PATCH /:id/signer`, désormais bloqué tant que la validation responsable n'a pas eu lieu) — la signature fait avancer le prospect dans le Kanban, mais la conversion en client (création du dossier `Client`) reste une action manuelle explicite, jamais automatique
- Tableau de répartition des travaux (Cabinet/Client/N.A.) : affiché pour **tous les types de mission** (Comptabilité, Audit, Conseil, Juridique, Autres), pas seulement Comptabilité ; valeurs à **N/A par défaut** lors d'une préparation depuis un prospect (pas de présomption Cabinet/Client) ; cases à cocher réelles et centrées côté formulaire, coche (✓) au lieu d'une croix dans le PDF généré
- Aperçu de la lettre de mission en modale (iframe) sur la fiche prospect, en plus du téléchargement — évite un aller-retour disque inutile
- **Fix** : la suppression d'une mission échouait systématiquement (violation de contrainte de clé étrangère avec son brouillon de lettre de mission généré automatiquement) — corrigé pour les missions prospect *et* client. Reste possible même après signature de l'expert-comptable (erreur humaine récupérable) ; bloquée uniquement une fois la lettre effectivement envoyée en signature au client (DocuSign)
- Modification et suppression d'une mission/lettre de mission en brouillon directement depuis la fiche prospect (jusque-là uniquement disponible côté client)

### Divers

- Diagnostic du bug de création de prospect (`FK_...id_createur`) : JWT de session périmé après reseed de la base — pas un bug de code, mais un piège de dev récurrent (`nest start` sans `--watch` : redémarrer le backend après toute modification de code)

## [0.3.0] - 2026-07-09

Migration du backend et du frontend vers le nouveau schéma de données LCB-FT défini dans `docs/mvp/` (KYC fusionné dans `Client`, pipeline prospect, questionnaire d'acceptation LAB, bénéficiaires effectifs, contacts, missions, lettres de mission, planning, obligations, opérations sensibles).

### Backend — reset et nouveau schéma (14 entités)

- Suppression du module `kyc/` (entité, dto, service, controller) et des anciennes migrations (`InitSchema`, `AddProspect`) — le KYC est désormais fusionné dans l'entité `Client`
- Création de `common/enums/index.ts` : tous les enums partagés (`Role`, `TypeEntite`, `StatutKanban`, `StatutClient`, `StatutKyc`, `ScreeningStatut`, `NiveauRisque`, `TypeMission`, `StatutMission`, `TypeObligation`, `StatutObligation`, `TypeOperationSensible`, `StatutOperationSensible`, `TypeContact`, `TypePlanningEtape`, `StatutPlanningEtape`)
- Réécriture des entités existantes : `User` (rôles en majuscules, `deletedAt`), `Client` (champs KYC + SIRENE fusionnés, toutes les relations), `Prospect` (nouveaux champs, `StatutKanban`), `AuditLog` (`ressource`/`ressourceId`, `ipAddress`), `ScoreRisque` (renommage `risk-score` → `score-risque`, réponses ARPEC 4 dimensions)
- 8 nouvelles entités et modules NestJS complets (entity + dto + service + controller + module) : `QuestionnaireAcceptation`, `BeneficiaireEffectif`, `Contact`, `Mission`, `LettreMission`, `PlanningEtape`, `Obligation`, `OperationSensible`
- `ScoringModule` : réécriture de l'algorithme de calcul du risque selon la méthode ARPEC (4 dimensions pondérées, seuils FAIBLE/MOYEN/ÉLEVÉ)
- `ProspectsModule` : génération de référence `QWP-YYYY-NNN`, conversion prospect → client (`POST /prospects/:id/convert`), soft delete
- `ClientsModule` : suppression de toute la logique KYC historique, validation KYC directement sur le client (`PATCH /clients/:id/validate`)
- Mise à jour de `app.module.ts` et `data-source.ts` : les 14 entités et les 14 modules métier enregistrés (const `ALL_ENTITIES` partagée)
- Migration unique `1782000000000-V2Schema.ts` : création des 14 tables dans l'ordre des dépendances FK (`users` → `prospects` → `questionnaire_acceptation` → `clients` → `beneficiaire_effectif` → `contacts` → `missions` → `documents` → `lettre_mission` → `score_risque` → `planning_etape` → `obligations` → `operation_sensible` → `audit_logs`), générée à partir des entités TypeORM et validée dans les deux sens (`up`/`down`)
- `database/seed.ts` : jeu de données de test couvrant les 14 tables (utilisateurs, clients, prospects, questionnaire, bénéficiaire effectif, contact, missions + lettre de mission signée, scores de risque, étape de planning, obligations, opération sensible, journal d'audit)

### Frontend — arborescence complète alignée sur le nouveau backend

- `types/index.ts` réécrit intégralement (16 enums + 14 entités) pour correspondre aux nouvelles entités et enums backend
- `useAuth`, `AppSidebar` et `lib/status.tsx` adaptés aux rôles en majuscules et aux nouveaux statuts (badges KYC, risque, kanban, mission, obligation, opération sensible)
- `/dashboard` : nouveaux KPIs (prospects actifs, clients actifs, clients à risque élevé, obligations en retard)
- Module Prospects : pipeline par statut, fiche prospect, page questionnaire d'acceptation (brouillon JSON + validation/refus)
- Module Clients : liste, création, fiche à 9 onglets (`infos`, `kyc`, `beneficiaires`, `contacts`, `scoring`, `missions`, `planning`, `obligations`, `operations` via `?tab=`)
- Nouvelles vues globales : `/dashboard/cartographie`, `/dashboard/obligations`, `/dashboard/operations-sensibles`, `/dashboard/planning`
- Module Admin réorganisé : `/dashboard/admin` (accueil) + `/dashboard/admin/users` (liste, création, édition)
- Suppression des pages obsolètes `/dashboard/collaborateur`, `/dashboard/responsable`, `/dashboard/scoring` (remplacées par l'onglet scoring de la fiche client)
- Pages volontairement minimales (pas de drag-and-drop Kanban, pas d'intégration SIRENE, questionnaire LAB en éditeur JSON brut plutôt que les 61 questions détaillées) — le design approfondi est laissé à une itération suivante

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
