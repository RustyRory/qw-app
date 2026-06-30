# Cahier des charges — QW-App LCB-FT

> Application web de conformité anti-blanchiment (LCB-FT) pour cabinets d'experts-comptables.
> Inspirée de la solution SaaS Kanta, développée pour le Cabinet QW.

---

## 1. Contexte et objectifs

### 1.1 Contexte métier

Les cabinets d'expertise comptable sont soumis à des obligations légales strictes en matière de **Lutte contre le Blanchiment de Capitaux et le Financement du Terrorisme (LCB-FT)**, issues notamment de la directive européenne AMLD5 et de l'ordonnance n°2016-1635.

Ces obligations se déclinent en quatre axes :

| Obligation | Description |
|-----------|-------------|
| **Identification** | Vérifier l'identité du client (KYC) avant toute entrée en relation |
| **Évaluation du risque** | Classer chaque client selon son niveau de risque LCB-FT |
| **Surveillance continue** | Suivre l'évolution du profil de risque pendant la relation |
| **Déclaration** | Signaler les opérations suspectes à Tracfin |

Aujourd'hui, le Cabinet QW gère ces obligations via des fichiers Excel, emails et documents Drive. Cette situation entraîne : absence de traçabilité, données sensibles non protégées, processus non standardisés, et risque de non-conformité réglementaire.

### 1.2 Objectifs de l'application

**Objectif principal :** Centraliser, sécuriser et tracer la gestion de la conformité LCB-FT dans un outil unique.

**Objectifs secondaires :**
- Standardiser les processus d'entrée en relation (prospect → client)
- Automatiser les rappels liés aux documents expirés et obligations réglementaires
- Produire les documents réglementaires (lettres de mission, rapports)
- Intégrer des sources de données officielles (SIRET, listes de sanctions)

### 1.3 Périmètre

**Dans le périmètre MVP :**
- Gestion du pipeline prospect (Kanban)
- Dossier client complet (KYC, documents, contacts)
- Évaluation et cartographie des risques
- Questionnaire d'acceptation (prospect → client)
- Gestion des missions et lettres de mission
- Tableau des obligations réglementaires
- Planning et historique des actions
- Rapports exportables

**Hors périmètre MVP :**
- Intégration Pennylane (synchronisation automatique non possible)
- Module Arpec (outil tiers, intégration différée)
- Application mobile native
- Déclaration automatique à Tracfin
- Module de facturation

---

## 2. Acteurs et rôles

### 2.1 Identification des acteurs

| Acteur | Type | Description |
|--------|------|-------------|
| **Collaborateur** | Interne | Crée et gère les dossiers prospects/clients |
| **Responsable** | Interne | Valide les dossiers, supervise le portefeuille |
| **Expert-comptable** | Interne | Signe les lettres de mission, consulte les rapports |
| **Administrateur** | Interne | Gère les comptes utilisateurs, paramétrage global |
| **Client** | Externe | Destinataire des documents (pas d'accès à l'application) |

### 2.2 Matrice des droits (RBAC)

| Action | Collaborateur | Responsable | Expert-comptable | Administrateur |
|--------|:-------------:|:-----------:|:----------------:|:--------------:|
| Créer un prospect | ✅ | ✅ | ✅ | ✅ |
| Gérer le pipeline Kanban | ✅ | ✅ | ✅ | ✅ |
| Saisir le KYC | ✅ | ✅ | ✅ | ✅ |
| Valider le questionnaire d'acceptation | ❌ | ✅ | ✅ | ✅ |
| Convertir prospect → client | ❌ | ✅ | ✅ | ✅ |
| Signer une lettre de mission | ❌ | ❌ | ✅ | ✅ |
| Exporter un rapport | ❌ | ✅ | ✅ | ✅ |
| Déclarer une opération sensible | ✅ | ✅ | ✅ | ✅ |
| Valider la relation d'affaire | ❌ | ❌ | ✅ | ✅ |
| Gérer les utilisateurs | ❌ | ❌ | ❌ | ✅ |
| Supprimer un dossier (soft delete) | ❌ | ❌ | ❌ | ✅ |

---

## 3. Besoins fonctionnels

### Module 1 — Gestion des prospects (Pipeline commercial)

**Description :** Suivi du cycle de vie d'un contact commercial depuis la prise de contact jusqu'à la conversion en client.

**Kanban — Étapes du pipeline :**

