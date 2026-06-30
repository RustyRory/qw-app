# Script de soutenance — QW-App

> **Durée cible :** 40 minutes  
> **Débit :** parle lentement. Plus lentement que tu le penses. Fais des pauses après chaque phrase importante.  
> **Les indications** *(en italique)* sont des rappels de mise en scène, pas à dire à voix haute.

---

## SLIDE 1 — Page de garde *(~30s)*

Bonjour à tous. Je m'appelle Damien Paszkiewicz, je suis en formation Concepteur Développeur d'Applications de niveau 6 à MyDigitalSchool Angers.

Aujourd'hui je vais vous présenter mon projet de stage : **QW-App**, une application web de gestion de la conformité LCB-FT, développée pour le Cabinet QW.

---

## SLIDE 2 — Sommaire *(~1 min)*

Je vais structurer cette présentation en dix grandes parties.

On commencera par me présenter rapidement et poser le contexte du stage. On verra ensuite la phase de conception — comment j'ai pensé l'application. Puis la réalisation, backend et frontend. On abordera la sécurité et l'infrastructure. Je vous parlerai aussi de vps-monitor, un projet transverse que j'ai développé en parallèle. Et on terminera par le bilan.

---

## SLIDE 3 — Introduction *(~1 min 30)*

Quelques mots sur mon parcours avant d'entrer dans le vif du sujet.

Côté projets académiques : My Digital Project, un projet transverse pluridisciplinaire mêlant design, cybersécurité, développement et marketing. J'ai aussi développé une application web pour l'association Saint-Barth Volley, une association sportive bénévole.

Côté projets personnels : j'ai construit une plateforme de déploiement multi-applications pour mon VPS — c'est vps-monitor, dont je vous reparlerai. J'ai aussi refactorisé un bot Discord, et développé un jeu de dés.

Et bien sûr mon stage au Cabinet QW, autour duquel s'articule ce dossier.

---

## SLIDE 4 — Parcours & projets réalisés *(~2 min)*

Le Cabinet QW est un cabinet d'expert comptable spécialisé dans la conformité réglementaire et la gestion des risques.

Son activité principale : accompagner des entreprises sur leurs obligations **LCB-FT** — c'est-à-dire la Lutte contre le Blanchiment de Capitaux et le Financement du Terrorisme.

Concrètement, ces obligations se résument en quatre points : identifier et vérifier l'identité de leurs clients — c'est ce qu'on appelle le KYC, Know Your Customer —, évaluer et surveiller le niveau de risque de chaque dossier, conserver un historique de toutes les actions, et signaler les opérations suspectes à Tracfin si nécessaire.

Quand j'arrive au stage, toute cette gestion se fait via des fichiers Excel et des documents partagés. Pas d'outil centralisé, pas de traçabilité formelle, et des données personnelles et financières peu protégées.

C'est ce contexte qui justifie entièrement le projet.

---

## SLIDE 5 — Contexte — Cabinet QW *(~2 min)*

L'objectif principal du stage était donc de concevoir et développer une application web responsive de gestion de la conformité LCB-FT.

Le MVP livré couvre six fonctionnalités majeures : la gestion complète des clients et des dossiers avec un CRUD complet, le KYC avec la structuration des données de connaissance client, un algorithme de scoring des risques, la gestion documentaire avec upload et accès sécurisé aux fichiers, l'authentification JWT avec gestion des rôles RBAC, et un audit trail qui journalise toutes les actions sensibles.

J'ai aussi défini explicitement ce qui est **hors périmètre** : pas de dashboards analytiques avancés, pas d'intégrations externes comme OFAC ou l'API SIREN, et pas de mise en production réelle — on est en environnement de test.

Les principales contraintes : la durée du stage, la conformité RGPD, et la priorité MVP.

---

## SLIDE 6 — Objectifs & périmètre *(~1 min)*

La problématique centrale : comment centraliser, sécuriser et tracer la gestion des dossiers de conformité LCB-FT dans un outil unique et maintenable ?

Les points douloureux identifiés étaient clairs. Des données dispersées entre Excel, email et Drive. Aucune traçabilité. Des données sensibles non sécurisées. Des processus non structurés dont la qualité variait selon le collaborateur. Et aucune gestion des accès.

---

## SLIDE 7 — Conception *(section, ~10s)*

