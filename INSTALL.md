# Installation

## Prérequis

- Node.js ≥ 20 LTS
- npm ≥ 10
- Docker + Docker Compose
- Git

```bash
node -v
npm -v
docker -v
```

---

## 1. Cloner le dépôt

```bash
git clone git@github.com:RustyRory/qw-app.git
cd qw-app
```

## 2. Installer les dépendances

Le dépôt est un monorepo **npm workspaces** (`backend` + `frontend`) : une seule commande à la racine installe les deux.

```bash
npm install
```

## 3. Configurer les variables d'environnement

### Backend — `backend/.env`

```bash
cp backend/.env.example backend/.env
```

```env
DATABASE_URL=postgresql://user:password@localhost:5432/qwapp
REDIS_URL=redis://localhost:6379
JWT_SECRET=<secret_fort_aléatoire>
JWT_EXPIRES_IN=1h
PORT=3001
NODE_ENV=development
```

> En production, ajouter également les identifiants OVHcloud Object Storage (`OVH_S3_*`) — voir [docs/projet/deployment.md](./docs/projet/deployment.md).

### Frontend — `frontend/.env.local`

```bash
cp frontend/.env.example frontend/.env.local
```

```env
NEXT_PUBLIC_API_URL=
```

> Les appels API passent par la route proxy interne de Next.js (`frontend/src/app/api/[...path]/route.ts`), pas par un rewrite `next.config.ts` — cette variable n'a généralement pas besoin d'être renseignée en local.

## 4. Démarrer l'infrastructure locale (PostgreSQL + Redis)

```bash
npm run infra:up    # docker compose -f deployment/docker-compose.dev.yml up -d
```

Pour l'arrêter :

```bash
npm run infra:down
```

## 5. Préparer la base de données

```bash
cd backend
npm run migration:run   # applique les migrations TypeORM
npm run seed             # crée un compte admin + données de démonstration
cd ..
```

## 6. Lancer l'application en développement

```bash
npm run dev    # backend sur :3001, frontend sur :3000 (attend le backend via wait-on)
```

- Frontend : http://localhost:3000
- API backend : http://localhost:3001/api

## 7. Lancer les tests

```bash
cd backend
npm test          # tests unitaires
npm run test:e2e  # tests end-to-end
npm run test:cov  # couverture
```

---

## Dépannage

| Problème | Solution |
|---|---|
| `ECONNREFUSED` sur PostgreSQL/Redis | Vérifier que `npm run infra:up` a bien démarré les conteneurs (`docker ps`) |
| Erreur de migration | Vérifier que `DATABASE_URL` dans `backend/.env` pointe vers la base locale (`localhost:5432`) |
| Port 3000/3001 déjà utilisé | Un autre processus écoute sur ces ports — l'arrêter ou changer `PORT` dans `backend/.env` |

Pour le déploiement en production, voir [docs/projet/deployment.md](./docs/projet/deployment.md).