```
[Prise de contact] → [Découverte prospect] → [Opportunité] → [LAB à effectuer] → [Préparation client] → [Converti]
```

| Étape | Description |
|-------|-------------|
| **Prise de contact** | Saisie des informations de base (nom, email, société, SIRET) |
| **Découverte prospect** | Complétion du profil (activité, localisation, CA) |
| **Opportunité** | Évaluation du potentiel commercial |
| **LAB à effectuer** | Lettre d'acceptation de la mission à préparer |
| **Préparation client** | Collecte documents + questionnaire d'acceptation |
| **Converti** | Prospect converti en client après validation |

**User stories :**

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-P01 | Collaborateur | Créer une fiche prospect à partir d'un SIRET | Récupérer automatiquement les données entreprise (nom, adresse, NAF) |
| US-P02 | Collaborateur | Déplacer une carte dans le Kanban | Faire avancer le prospect dans le pipeline |
| US-P03 | Responsable | Voir l'ensemble du pipeline en vue Kanban | Suivre l'état d'avancement de tous les prospects |
| US-P04 | Collaborateur | Ajouter des notes et documents à un prospect | Centraliser les informations de découverte |
| US-P05 | Responsable | Valider le questionnaire d'acceptation | Décider de convertir ou refuser le prospect |
| US-P06 | Responsable | Convertir un prospect en client | Créer automatiquement le dossier client avec les données déjà saisies |
| US-P07 | Collaborateur | Filtrer les prospects par étape et responsable | Gérer mon portefeuille de prospects |

**Règles métier :**
- La conversion prospect → client nécessite un questionnaire d'acceptation validé par un Responsable ou Expert-comptable
- La trame du Kanban (noms des étapes) est paramétrable par l'Administrateur
- Un prospect refusé est archivé avec le motif de refus et conservé 5 ans (LCB-FT)

---

### Module 2 — Dossier client

**Description :** Gestion complète des informations client nécessaires à la conformité LCB-FT.

**User stories :**

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-C01 | Collaborateur | Créer un client via son SIRET | Pré-remplir automatiquement les données SIRENE (raison sociale, adresse, code NAF, effectif) |
| US-C02 | Collaborateur | Saisir la localisation, l'activité principale et le chiffre d'affaires | Évaluer le niveau de risque LCB-FT |
| US-C03 | Collaborateur | Gérer les contacts du dossier (intervenants, avocats, tiers) | Avoir une vision complète des parties prenantes |
| US-C04 | Système | Envoyer une relance automatique si un document d'identité expire | Maintenir la conformité KYC sans intervention manuelle |
| US-C05 | Collaborateur | Consulter l'historique complet des actions sur un dossier | Tracer toutes les interventions (obligation réglementaire) |
| US-C06 | Responsable | Vérifier automatiquement les informations client via les APIs nationales | S'assurer de la cohérence et de l'actualité des données |

**Données du dossier client :**

```
Identification
├── Raison sociale / Nom & prénom
├── SIRET / SIREN
├── Forme juridique
├── Date de création
└── Code NAF / Activité principale

Localisation
├── Adresse du siège social
├── Pays
└── Nationalité (pour les personnes physiques)

Situation économique
├── Chiffre d'affaires annuel
├── Effectif salarié
└── Nature de la mission confiée

Contacts
├── Interlocuteur principal
├── Intervenants internes (collaborateur, responsable)
└── Tiers (avocats, commissaires aux comptes, notaires)
```

**Règles métier :**
- La référence interne est générée automatiquement au format `QW-AAAA-XXX`
- Toute modification d'un dossier est tracée dans l'audit trail (auteur, date, champ modifié)
- La suppression est un soft delete — conservation 5 ans conformément à l'obligation LCB-FT
- L'appel à l'API SIRENE se fait à la création et peut être relancé manuellement pour mise à jour

---

### Module 3 — KYC (Know Your Customer)

**Description :** Collecte et vérification des informations d'identité requises par la réglementation LCB-FT.

**User stories :**

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-K01 | Collaborateur | Renseigner les pièces d'identité du client | Satisfaire l'obligation de vérification d'identité |
| US-K02 | Système | Alerter 30 jours avant l'expiration d'un document d'identité | Permettre le renouvellement avant la date limite |
| US-K03 | Collaborateur | Renseigner le(s) bénéficiaire(s) effectif(s) (UBO) | Identifier les personnes physiques détenant >25% du capital |
| US-K04 | Collaborateur | Vérifier si le client est une PPE (Personne Politiquement Exposée) | Appliquer des diligences renforcées si nécessaire |
| US-K05 | Système | Croiser les données client avec les listes de sanctions | Détecter automatiquement les correspondances (gel des avoirs, OFAC) |
| US-K06 | Collaborateur | Accéder à la checklist de complétude KYC | Savoir quelles informations manquent pour valider le dossier |

