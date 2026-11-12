# Revue du parcours QW-App — décisions (novembre 2026)

Décisions prises lors de la revue complète du parcours prospect → client.
Ce document fait foi pour les corrections ; il remplace les points
contradictoires du cahier des charges (`docs/mvp/cahier-des-charges.md`).

Rôles : COLLAB = collaborateur, RESP = responsable, EC = expert-comptable.

## 1. Prospects

| Sujet | Décision |
|---|---|
| Colonnes Kanban | Inchangées : Prise de contact → Préparation LAB → Validation LAB → LM à faire → LM envoyée → Converti (+ Refusé) |
| Déplacement | Glisser-déposer libre + avancées automatiques, **sauf vers « Converti »** : uniquement via le bouton Convertir (qui crée le client) |
| Création | COLLAB, RESP, EC, ADMIN |
| Champs obligatoires | Nom + type + **SIRET si personne morale** + **au moins un email ou un téléphone** |
| SIRET en double | **Bloqué** (prospect actif ou client), message avec la référence existante |
| Assignation | Champ « Assigné à » dans le formulaire de création ; ensuite tout le monde peut (ré)assigner |
| Visibilité | Tout le monde voit tous les prospects |
| Modification par COLLAB | Prospects qui lui sont assignés ou non assignés |
| Refus | RESP, EC, ADMIN ; **motif obligatoire** ; archivage automatique après 7 jours |
| Réactivation | Possible **même archivé** : page « Prospects archivés » avec bouton Réactiver |
| Suppression | COLLAB : ses propres créations ; RESP, **EC**, ADMIN : tous |
| Champs | Chiffre d'affaires et effectif saisissables ; tous les champs modifiables et effaçables |

## 2. Conversion prospect → client

| Sujet | Décision |
|---|---|
| Qui | **RESP, EC, ADMIN**, bouton manuel (pas de conversion automatique) |
| Conditions | Questionnaire LAB **validé** + **au moins une LM signée par l'EC** + **PDF signé par le client déposé** sur cette LM ; prospect non refusé |
| Données | **Tout** est transféré au client : champs (dont capital, régimes fiscal/TVA, n° TVA, salariés, convention collective, SIREN), missions et LM, planning, obligations, questionnaire, scores, documents, bénéficiaires effectifs |
| Après conversion | Le prospect disparaît du pipeline ; la fiche client fait foi |
| Double-clic | Protégé (un seul client créé) |

## 3. Questionnaire d'acceptation et risque

