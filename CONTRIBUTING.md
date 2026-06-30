# Contribuer à QW-App

Ce document décrit le Git Flow, la convention de commits et le processus de Pull Request du projet. Pour l'installation, voir [INSTALL.md](./INSTALL.md).

---

## Branches

| Branche | Rôle | Depuis |
|---------|------|--------|
| `main` | Version stable livrée | — |
| `dev` | Intégration des développements | `main` |
| `staging` | Environnement de test / déploiement | `dev` |
| `feat/<issue>-description` | Nouvelle fonctionnalité | `dev` |
| `fix/<issue>-description` | Correction de bug | `dev` |
| `hotfix/<issue>-description` | Correction urgente en production | `main` |

## Convention de commits

```
type(scope): Fixes #<issue> - description courte

Types : feat | fix | refactor | test | docs | chore | ci
```

Exemples :

```
feat(auth): Fixes #12 - ajouter le guard JWT
fix(scoring): Fixes #34 - corriger le calcul du score ARPEC
docs(readme): Fixes #5 - mettre à jour les instructions d'installation
```

> Le format est vérifié automatiquement par le hook `commit-msg` (commitlint, config dans `commitlint.config.js`). La majuscule après `Fixes #<issue> -` est volontairement autorisée (`subject-case` désactivé).

## Flux de travail

```bash
# 1. Créer une branche depuis dev
git checkout dev && git pull
git checkout -b feat/42-creation-client

# 2. Développer, committer régulièrement
git add <fichiers>
git commit -m "feat(clients): Fixes #42 - ajouter la route POST /api/clients"

# 3. Pousser et ouvrir une Pull Request vers dev
git push origin feat/42-creation-client

# 4. Après validation CI + review → merger dans dev
# 5. Merger dev → staging pour déployer en staging
# 6. Merger dev → main pour créer une release
```

## Avant de committer

Les hooks Husky s'exécutent automatiquement :

- **`pre-commit`** : `lint-staged` (ESLint + Prettier sur les fichiers modifiés, backend et frontend) puis `npm test` côté backend
- **`commit-msg`** : validation du format du message via commitlint

Pour lancer manuellement les mêmes vérifications avant de pousser :

```bash
cd backend && npm run lint && npm test
cd ../frontend && npm run lint
```

## Pull Requests

- Cibler `dev` (jamais directement `main`, sauf `hotfix/*`)
- Le nom de branche et le message de commit doivent respecter les conventions ci-dessus
- La PR doit décrire le **pourquoi** du changement, pas uniquement le quoi
- Toute modification touchant à l'authentification, aux droits RBAC, aux documents ou aux données personnelles doit être cohérente avec [docs/projet/security.md](./docs/projet/security.md)
- Toute modification du schéma de base de données doit être accompagnée d'une migration TypeORM et reflétée dans [docs/projet/database.md](./docs/projet/database.md) si elle change la structure documentée

## Tests

Avant d'ouvrir une PR :

```bash
cd backend
npm test
npm run test:e2e
```

Voir [docs/projet/workflow.md](./docs/projet/workflow.md) pour le détail des cas à couvrir par module.

## Versioning

- `x.Y.0` : merge de `dev` vers `main` (incrémente le mineur)
- `x.y.Z` : merge de `hotfix/*` vers `main` (incrémente le patch)
- Le `CHANGELOG.md` doit contenir une section `## [x.y.z]` avant chaque release