**Documents KYC gérés :**

| Type de document | Personne physique | Personne morale | Date d'expiration |
|-----------------|:-----------------:|:---------------:|:-----------------:|
| Pièce d'identité (CNI, passeport) | ✅ | ❌ | ✅ |
| Justificatif de domicile | ✅ | ❌ | ❌ |
| Kbis (< 3 mois) | ❌ | ✅ | ✅ (3 mois) |
| Statuts constitutifs | ❌ | ✅ | ❌ |
| Liste des bénéficiaires effectifs | ❌ | ✅ | ❌ |
| Attestation PPE | ✅ | ❌ | ❌ |

**Règles métier :**
- Une pièce d'identité expirée bloque la validation du dossier
- Le statut PPE entraîne automatiquement une majoration du score de risque
- Les documents sont stockés chiffrés (AES-256) sur un espace objet S3 hébergé en Europe (RGPD)
- L'accès aux documents se fait via URL pré-signée à durée limitée (15 minutes)

---

### Module 4 — Évaluation et cartographie des risques

**Description :** Calcul du niveau de risque LCB-FT de chaque client via un questionnaire et un algorithme de scoring.

**User stories :**

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-R01 | Collaborateur | Répondre au questionnaire d'évaluation des risques (9 questions) | Calculer automatiquement le score de risque |
| US-R02 | Système | Calculer et stocker le score de risque avec horodatage | Conserver l'historique de toutes les évaluations |
| US-R03 | Responsable | Visualiser la cartographie des risques (vue globale portefeuille) | Identifier les dossiers à risque élevé en un coup d'œil |
| US-R04 | Responsable | Accéder au détail du scoring d'un dossier | Comprendre les critères qui ont conduit au niveau de risque |
| US-R05 | Système | Recalculer automatiquement le score lors d'une modification KYC | Maintenir le scoring à jour |

**Questionnaire d'évaluation (9 questions) :**

| # | Critère | Pondération |
|---|---------|:-----------:|
| Q1 | Le client est-il une Personne Politiquement Exposée (PPE) ? | 30 pts |
| Q2 | Le client est-il issu ou opère-t-il dans un pays à risque (liste GAFI) ? | 25 pts |
| Q3 | Le client exerce-t-il dans un secteur sensible (crypto, casino, immobilier, armement) ? | 20 pts |
| Q4 | Le chiffre d'affaires annuel dépasse-t-il 500 000 € ? | 10 pts |
| Q5 | Des transactions en espèces importantes ont-elles été détectées ? | 15 pts |
| Q6 | La structure de propriété est-elle complexe ou opaque ? | 15 pts |
| Q7 | Le client a-t-il des liens avec des pays tiers à risques ? | 10 pts |
| Q8 | Le client est-il une personne morale avec des bénéficiaires effectifs à l'étranger ? | 10 pts |
| Q9 | Des alertes ont-elles été remontées par les sources de données nationales (LIMPI) ? | 20 pts |

**Niveaux de risque :**

| Niveau | Score | Actions requises |
|--------|:-----:|-----------------|
| **FAIBLE** | 0 – 33 | Diligences standard |
| **MOYEN** | 34 – 66 | Diligences renforcées |
| **ÉLEVÉ** | 67 – 100 | Diligences renforcées + validation Responsable obligatoire |

**Vue cartographie :**
- Vue liste avec filtre par niveau de risque
- Vue synthétique (compteurs par niveau : faible / moyen / élevé)
- Historique des réévaluations par dossier (évolution du score dans le temps)

---

### Module 5 — Questionnaire d'acceptation (LAB)

**Description :** Processus de validation formelle avant toute entrée en relation avec un nouveau client. Correspond à la **Lettre d'Acceptation de la mission de Blanchiment (LAB)** exigée par le NPLAB et l'art. L.561-5 CMF. Le questionnaire est rempli par le collaborateur, validé par le Responsable, et contresigné par l'Expert-comptable en cas de risque élevé.

