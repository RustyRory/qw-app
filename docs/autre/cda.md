







Nom
►
PASZKIEWICZ
Prénom
►
Damien
Adresse
►
Angers 49100







Titre professionnel visé


Concepteur Développeur d’Applications (CDA) – Niveau 6 (Bac+3)




Remerciements
Je tiens à remercier l’ensemble des personnes qui ont contribué, de près ou de loin, à la réalisation de ce projet ainsi qu’à ma progression tout au long de ma formation.
Je remercie en premier lieu l’équipe pédagogique de MyDigitalSchool Angers pour les enseignements apportés, qui m’ont permis d’acquérir les bases nécessaires en conception, développement et déploiement d’applications.
Je souhaite également remercier le cabinet QW pour m’avoir accueilli dans le cadre de mon stage et pour m’avoir donné l’opportunité de travailler sur un projet concret, en lien direct avec des problématiques métiers réelles.
Enfin, je remercie les différentes personnes avec lesquelles j’ai pu échanger durant cette année (étudiants, intervenants, professionnels), qui ont contribué, à travers leurs retours et leurs expériences, à enrichir ma compréhension du métier de développeur.

Résumé
Ce dossier s’inscrit dans le cadre de la formation Concepteur Développeur d’Applications (CDA) réalisée à MyDigitalSchool Angers. Il présente la conception, le développement et le déploiement d’une application web dédiée à la gestion de la conformité réglementaire LCB-FT, réalisée lors d’un stage au sein du cabinet QW.
L’objectif principal du projet est de centraliser les données clients, de structurer les processus de suivi de conformité et d’améliorer la traçabilité des actions au sein d’une plateforme unique, sécurisée et maintenable.
Pour répondre à ces besoins, une architecture complète a été mise en place, reposant sur un frontend développé avec Next.js, un backend construit avec NestJS exposant une API REST, ainsi qu’une base de données PostgreSQL. L’ensemble de l’application est déployé sur un VPS Linux à l’aide de Docker, avec une approche multi-applications et un début d’automatisation via des pipelines CI/CD.
Ce projet a permis de mobiliser et de développer des compétences clés en conception d’applications, en développement web full-stack, en gestion de bases de données, en sécurité applicative et en déploiement d’infrastructures.
Il met également en évidence une progression réalisée en grande partie en autonomie, avec une montée en compétences progressive basée sur la pratique, l’expérimentation et l’adaptation aux besoins rencontrés.
Sommaire
Remerciements	2
Résumé	3
Sommaire	4
Liste des acronymes	9
1. Introduction	10
1.1 Contexte de formation	10
1.2 Objectif du dossier	10
1.3 Présentation du parcours	11
1.3.1 Projets réalisés	11
1.3.2 Stage en entreprise	11
1.4 Projet retenu pour le dossier	11
2. Contexte du projet	12
2.1 Présentation de l'entreprise	12
2.2 Problématique	12
2.3 Besoin métier	12
3. Objectifs du projet	13
3.1 Objectif principal	13
3.2 Objectifs fonctionnels	13
3.3 Objectifs techniques	13
4. Périmètre du projet	14
4.1 Inclus dans le périmètre (MVP)	14
4.2 Exclu du périmètre	14
4.3 Contraintes	14
5. Fonctionnalités	15
5.1 Fonctionnalités principales (MVP)	15
5.2 Évolutions envisagées	15
6. Conception fonctionnelle	16
6.1 Acteurs du système	16
6.2 Cartographie fonctionnelle	16
6.3 Parcours utilisateurs	17
6.3.1 Création d'un client	17
6.3.2 Mise à jour KYC	18
6.3.3 Evaluation des risques	19
6.3.4 Validation d'un dossier	20
6.4 Maquettes	21
6.4.1 Wireframes	21
6.4.2 Maquettes	22
6.5 Conception de la base de données	23
6.5.1 Dictionnaire de données	23
6.5.2 MCD (Modèle Conceptuel de Données)	23
Entités	23
Associations, liaisons et cardinalités	23
6.5.3 MCD (Modèle Logique de Données)	25
6.5.3 MPD (Modèle Physique de Données)	25
7. Conception technique	26
7.1 Architecture globale	22
7.1.1 Frontend / Backend / Base de données	22
7.1.2 Cartographie technique	22
7.2 Frontend	23
7.2.1 Next.js	23
7.2.2 React & Tailwind CSS	23
7.2.3 Pages principales	23
7.3 Backend	23
7.3.1 NestJS	23
7.3.2 Modules métier	23
7.3.3 Services métier	23
7.4 Base de données	24
7.4.1 PostgreSQL	28
7.4.2 Redis	28
7.4.3 Stockage de documents	28
8. Réalisation technique	25
8.1 Environnement de développement	25
8.1.1 VPS et Linux	25
8.1.2 Outils de développement	25
8.2 Base de données	25
8.2.1 PostgreSQL et TypeORM	25
8.2.2 Cache (Redis)	26
8.3 Frontend	26
8.3.1 Structure et organisation	26
8.3.2 Design system — shadcn/ui	26
8.3.3 Architecture du dashboard	27
8.3.4 Composant SectionCards — statistiques	27
8.3.5 Pages développées	27
8.3.6 Gestion de l'état et des appels API	28
8.3.7 Sécurité frontend	28
8.4 Backend	28
8.4.1 Architecture modulaire (NestJS)	28
8.4.2 Sécurité des endpoints	29
8.4.3 Service de scoring	29
8.4.4 Service d'audit	29
8.4.5 Workflow CRUD — application LCB-FT	29
Chaîne de traitement d'une requête	29
Flux par opération	30
Matrice des droits par opération	32
8.4.6 Helper apiFetch (frontend)	33
8.4.7 Authentification et gestion des rôles	33
8.4.8 Entité utilisateur (PostgreSQL / TypeORM)	33
8.4.9 Route de login (backend NestJS)	33
8.4.10 Guards NestJS — JwtAuthGuard et RolesGuard	33
8.4.11 Hook useAuth (frontend Next.js)	34
8.4.12 Composant LoginForm (frontend)	34
8.4.11 Flux complet de connexion	35
8.5 Architecture serveur	36
8.5.1 Nginx (reverse proxy)	36
8.5.2 Architecture multi-applications	36
8.6 Sécurité et conformité	36
8.6.1 Authentification (JWT)	36
8.6.2 Autorisation (RBAC)	36
8.6.3 Validation des données	36
8.6.4 Protection contre les attaques	37
8.6.5 Sécurité serveur	37
8.6.6 Sécurité des documents	37
8.6.7 RGPD	37
8.7 Tests	38
8.7.1 Stratégie de tests	38
8.7.2 Cas de tests	38
8.7.3 Résultats	38
8.8 Déploiement & infrastructure	44
8.8.1 Cartographie de déploiement	44
8.8.2 Architecture de déploiement	45
8.8.3 Environnement de test (staging)	45
8.8.4 Procédure de déploiement (CD)	45
8.8.5 Monitoring de l'infrastructure	45
Application VPS Monitor	45
Fonctionnalités	46
8.9 CI / CD	41
8.9.1 Intégration continue (CI)	41
Qualité du code	41
Tests	41
Sécurité	41
Conventions et traçabilité	41
Hooks locaux (Husky)	41
8.9.2 Déploiement continu (CD)	42
8.9.3 Versioning et releases	42
8.9.4 Release automatique (release.yml)	42
8.9.5 Hotfix release automatique (hotfix-release.yml)	42
8.9.6 Limites	43
8.10 Hébergement	44
8.10.1 VPS	44
8.10.2 Stockage des fichiers	44
9. Bilan du projet	45
9.1 Objectifs atteints	45
9.2 Difficultés rencontrées	45
9.3 Solutions apportées	45
9.4 Améliorations possibles	46
9.5 Perspectives	46
10. Conclusion	47
Annexes	53
USE CASE	53
Diagrammes séquence	53
Mise à jour KYC	53
Validation d’un dossier	54
Base de données	55
Dictionnaire de données	55
MPD	58
Types énumérés (PostgreSQL ENUM)	58
Tables	59
Captures d’écran	64
Documentation technique — VPS Monitor	65
A1. Architecture globale	65
A2. Diagramme de séquence — Authentification	66
A3. Diagramme de séquence — Cycle de monitoring	67
A4. Diagramme de séquence — Action Docker	67
A5. Routing — Page d’accueil selon session	68
A6. Endpoints API	68
A7. Structure des fichiers	70
A8. Pipeline CI/CD (VPS Monitor)	71
Annexes — CI/CD	72
B1. Vue d’ensemble des workflows	72
B2. Diagramme — Intégration continue (PR)	73
B3. Diagramme — Déploiement continu (CD)	73
B4. Diagramme — Release automatique	74
B5. Stratégie de branches	75
B6. Contenu des workflows principaux	75
ci.yml	75
deploy.yml	76
release.yml (extrait — logique de versioning)	77
Annexes — C. Code QWapp	77
C1. Entité User (TypeORM)	77
C2. Route de login — POST /api/auth/login	78
C3. JwtAuthGuard	78
C4. RolesGuard	79
C5. Hook useAuth (Next.js)	79
C6. LoginForm — soumission du formulaire	80
C7. Helper apiFetch	80
C8. Layout du dashboard (dashboard/layout.tsx)	81
C9. Composant SectionCards	81
C10. Entité Client (TypeORM)	82
Annexes — D. Infrastructure VPS	83
D1. docker-compose.yml — Orchestration multi-applications	83
D2. Configuration Nginx — Reverse proxy	86
D3. Tableau de routage — Ports et routes	89
D4. Procédure de configuration du serveur VPS	89
1. Connexion initiale et mise à jour du système	89
2. Création d’un utilisateur dédié	90
3. Sécurisation de l’accès SSH	90
4. Configuration du pare-feu (UFW)	90
5. Installation de Docker	91
6. Installation de Nginx	92
7. Structure des dossiers de travail	92
8. Configuration Nginx	92
9. Démarrage des applications	92
10. Vérification finale	93
Récapitulatif — ordre des opérations	93