*(clic)*

Passons à la phase de conception.

---

## SLIDE 8 — Méthodologie de travail & Outils *(~2 min)*

J'ai travaillé principalement en autonomie tout au long du stage.

Les outils du quotidien : GitHub pour le versioning avec issues, pull requests et GitHub Actions. VS Code avec ESLint, Prettier et GitLens. Insomnia pour tester l'API, Supertest pour les tests end-to-end. draw.io pour les cartographies, Merise pour la base de données. Et Docker Desktop en local pour répliquer l'environnement de production.

Ma méthode de développement était itérative par nature. Je pars d'un besoin identifié, je développe rapidement pour valider le concept. Ensuite, au fur et à mesure des connaissances acquises en cours — frameworks, sécurité, bonnes pratiques — je refactorise pour aligner le code sur ces standards, et je passe au prochain cycle.

Par exemple : j'ai migré le stockage du JWT de localStorage vers un cookie httpOnly après avoir appris les risques XSS. J'ai remplacé `synchronize: true` par des migrations versionnées après avoir compris les risques en production. Chaque refactoring correspond à une connaissance acquise et appliquée immédiatement.

---

## SLIDE 9 — Acteurs & rôles (RBAC) *(~1 min 30)*

L'application définit quatre rôles distincts.

Le **Collaborateur** crée et modifie ses propres dossiers. Le **Responsable** valide les dossiers et supervise l'ensemble du portefeuille. L'**Expert-comptable** consulte et analyse. Et l'**Admin** gère les comptes et peut effectuer les suppressions.

La matrice des droits suit le principe du moindre privilège. Par exemple, seul l'Admin peut faire une suppression — et c'est un soft delete, jamais une suppression physique des données. Le Collaborateur ne voit que ses propres dossiers.

Ces règles sont **enforced au niveau du backend** avec des guards NestJS — pas seulement masquées dans l'interface.

---

## SLIDES 10 & 11 — Base de données MCD / MLD *(~2 min)*

*(passer à la slide 10)*

Voici le Modèle Conceptuel de Données. J'ai appliqué la méthodologie Merise pour aller du MCD vers le MLD puis le MPD.

*(clic vers slide 11)*

Et voici le Modèle Logique. On a **sept entités** principales : Utilisateur, Client, KYC, Document, Score de risque, Audit Log, et Prospect.

Quelques points de conception importants. La relation Client-KYC est en 1-1 avec contrainte UNIQUE — un client a exactement une fiche KYC. Toutes les clés primaires sont en UUID pour éviter les identifiants prédictibles. Le soft delete sur Client avec un champ `deleted_at` répond à l'obligation LCB-FT de rétention 5 ans. Et chaque calcul de score crée une nouvelle ligne — on conserve l'historique complet des réévaluations.

Entité 
attributs
associations
cardinalités

---

## SLIDE 12 — Architecture technique *(~1 min)*

L'architecture s'articule autour de six couches. Next.js et React 19 avec Tailwind v4 pour le frontend. NestJS en TypeScript pour le backend. PostgreSQL 16 avec TypeORM. Redis pour le cache. Un stockage objet S3-compatible hébergé en Europe pour les documents. Et un VPS Linux avec Nginx et Docker.

Le flux général : le navigateur parle uniquement à Next.js. Next.js proxifie vers NestJS. NestJS interroge PostgreSQL, Redis, et S3. L'URL interne du backend n'est **jamais** exposée au navigateur.

---

## SLIDE 13 — Choix technologiques *(~2 min)*

Je vais justifier rapidement les quatre choix technologiques clés.

**Pourquoi Next.js** plutôt qu'un SPA React classique ? Trois raisons. Le SSR natif évite le flash de contenu non authentifié. Le middleware serveur permet de protéger les routes avant même que la page soit rendue. Et le proxy API intégré évite d'exposer l'URL du backend dans le bundle JavaScript.

**Pourquoi PostgreSQL** plutôt que MongoDB ? Parce que les données sont structurées avec des relations fortes. Les contraintes d'intégrité au niveau base — UNIQUE, clés étrangères, NOT NULL — sont indispensables pour des données réglementaires. Et les transactions ACID garantissent la cohérence.