**Base réglementaire :** Art. L.561-5 CMF (vérification identité), Art. L.561-4-1 CMF (évaluation risque), NPLAB, ARPEC, directives AMLD5/6, recommandations GAFI.

**User stories :**

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-A01 | Collaborateur | Déclencher le questionnaire d'acceptation depuis la fiche prospect | Initier le processus de validation |
| US-A02 | Collaborateur | Remplir les 10 sections du questionnaire et enregistrer un brouillon | Saisir les informations progressivement sans perdre les données |
| US-A03 | Responsable | Valider ou refuser le questionnaire d'acceptation | Formaliser la décision d'entrée en relation |
| US-A04 | Expert-comptable | Contresigner le questionnaire pour les dossiers à risque élevé | Assurer une double validation sur les dossiers sensibles |
| US-A05 | Système | Historiser les étapes de validation avec auteur et date | Tracer le processus décisionnel (obligation LCB-FT) |
| US-A06 | Système | Adapter les questions affichées selon le type d'entité (PM/PP) | Éviter les questions non pertinentes et simplifier la saisie |
| US-A07 | Système | Bloquer la conversion prospect → client si le questionnaire n'est pas validé | Garantir la conformité réglementaire avant toute entrée en relation |

**Étapes de validation :**

```
[Questionnaire rempli] → [Soumis au Responsable] → [Validé] → [Conversion en client]
                                                  ↘ [Refusé] → [Archivé avec motif]

Si risque ÉLEVÉ : [Validé Responsable] → [Contresigné Expert-comptable] → [Conversion]
```

**Règles métier :**
- Un questionnaire REFUSÉ est archivé avec le motif — conservé 5 ans (art. L.561-12 CMF)
- La section 10 (Décision) n'est accessible qu'après avoir complété les sections 1 à 9
- Les réponses sont stockées en JSONB (`questionnaire_acceptation.reponses`) — le schéma peut évoluer sans migration
- Les questions conditionnelles (PPE, PM/PP) sont incluses ou exclues selon le type d'entité du prospect

**Liste des 61 questions — 10 sections**

**Section 1 — Identification et KYC** *(art. L.561-5 CMF)*

*Personne morale :*
- Q1 — Le Kbis date-t-il de moins de 3 mois ?
- Q2 — Les statuts constitutifs ont-ils été collectés ?
- Q3 — Le représentant légal a-t-il été identifié ?
- Q4 — A-t-il le pouvoir d'engager la société (délégation vérifiée) ?

*Personne physique :*
- Q5 — La pièce d'identité est-elle en cours de validité ?
- Q6 — Un justificatif de domicile de moins de 3 mois a-t-il été collecté ?
- Q7 — L'adresse déclarée correspond-elle à la réalité ?

*Bénéficiaires effectifs :*
- Q8 — Tous les bénéficiaires effectifs détenant >25% ont-ils été identifiés ?
- Q9 — Leur pièce d'identité a-t-elle été collectée ?
- Q10 — Le Registre des Bénéficiaires Effectifs (RBE) a-t-il été consulté ?
- Q11 — Les données RBE sont-elles cohérentes avec les déclarations du client ?

**Section 2 — Screening / Sanctions**

- Q12 — Vérifié contre la liste de gel des avoirs (Direction du Trésor) ?
- Q13 — Vérifié contre les listes de sanctions européennes ?
- Q14 — Vérifié contre la liste OFAC (USA) et la liste ONU ?
- Q15 — Les bénéficiaires effectifs ont-ils également été screenés ?
- Q16 — Le résultat global du screening est-il négatif (aucune correspondance) ?

**Section 3 — PPE (Personne Politiquement Exposée)**

- Q17 — Le client exerce-t-il ou a-t-il exercé des fonctions publiques importantes (nationales ou étrangères) ?
- Q18 — Un membre de sa famille proche est-il une PPE ?
- Q19 — Un associé ou collaborateur proche est-il une PPE ?
- Q20 — Si PPE : une autorisation hiérarchique a-t-elle été obtenue avant d'aller plus loin ?
- Q21 — Si PPE : la source du patrimoine a-t-elle été expliquée et documentée ?
- Q22 — Si PPE : la source des fonds affectés à la mission est-elle vérifiée ?

**Section 4 — Structure et propriété**