Liste des acronymes
API — Application Programming Interface : interface permettant la communication entre différentes applications
CRUD — Create, Read, Update, Delete : opérations de base sur les données
CI/CD — Continuous Integration / Continuous Deployment : intégration et déploiement continus
CDA — Concepteur Développeur d’Applications
CSR — Client-Side Rendering : rendu côté client
SSR — Server-Side Rendering : rendu côté serveur
SSG — Static Site Generation : génération de pages statiques
DTO — Data Transfer Object : objet de transfert de données
JWT — JSON Web Token : mécanisme d’authentification basé sur des tokens
RBAC — Role-Based Access Control : gestion des accès basée sur les rôles
KYC — Know Your Customer : processus d’identification client
LCB-FT — Lutte contre le Blanchiment de Capitaux et le Financement du Terrorisme
ORM — Object-Relational Mapping : technique de liaison entre objets et base de données relationnelle
SQL — Structured Query Language : langage de gestion des bases de données relationnelles
HTTP — HyperText Transfer Protocol : protocole de communication web
HTTPS — HyperText Transfer Protocol Secure : version sécurisée de HTTP
SSH — Secure Shell : protocole sécurisé d’accès à distance
VPS — Virtual Private Server : serveur privé virtuel
UI — User Interface : interface utilisateur
UX — User Experience : expérience utilisateur
RGPD — Règlement Général sur la Protection des Données
MVP — Minimum Viable Product : version minimale fonctionnelle d’un produit
XSS — Cross-Site Scripting : faille de sécurité liée à l’injection de scripts
CSRF — Cross-Site Request Forgery : attaque exploitant la session utilisateur
CORS — Cross-Origin Resource Sharing : mécanisme de contrôle des accès entre origines
UFW — Uncomplicated Firewall : pare-feu simplifié sous Linux
JSON — JavaScript Object Notation : format d’échange de données
REST — Representational State Transfer : architecture d’API web

Introduction
1.1 Contexte de formation
Formation : Concepteur Développeur d'Applications (CDA) – MyDigitalSchool Angers
Axes : conception, développement, déploiement (web et mobile)
Dans le cadre de ma formation Concepteur Développeur d'Applications (CDA) au sein de MyDigitalSchool Angers, j'ai suivi un parcours orienté vers la conception, le développement et le déploiement d'applications web et mobiles.
Cette formation vise à former des professionnels capables d'analyser un besoin métier, de concevoir une solution applicative complète et de la développer en respectant les bonnes pratiques de développement, de qualité logicielle et de sécurité.
Au cours de ce cursus, j'ai acquis et consolidé des compétences dans plusieurs domaines clés du développement logiciel, notamment :
Le développement d'applications web côté frontend et backend ;
La conception d'architectures applicatives robustes et maintenables ;
La modélisation de bases de données relationnelles ;
La mise en place d'API REST ;
La gestion de projets informatiques dans un contexte professionnel ;
L'application des bonnes pratiques de sécurité et de qualité logicielle.
1.2 Objectif du dossier
Ce dossier vise à mettre en évidence les différentes étapes du projet principal réalisé dans le cadre de la formation, de l'analyse du besoin à la mise en œuvre de la solution, en passant par la conception, le développement et la sécurisation de l'application.
Il a également pour vocation de démontrer l'acquisition des compétences attendues dans le référentiel CDA, notamment en matière de conception applicative, de développement web, de gestion de base de données, de sécurité et de gestion de projet.

1.3 Présentation du parcours
Au cours de ma formation, j'ai eu l'opportunité de travailler sur plusieurs projets académiques et personnels, ainsi que de réaliser un stage en entreprise.
1.3.1 Projets réalisés
My Digital Project — projet transverse mené en équipe pluridisciplinaire avec les filières design, cybersécurité, développement et marketing ;
Saint Barth Volley — application web pour une association sportive dans laquelle je suis bénévole ;
Travaux pratiques variés (CineMap TP Laravel, TP Vue.js, etc.) ;
Projets personnels : monitoring de VPS, bot Discord, jeu de dé.
1.3.2 Stage en entreprise
J'ai effectué un stage au sein du cabinet de conseil QW, spécialisé dans la conformité réglementaire et la gestion des risques, où j'ai développé une application web de gestion de la conformité LCB-FT.
1.4 Projet retenu pour le dossier
Le projet principal présenté dans ce dossier est celui réalisé lors de mon stage chez QW. Il constitue le cœur de l'évaluation pour l'obtention du titre CDA.
Plusieurs éléments issus de mes projets personnels ont été réutilisés et enrichissent ce contexte, notamment :
La mise en place d'un VPS configuré pour héberger plusieurs applications ;
L'architecture multi-applications basée sur Docker ;
Un système de monitoring du VPS et des applications déployées.


Contexte du projet
2.1 Présentation de l'entreprise
Le projet a été réalisé au sein du cabinet de conseil QW, une structure spécialisée dans l'accompagnement des entreprises sur les enjeux de conformité réglementaire et de gestion des risques.
Le cabinet intervient auprès de clients professionnels afin de les aider à structurer leurs processus internes et à répondre à leurs obligations réglementaires, notamment dans les domaines liés à la lutte contre le blanchiment de capitaux et le financement du terrorisme (LCB-FT).
Il propose un accompagnement basé sur l'analyse des risques, la mise en conformité des organisations et le suivi des obligations réglementaires en vigueur.
2.2 Problématique
Actuellement, les processus de gestion de la conformité au sein du cabinet reposent sur l'utilisation de plusieurs outils non centralisés, tels que des fichiers Excel et des documents partagés.
Cette organisation entraîne :
Une dispersion des informations, rendant difficile la consolidation et l'exploitation des données clients ;
Une absence de traçabilité : il devient complexe de suivre l'historique des modifications, des analyses réalisées ou des décisions prises sur les dossiers ;
Des risques d'erreurs, de doublons ou de perte d'informations, impactant directement la fiabilité du suivi des dossiers de conformité.
2.3 Besoin métier
Afin de répondre aux limites identifiées, le cabinet exprime plusieurs besoins métiers essentiels :
Centraliser l'ensemble des données clients et des informations liées aux dossiers au sein d'une plateforme unique ;
Sécuriser les informations, compte tenu de la sensibilité des données traitées dans le cadre de la conformité LCB-FT (confidentialité, intégrité, protection) ;
Améliorer le suivi des obligations de conformité, notamment à travers une meilleure traçabilité des actions et une vision plus claire de l'état d'avancement des dossiers.

Objectifs du projet
3.1 Objectif principal
L'objectif principal est de concevoir et développer une application web responsive de gestion de la conformité LCB-FT destinée au cabinet QW.
Cette application doit permettre de centraliser l'ensemble des données liées aux clients et aux dossiers de conformité, tout en structurant les processus de traitement et d'analyse, dans un outil unique, fiable et sécurisé.
3.2 Objectifs fonctionnels
Gestion des clients (KYC) : création, consultation et mise à jour des informations clients nécessaires à leur identification et à leur suivi (Know Your Customer) ;
Scoring des risques : évaluation automatique du niveau de risque associé à chaque client, permettant de les classer et d'adapter le suivi en conséquence ;
Traçabilité : enregistrement de l'ensemble des actions réalisées sur les dossiers, garantissant un historique complet ;
Gestion documentaire : ajout, stockage et consultation des documents liés aux dossiers clients.
3.3 Objectifs techniques
Mise en place d'une architecture web moderne avec séparation claire entre frontend, backend et base de données ;
Exposition et consommation d'une API REST pour la communication inter-couches ;
Sécurisation des données : authentification, protection des échanges, gestion des accès ;
Système de gestion des rôles (RBAC) pour contrôler les accès aux différentes fonctionnalités.


Périmètre du projet
4.1 Inclus dans le périmètre (MVP)
Gestion des clients : création, modification et consultation des dossiers clients ;
KYC (Know Your Customer) : saisie et structuration des informations d'identification ;
Scoring des risques : système d'évaluation du niveau de risque par client ;
Authentification : système de connexion sécurisé ;
Gestion des rôles utilisateurs : niveaux d'accès différenciés selon le profil ;
Audit simple : enregistrement des principales actions effectuées sur les dossiers.
4.2 Exclu du périmètre
Dashboards avancés : tableaux de bord analytiques complexes ;
Intégrations externes (OFAC, GAFI, etc.) : connexions avec des bases de données de conformité ;
Système d'alerting avancé : mécanismes automatisés de détection des alertes ;
Import de données (Excel/CSV) : import automatisé de données ;
Mise en production réelle : le projet est déployé dans un environnement de test uniquement.
4.3 Contraintes
Contrainte de temps : cadre du stage et de la formation, avec durée limitée imposant de prioriser les fonctionnalités essentielles ;
MVP obligatoire : première version fonctionnelle centrée sur les besoins principaux ;
Contraintes réglementaires (RGPD) :
Protection des données personnelles ;
Limitation de la collecte aux données strictement nécessaires ;
Sécurisation des accès et des échanges ;
Traçabilité des actions effectuées sur les données ;
Environnement de test uniquement : solution non déployée en production réelle.


Fonctionnalités
5.1 Fonctionnalités principales (MVP)
Gestion des clients : création, modification et consultation des informations clients ;
Gestion des dossiers : centralisation et organisation des dossiers par client ;
KYC : gestion des informations d'identification conformément aux exigences réglementaires ;
Scoring des risques : évaluation automatique du niveau de risque ;
Gestion des documents : ajout, stockage et consultation des fichiers liés aux dossiers ;
Traçabilité : historique des modifications et des opérations réalisées.
5.2 Évolutions envisagées
Alertes : notifications sur les événements importants liés aux dossiers ;
Dashboards : tableaux de bord analytiques pour une vision globale de l'activité ;
Imports de données : import via fichiers Excel/CSV ;
Automatisations : recalcul automatique des scores de risque et mises à jour de données.


Conception fonctionnelle
6.1 Acteurs du système
Collaborateur : saisie et mise à jour des dossiers clients, alimentation des informations KYC ;
Responsable : validation, supervision et contrôle de la cohérence des dossiers ;
Expert-comptable : analyse des situations complexes, regard réglementaire et financier ;
Administrateur : gestion des comptes, des rôles, des paramètres système et supervision globale.
6.2 Cartographie fonctionnelle




6.3 Parcours utilisateurs
6.3.1 Création d'un client


6.3.2 Mise à jour KYC


6.3.3 Evaluation des risques

6.3.4 Validation d'un dossier