**Pourquoi NestJS** plutôt qu'Express brut ? Pour l'architecture modulaire imposée qui organise le code par domaine métier, l'injection de dépendances qui facilite les tests unitaires, et les décorateurs `@Guard` et `@Roles` qui rendent la sécurité déclarative et lisible.

**Pourquoi JWT en cookie** plutôt que localStorage ? Parce que localStorage est accessible par tout script JavaScript — une attaque XSS peut voler le token. Le cookie httpOnly, lui, est inaccessible au JavaScript côté client.

---

## SLIDE 14 — Réalisation Backend *(section, ~10s)*

*(clic)*

Passons à la réalisation. Je commence par le backend.

---

## SLIDE 15 — Backend — Architecture *(~2 min)*

Le backend NestJS est composé de sept modules : Auth, Users, Clients, KYC, Documents, Scoring et Audit. Chaque module a son Controller, son Service et son Entity. Séparation stricte des responsabilités — jamais de logique métier dans un controller, jamais d'accès base directement dans un controller.

Pour chaque nouvelle ressource, je suivais toujours le même ordre. D'abord la Migration pour créer ou modifier le schéma en base. Ensuite l'Entity qui mappe la table en objet TypeScript. Puis le Seed pour les données de test. Puis le DTO pour valider les requêtes. Puis le Service pour la logique métier. Puis le Controller pour les routes HTTP. Et enfin la page Next.js côté frontend.

Cet ordre garantit qu'on ne peut jamais avoir un service qui référence une table inexistante.

---

## SLIDE 16 — Backend — Authentification & guards *(~2 min)*

Le flux de login fonctionne ainsi. Le client envoie email et password. Le service récupère l'utilisateur par email. Il compare le password avec bcrypt — le mot de passe n'est jamais stocké en clair en base. Si le compte est désactivé, on rejette la requête avant même de vérifier le hash. Si tout est bon, on signe un JWT avec un payload minimal — juste l'id et le rôle — et on le stocke dans un cookie httpOnly.

Sur chaque endpoint sensible, deux guards en cascade. `JwtAuthGuard` vérifie et décode le token Bearer, puis injecte l'objet user dans la requête. `RolesGuard` vérifie que le rôle de l'utilisateur est dans les rôles autorisés déclarés par le décorateur `@Roles`.

En cas d'échec : 401 si non authentifié, 403 si le rôle est insuffisant.

---

## SLIDE 17 — Backend — Migration *(~1 min 30)*

La migration versionne le schéma SQL dans git. C'est la **seule source de vérité** pour la structure de la base de données.

Voici un exemple avec la table client. La méthode `up` crée la table avec ses colonnes : un UUID comme clé primaire, le prénom, l'email avec contrainte d'unicité, la référence interne au format QW-2025-001, le champ `deleted_at` pour le soft delete. La méthode `down` est le rollback — elle supprime la table et permet de revenir en arrière.

Les commandes : `migration:generate` pour générer la migration depuis les entités, `migration:run` pour l'appliquer, `migration:revert` pour revenir en arrière.

La règle absolue : **`synchronize: false` en production**. En dev on peut utiliser true, mais en prod, la migration est l'unique source de vérité. `synchronize: true` peut modifier le schéma automatiquement et détruire des données.

---

## SLIDE 18 — Backend — Entity *(~1 min)*

L'entité mappe la table en objet TypeScript. TypeORM lit les décorateurs pour générer les requêtes SQL.

On voit ici l'entité Client. `PrimaryGeneratedColumn` en UUID. Les colonnes firstName, email, ref. La relation 1-1 avec KYC via `OneToOne` et `JoinColumn` — avec cascade, donc quand on crée un client, sa fiche KYC est créée automatiquement. La relation vers le créateur avec `ManyToOne`. Et le `DeleteDateColumn` pour le soft delete — TypeORM exclut automatiquement les enregistrements supprimés de toutes les requêtes.

---

## SLIDE 19 — Backend — Seed *(~45s)*

Le seed peuple la base avec des données reproductibles pour les tests et la démonstration. Ici on crée deux utilisateurs : un admin et un collaborateur, avec leurs mots de passe hashés en bcrypt. La commande `npm run seed` peut être relancée à tout moment pour repartir d'un état propre.

---

## SLIDE 20 — Backend — Create Client *(~1 min 30)*

