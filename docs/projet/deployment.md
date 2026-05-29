# Déploiement

## Architecture

L'application est déployée sur un VPS via **vps-monitor**, un orchestrateur maison qui gère les clones Git, les images Docker et la configuration nginx.

```
Internet → nginx (:80)
              └── /qw-app/ → qw-app-frontend (:3006)
                                └── /api/* (rewrite) → qw-app-backend (:3001, réseau Docker interne)
```

### Services Docker

| Service | Image | Port |
|---|---|---|
| `qw-app-frontend` | Next.js (build local) | `127.0.0.1:3006:3000` |
| `qw-app-backend` | NestJS (build local) | interne uniquement |
| `qw-app-postgres` | `postgres:16-alpine` | interne uniquement |
| `qw-app-redis` | `redis:7-alpine` | interne uniquement |

---

## Premier déploiement

### 1. Prérequis sur le VPS

Créer le fichier d'environnement (non versionné) :

```bash
cp /var/www/qw-app/deployment/.env.example /var/www/qw-app/deployment/.env
nano /var/www/qw-app/deployment/.env
```

Variables à renseigner :

```env
# PostgreSQL
POSTGRES_USER=qwuser
POSTGRES_PASSWORD=<mot de passe>
POSTGRES_DB=qwapp

# Backend
DB_HOST=qw-app-postgres
DB_PORT=5432
DB_USERNAME=qwuser
DB_PASSWORD=<mot de passe>
DB_DATABASE=qwapp
REDIS_HOST=qw-app-redis
REDIS_PORT=6379
JWT_SECRET=<secret>
PORT=3001
```

### 2. Clone via vps-monitor

Dans l'onglet **Déploiement** de vps-monitor :

| Champ | Valeur |
|---|---|
| Nom | `qw-app` |
| URL | `https://github.com/RustyRory/qw-app.git` |
| Branche | `staging` |
| Chemin nginx | `/qw-app/` |
| Port | `3006` |
| Conserver le préfixe | ✅ coché |

> Le build démarre automatiquement après le clone. Il prend plusieurs minutes (installation npm + compilation TypeScript + build Next.js).

### 3. Configuration nginx

La location `/qw-app/` est ajoutée automatiquement par vps-monitor avec le préfixe conservé :

```nginx
location /qw-app/ {
    proxy_pass http://127.0.0.1:3006;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

> **Important** : le préfixe doit être conservé (pas de `/` final sur `proxy_pass`). Next.js est configuré avec `basePath: '/qw-app'` pour que les assets `/_next/` soient correctement routés.

---

## Déploiement continu (CD)

Tout push sur la branche `staging` déclenche automatiquement le workflow GitHub Actions `.github/workflows/staging.yml` :

1. GitHub Actions appelle `POST /api/webhook/deploy` sur vps-monitor
2. vps-monitor fait un `git fetch` + `git reset --hard origin/staging`
3. vps-monitor rebuild les images Docker et redémarre les containers

### Secrets GitHub requis

| Secret | Description |
|---|---|
| `VPS_MONITOR_URL` | URL du vps-monitor (ex: `http://78.138.58.95`) |
| `WEBHOOK_SECRET` | Valeur de `WEBHOOK_SECRET` dans l'env du vps-monitor |

---

## Mise à jour manuelle

Via vps-monitor, onglet **Déploiement** → bouton **Mettre à jour**.

Ou directement sur le VPS :

```bash
git -C /var/www/qw-app fetch origin
git -C /var/www/qw-app reset --hard origin/staging
docker compose -f /var/www/docker-compose.yml up -d --build qw-app-backend qw-app-frontend
```

---

## Développement local

```bash
npm install          # depuis la racine (npm workspaces)
npm run dev          # backend :3001 + frontend :3000
```

Les services PostgreSQL et Redis en local :

```bash
docker compose -f deployment/docker/docker-compose.yml up -d
```