- Q23 — La chaîne de détention est-elle simple et transparente (moins de 3 niveaux de holding) ?
- Q24 — Existe-t-il des filiales ou participations dans des pays à risque ou paradis fiscaux ?
- Q25 — Des actions au porteur, trusts ou structures fiduciaires sont-ils impliqués ?
- Q26 — Des entités anonymes (fondations, fonds) figurent-elles dans la chaîne de propriété ?
- Q27 — Le capital est-il détenu en totalité ou en partie dans des pays non coopératifs ?

**Section 5 — Zone géographique**

- Q28 — Le siège social est-il situé en France ou dans un pays de l'UE ?
- Q29 — Les activités sont-elles exercées principalement en France ?
- Q30 — Le client a-t-il des filiales, succursales ou partenaires dans des pays listés par le GAFI ?
- Q31 — Le client effectue-t-il des transactions avec des pays sous embargo européen ou ONU ?
- Q32 — Des flux financiers importants sont-ils dirigés vers ou reçus de pays à risque ?
- Q33 — Le client opère-t-il dans des zones géographiques à forte criminalité financière ?

**Section 6 — Activité et secteur**

- Q34 — L'activité principale est-elle cohérente avec le code NAF/APE déclaré ?
- Q35 — Le secteur est-il sensible (crypto/NFT, jeux/casino, immobilier, art, armement, métaux précieux, change, forex) ?
- Q36 — Le chiffre d'affaires déclaré est-il cohérent avec l'effectif et la nature de l'activité ?
- Q37 — L'entreprise pratique-t-elle des transactions en espèces (seuil : >1 000 €) ?
- Q38 — Des paiements proviennent-ils de tiers non identifiés ou de comptes tiers ?
- Q39 — Le client a-t-il des clients ou fournisseurs principaux dans des pays à risque ?
- Q40 — L'activité génère-t-elle des flux transfrontaliers importants sans justification économique claire ?
- Q41 — L'activité présente-t-elle des variations de CA difficiles à expliquer ?

**Section 7 — Situation financière**

- Q42 — La santé financière est-elle compatible avec les honoraires envisagés ?
- Q43 — Des procédures collectives (redressement judiciaire, liquidation) sont-elles en cours ?
- Q44 — Des dettes fiscales ou sociales significatives et non contestées sont-elles connues ?
- Q45 — Le client présente-t-il des signes de difficultés financières anormales au regard de son activité ?

**Section 8 — Antécédents**

- Q46 — Le client a-t-il fait l'objet de procédures pénales (fraude, blanchiment, corruption, ABS) ?
- Q47 — Des contentieux fiscaux ou douaniers sont-ils en cours ou récents (<5 ans) ?
- Q48 — Le client a-t-il été refusé ou résilié par un précédent cabinet d'expertise comptable ?
- Q49 — Des articles de presse négatifs, enquêtes journalistiques ou signalements le concernent-ils ?
- Q50 — Le client figure-t-il dans des bases de données de réputation négative (adverse media) ?

**Section 9 — Mission et relation**

- Q51 — La nature et le périmètre de la mission sont-ils clairement définis ?
- Q52 — La mission est-elle dans le périmètre habituel et les compétences du cabinet ?
- Q53 — Y a-t-il une urgence inhabituelle ou une pression temporelle anormale dans la demande ?
- Q54 — Le client a-t-il manifesté des réticences à fournir les documents demandés ?
- Q55 — Le client a-t-il posé des questions inhabituelles sur la confidentialité ou le secret professionnel ?
- Q56 — Le client cherche-t-il à limiter le périmètre de la mission pour éviter certains contrôles ?
- Q57 — Les informations fournies sont-elles cohérentes entre elles (pas de contradictions) ?
- Q58 — Le mode de règlement des honoraires est-il exclusivement par virement bancaire identifié ?
- Q59 — Les honoraires sont-ils cohérents avec la mission et la taille de l'entreprise ?
- Q60 — Y a-t-il un conflit d'intérêts potentiel avec un autre client ou dossier du cabinet ?
- Q61 — Le client comprend-il et accepte-t-il les obligations LCB-FT qui s'appliquent à la relation ?

**Section 10 — Décision finale** *(débloquée après sections 1–9)*

- Des éléments bloquants irréductibles ont-ils été identifiés ?
- Niveau de diligences requis : Standard / Renforcées / Renforcées + validation hiérarchique
- Des diligences complémentaires sont-elles nécessaires avant de statuer ?
- Commentaire libre du responsable
- **Décision : Accepter / Refuser / Mettre en attente**
- Si refus : motif obligatoire (conservé 5 ans — art. L.561-12 CMF)
- Si risque ÉLEVÉ : contresignature de l'expert-comptable requise (US-A04)