Voici le cycle complet pour la création d'un client, du DTO jusqu'au controller.

Le **DTO** valide le body de la requête avec des décorateurs class-validator : `@IsString`, `@IsNotEmpty`, `@IsEmail`. Ces validations sont appliquées automatiquement par le `ValidationPipe` global.

Le **service** génère une référence interne au format QW-2025-001, crée une fiche KYC vide liée au client, sauvegarde le tout en base, et logue l'action dans l'audit trail.

Le **controller** applique les guards, reçoit le DTO validé et l'ID de l'utilisateur depuis la requête injectée, et délègue au service. Aucune logique métier dans le controller.

---

## SLIDE 21 — Backend — Algorithme de scoring *(~1 min 30)*

L'algorithme de scoring calcule le niveau de risque LCB-FT d'un client sur 100 points.

Quatre critères sont évalués : être une Personne Politiquement Exposée vaut 30 points, être associé à un pays à haut risque selon les listes GAFI vaut 25, exercer dans un secteur sensible — crypto, casino, immobilier — vaut 20, et avoir un chiffre d'affaires supérieur à 500 000 euros vaut 10 points supplémentaires.

On obtient trois niveaux : FAIBLE de 0 à 33, MOYEN de 34 à 66, ÉLEVÉ de 67 à 100.

L'implémentation : le résultat est persisté en base avec un horodatage pour l'historique des réévaluations. Le score est mis en cache Redis avec une clé par client et un TTL d'une heure. Le cache est invalidé automatiquement à chaque mise à jour du KYC.

---

## SLIDE 22 — Réalisation Frontend *(section, ~10s)*

*(clic)*

Passons au frontend.

---

## SLIDE 23 — Frontend — Structure & routing *(~1 min 30)*

Le frontend utilise le **App Router** de Next.js. La structure des fichiers reflète directement l'arborescence des URL.

On a une page login, puis tout le dashboard en dessous. Le layout du dashboard inclut la sidebar de navigation. Les pages clients permettent le listing, la création via un formulaire, et la fiche détaillée avec les onglets KYC, scoring, documents et historique. Il y a aussi des pages dédiées par rôle : collaborateur, responsable, admin.

Le design system est basé sur **shadcn/ui** avec Radix UI et Tailwind v4 pour les composants, et des icônes Tabler.

---

## SLIDE 24 — Frontend — Dashboard Admin *(~30s)*

*(clic)*

Voici le dashboard admin. On voit en haut les statistiques clés, en dessous la gestion des utilisateurs. L'interface est responsive et utilise les composants shadcn/ui avec les actions disponibles selon le rôle connecté.

---

## SLIDE 25 — Frontend — Protection des routes & proxy *(~2 min)*

Deux mécanismes distincts côté serveur Next.js protègent l'accès à l'application.

Le premier est le **middleware `proxy.ts`** qui s'exécute côté serveur Edge, avant tout rendu de page. Il lit le cookie `qw_token`, décode le payload — sans vérifier la signature, ça c'est le rôle de NestJS —, et vérifie l'expiration. Si le token est absent ou expiré, l'utilisateur est redirigé vers login. S'il est authentifié, il est redirigé vers son dashboard selon son rôle.

Pourquoi middleware et pas un guard `useEffect` côté client ? Parce qu'un guard client s'exécute après le rendu — la page s'affiche une fraction de seconde avant la redirection. C'est le **flash de contenu**. Le middleware Edge s'exécute sur le serveur : aucun HTML n'est envoyé si l'utilisateur n'est pas authentifié.

Le second mécanisme est le **proxy API**. Toutes les requêtes vers `/api/*` sont interceptées par une route catch-all Next.js qui les relaie au backend NestJS. La variable `BACKEND_URL` est serveur uniquement — elle n'est jamais incluse dans le bundle JavaScript envoyé au navigateur.

---

## SLIDE 26 — Flux complet d'une requête *(~1 min 30)*

Voici le flux complet pour un collaborateur qui consulte une fiche client.

Le navigateur envoie GET vers la page dashboard. Le middleware lit le cookie, vérifie le token, laisse passer. La page Next.js appelle `apiFetch` qui forward vers le proxy. Le proxy reconstruit la requête vers NestJS en injectant le Bearer token depuis le cookie. `JwtAuthGuard` vérifie la signature du token et injecte l'objet user. `RolesGuard` vérifie que le rôle est autorisé. Le service fait la requête TypeORM avec exclusion automatique des soft-deleted. L'audit service logue l'action en base. Et la réponse JSON remonte jusqu'au navigateur.