6.4 Maquettes
6.4.1 Wireframes

6.4.2 Maquettes



6.5 Conception de la base de données
La base de données de QW-app est conçue selon la méthodologie Merise, en trois étapes successives : MCD → MLD → MPD. Le SGBD retenu est PostgreSQL 16, accédé via TypeORM (ORM TypeScript).
6.5.1 Dictionnaire de données
Le dictionnaire recense l'ensemble des informations à stocker dans la base de données. Voir l'annexe Base de données - Dictionnaire de données.
6.5.2 MCD (Modèle Conceptuel de Données)
Le schéma visuel du MCD est à réaliser avec Looping ou JMerise à partir des entités et associations ci-dessous.
Entités
Entité
Propriétés principales
UTILISATEUR
id, email, password_hash, role, prenom, nom, is_active, last_login_at
CLIENT
id, reference, prenom, nom, raison_sociale, email, telephone, statut, deleted_at
KYC
id, nationalite, pays_residence, secteur_activite, forme_juridique, est_pep, pays_haut_risque, chiffre_affaires
DOCUMENT
id, nom_fichier, chemin_stockage, type_mime, taille
SCORE_RISQUE
id, score, niveau, details, calculated_at
AUDIT_LOG
id, action, entite_type, entite_id, details, created_at

Associations, liaisons et cardinalités

UTILISATEUR (1,n) ────── crée ────── (0,n) CLIENT
   Un utilisateur peut créer 0 ou plusieurs clients.
   Un client est créé par exactement 1 utilisateur.
UTILISATEUR (0,n) ──── valide ──── (0,1) CLIENT
   Un utilisateur peut valider 0 ou plusieurs dossiers.
   Un client peut être validé par au plus 1 utilisateur.
CLIENT (1,1) ──── possède ──── (1,1) KYC
   Un client possède exactement 1 fiche KYC.
   Une fiche KYC appartient à exactement 1 client.
CLIENT (1,n) ──── détient ──── (0,n) DOCUMENT
   Un client peut avoir 0 ou plusieurs documents.
   Un document est rattaché à exactement 1 client.
UTILISATEUR (1,n) ── uploade ── (0,n) DOCUMENT
   Un utilisateur peut uploader 0 ou plusieurs documents.
   Un document est uploadé par exactement 1 utilisateur.
CLIENT (1,n) ──── fait_lobjet ──── (0,n) SCORE_RISQUE
   Un client peut avoir 0 ou plusieurs scores (historique).
   Un score concerne exactement 1 client.
UTILISATEUR (1,n) ── calcule ── (0,n) SCORE_RISQUE
   Un utilisateur peut calculer 0 ou plusieurs scores.
   Un score est calculé par exactement 1 utilisateur.
UTILISATEUR (1,n) ──── genere ──── (0,n) AUDIT_LOG
   Un utilisateur peut générer 0 ou plusieurs entrées d'audit.
   Une entrée d'audit est générée par exactement 1 utilisateur.


6.5.3 MCD (Modèle Logique de Données)
Traduction du MCD en tables relationnelles. Les clés primaires sont en MAJUSCULES, les clés étrangères entre [crochets].
UTILISATEUR (ID, email, password_hash, role, prenom, nom, is_active, last_login_at, created_at, updated_at)
CLIENT (ID, reference, prenom, nom, raison_sociale, email, telephone, statut, deleted_at, created_at, updated_at,
        [id_createur → UTILISATEUR.id], [id_validateur → UTILISATEUR.id])
KYC (ID, nationalite, pays_residence, secteur_activite, forme_juridique, est_pep, pays_haut_risque,
     chiffre_affaires, created_at, updated_at,
     [id_client → CLIENT.id])                    ← relation 1-1 (UNIQUE)
DOCUMENT (ID, nom_fichier, chemin_stockage, type_mime, taille, created_at,
          [id_client → CLIENT.id], [id_utilisateur → UTILISATEUR.id])
SCORE_RISQUE (ID, score, niveau, details, calculated_at,
              [id_client → CLIENT.id], [id_utilisateur → UTILISATEUR.id])
AUDIT_LOG (ID, action, entite_type, entite_id, details, created_at,
           [id_utilisateur → UTILISATEUR.id])



6.5.3 MPD (Modèle Physique de Données)
Implémentation concrète pour PostgreSQL 16 avec TypeORM. Les types sont définis précisément, les contraintes d'intégrité et les index sont inclus. Voir l'annexe Base de données - MPD.

Conception technique
7.1 Architecture globale
L'architecture de la plateforme repose sur un modèle client-serveur structuré en couches distinctes, garantissant la maintenabilité, la scalabilité et la séparation des responsabilités.
7.1.1 Frontend / Backend / Base de données
Frontend (Next.js) : interface utilisateur, affichage des données, interactions avec l'utilisateur ;
Backend (NestJS) : logique métier, traitement des données, exposition des services via API ;
Base de données (PostgreSQL) : persistance des données et garantie de leur intégrité.
La communication entre le frontend et le backend s'effectue via une API REST (requêtes HTTP : GET, POST, PUT, DELETE).
7.1.2 Cartographie technique