| Sujet | Décision |
|---|---|
| Critères « ÉLEVÉ d'office » | PPE (client **ou bénéficiaire effectif**), pays GAFI / UE haut risque, alerte LIMPI / gel des avoirs |
| Seuils | < 34 FAIBLE, 34–66 MOYEN, ≥ 67 ÉLEVÉ |
| Validation / refus | RESP, EC, ADMIN si FAIBLE ou MOYEN ; **EC ou ADMIN seulement si ÉLEVÉ** |
| 4 yeux | Non : celui qui remplit peut valider |
| Ajustement manuel | EC / ADMIN, justification obligatoire, tracé dans l'audit, jamais en dessous d'un « ÉLEVÉ d'office » |
| Remplissage | Ouvert à tous les rôles métier (pas de contrôle d'assignation) |
| « Tout cocher Oui / Non » | Remplace **toutes** les réponses du module, y compris celles déjà saisies (plus besoin de tout décocher avant) |
| Après conversion | Questionnaire rattaché au client |
| Revue périodique | **Chaque année pour tous** : questionnaire LAB à refaire + KYC (voir §6) |

## 4. Documents et bénéficiaires effectifs

| Sujet | Décision |
|---|---|
| Stockage | **Dossier local choisi dans les paramètres utilisateur** (Edge/Chrome, usage solo) **+ copie sur le serveur** (volume Docker sauvegardé) |
| Sans dossier choisi | **Dépôt bloqué** |
| Arborescence | `qw-app/Clients/<Réf> <Nom>/…` et `qw-app/Prospects/<Réf> <Nom>/…` |
| Nom des fichiers | `Nom-Type-JJ-MM-AAAA.ext` (ex. `SocieteMartin-PieceIdentite-12-11-2026.pdf`, `SocieteMartin-LettreMission-TenueComptable-12-11-2026.pdf`) |
| À la conversion | Dossier déplacé de `Prospects/` vers `Clients/` avec la nouvelle référence |
| Documents sur prospect | Oui, transférés au client à la conversion |
| Formats | PDF, images (JPG, PNG), Word, Excel ; **20 Mo** maximum |
| Suppression | Déposant + RESP, EC, ADMIN (suppression douce) |
| Pièces obligatoires | Société : Kbis, statuts, liste UBO, **pièce d'identité du dirigeant**, **pièces d'identité des bénéficiaires** ; personne physique : pièce d'identité, justificatif de domicile ; + attestation PPE si PPE ; + **justificatif d'origine des fonds si ÉLEVÉ** |
| Validité | **Date d'expiration** saisie au dépôt ; alerte + obligation à l'expiration |
| Bénéficiaires sur prospect | Oui, transférés à la conversion |
| Contrôles UBO | Total ≤ 100 % ; avertissement sous 25 % ; au moins un UBO pour une société (avant conversion et validation KYC) |
| Nationalité | Liste de pays |

## 5. Missions et lettres de mission

| Sujet | Décision |
|---|---|
| Missions | Créer, modifier, supprimer : RESP, EC, ADMIN |
| Types | Tenue comptable, Comptes annuels, Social / Paie, Fiscal, Juridique, Conseil, Audit / Examen, Autre |
| Validation LM | RESP, **EC**, ADMIN |
| Signature cabinet | EC ou ADMIN, avec la signature des paramètres utilisateur |
| Modification après validation | La LM est régénérée et **repasse « à valider »** |
| Modification après signature | **Nouvelle version (avenant)** à valider et signer ; l'ancienne version signée est conservée |
| Données du dossier modifiées | Les LM **non signées** sont régénérées automatiquement (et leur validation annulée) |
| Envoi au client | Téléchargement du PDF, envoi par la messagerie personnelle |
| Retour signé | Le client renvoie la LM signée par mail ; **EC ou ADMIN dépose le PDF** → LM « signée par le client » |
| DocuSign | **Supprimé** (code, colonnes, écrans) |
| Coordonnées du cabinet | Page admin « Cabinet » (nom, adresse, SIRET, TVA, capital, logo) |
| En-tête | Présentation de lettre : expéditeur (cabinet) en haut à gauche, destinataire (client : nom, représentant légal, adresse) à droite, lieu et date, objet |
| Paraphes | **Deux cases visibles en bas de chaque page** : « Paraphe cabinet » (rempli automatiquement à la signature de l'EC) et « Paraphe client » (vide) |
| Répartition des travaux | Tableau à **deux colonnes cochables « Cabinet » et « Client »** : les deux peuvent être cochées (tâche partagée), aucune = non applicable |

## 6. Dossier client

| Sujet | Décision |
|---|---|
| Création directe | **Interdite** : tout client vient d'une conversion |
| Visibilité | Tout le monde voit tous les clients |
| Modification | Tous les rôles métier ; PPE, statut KYC et screening uniquement via leurs actions dédiées |
| Validation KYC | Conditions : pièces obligatoires présentes et non expirées + screening effectué + UBO saisis (société) |
| Expiration KYC | **1 an** après validation ; rappel 30 jours avant ; questionnaire LAB à refaire chaque année |
| Screening | RESP, EC, ADMIN |
| Suppression (archivage) | EC, ADMIN |
| Client résilié | Lecture seule, conservation **5 ans** après la fin de relation avant toute suppression définitive |

## 7. Obligations et planning

| Sujet | Décision |
|---|---|
| Clôture manuelle | Autorisée (y compris obligations automatiques) |
| Délais | Échéance automatique 30 jours ; rappel de renouvellement de mission 60 jours avant la fin |
| Obligation en retard | Notification au collaborateur en charge, aux RESP et aux EC |
| Revue annuelle | Obligation + notification 30 jours avant la date anniversaire |

## 8. Opérations sensibles et audit

| Sujet | Décision |
|---|---|
| Visibilité | Le déclarant + RESP, EC, ADMIN |
| Circuit | Signalée → En analyse (bouton « Prendre en analyse ») → Classée **ou** Déclarée TRACFIN |
| Décision | EC, ADMIN ; **motif obligatoire** pour classer |
| Journal d'audit | RESP, **EC**, ADMIN |

## 9. Utilisateurs

| Sujet | Décision |
|---|---|
| Non connecté / session expirée | Redirection systématique vers la page de connexion (y compris en production sous `/qw-app`) |
| Rôle Modérateur | **Supprimé** ; les comptes existants deviennent ADMIN |
| Premier login | Mot de passe provisoire à changer obligatoirement |
| Mot de passe | 12 caractères minimum, majuscule, minuscule, chiffre |
| Départ | Compte désactivé (historique conservé), prospects assignés repassent non assignés |
