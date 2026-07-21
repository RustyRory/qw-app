# Documentation — QW-App

## docs/projet/ — Documentation de référence

Documentation à jour, maintenue avec le code. À consulter en priorité.

| Document | Contenu |
|---|---|
| [projet.md](./projet/projet.md) | Vue d'ensemble fonctionnelle : contexte, objectifs, acteurs/RBAC, modules, glossaire |
| [architecture.md](./projet/architecture.md) | Stack technique, structure des dossiers, communication frontend/backend |
| [database.md](./projet/database.md) | Modélisation Merise (MCD/MLD), 14 entités, index, migrations |
| [security.md](./projet/security.md) | RBAC, authentification, RGPD, sécurité des documents |
| [workflow.md](./projet/workflow.md) | Guide de développement, CI/CD, Git Flow, roadmap |
| [deployment.md](./projet/deployment.md) | Déploiement VPS, Docker, nginx |

## docs/mvp/ — Notes de travail

Documents source détaillés issus de la conception du projet (cahier des charges complet, modélisation de données, guides d'implémentation pas-à-pas backend/frontend). `docs/projet/` en est la synthèse maintenue ; ces fichiers restent la référence pour le détail exhaustif (code des entités, zonings d'écran, liste complète des questions du questionnaire d'acceptation…). **Non maintenus après implémentation** : certains détails (ex. questionnaire de scoring à 9 questions dédié, table `score_risque` client-only) ont été adaptés en cours de développement — voir `docs/projet/` pour l'état réel.

| Document | Contenu |
|---|---|
| `cahier-des-charges.md` | Cahier des charges complet (user stories, règles métier, NFR) |
| `modelisation-bdd.md` | Modélisation détaillée de la base de données |
| `workflow-backend.md` | Guide d'implémentation backend (migration vers le schéma à 14 entités) |
| `workflow-frontend.md` | Guide d'implémentation frontend (zonings d'écran par page) |

## docs/autre/ — Matériel annexe

| Document | Contenu |
|---|---|
| `cda.md`, `cda-rev.md`, `script-cda.md`, `slides-cda.md` | Matériel de soutenance CDA |
| `synology.md` | Notes diverses |