7.2 Frontend
7.2.1 Next.js
Next.js a été choisi pour sa capacité à combiner plusieurs modes de rendu (SSR, CSR, SSG), ce qui optimise les performances et le temps de chargement. Son routing basé sur les fichiers simplifie l'organisation du projet, et son intégration native avec React en fait un choix cohérent avec les standards actuels.
7.2.2 React & Tailwind CSS
L'interface est construite avec React (composants réutilisables et modulaires) et stylisée avec Tailwind CSS complété par une bibliothèque de composants UI, garantissant une interface cohérente, responsive et facilement personnalisable.
7.2.3 Pages principales
Tableau de bord : vue globale des clients et des indicateurs ;
Gestion des clients : création, modification, consultation ;
Dossier client : détail KYC et documents associés ;
Scoring des risques : affichage et suivi du niveau de risque ;
Authentification : page de connexion sécurisée.
7.3 Backend
7.3.1 NestJS
NestJS a été retenu pour son architecture modulaire basée sur TypeScript, sa séparation claire des responsabilités (modules, services, controllers inspirés d'Angular) et son adaptabilité à la création d'API REST robustes et scalables.
7.3.2 Modules métier
Module clients : cycle de vie des clients (création, modification, consultation) ;
Module KYC : structuration des données de connaissance client ;
Module documents : gestion des fichiers associés aux dossiers ;
Module utilisateurs : authentification et gestion des rôles.
7.3.3 Services métier
Service de scoring : calcul automatique du niveau de risque en fonction de règles définies ;
Service d'audit : enregistrement des actions pour assurer la traçabilité ;
Services utilitaires : validation, règles métier transverses.

7.4 Base de données
7.4.1 PostgreSQL
PostgreSQL a été choisi pour sa robustesse, sa fiabilité et sa conformité aux standards SQL. Il permet de gérer efficacement des données structurées avec des relations complexes, ce qui correspond parfaitement aux besoins d'une application de gestion de conformité où l'intégrité des données est primordiale.
Tables principales
clients : informations d'identification et données KYC ;
dossiers : informations liées aux dossiers de conformité ;
documents : métadonnées des fichiers associés ;
risk_scores : historique des scores de risque calculés ;
audit_logs : journalisation des actions effectuées ;
users : gestion des utilisateurs et de leurs rôles.
7.4.2 Redis
Redis est utilisé comme système de cache en mémoire afin de réduire les requêtes répétitives vers PostgreSQL, notamment pour les données fortement sollicitées (scores de risque, informations fréquemment consultées). Cela améliore les temps de réponse et réduit la charge serveur lors des pics d'utilisation.
7.4.3 Stockage de documents
Le stockage des documents n'est pas définitivement arrêté. Deux solutions sont envisagées :
Stockage sur VPS : fichiers stockés directement sur le serveur, organisés par dossier client ;
Synology Drive : stockage externe, avec l'application conservant uniquement les liens et métadonnées.
Le backend agit comme intermédiaire unique pour l'upload, la récupération et le contrôle d'accès aux fichiers, permettant de changer de solution de stockage sans modifier la logique applicative.

Réalisation technique
8.1 Environnement de développement
8.1.1 VPS et Linux
L'environnement de développement et de test repose sur un VPS (Virtual Private Server) sous Linux (Ubuntu). Ce choix s'explique par la stabilité, la performance et la compatibilité optimale avec les outils utilisés (Node.js, Docker, Nginx, PostgreSQL).
La configuration du serveur comprend (Voir annexe D4) :
Un utilisateur dédié avec des droits restreints ;
Accès via SSH avec authentification par clé (mot de passe désactivé) ;
Pare-feu (UFW) limitant les ports exposés (22, 80, 443) ;
Installation des services nécessaires (Nginx, Docker, PostgreSQL, Redis) ;
Reverse proxy Nginx pour la gestion des applications.
8.1.2 Outils de développement
Visual Studio Code : éditeur principal, avec support TypeScript/JavaScript, intégration Git, Prettier et ESLint ;
Git / GitHub : gestion de version, branches, pull requests, suivi des issues ;
Docker : conteneurisation des services (frontend, backend, base de données, cache), orchestration via docker-compose.
8.2 Base de données
8.2.1 PostgreSQL et TypeORM
La base de données PostgreSQL est accédée via TypeORM (ORM TypeScript). Les entités définissent le schéma et les relations ; les migrations gèrent les évolutions du schéma sans perte de données.
Entités principales :
Entité
Contenu
User
Identifiants, rôle, date de création
Client
Informations d'identification, statut du dossier
Kyc
Données de connaissance client (relation 1-1 avec Client)
Document
Métadonnées du fichier, chemin de stockage, client associé
RiskScore
Score calculé, niveau, date, client associé
AuditLog
Utilisateur, action, entité cible, timestamp

Les entités sont reliées par des relations TypeORM (@OneToOne, @OneToMany). Par exemple, Client est lié à une Kyc (1-1), à plusieurs RiskScore (1-N) et à plusieurs AuditLog (1-N). Le code de l'entité Client est disponible en Annexe C10.
8.2.2 Cache (Redis)
Redis est utilisé pour mettre en cache les résultats de scoring et les données clients fréquemment consultées. Le cache est invalidé à chaque modification du dossier concerné. Cela réduit la charge sur PostgreSQL lors des consultations répétées et améliore les temps de réponse.
8.3 Frontend
8.3.1 Structure et organisation
L'interface est développée avec Next.js (App Router) et React. Les composants sont organisés par domaine fonctionnel (clients, dossiers, scoring, documents) et partagent une bibliothèque de composants UI basée sur Tailwind CSS.
8.3.2 Design system — shadcn/ui
L'interface du dashboard suit les patterns shadcn/ui : composants accessibles construits sur Radix UI, stylisés avec Tailwind CSS et des variables CSS oklch pour le thème (light/dark). Aucune dépendance à la CLI shadcn : les composants sont intégrés directement dans src/components/ui/.
Packages utilisés :
Catégorie
Packages
Primitives UI
@radix-ui/react-{avatar,checkbox,dialog,dropdown-menu,label,select,separator,slot,tabs,tooltip}
Styling
class-variance-authority, clsx, tailwind-merge, tw-animate-css
Icônes
@tabler/icons-react
Graphiques
recharts
Formulaires
zod
Notifications
sonner

8.3.3 Architecture du dashboard
Le dashboard repose sur un layout SidebarProvider qui encapsule toutes les pages de l'espace connecté :

SidebarProvider
├── AppSidebar          ← barre latérale collapsible (offcanvas mobile)
│   ├── SidebarHeader   ← logo de l'application
│   ├── SidebarContent
│   │   ├── NavMain     ← navigation principale (icônes Tabler)
│   │   └── NavSecondary ← liens secondaires (Paramètres, Aide)
│   └── SidebarFooter
│       └── NavUser     ← avatar + email + rôle + bouton déconnexion
└── SidebarInset        ← zone de contenu principale
    ├── SiteHeader      ← header de page (titre + breadcrumb)
    └── {children}      ← contenu de la page courante


Le layout vérifie l'authentification via useAuth() : toutes les pages enfants sont protégées automatiquement sans duplication. Les pages nécessitant un rôle spécifique (ex. admin) ajoutent useAuth("admin") au niveau de la page. Le code complet est disponible en Annexe C8.
8.3.4 Composant SectionCards — statistiques
Chaque page de vue globale affiche une grille de cartes de statistiques (SectionCards). Chaque carte contient un label, une icône colorée (Tabler) et la valeur remontée depuis l'API. Les données sont chargées en parallèle via Promise.allSettled au montage de la page, garantissant qu'une erreur sur un endpoint n'empêche pas l'affichage des autres indicateurs. Code complet en Annexe C9.
8.3.5 Pages développées
/login — Formulaire d'authentification, gestion des erreurs, redirection post-connexion ;
/dashboard — Vue globale : liste des clients, indicateurs de risque, statuts des dossiers ;
/clients — Listing, création et modification des fiches clients ;
/clients/[id] — Détail client : KYC, scoring, documents, historique des actions ;
/scoring — Affichage et suivi du niveau de risque par client.
8.3.6 Gestion de l'état et des appels API
Appels API centralisés via le helper apiFetch (voir Annexe C7) qui injecte automatiquement le token JWT dans le header Authorization ;
Session gérée côté client via localStorage (token + rôle) ;
Redirection automatique vers /login en cas de token expiré (401).
8.3.7 Sécurité frontend
Aucun secret exposé côté client ;
Protection XSS assurée par l'échappement natif de React ;
Validation des formulaires avant envoi (retours d'erreur serveur affichés).
8.4 Backend
8.4.1 Architecture modulaire (NestJS)
Le backend est structuré selon l'architecture modulaire de NestJS, avec une séparation claire entre modules, controllers, services et DTOs.
Modules développés :
Module
Responsabilité
AuthModule
Authentification JWT (access + refresh token), guards, stratégies Passport
UsersModule
Gestion des comptes utilisateurs et des rôles
ClientsModule
CRUD clients, cycle de vie des dossiers
KycModule
Structuration et mise à jour des données KYC
DocumentsModule
Upload, stockage et accès contrôlé aux fichiers
ScoringModule
Calcul automatique du niveau de risque
AuditModule
Journalisation de toutes les actions métier

8.4.2 Sécurité des endpoints
Chaque route est protégée par un JwtAuthGuard et un RolesGuard via des décorateurs personnalisés :

@Roles(Role.RESPONSABLE, Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Patch(':id/validate')
validate(@Param('id') id: string) { ... }


Un ValidationPipe global rejette les requêtes dont les données ne correspondent pas aux DTOs définis avec class-validator.
8.4.3 Service de scoring
Le service calcule un score de risque (faible / moyen / élevé) en fonction de critères pondérés issus du KYC (nationalité, activité, exposition politique, historique). Le résultat est persisté avec un horodatage pour assurer la traçabilité des réévaluations.
8.4.4 Service d'audit
Chaque action significative (création, modification, validation, consultation de document) déclenche l'enregistrement d'une entrée dans la table audit_logs : utilisateur, action, entité cible, timestamp.
8.4.5 Workflow CRUD — application LCB-FT
Toutes les ressources de l'application (clients, dossiers, KYC, documents) suivent le même flux : chaque requête du frontend traverse une chaîne middleware avant d'atteindre la base de données, et chaque opération d'écriture génère une entrée dans l'audit.
Chaîne de traitement d'une requête

Frontend (Next.js)
  └── apiFetch()                    // injecte Authorization: Bearer <token>
        │
        ▼
Backend (NestJS)
  ├── JwtAuthGuard                  // vérifie et décode le JWT
  ├── RolesGuard                    // contrôle le rôle requis
  ├── ValidationPipe (DTO)          // valide le body (class-validator)
  ├── ClientsController             // reçoit la requête validée
  │     └── ClientsService          // logique métier
  │           ├── clientRepository  // TypeORM → PostgreSQL
  │           └── AuditService      // enregistre l'action (create/update/delete)
  └── response JSON




Flux par opération
CREATE — POST /api/clients


READ — GET /api/clients et GET /api/clients/:id

Le filtre selon le rôle permet par exemple à un collaborateur de ne voir que ses propres dossiers, tandis qu'un responsable ou un admin voit tous les clients.
UPDATE — PATCH /api/clients/:id

DELETE — DELETE /api/clients/:id

La suppression est un soft delete : le client est marqué deletedAt mais les données restent en base pour respecter l'obligation de conservation LCB-FT (5 ans).
Matrice des droits par opération
Opération
Collaborateur
Responsable
Expert-comptable
Admin
Créer un client
✅
✅
❌
✅
Lire la liste
✅ (ses dossiers)
✅ (tous)
✅ (tous)
✅
Lire le détail
✅
✅
✅
✅
Modifier KYC
✅
✅
❌
✅
Valider un dossier
❌
✅
❌
✅
Consulter les scores
✅
✅
✅
✅
Accéder aux documents
✅
✅
✅
✅
Supprimer (soft)
❌
❌
❌
✅

8.4.6 Helper apiFetch (frontend)
Toutes les requêtes passent par un helper centralisé (apiFetch) qui injecte automatiquement le token JWT dans le header Authorization et gère l'expiration de session : en cas de 401, le token et le rôle sont supprimés de localStorage et l'utilisateur est redirigé vers /login. Code complet en Annexe C7.
8.4.7 Authentification et gestion des rôles
Le système d'authentification de QWapp repose sur JWT, bcrypt et TypeORM, avec un double contrôle backend (guard + rôle) et un hook React côté frontend. Cette architecture est réutilisable sur tout projet Next.js + Express/NestJS avec rôles.
8.4.8 Entité utilisateur (PostgreSQL / TypeORM)
Le modèle User centralise les informations d'authentification et le rôle. Les quatre rôles de l'application sont définis via une enum TypeScript :

export enum UserRole {
  COLLABORATEUR    = "collaborateur",
  RESPONSABLE      = "responsable",
  EXPERT_COMPTABLE = "expert-comptable",
  ADMIN            = "admin",
}


Le mot de passe n'est jamais stocké en clair : seul le hash bcrypt est persisté. L'entité complète est disponible en Annexe C1.
8.4.9 Route de login (backend NestJS)
La route POST /api/auth/login vérifie l'email, compare le hash bcrypt, met à jour lastLoginAt, puis retourne un token JWT signé { id, role }. Deux règles de sécurité clés :
Même message d'erreur pour email inconnu et mot de passe incorrect (pas d'énumération des comptes) ;
Un compte avec isActive: false est rejeté avant la vérification du mot de passe.
Code complet en Annexe C2.
8.4.10 Guards NestJS — JwtAuthGuard et RolesGuard
Le JwtAuthGuard vérifie et décode le token Bearer sur chaque route protégée. Le RolesGuard contrôle ensuite que le rôle de l'utilisateur est dans la liste autorisée pour l'endpoint. Ils s'appliquent via des décorateurs :
@Roles(UserRole.RESPONSABLE, UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Patch(':id/valider')
validerDossier(@Param('id') id: string) { ... }

Implémentations complètes en Annexes C3 et C4.
8.4.11 Hook useAuth (frontend Next.js)
Centralise la protection des pages côté client. Vérifie la présence du token dans localStorage au montage et redirige vers /login si absent ou si le rôle est insuffisant. 
Expose { ready, role, logout }. Usage :
// Vérifie uniquement la connexion
const { ready, role } = useAuth();

// Vérifie la connexion ET le rôle
const { ready } = useAuth("admin");

Le rendu est bloqué tant que ready est false, évitant tout flash de contenu non autorisé. Code complet en Annexe C5.
8.4.12 Composant LoginForm (frontend)
Envoie les identifiants au backend, stocke le token et le rôle retournés dans localStorage, puis redirige vers /dashboard. Les erreurs serveur sont affichées directement dans le formulaire. Code complet en Annexe C6.

8.4.11 Flux complet de connexion

8.5 Architecture serveur
8.5.1 Nginx (reverse proxy)
Nginx est utilisé comme serveur web principal et reverse proxy. Il intercepte les requêtes entrantes et les redirige vers les bons services internes en fonction des routes ou des sous-domaines.
Avantages :
Centralisation de l'accès aux différentes applications ;
Amélioration de la sécurité en masquant les services internes ;
Simplification de la gestion des certificats HTTPS ;
Meilleure organisation du trafic réseau.
8.5.2 Architecture multi-applications
Le serveur est configuré pour héberger plusieurs applications simultanément sur un même VPS. Chaque application est isolée dans son propre conteneur Docker et accessible via une route spécifique configurée dans Nginx. Cela permet une mutualisation des ressources tout en maintenant l'isolation et l'indépendance de chaque projet.
8.6 Sécurité et conformité
8.6.1 Authentification (JWT)
L'authentification repose sur des JSON Web Tokens (JWT) signés avec une clé secrète stockée en variable d'environnement. Le token contient le id et le role de l'utilisateur et est transmis dans le header Authorization: Bearer <token> à chaque requête.
Ce mécanisme sans état (stateless) évite toute gestion de session côté serveur et garantit une scalabilité horizontale.
8.6.2 Autorisation (RBAC)
Le système d'autorisation repose sur un contrôle d'accès basé sur les rôles (RBAC). Chaque utilisateur est associé à un rôle (collaborateur, responsable, expert-comptable, admin) qui détermine ses permissions.
La gestion des autorisations est implémentée côté backend via des guards NestJS (JwtAuthGuard + RolesGuard) avec des décorateurs personnalisés associant les rôles requis à chaque endpoint. Cela permet de respecter le principe du moindre privilège.
8.6.3 Validation des données
La validation des données entrantes repose sur des DTO (Data Transfer Objects) avec les bibliothèques class-validator et class-transformer. Un ValidationPipe global rejette automatiquement les requêtes non conformes avant toute exécution de la logique métier.
8.6.4 Protection contre les attaques
XSS : React/Next.js échappe automatiquement les données affichées dans les composants ;
CSRF : l'architecture JWT (token dans les headers) et une configuration CORS restrictive limitent fortement ce risque ;
Injection SQL : toutes les interactions avec la base de données passent par TypeORM (requêtes paramétrées) ;
Rate limiting : limitation du nombre de requêtes par IP pour protéger les endpoints sensibles contre la force brute.
8.6.5 Sécurité serveur
SSH : authentification par clé uniquement, utilisateur dédié distinct du compte root ;
Firewall (UFW) : seuls les ports 22 (SSH), 80 (HTTP) et 443 (HTTPS) sont ouverts ;
HTTPS : certificat SSL/TLS via Nginx pour chiffrer les données en transit.
8.6.6 Sécurité des documents
L'accès aux documents est strictement contrôlé via le backend (authentification + rôle + permissions sur le dossier). Aucun fichier n'est accessible directement via URL publique : toute requête passe obligatoirement par l'API, qui journalise les consultations dans les logs d'audit.
8.6.7 RGPD
Minimisation des données : seules les données strictement nécessaires au KYC et à l'évaluation des risques sont collectées ;
Droits des utilisateurs : droit d'accès, de rectification, d'effacement (dans les limites légales), de limitation et à la portabilité ;
Durée de conservation : 5 ans à compter de la fin de la relation d'affaires, conformément aux obligations LCB-FT ;
Privacy by design : sécurité intégrée dès la conception, paramétrage par défaut le plus protecteur, limitation des accès au strict nécessaire ;
Traçabilité (accountability) : journalisation de toutes les actions sur les données via le système d'audit.


8.7 Tests
8.7.1 Stratégie de tests
La stratégie de tests repose sur une approche progressive visant à garantir la fiabilité et la qualité de l’application.
À ce stade du projet, les tests ne sont pas encore entièrement implémentés, mais une architecture de tests claire a été définie afin de couvrir les différents niveaux de validation.
Tests unitaires
Les tests unitaires ont pour objectif de vérifier le bon fonctionnement des services métier de manière isolée.
Ils seront réalisés en utilisant des mocks afin de simuler les dépendances externes, notamment :
Les repositories (accès base de données via TypeORM) ;
Les services externes (ex : scoring, audit) ;
Les appels réseau éventuels.
L’objectif est de tester uniquement la logique métier, sans dépendre de l’infrastructure.
Exemples de tests unitaires prévus :
Vérification du calcul du score de risque selon différents cas ;
Validation des règles métier (ex : création d’un client avec données obligatoires) ;
Vérification des comportements en cas d’erreur (exceptions, données invalides).
Tests fonctionnels (end-to-end)
Les tests fonctionnels visent à valider les flux complets de l’application, du frontend jusqu’à la base de données.
Ils permettront de tester le comportement réel de l’application dans des conditions proches de la production.
Ces tests incluront :
L’authentification utilisateur (login, accès protégé, déconnexion) ;
Les opérations CRUD sur les clients ;
Le calcul et la consultation des scores de risque ;
La gestion des rôles et des autorisations.
Les tests end-to-end seront réalisés avec une base de données de test dédiée afin de garantir l’isolation des environnements.

8.7.2 Cas de tests
Plusieurs cas de tests ont été identifiés afin de couvrir les fonctionnalités principales de l’application.
Création d’un client
Vérifier qu’un client est correctement créé avec des données valides ;
Vérifier qu’une erreur est retournée si des champs obligatoires sont manquants ;
Vérifier que l’action est bien enregistrée dans les logs d’audit.
Calcul du scoring de risque
Vérifier que le score est correctement calculé en fonction des données KYC ;
Tester plusieurs scénarios (risque faible, moyen, élevé) ;
Vérifier la persistance du score en base de données.
Authentification
Vérifier qu’un utilisateur peut se connecter avec des identifiants valides ;
Vérifier qu’un accès est refusé avec des identifiants invalides ;
Vérifier que les routes protégées sont inaccessibles sans token ;
Vérifier la gestion des rôles sur les endpoints sécurisés ;
Vérifier la déconnexion (suppression du token côté client).
8.7.3 Résultats
Les tests sont en cours de mise en place et n’ont pas encore été entièrement exécutés au moment de la rédaction de ce dossier.
Toutefois, la stratégie définie permet de garantir à terme :
Une meilleure fiabilité de l’application ;
Une détection rapide des régressions lors des évolutions ;
Une validation automatisée des fonctionnalités critiques.
À terme, les résultats des tests seront analysés en comparant les comportements attendus et obtenus, afin d’identifier les anomalies et d’améliorer la qualité globale du projet.


8.8 Déploiement & infrastructure
8.8.1 Cartographie de déploiement

8.8.2 Architecture de déploiement
L'application est déployée sur un VPS (Virtual Private Server) utilisé comme environnement de test, reproduisant des conditions proches de la production.
Le VPS héberge l'ensemble des composants :
Frontend (Next.js)
Backend (NestJS)
Base de données (PostgreSQL)
Cache (Redis)
Outils annexes (monitoring)
Tous les services sont conteneurisés via Docker et orchestrés avec docker-compose, garantissant reproductibilité, isolation et simplicité de déploiement.
Nginx assure la répartition des requêtes entre les différentes applications selon la configuration définie.
8.8.3 Environnement de test (staging)
L'application est déployée dans un environnement de type staging, permettant de valider les développements dans des conditions proches de la production, sans utilisateurs réels. Aucune mise en production réelle n'a été effectuée dans le cadre du projet.
8.8.4 Procédure de déploiement (CD)
Le déploiement est automatisé via GitHub Actions. À chaque push sur la branche staging :
Connexion au VPS via SSH (clé sécurisée stockée en secret GitHub) ;
Récupération du code (git pull) ;
Reconstruction des images Docker ;
Redémarrage des services (docker-compose up -d).
Cette automatisation réduit les erreurs humaines et garantit une mise à jour continue de l'environnement.
8.8.5 Monitoring de l'infrastructure
Application VPS Monitor
Afin de superviser l'environnement multi-applications, une application de monitoring dédiée a été développée. Elle remplace la page statique initiale du serveur et constitue un point d'entrée centralisé pour l'ensemble de l'infrastructure.
L'application est accessible publiquement pour la navigation entre les projets hébergés, et dispose d'un dashboard protégé réservé à l'administrateur pour la supervision technique. Voir annexes A
Fonctionnalités
Monitoring Docker :
Listing des conteneurs avec leur statut (running, stopped, restarting) ;
Affichage de l'image, de l'uptime et des ports exposés ;
Actions à distance : redémarrer, arrêter, démarrer un conteneur.
Monitoring des applications web :
Vérification de la disponibilité de chaque application via requête HTTP ;
Détection des erreurs ou indisponibilités (timeout 5 s) ;
Affichage d'un statut global (OK / KO / Degraded) et d'un résumé (X OK / Y KO).
Dashboard global :
Vue synthétique du serveur avec mise à jour automatique toutes les 5 secondes ;
Page d'accueil publique listant les applications hébergées avec leurs liens.
8.9 CI / CD
8.9.1 Intégration continue (CI)
La chaîne d'intégration continue repose sur GitHub Actions et est déclenchée à chaque Pull Request. Elle est découpée en plusieurs workflows spécialisés et indépendants.
Qualité du code
lint.yml — Exécute ESLint (backend et frontend séparément) et Prettier pour valider la cohérence du code et le formatage ;
ci.yml — Workflow global orchestrant en parallèle (via matrix backend / frontend) : lint, Prettier, tests Jest et audit de sécurité.
Tests
tests.yml — Lance la suite de tests Jest sur le backend et le frontend en parallèle (npm test) ;
Sécurité
audit.yml — Exécute npm audit --audit-level=high sur le backend et le frontend. Bloque la PR si une dépendance présente une vulnérabilité de niveau élevé ou critique.
Conventions et traçabilité
branch-name.yml — Vérifie que le nom de branche respecte le format attendu : feature/123-description, feat/123-description, fix/123-description, hotfix/123-description. Bloque les PR dont la branche est mal nommée ;
commit-message.yml — Valide le format des messages de commit selon la convention type(scope): Fixes #<issue> - message. Les merges et releases automatiques sont ignorés ;
ticket.yml — Vérifie que le titre de la PR ou le nom de branche référence bien un numéro d'issue GitHub. Garantit la traçabilité entre le code et le backlog ;
structure.yml — Contrôle la présence des fichiers obligatoires (README.md, CONTRIBUTING.md, INSTALL.md, LICENSE) et des répertoires du projet.
Hooks locaux (Husky)
Un système de pre-commit hooks via Husky et lint-staged exécute lint et Prettier localement avant chaque commit, en complément des vérifications CI.
Des rulesets GitHub protègent les branches main et dev : aucune fusion n'est autorisée sans que l'ensemble des contrôles CI soit passé.
8.9.2 Déploiement continu (CD)
Le déploiement est automatisé via deploy.yml, déclenché à chaque push sur la branche staging :
Connexion au VPS via SSH (clé privée stockée en secret GitHub) ;
Mise à jour du code (git pull origin staging) ;
Reconstruction des images Docker (docker compose build clb-back clb-front) ;
Redémarrage des services (docker compose up -d --remove-orphans) ;
Nettoyage des images obsolètes (docker image prune -f) ;
Vérification que les conteneurs sont bien en état running.
8.9.3 Versioning et releases
Le projet suit un Git Flow simplifié :
Branche
Rôle
main
Version stable
staging
Environnement de test / déploiement
dev
Intégration des développements
feat/* / feature/*
Nouvelles fonctionnalités
fix/*
Corrections de bugs
hotfix/*
Corrections urgentes sur main

8.9.4 Release automatique (release.yml)
Déclenché automatiquement lors du merge de dev vers main :
Calcul de la prochaine version SemVer (incrémentation mineure x.y+1.0) ;
Vérification de la présence d'une section correspondante dans CHANGELOG.md (échec si absente ou vide) ;
Création du tag Git et push ;
Création de la GitHub Release avec les notes du changelog.
8.9.5 Hotfix release automatique (hotfix-release.yml)
Déclenché lors du merge d'une branche hotfix/* vers main :
Calcul de la prochaine version patch (x.y.z+1) ;
Création du tag Git et de la GitHub Release (notes générées automatiquement) ;
Ouverture automatique d'une Pull Request de synchronisation main → dev pour remettre dev à jour.
8.9.6 Limites
Pipeline adapté à un projet individuel, relativement simple ;
Absence d'environnement de production distinct ;
Gestion limitée de la montée en charge et de la haute disponibilité ;
Couverture de tests partielle.
Ces choix restent cohérents avec le cadre du projet (stage et formation) et les contraintes de temps.


8.10 Hébergement
8.10.1 VPS
L'application est hébergée sur un VPS (Virtual Private Server), offrant un contrôle total sur l'infrastructure à faible coût (~5€/mois). Configuration typique : 1-2 cœurs CPU, 2-4 Go de RAM, stockage SSD.
Avantages :
Coût faible et maîtrisé ;
Contrôle total de la configuration serveur ;
Compatible avec une architecture multi-applications ;
Reproduction d'un environnement proche de la production.
Limites :
Ressources limitées en cas de montée en charge ;
Absence de haute disponibilité native ;
Maintenance entièrement à la charge du développeur.
8.10.2 Stockage des fichiers
Deux solutions sont envisagées (voir section Stockage des documents). Dans les deux cas, l'application abstrait le système de stockage, permettant de changer de solution sans modifier la logique métier.



 Bilan du projet
9.1 Objectifs atteints
Le projet a permis de répondre aux objectifs principaux définis en début de mission.
Sur le plan fonctionnel, une application web permettant de centraliser les données clients, de gérer les informations KYC, d’évaluer les risques et d’assurer une traçabilité des actions a été développée. Les fonctionnalités essentielles attendues dans le cadre d’un MVP ont été implémentées et sont opérationnelles dans un environnement de test.
Sur le plan technique, plusieurs objectifs ont été atteints :
Mise en place d’une architecture complète frontend / backend / base de données ;
Développement d’une API REST structurée avec NestJS ;
Implémentation d’un système d’authentification sécurisé (JWT) et de gestion des rôles (RBAC) ;
Utilisation d’une base de données relationnelle (PostgreSQL) avec ORM ;
Déploiement sur un VPS Linux avec une architecture Docker multi-applications ;
Mise en place d’un début de pipeline CI/CD.
Le projet constitue ainsi une solution fonctionnelle cohérente, répondant aux besoins principaux du client dans le cadre du stage.
9.2 Difficultés rencontrées
La principale difficulté rencontrée tout au long du projet a été liée à un manque de connaissances initiales et de bonnes pratiques.
Une grande partie des choix techniques et des implémentations ont été réalisés de manière empirique, en apprenant directement au moment du besoin. Cela a entraîné :
Des hésitations dans les choix d’architecture ;
Des phases de refactorisation après coup ;
Une perte de temps liée à des erreurs ou à des approches non optimales ;
Une difficulté à anticiper certains besoins (scalabilité, monitoring, organisation).
Par ailleurs, le fait d’avoir travaillé majoritairement en autonomie a limité les échanges techniques et le recul critique qu’aurait pu apporter un développeur plus expérimenté.
9.3 Solutions apportées
Face à ces difficultés, une approche progressive et itérative a été adoptée.
Les solutions ont été construites au fur et à mesure des besoins, avec une logique d’amélioration continue :
Ajout de nouvelles fonctionnalités en réponse aux problématiques rencontrées ;
Refonte partielle de certaines parties du projet après acquisition de nouvelles compétences ;
Mise en place progressive de bonnes pratiques (modularisation, sécurité, structuration du code) ;
Évolution de l’infrastructure (passage d’un simple déploiement avec PM2 à une architecture Dockerisée multi-applications) ;
Développement d’un outil de monitoring VPS pour améliorer la lisibilité et la gestion des services.
Cette démarche, bien que moins structurée au départ, a permis de faire évoluer le projet de manière concrète et pragmatique.
9.4 Améliorations possibles
Plusieurs axes d’amélioration ont été identifiés pour faire évoluer le projet vers une solution plus robuste et professionnelle :
Amélioration de la qualité du code et refactorisation de certaines parties ;
Augmentation de la couverture de tests (tests unitaires et fonctionnels) ;
Mise en place d’un monitoring plus avancé (performance, logs centralisés) ;
Amélioration de la sécurité (gestion plus fine des tokens, audit renforcé) ;
Optimisation de l’architecture pour une meilleure scalabilité ;
Ajout de fonctionnalités non incluses dans le MVP (dashboards, alertes, imports de données).
Ces améliorations s’inscrivent dans une logique de passage d’un projet de formation à un projet plus proche d’un environnement de production réel.
9.5 Perspectives
À court terme, une évolution naturelle du projet serait la mise en place d’un environnement de production distinct, avec une infrastructure plus robuste et sécurisée.
À moyen terme, le projet pourrait être enrichi avec :
Des outils d’analyse avancés pour le suivi des risques ;
Des intégrations externes (bases réglementaires, APIs métiers) ;
Un système d’alerting automatisé ;
Une amélioration de l’expérience utilisateur.
Sur le plan personnel, ce projet constitue une base solide qui pourra être réutilisée et améliorée dans des contextes professionnels futurs.
Conclusion
Ce projet s’inscrit pleinement dans les objectifs de la formation Concepteur Développeur d’Applications (CDA) en couvrant l’ensemble du cycle de vie d’une application : de l’analyse du besoin à la conception, au développement, à la sécurisation et au déploiement.
Il m’a permis de développer des compétences clés du référentiel :
Concevoir une application sécurisée répondant à un besoin métier ;
Mettre en place une architecture en couches claire et maintenable ;
Déployer une application dans un environnement proche de la production ;
Appliquer des bonnes pratiques en matière de sécurité et de gestion des données.
Au-delà des compétences techniques, ce projet m’a surtout permis de progresser sur ma capacité à apprendre en autonomie, à résoudre des problèmes concrets et à faire évoluer une application dans le temps.
Il met également en évidence certains axes d’amélioration, notamment sur la maîtrise des bonnes pratiques et la structuration des projets, que je souhaite approfondir dans la suite de mon parcours.
Mon objectif est désormais de m’insérer durablement dans le monde professionnel en tant que développeur, au sein d’une structure dans laquelle je pourrai continuer à progresser, être encadré et m’épanouir.
Dans cette optique, la poursuite de mes études en master développement full-stack à MyDigitalSchool constitue une opportunité concrète pour renforcer mes compétences techniques et consolider mon profil professionnel.



Annexes
USE CASE


Diagrammes séquence
Mise à jour KYC

Validation d’un dossier

Base de données
Dictionnaire de données
MPD
Types énumérés (PostgreSQL ENUM)
Tables
Captures d’écran
Documentation technique — VPS Monitor
A1. Architecture globale
┌─────────────────────────────────────────────────────────────────┐
│                        VPS (Ubuntu)                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Nginx (reverse proxy)                  │  │
│  │                                                          │  │
│  │  location /           → 127.0.0.1:3000 (vps-monitor)    │  │
│  │  location /cinemap/   → 127.0.0.1:8001                  │  │
│  │  location /lucky7/    → 127.0.0.1:8002                  │  │
│  │  ...                                                     │  │
│  └────────────────────────────┬─────────────────────────────┘  │
│                               │                                 │
│              ┌────────────────▼────────────────┐               │
│              │   Node.js / Express (port 3000)  │               │
│              │   vps-monitor (conteneur Docker) │               │
│              │                                  │               │
│              │  ┌────────────────────────────┐  │               │
│              │  │     api/services/docker.js │  │               │
│              │  │     Dockerode              │  │               │
│              │  └──────────────┬─────────────┘  │               │
│              │                 │                 │               │
│              │  ┌──────────────▼─────────────┐  │               │
│              │  │  /var/run/docker.sock       │  │               │
│              │  │  (Docker Engine API)        │  │               │
│              │  └─────────────────────────────┘  │               │
│              │                                  │               │
│              │  ┌────────────────────────────┐  │               │
│              │  │     api/services/http.js   │  │               │
│              │  │     fetch → 172.18.0.1     │  │               │
│              │  │     (gateway Docker)       │  │               │
│              │  └─────────────────────────────┘  │               │
│              └──────────────────────────────────┘               │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │cinemap   │  │lucky7    │  │saintbarth│  │  autres apps  │   │
│  │(Docker)  │  │(Docker)  │  │(Docker)  │  │  (Docker)    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘


A2. Diagramme de séquence — Authentification



A3. Diagramme de séquence — Cycle de monitoring

A4. Diagramme de séquence — Action Docker


A5. Routing — Page d'accueil selon session

A6. Endpoints API
Méthode
Route
Auth
Description
GET
/
Non
Homepage publique ou dashboard (selon session)
GET
/api/status
Oui
Statut complet (conteneurs + sites + global)
POST
/api/container/restart
Oui
Redémarre un conteneur par nom
POST
/api/container/stop
Oui
Arrête un conteneur par nom
POST
/api/container/start
Oui
Démarre un conteneur par nom
POST
/auth/login
Non
Connexion — crée la session
POST
/auth/logout
Non
Déconnexion — détruit la session


Exemple de réponse GET /api/status :
{
  "globalStatus": "OK",
  "containers": [
    {
      "name": "cinemap",
      "status": "running",
      "image": "cinemap:latest",
      "uptime": "2 days ago",
      "ports": ["8001/tcp"]
    }
  ],
  "websites": [
    {
      "name": "CineMap",
      "url": "<http://172.18.0.1/cinemap/>",
      "status": "OK",
      "httpCode": 200
    },
    {
      "name": "SaintBarth Volley",
      "url": "<http://172.18.0.1/saintbarthvolley/>",
      "status": "OK",
      "httpCode": 302
    }
  ]
}


Note : Les vérifications HTTP utilisent l'IP gateway Docker (172.18.0.1) et non localhost, car le monitoring s'exécute dans un conteneur Docker. redirect: 'manual' est utilisé pour traiter les redirections (302) comme valides.


A7. Structure des fichiers

vps-monitor-app/
├── api/
│   ├── server.js              # Serveur Express principal (ES Modules)
│   ├── server.test.js         # Tests Jest + Supertest
│   └── services/
│       ├── docker.js          # Accès Docker via Dockerode
│       └── http.js            # Vérifications HTTP des applications
├── public/
│   ├── home.html              # Page d'accueil publique
│   ├── index.html             # Dashboard de monitoring (protégé)
│   ├── login.html             # Formulaire de connexion
│   ├── app.js                 # Logique frontend (refresh, render, actions)
│   └── style.css              # Styles unifiés (dashboard + home + login)
├── .env                       # Variables d'environnement (non versionné)
├── docker-compose.yml         # Orchestration Docker
├── Dockerfile                 # Image Node.js
├── eslint.config.js           # ESLint ESM (globals scopés par fichier)
└── package.json               # "type": "module", scripts, dépendances





A8. Pipeline CI/CD (VPS Monitor)

Secrets GitHub requis pour le CD :
Secret
Usage
VPS_HOST
Adresse IP du serveur
VPS_USER
Utilisateur SSH
VPS_SSH_KEY
Clé privée SSH



Annexes — CI/CD
B1. Vue d'ensemble des workflows
Fichier
Déclencheur
Rôle
ci.yml
PR
Lint + Prettier + Tests + Audit (backend & frontend en parallèle)
lint.yml
PR
ESLint backend & frontend + Prettier
tests.yml
PR
Jest backend & frontend
audit.yml
PR
npm audit --audit-level=high backend & frontend
branch-name.yml
PR
Validation du nom de branche
commit-message.yml
PR
Validation du format des commits
ticket.yml
PR
Vérification de la référence au ticket dans la PR
structure.yml
PR
Contrôle de la structure du projet
release.yml
Merge dev → main
Release SemVer automatique (mineure)
hotfix-release.yml
Merge hotfix/* → main
Release patch + sync main → dev
deploy.yml
Push sur staging
Déploiement continu sur VPS


B2. Diagramme — Intégration continue (PR)


B3. Diagramme — Déploiement continu (CD)


Secrets GitHub requis :
Secret
Usage
VPS_HOST
Adresse IP du VPS
VPS_USER
Utilisateur SSH
VPS_SSH_KEY
Clé privée SSH

B4. Diagramme — Release automatique

B5. Stratégie de branches
Branche
Rôle
Source
Destination
Utilisation principale
main
Production
staging ou hotfix
—
Code en production stable
dev
Développement
main
staging / main
Intégration des features
staging
Pré-production
dev
main
Tests avant release
feature/*
Nouvelle fonctionnalité
dev
dev
Développement isolé
hotfix/*
Correction urgente prod
main
main + dev
Fix critique en production


B6. Contenu des workflows principaux
ci.yml
name: CI

on:
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        dir: [backend, frontend]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        working-directory: app/${{ matrix.dir }}
        run: npm ci --ignore-scripts

      - name: Lint + Prettier
        working-directory: app/${{ matrix.dir }}
        run: |
          npx eslint . --ext .ts,.js,.tsx,.jsx || exit 1
          npx prettier --check . || exit 1

      - name: Test
        working-directory: app/${{ matrix.dir }}
        run: npm test || exit 1

      - name: Audit
        working-directory: app/${{ matrix.dir }}
        run: npm audit --audit-level=high || exit 0

deploy.yml
name: Deploy

on:
  push:
    branches:
      - staging

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e
            REPO_DIR="/var/www/app"
            COMPOSE_FILE="/var/www/docker-compose.yml"

            git -C "$REPO_DIR" pull origin staging

            docker compose -f "$COMPOSE_FILE" build clb-back clb-front
            docker compose -f "$COMPOSE_FILE" up -d --remove-orphans clb-back clb-front
            docker image prune -f
            docker ps --filter "name=clb-" --format "table {{.Names}}\\\\t{{.Status}}"

release.yml (extrait — logique de versioning)
- name: "Déterminer la nouvelle version"
  id: semver
  run: |
    LATEST_TAG=$(git tag --sort=-v:refname | grep -E '^v[0-9]+\\\\.[0-9]+\\\\.[0-9]+$' | head -n 1)
    VERSION="${LATEST_TAG#v}"
    MINOR=$(($(echo "$VERSION" | cut -d. -f2) + 1))
    TAG="v$(echo "$VERSION" | cut -d. -f1).$MINOR.0"
    echo "tag=$TAG" >> $GITHUB_OUTPUT

- name: "Vérifier le CHANGELOG"
  run: |
    SECTION=$(awk "/^## \\\\[$VERSION\\\\]/{found=1} found{print}" CHANGELOG.md)
    [ -z "$SECTION" ] && exit 1

- name: "Créer le tag Git"
  run: git tag "$TAG" && git push origin "$TAG"

- name: "Créer la GitHub Release"
  uses: ncipollo/release-action@v1
  with:
    tag: "${{ steps.semver.outputs.tag }}"
    body: "${{ steps.changelog_check.outputs.release_notes }}"



Annexes — C. Code QWapp
C1. Entité User (TypeORM)
export enum UserRole {
  COLLABORATEUR    = "collaborateur",
  RESPONSABLE      = "responsable",
  EXPERT_COMPTABLE = "expert-comptable",
  ADMIN            = "admin",
}

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, transformer: { to: v => v.toLowerCase(), from: v => v } })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.COLLABORATEUR })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

C2. Route de login — POST /api/auth/login
@Post("login")
async login(@Body() dto: LoginDto) {
  const user = await this.usersService.findByEmail(dto.email);
  if (!user || !user.isActive)
    throw new UnauthorizedException("Identifiants invalides");

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid)
    throw new UnauthorizedException("Identifiants invalides");

  await this.usersService.updateLastLogin(user.id);

  const token = this.jwtService.sign({ id: user.id, role: user.role });
  return { token, role: user.role };
}

C3. JwtAuthGuard
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: unknown, user: unknown) {
    if (err || !user) throw new UnauthorizedException("Token invalide ou expiré");
    return user;
  }
}

C4. RolesGuard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!roles.includes(user.role))
      throw new ForbiddenException("Accès interdit");
    return true;
  }
}

// Décorateur
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

C5. Hook useAuth (Next.js)
export function useAuth(requiredRole?: string) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (!token) { router.replace("/login"); return; }
    if (requiredRole && storedRole !== requiredRole) { router.replace("/login"); return; }

    setRole(storedRole);
    setReady(true);
  }, [router, requiredRole]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  }

  return { ready, role, logout };
}

C6. LoginForm — soumission du formulaire
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.message ?? "Erreur de connexion"); return; }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    router.push("/dashboard");
  } catch {
    setError("Impossible de contacter le serveur");
  } finally {
    setLoading(false);
  }
}

C7. Helper apiFetch
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
    throw new Error("Session expirée");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Erreur ${res.status}`);
  }

  return res.json() as Promise<T>;
}

C8. Layout du dashboard (dashboard/layout.tsx)
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useAuth(); // vérifie la connexion pour toutes les pages
  const [user, setUser] = React.useState({ name: "", email: "", role: "" });

  React.useEffect(() => {
    const email = localStorage.getItem("email") ?? "";
    const role  = localStorage.getItem("role")  ?? "";
    setUser({ name: email.split("@")[0], email, role });
  }, []);

  if (!ready) return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Chargement...</p>
    </div>
  );

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

C9. Composant SectionCards
export function SectionCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <Card key={key} className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className={`size-4 ${color}`} />
            </div>
          </CardHeader>
          <CardContent className="px-4">
            <p className="text-3xl font-bold tabular-nums">{stats[key]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

C10. Entité Client (TypeORM)
@Entity()
export class Client {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ nullable: true })
  activite: string;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  deletedAt: Date;

  @OneToOne(() => Kyc, kyc => kyc.client, { cascade: true })
  kyc: Kyc;

  @OneToMany(() => RiskScore, score => score.client)
  scores: RiskScore[];

  @OneToMany(() => Document, doc => doc.client)
  documents: Document[];

  @OneToMany(() => AuditLog, log => log.entityId)
  auditLogs: AuditLog[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

Annexes — D. Infrastructure VPS
D1. docker-compose.yml — Orchestration multi-applications
Fichier situé à /var/www/docker-compose.yml sur le VPS. Il orchestre l'ensemble des applications hébergées, partage une instance MongoDB commune, et isole chaque service dans son propre conteneur.
version: '3.8'

services:

  # TP VUE — Application pédagogique Vue.js + Express
  tp-vue-api:
    build:
      context: ./B3dev-TP_VUE/express-project
      dockerfile: deployment/Dockerfile
    container_name: tp-vue-api
    ports:
      - "3003:3000"
    environment:
      - NODE_ENV=test
    depends_on:
      - mongo

  tp-vue-front:
    build:
      context: ./B3dev-TP_VUE/my-project
      dockerfile: deployment/Dockerfile
    container_name: tp-vue-front
    ports:
      - "8080:80"

  # MongoDB — Base partagée entre les apps Node.js
  mongo:
    image: mongo
    container_name: mongo
    restart: always
    volumes:
      - ./data/mongo:/data/db
    expose:
      - "27017"

  # SaintBarth Volley — Next.js + Express
  sbv-api:
    build:
      context: ./SaintBarthVolley/saintBarthVolleyApp/backend
      dockerfile: Dockerfile
    container_name: sbv-api
    ports:
      - "3006:5000"
    env_file:
      - ./SaintBarthVolley/saintBarthVolleyApp/backend/.env
    volumes:
      - ./SaintBarthVolley/saintBarthVolleyApp/backend/public/uploads:/usr/src/app/public/uploads
    depends_on:
      - mongo
    restart: unless-stopped

  sbv-front:
    build:
      context: ./SaintBarthVolley/saintBarthVolleyApp/frontend
      dockerfile: Dockerfile
      args:
        NEXT_BASE_PATH: /saintbarthvolley
        NEXT_PUBLIC_API_URL: /saintbarthvolley
    container_name: sbv-front
    ports:
      - "3007:3000"
    restart: unless-stopped

  # Lucky7 — Next.js + Express
  lucky7-back:
    build:
      context: ./Lucky7/lucky7-app/backend
      dockerfile: Dockerfile
    container_name: lucky7-back
    ports:
      - "3009:4000"
    env_file:
      - ./Lucky7/lucky7-app/backend/.env
    depends_on:
      - mongo
    restart: unless-stopped

  lucky7-front:
    build:
      context: ./Lucky7/lucky7-app/frontend
      dockerfile: Dockerfile
      args:
        NEXT_BASE_PATH: /lucky7
    container_name: lucky7-front
    ports:
      - "3008:3000"
    restart: unless-stopped

  # Collège La Boussole — Next.js + Express
  clb-back:
    build:
      context: ./CollegeLaBoussole/collegeLaBoussoleApp/backend
      dockerfile: Dockerfile
    container_name: clb-back
    ports:
      - "3010:5000"
    env_file:
      - ./CollegeLaBoussole/collegeLaBoussoleApp/backend/.env
    depends_on:
      - mongo
    restart: unless-stopped

  clb-front:
    build:
      context: ./CollegeLaBoussole/collegeLaBoussoleApp/frontend
      dockerfile: Dockerfile
      args:
        NEXT_BASE_PATH: /collegelaboussole
        NEXT_PUBLIC_API_URL: /collegelaboussole
    container_name: clb-front
    ports:
      - "3011:3000"
    restart: unless-stopped

  # CineMap — App PHP (Laravel)
  cinemap:
    build:
      context: ./B3dev-TP_framework_php/cinemap-app
      dockerfile: deployment/Dockerfile
    image: www-cinemap
    container_name: cinemap
    ports:
      - "3012:80"
    volumes:
      - ./data/cinemap/database.sqlite:/var/www/html/database/database.sqlite
    env_file:
      - ./B3dev-TP_framework_php/cinemap-app/.env
    restart: unless-stopped

  # VPS Monitor — Dashboard de supervision
  vps-monitor:
    build: ./VPS-monitor/vps-monitor-app
    container_name: vps-monitor
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - "3020:3000"
    environment:
      - PORT=3000
      - BASE_URL=http://172.18.0.1
      - AUTH_USER=<redacted>
      - AUTH_PASS=<redacted>
      - SESSION_SECRET=<redacted>
    restart: unless-stopped

Les valeurs AUTH_USER, AUTH_PASS et SESSION_SECRET sont définies dans l'environnement de production et ne sont pas versionnées.
D2. Configuration Nginx — Reverse proxy
Fichier situé à /etc/nginx/sites-enabled/vps. Il route chaque requête entrante vers le bon conteneur selon le chemin URL, en masquant les ports internes.
server {
    listen 80;
    server_name _;

    # VPS Monitor — Homepage et dashboard admin
    location / {
        proxy_pass <http://127.0.0.1:3020>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # TP VUE — API Express
    location /B3dev-TP_VUE/api/ {
        rewrite ^/B3dev-TP_VUE/api/(.*)$ /api/$1 break;
        proxy_pass <http://127.0.0.1:3003/api/>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # TP VUE — Socket.IO
    location /B3dev-TP_VUE/socket.io/ {
        proxy_pass <http://127.0.0.1:3003>;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # TP VUE — Frontend Vue.js
    location /B3dev-TP_VUE/ {
        proxy_pass <http://127.0.0.1:8080/>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # SaintBarth Volley — API + Uploads + Frontend
    location /saintbarthvolley/api/ {
        proxy_pass <http://127.0.0.1:3006/api/>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /saintbarthvolley/uploads/ {
        proxy_pass <http://127.0.0.1:3006/uploads/>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /saintbarthvolley/ {
        proxy_pass <http://127.0.0.1:3007>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Lucky7 — Socket.IO + Frontend
    location /lucky7/socket.io/ {
        proxy_pass <http://127.0.0.1:3009>;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    location /lucky7/ {
        proxy_pass <http://127.0.0.1:3008>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Collège La Boussole — API + Frontend
    location = /collegelaboussole {
        return 301 /collegelaboussole/;
    }

    location /collegelaboussole/api/ {
        proxy_pass <http://127.0.0.1:3010/api/>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /collegelaboussole/ {
        proxy_pass <http://127.0.0.1:3011>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # CineMap — App PHP
    location /cinemap/ {
        rewrite ^/cinemap/(.*)$ /$1 break;
        proxy_pass <http://127.0.0.1:3012>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

D3. Tableau de routage — Ports et routes
Application
Conteneur
Port interne
Port hôte
Route Nginx
VPS Monitor
vps-monitor
3000
3020
/
TP Vue API
tp-vue-api
3000
3003
/B3dev-TP_VUE/api/
TP Vue Front
tp-vue-front
80
8080
/B3dev-TP_VUE/
MongoDB
mongo
27017
— (interne)
—
SBV API
sbv-api
5000
3006
/saintbarthvolley/api/
SBV Front
sbv-front
3000
3007
/saintbarthvolley/
Lucky7 API
lucky7-back
4000
3009
/lucky7/socket.io/
Lucky7 Front
lucky7-front
3000
3008
/lucky7/
CLB API
clb-back
5000
3010
/collegelaboussole/api/
CLB Front
clb-front
3000
3011
/collegelaboussole/
CineMap
cinemap
80
3012
/cinemap/

D4. Procédure de configuration du serveur VPS
Instructions complètes pour reproduire l'environnement de zéro, dans l'ordre d'exécution.
1. Connexion initiale et mise à jour du système
# Connexion en root (première fois)
ssh root@<IP_VPS>

# Mise à jour du système
apt update && apt upgrade -y

2. Création d'un utilisateur dédié
# Créer un utilisateur non-root
adduser rusty

# Lui donner les droits sudo
usermod -aG sudo rusty

# Passer sur ce nouvel utilisateur
su - rusty

3. Sécurisation de l'accès SSH
# Depuis la machine locale — copier la clé publique sur le VPS
ssh-copy-id rusty@<IP_VPS>

# Puis sur le VPS — désactiver l'authentification par mot de passe
sudo nano /etc/ssh/sshd_config



Lignes à modifier dans sshd_config :

PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Redémarrer SSH pour appliquer
sudo systemctl restart ssh

# Vérifier que la connexion par clé fonctionne AVANT de fermer la session actuelle
ssh rusty@<IP_VPS>

4. Configuration du pare-feu (UFW)
# Installer UFW si absent
sudo apt install ufw -y

# Règles : n'autoriser que SSH, HTTP et HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le pare-feu
sudo ufw enable

# Vérifier l'état
sudo ufw status

Résultat attendu :
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere

5. Installation de Docker
# Installer les dépendances
sudo apt install ca-certificates curl gnupg -y

# Ajouter la clé GPG officielle Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL <https://download.docker.com/linux/ubuntu/gpg> | \\\\
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Ajouter le dépôt Docker
echo \\\\
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \\\\
  <https://download.docker.com/linux/ubuntu> $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \\\\
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker Engine
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

# Permettre à l'utilisateur d'utiliser Docker sans sudo
sudo usermod -aG docker rusty

# Vérifier l'installation
docker --version
docker compose version

Important : se déconnecter et reconnecter pour que l'appartenance au groupe docker soit prise en compte.
6. Installation de Nginx

sudo apt install nginx -y

# Démarrer Nginx et l'activer au démarrage
sudo systemctl start nginx
sudo systemctl enable nginx

# Vérifier le statut
sudo systemctl status nginx

7. Structure des dossiers de travail

# Créer le dossier racine des projets
sudo mkdir -p /var/www
sudo chown rusty:rusty /var/www

# Cloner les dépôts dans /var/www
cd /var/www
git clone <https://github.com/RustyRory/><repo>.git

8. Configuration Nginx

# Créer le fichier de configuration du site
sudo nano /etc/nginx/sites-enabled/vps

# (Coller la configuration de l'Annexe D2)

# Tester la configuration
sudo nginx -t

# Recharger Nginx pour appliquer
sudo nginx -s reload

9. Démarrage des applications

cd /var/www

# Premier démarrage (build + lancement)
docker compose build
docker compose up -d

# Vérifier que tous les conteneurs sont bien démarrés
docker compose ps

Résultat attendu : tous les conteneurs en état running.
10. Vérification finale

# Tester que Nginx répond
curl -I <http://localhost>

# Vérifier les logs d'un conteneur en cas de problème
docker compose logs vps-monitor

# Vérifier les ports ouverts
sudo ss -tlnp | grep -E '80|443|22'

Récapitulatif — ordre des opérations
Étape
Action
Commande clé
1
Mise à jour système
apt update && apt upgrade
2
Création utilisateur
adduser + usermod -aG sudo
3
Sécurisation SSH
ssh-copy-id + désactiver PasswordAuthentication
4
Pare-feu
ufw allow 22,80,443 + ufw enable
5
Docker
Installation via dépôt officiel
6
Nginx
apt install nginx
7
Projets
git clone dans /var/www
8
Config Nginx
Éditer sites-enabled/vps + nginx -s reload
9
Lancement
docker compose build && up -d
10
Vérification
docker compose ps + curl localhost

 