---

## SLIDE 27 — Dashboard Admin — Clients *(~30s)*

*(clic)*

Et voici la liste des clients. On voit le niveau de risque affiché pour chaque dossier, les actions disponibles selon le rôle, et les filtres de recherche.

---

## SLIDE 28 — Sécurité & Infrastructure *(section, ~10s)*

*(clic)*

Passons à la sécurité et l'infrastructure.

---

## SLIDE 29 — Sécurité & conformité RGPD *(~2 min)*

La sécurité de l'application couvre cinq vecteurs d'attaque.

Le **XSS** est contré par le cookie httpOnly — inaccessible au JavaScript — combiné à l'échappement natif de React. Les **injections SQL** sont impossibles grâce à TypeORM qui utilise des requêtes paramétrées exclusivement. L'**accès non autorisé** est bloqué par le double guard NestJS : JWT puis RBAC. Le **CORS** est restreint à la seule URL du frontend. Et pour l'**énumération de comptes** : email inconnu et mauvais mot de passe renvoient exactement le même message d'erreur.

Côté sécurité serveur : authentification SSH par clé uniquement avec root désactivé, UFW avec uniquement les ports 22, 80 et 443 ouverts, et HTTPS via certificat TLS Nginx.

Côté RGPD : soft delete avec rétention 5 ans pour respecter l'obligation LCB-FT, minimisation des données collectées, audit trail complet sur toutes les actions, et documents chiffrés au repos en AES-256 et en transit en TLS.

---

## SLIDE 30 — Gestion des documents *(~1 min 30)*

Les documents du KYC sont des fichiers sensibles — pièces d'identité, bilans financiers. On ne les stocke ni en base de données, ni sur le serveur applicatif.

J'ai choisi un **stockage objet S3-compatible hébergé en Europe** pour respecter le RGPD.

Le fonctionnement avec Presigned URLs : le client demande un téléchargement au backend. Le backend vérifie les droits, logue l'action dans l'audit trail, génère une URL signée valide **15 minutes**, et la retourne au client. Le client télécharge directement depuis S3 sans repasser par le backend. Après 15 minutes, l'URL est invalide même si elle a fuité. Le bucket est privé — aucune URL permanente accessible.

---

## SLIDE 31 — Infrastructure & déploiement *(~1 min 30)*

L'infrastructure tourne sur un VPS à environ 5 euros par mois. Six applications sont hébergées sur le même serveur grâce à Nginx qui route par nom de domaine.

Pour qw-app spécifiquement, quatre conteneurs Docker : le frontend Next.js exposé sur le port 3006, le backend NestJS sur le 3008, PostgreSQL et Redis en réseau interne uniquement.

Tous les ports sont bindés sur `127.0.0.1` — invisibles depuis Internet. Seul Nginx est exposé sur les ports 80 et 443.

---

## SLIDE 32 — Cartographie de déploiement *(~30s)*

*(clic)*

Voici la cartographie de déploiement. On voit le flux depuis Internet, le reverse proxy Nginx, et les différents conteneurs Docker isolés par réseau interne.

---

## SLIDES 33 & 34 — Nginx — Reverse proxy *(~2 min)*

Nginx joue le rôle de reverse proxy. Un seul point d'entrée pour toutes les applications — zéro port exposé sauf 80 et 443.

*(clic vers slide 34)*

La configuration pour qw-app est en deux blocs. Le premier écoute sur le port 80 et redirige tout le trafic HTTP vers HTTPS. Le second écoute sur le 443 avec SSL, et proxifie vers le frontend Next.js en 127.0.0.1:3006, en transmettant les headers nécessaires.

Le certificat TLS vient de **Let's Encrypt** via certbot — gratuit et renouvelé automatiquement.

Le reload sans coupure de service se fait en deux étapes : `nginx -t` pour vérifier la config, puis `kill -HUP` pour recharger sans couper les connexions actives. C'est cette commande que vps-monitor utilise pour mettre à jour dynamiquement les routes quand on déploie une nouvelle application.

---