---

### Module 6 — Missions et lettres de mission

**Description :** Gestion des lettres de mission conformes aux exigences de l'Ordre des Experts-Comptables.

**User stories :**

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-M01 | Collaborateur | Créer une lettre de mission à partir d'un modèle | Produire le document réglementaire rapidement |
| US-M02 | Expert-comptable | Signer électroniquement la lettre de mission | Valider l'engagement contractuel |
| US-M03 | Système | Vérifier automatiquement les informations du client dans la lettre | Éviter les erreurs de saisie (nom, SIRET, adresse) |
| US-M04 | Expert-comptable | Exporter la lettre de mission en PDF | Envoyer le document signé au client |
| US-M05 | Responsable | Régénérer les lettres de mission pour tous les clients lors d'un changement de modèle | Mettre à jour le parc de lettres existantes |
| US-M06 | Collaborateur | Consulter l'historique des missions d'un client | Suivre l'évolution de la relation |

**Contenu d'une lettre de mission :**
- Identité des parties (cabinet + client avec données SIRENE)
- Nature et périmètre de la mission
- Honoraires et conditions de règlement
- Clause de résiliation
- Tableau de répartition des tâches
- Conditions générales (modèle Ordre des Experts-Comptables)
- Champ de signature (expert-comptable + client)

---

### Module 7 — Planning et suivi

**Description :** Gestion du calendrier des actions et diligences à réaliser sur chaque dossier.

**User stories :**

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-PL01 | Collaborateur | Ajouter une étape au planning d'un dossier | Planifier les actions à venir |
| US-PL02 | Collaborateur | Marquer une étape comme réalisée | Mettre à jour l'avancement |
| US-PL03 | Responsable | Consulter le planning global par collaborateur | Suivre la charge de travail de l'équipe |
| US-PL04 | Système | Ajouter automatiquement les étapes réglementaires obligatoires | Rappeler les diligences minimales requises |
| US-PL05 | Collaborateur | Consulter l'historique des actions sur un dossier | Avoir une traçabilité complète des interventions |

---

### Module 8 — Tableau des obligations

**Description :** Vue synthétique des obligations réglementaires LCB-FT par client.

**User stories :**

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-O01 | Responsable | Consulter le tableau de bord des obligations par dossier | Identifier en un coup d'œil les non-conformités |
| US-O02 | Système | Calculer automatiquement l'état de conformité de chaque obligation | Éviter les oublis de diligences |
| US-O03 | Responsable | Filtrer les dossiers par état de conformité | Prioriser les actions correctives |

**Obligations suivies :**

| Obligation | Fréquence | Statut possible |
|-----------|-----------|----------------|
| Vérification d'identité KYC | À l'entrée en relation | À faire / Fait / Expiré |
| Évaluation du risque | Annuelle minimum | À faire / Fait / En retard |
| Mise à jour des documents | Selon expiration | OK / Relance envoyée / Expiré |
| Validation relation d'affaire | À l'entrée + révision annuelle | En cours / Validé / Refusé |
| Lettre de mission signée | À l'entrée en relation | Manquante / Signée |

---

### Module 9 — Opérations sensibles

**Description :** Identification et suivi des opérations atypiques nécessitant une vigilance accrue (potentiellement déclarables à Tracfin).

**User stories :**

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-OS01 | Collaborateur | Déclarer une opération sensible sur un dossier | Signaler une anomalie pour analyse |
| US-OS02 | Responsable | Valider ou classer une opération sensible | Décider de la suite à donner (surveillance, déclaration Tracfin) |
| US-OS03 | Responsable | Consulter le récapitulatif des opérations sensibles par période | Identifier des patterns suspects |

**Types d'opérations sensibles :**
- Transaction en espèces d'un montant supérieur à un seuil paramétrable
- Opération avec un pays à risque (liste GAFI)
- Mouvement de fonds sans justification économique apparente
- Changement soudain de comportement ou d'activité du client

---

### Module 10 — Diligences et conseils KYC

**Description :** Recommandations contextuelles générées en fonction du profil de risque du client.

**User stories :**

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-D01 | Collaborateur | Consulter les diligences recommandées pour un dossier | Savoir quelles actions effectuer selon le profil de risque |
| US-D02 | Système | Adapter les recommandations selon le niveau de risque (FAIBLE/MOYEN/ÉLEVÉ) | Fournir des conseils proportionnels au risque |