## SLIDE 35 — Pipeline CI/CD *(~2 min)*

Le pipeline CI/CD est entièrement automatisé.

Côté **intégration continue** : deux hooks Husky. Le hook pre-commit lance lint-staged qui vérifie le linting et le formatage Prettier uniquement sur les fichiers modifiés. Le hook commit-msg vérifie que le message respecte les Conventional Commits.

Côté **déploiement continu** : quand je push sur la branche staging, GitHub Actions se déclenche. Il appelle un webhook POST sur vps-monitor avec un Bearer token sécurisé. vps-monitor exécute alors : git pull, docker compose build, docker compose up, puis surveille la santé de l'application avec un healthcheck HTTP toutes les deux secondes pendant 30 secondes maximum. En cas de succès, retour 200. En cas d'échec, retour 500 — et les anciens conteneurs continuent à tourner, il n'y a pas de downtime.

La stratégie de branches : main pour la version stable, staging pour les tests et le déploiement automatique, dev pour l'intégration, et des branches feat/* ou fix/* par fonctionnalité.

---

## SLIDE 36 — Tests *(~1 min 30)*

La stratégie de tests combine **unitaires et end-to-end**.

Pour les tests unitaires avec Jest, j'ai cinq suites : le service de scoring avec cinq cas de figure, et les services Clients, KYC, Documents et Audit. Les dépendances comme TypeORM sont mockées pour isoler la logique testée.

Les cas de test du scoring couvrent l'ensemble des paliers : du score zéro avec aucun critère, jusqu'au score 85 avec tous les critères actifs. Cinq scénarios qui vérifient les trois niveaux de risque.

Pour les tests end-to-end avec SuperTest : je teste l'endpoint `/auth/login` et les protections 401 et 403. `npm run test:cov` génère un rapport de couverture en LCOV.

---

## SLIDE 37 — VPS monitor *(section, ~10s)*

*(clic)*

Je vais maintenant vous parler de vps-monitor, un projet transverse.

---

## SLIDE 38 — vps-monitor — Projet transverse *(~2 min)*

vps-monitor est un projet personnel que j'ai développé en parallèle du stage. C'est une mini-plateforme de déploiement — inspirée de Railway ou Coolify — qui tourne sur mon VPS.

Son rôle dans le contexte de ce projet : c'est lui qui orchestre le déploiement de qw-app côté serveur.

L'architecture est en **Node.js avec Express 5**. Cinq fichiers principaux : `deploy.js` pour le pipeline git pull, build, healthcheck. `nginx.js` pour la gestion dynamique du reverse proxy. `docker.js` pour les opérations sur les conteneurs. `metrics.js` pour le monitoring CPU et RAM en temps réel. Et `registry.js` qui maintient un fichier JSON des applications enregistrées.

Les fonctionnalités clés : le **log streaming en temps réel** via WebSocket avec jeton à usage unique, le monitoring des conteneurs, la gestion Nginx dynamique sans redémarrage de service, et l'authentification du webhook par Bearer token.

Ce projet gère aujourd'hui six applications sur le VPS.

---

## SLIDE 39 — Bilan *(section, ~10s)*

*(clic)*

Passons au bilan.

---

## SLIDE 40 — Difficultés rencontrées & solutions *(~1 min 30)*

Le défi principal de ce stage était l'**apprentissage majoritairement en autonomie**.

Voici les principales difficultés rencontrées. J'avais initialement stocké le JWT en localStorage — vulnérable au XSS. Après avoir appris les bonnes pratiques, j'ai migré vers un cookie httpOnly. Le déploiement SSH manuel était chronophage — j'ai construit vps-monitor pour l'automatiser. Je n'avais pas de protection des routes côté serveur au départ — j'ai créé le middleware Next.js. Et sans feedback technique externe, j'ai utilisé les tests unitaires comme filet de sécurité.

Ce que ça m'a appris : anticiper la sécurité dès la conception et pas après coup. La valeur des migrations versionnées plutôt que `synchronize: true`. Et qu'une bonne infrastructure facilite le développement au quotidien.

---

## SLIDES 41 & 42 — Compétences acquises *(~2 min)*

Si je mets en regard mon travail avec le référentiel CDA...

Pour **l'environnement de travail** : Node.js 20, Docker Compose avec PostgreSQL et Redis, VS Code avec ESLint et Prettier, Husky et commitlint, fichiers .env par service.

Pour les **interfaces utilisateur** : Next.js 16, React 19, Tailwind v4, shadcn/ui, formulaires validés avec Zod et React Hook Form.

Pour les **composants métier** : sept modules NestJS, l'algorithme de scoring LCB-FT, les guards RBAC déclaratifs.

Pour la **gestion de projet** : GitHub Issues, branches par fonctionnalité, PRs avec CI obligatoire, Git Flow, Conventional Commits.

*(clic vers slide 42)*

Pour la **base de données** : PostgreSQL 16, sept entités, UUID, soft delete, migrations versionnées, index sur statut et deleted_at.

Pour les **composants d'accès aux données** : TypeORM avec repository pattern, Redis pour le cache scoring avec invalidation.

Pour les **tests** : Jest unitaires sur cinq services, Supertest end-to-end, rapport de couverture LCOV.

Pour le **déploiement** : README, INSTALL, CONTRIBUTING, docker-compose prod, scripts shell.

Et pour la **démarche DevOps** : GitHub Actions, déploiement automatique via webhook, Docker multi-stage, Nginx avec HTTPS Let's Encrypt, et monitoring temps réel avec vps-monitor.

---

## SLIDE 43 — Bilan & perspectives *(~1 min)*

Pour conclure sur le bilan : le MVP est **fonctionnel et déployé** en environnement de test. Le pipeline CI/CD est opérationnel de bout en bout. La sécurité est correcte — JWT, RBAC, RGPD. Et l'infrastructure vps-monitor est réutilisable pour mes autres projets.

Les axes d'amélioration pour une V2 : un refresh token avec access token à courte durée de vie, du rate limiting sur l'endpoint de login, des tests end-to-end sur une base de données dédiée, et des fonctionnalités analytiques avancées.

En termes de perspectives : je souhaite poursuivre en Master développement full-stack à MyDigitalSchool Angers, et rejoindre une équipe pour progresser au contact d'autres développeurs.

---

## SLIDE 44 — Conclusion *(~1 min)*

Ce projet couvre l'intégralité du cycle de vie d'une application : du besoin métier, à la conception, au développement, à la sécurité, jusqu'au déploiement.

Trois points forts à retenir.

D'abord, une **réponse à un besoin réel** — cette application remplace des fichiers Excel dans un contexte réglementaire exigeant, la LCB-FT.

Ensuite, une **stack moderne et cohérente** — Next.js, NestJS, PostgreSQL, Docker — avec chaque choix technologique justifié.

Et enfin, une **infrastructure maîtrisée de bout en bout** — du code au serveur, y compris le pipeline de déploiement automatisé.

---

## SLIDE 45 — Questions *(~30s)*

Je vous remercie pour votre attention.

Je suis maintenant disponible pour répondre à vos questions.

---
---

# Notes de préparation

## Timing de secours

Si tu es en avance (trop rapide) : ralentis sur les slides techniques (16, 17, 25) — décris le code ligne par ligne.

Si tu es en retard (trop lent) : coupe les slides 19 (Seed), 27 (screenshot Clients) et 32 (Cartographie — juste montrer l'image sans commenter).

## Les 5 diapositives les plus importantes à maîtriser

1. **Slide 13** — Choix technologiques (le jury va tester chaque justification)
2. **Slide 16** — Authentification & guards (RBAC en cascade, c'est fondamental)
3. **Slide 25** — Protection des routes & proxy (middleware vs useEffect — question classique)
4. **Slide 29** — Sécurité & RGPD (tu parles de données réglementaires, il faut être précis)
5. **Slide 35** — Pipeline CI/CD (montre que tu maîtrises de bout en bout)

## Phrases de transition si tu bloques

- *"Je vais passer à la diapositive suivante qui illustre bien ce point..."*
- *"C'est une question que le jury me posera certainement, j'y reviendrai..."*
- *"Ce choix est directement lié à ce qu'on vient de voir..."*

## À ne jamais dire

- ❌ "Je n'ai pas eu le temps de..."
- ❌ "C'est pas parfait mais..."
- ❌ "Normalement ça devrait..."
- ✅ À la place : "L'axe d'amélioration identifié pour la V2 est..."