**Règle de diligences :**

| Niveau de risque | Diligences |
|-----------------|------------|
| FAIBLE | Vérification d'identité standard + copie pièce d'identité |
| MOYEN | FAIBLE + vérification source des fonds + actualisation annuelle |
| ÉLEVÉ | MOYEN + validation Responsable + déclaration potentielle à Tracfin |

---

### Module 11 — Rapports

**Description :** Génération des documents de synthèse exportables.

**User stories :**

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-RP01 | Expert-comptable | Générer un rapport de conformité par client | Avoir une synthèse documentée de la relation |
| US-RP02 | Expert-comptable | Exporter le rapport en PDF | Archiver ou transmettre le document |
| US-RP03 | Responsable | Générer un rapport global du portefeuille | Présenter un bilan de conformité à la direction |

**Contenu d'un rapport client :**
- Identité de l'entité (client)
- Mission(s) en cours
- Nature des prestations
- Honoraires
- Signataires
- Tableau de répartition des tâches
- Score de risque et historique
- Conditions générales
- Annexes jointes

---

### Module 12 — Documents et annexes

**Description :** Gestion documentaire centralisée par dossier.

**User stories :**

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-DOC01 | Collaborateur | Uploader un document sur un dossier | Centraliser tous les fichiers en un seul endroit |
| US-DOC02 | Collaborateur | Catégoriser les documents (pièce d'identité, justificatif, annexe) | Retrouver rapidement le bon fichier |
| US-DOC03 | Collaborateur | Télécharger un document sécurisé | Accéder aux fichiers sans exposer les URLs permanentes |
| US-DOC04 | Système | Générer une URL pré-signée à durée limitée (15 min) | Sécuriser l'accès aux documents sensibles |

---

## 4. Intégrations externes

### 4.1 API Sirene (INSEE)

**Objectif :** Récupérer automatiquement les données entreprise à partir du SIRET.

**Données récupérées :**
- Dénomination sociale
- Adresse du siège social
- Code APE / NAF
- Forme juridique
- Date de création
- Statut actif/cessé

**Déclenchement :** À la création du dossier et sur demande manuelle (bouton "Actualiser").

### 4.2 Listes de sanctions et PPE

**Objectif :** Vérifier automatiquement si un client ou un bénéficiaire effectif figure sur une liste de sanctions.

**Sources à croiser :**
- Liste française de gel des avoirs (direction du Trésor)
- Liste européenne des sanctions (OFAC-UE)
- Liste OFAC (Office of Foreign Assets Control — USA)
- Liste ONU
- Bases PPE nationales et internationales
- LIMPI (outil de screening LCB-FT dédié aux professions comptables)

**Déclenchement :** À l'entrée en relation, lors de la mise à jour du KYC, et selon un calendrier de révision paramétrable.

### 4.3 Portail de l'Ordre des Experts-Comptables

**Objectif :** Utiliser les modèles de lettres de mission conformes aux recommandations de l'Ordre.

**Note :** L'intégration est documentaire — les modèles sont importés dans l'application, pas via API.

### 4.4 Pennylane

**Objectif :** Synchronisation des données client.

**Contrainte :** La mise à jour automatique n'est pas possible via l'API Pennylane (limitation de la solution). **Hors périmètre MVP.**

---

## 5. Besoins non fonctionnels

### 5.1 Sécurité

| Exigence | Détail |
|----------|--------|
| Authentification | JWT en cookie HttpOnly (protection XSS) |
| Autorisation | RBAC avec 4 rôles (Collaborateur, Responsable, Expert-comptable, Admin) |
| Chiffrement des données en transit | TLS 1.3 (HTTPS obligatoire) |
| Chiffrement des documents au repos | AES-256 sur le stockage objet S3 |
| Protection CSRF | Cookie SameSite=Strict |
| Protection injections SQL | Requêtes paramétrées via ORM uniquement |
| Audit trail | Journalisation de toutes les actions sensibles (auteur, date, action, ressource) |

### 5.2 Conformité RGPD

| Exigence | Implémentation |
|----------|---------------|
| Rétention des données | Soft delete — conservation 5 ans (obligation LCB-FT) |
| Droit à la suppression | Anonymisation des données personnelles après 5 ans |
| Localisation des données | Stockage objet S3 hébergé en Europe uniquement |
| Minimisation | Collecte limitée aux données strictement nécessaires |
| Traçabilité | Audit trail complet sur toutes les actions |

### 5.3 Performance

| Exigence | Cible |
|----------|-------|
| Temps de réponse API | < 500ms pour 95% des requêtes |
| Disponibilité | 99% (hors fenêtres de maintenance planifiée) |
| Taille maximale de fichier | 10 Mo par document |
| Formats supportés | PDF, JPEG, PNG, DOCX |

### 5.4 Ergonomie

- Interface responsive (desktop prioritaire, tablette secondaire)
- Navigation cohérente entre les modules
- Feedback visuel sur les actions (loading states, toasts de confirmation)
- Checklist de complétude visible sur chaque dossier

---

## 6. Architecture technique

### 6.1 Stack technologique

| Couche | Technologie | Justification |
|--------|------------|---------------|
| Frontend | Next.js 16 + React 19 + Tailwind v4 | SSR natif, middleware serveur, proxy API intégré |
| Backend | NestJS (TypeScript) | Architecture modulaire, DI, décorateurs RBAC |
| Base de données | PostgreSQL 16 | Contraintes d'intégrité, ACID, adapté aux données réglementaires |
| Cache | Redis | Score de risque mis en cache, invalidation ciblée |
| Stockage documents | Minio (S3-compatible, Europe) | RGPD, URLs pré-signées, chiffrement AES-256 |
| Infrastructure | VPS Linux + Docker + Nginx | Maîtrise du coût, déploiement conteneurisé |

### 6.2 Modèle de données — entités principales

```
Utilisateur (id, prénom, nom, email, role, actif)
    │
    ├── crée ──► Prospect (id, siret, nom, statut_pipeline, score_risque)
    │                │
    │                └── converti en ──► Client (id, ref, siret, nom, deletedAt)
    │                                       │
    │                               ┌───────┴──────────────────────────┐
    │                               │                                  │
    │                             KYC (id, ppe, statut)            Mission (id, type, signé)
    │                               │                                  │
    │                           Document (id, type, s3Key, expiresAt) Lettre de mission (PDF)
    │
    ├── calcule ──► ScoreRisque (id, score, niveau, createdAt) ← historique par dossier
    │
    ├── déclare ──► OperationSensible (id, type, statut, validatedBy)
    │
    └── logue ──► AuditLog (id, action, ressource, ressourceId, userId, createdAt)
```

### 6.3 Flux d'une entrée en relation

```
1. Création prospect (SIRET → API Sirene)
2. Complétion du profil (Kanban — 5 étapes)
3. Collecte KYC + documents
4. Screening listes de sanctions (LIMPI / gel des avoirs)
5. Questionnaire d'évaluation des risques (9 questions → score)
6. Questionnaire d'acceptation (validation Responsable)
7. Conversion prospect → client
8. Génération lettre de mission (modèle Ordre)
9. Signature expert-comptable
10. Archivage dossier + audit trail complet
```

---

## 7. Glossaire

| Terme | Définition |
|-------|-----------|
| **LCB-FT** | Lutte contre le Blanchiment de Capitaux et le Financement du Terrorisme |
| **KYC** | Know Your Customer — processus d'identification et de vérification du client |
| **PPE** | Personne Politiquement Exposée — client présentant un risque accru de corruption |
| **UBO** | Ultimate Beneficial Owner — bénéficiaire effectif (personne physique détenant >25% du capital) |
| **Tracfin** | Traitement du renseignement et action contre les circuits financiers clandestins |
| **GAFI** | Groupe d'Action Financière — organisme intergouvernemental fixant les standards LCB-FT |
| **SIRENE** | Système national d'identification et du répertoire des entreprises (INSEE) |
| **LIMPI** | Outil de screening LCB-FT dédié aux professions comptables et juridiques |
| **Gel des avoirs** | Mesure de blocage des fonds d'une personne ou entité sanctionnée |
| **Diligences** | Mesures de vérification et de surveillance imposées par la réglementation LCB-FT |
| **LAB** | Lettre d'Acceptation de la mission de Blanchiment — document préalable à l'entrée en relation |
| **Audit trail** | Journal immuable de toutes les actions réalisées sur l'application |
| **Soft delete** | Suppression logique — l'enregistrement est marqué supprimé mais conservé en base |
| **Presigned URL** | URL temporaire donnant accès à un fichier S3 privé (durée limitée) |
