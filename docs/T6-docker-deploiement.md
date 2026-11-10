# T6 — Docker, Portainer et CI

**Modèle : Claude Sonnet 5.5 · Effort : medium · Dépendances : aucune pour écrire, T1 pour vérifier**

> **Lis `docs/PLAN-GENERAL.md` en entier avant de commencer**, en particulier les §2 (hébergement),
> §5 (variables) et §12 (pièges 7 et 8). Tu démarres en même temps que T1 : écris tes fichiers tout
> de suite, puis vérifie la construction de l'image dès que T1 est fusionnée dans `main` (rebase ta
> branche dessus).

## Mission

Tu rends l'app déployable exactement comme les autres apps de Tyler : une image publiée
automatiquement sur GHCR à chaque poussée sur `main`, une stack collée dans l'éditeur web de
Portainer avec quelques variables d'environnement, et une mise à jour qui se résume à *Re-pull
image* + *Redeploy*. Le modèle à suivre est app-photo (`~/github/app-photo` : `Dockerfile`,
`docker-compose.yml`, `.github/workflows/build.yml`, `README.md`), en plus simple : un seul projet
npm, aucun binaire système à installer.

## Fichiers que tu possèdes

```
Dockerfile
docker-compose.yml
.dockerignore
.env.example
.github/workflows/build.yml
README.md
```

## Fichiers auxquels tu ne touches jamais

`src/`, `public/`, `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore` (T1, T2…),
`docs/`, `consignes-humains.md`.

## Travail détaillé

### 1. `Dockerfile`

Multi-étapes, sur le modèle d'app-photo :

1. `deps` (`node:24-trixie`) : `package.json` et `package-lock.json`, puis `npm ci --omit=dev`.
2. `build` (`node:24-trixie`) : `npm ci`, copie de `tsconfig.json` et `src/`, `npm run build`, puis
   `test -f dist/schema.sql`.
3. Finale (`node:24-trixie-slim`) : `WORKDIR /app`, `ENV NODE_ENV=production`, copie de
   `node_modules` (de `deps`), de `dist/` (de `build`), de `public/` (du contexte) et de
   `package.json`. `EXPOSE 8080`.
   `HEALTHCHECK` sur `http://127.0.0.1:8080/health` avec `fetch` de Node (même forme qu'app-photo).
   `CMD ["node", "dist/index.js"]`.

`public/` doit se retrouver dans `/app/public`, à côté de `/app/dist` : T1 résout le dossier par
`path.join(import.meta.dirname, '..', 'public')`.

### 2. `.dockerignore`

`node_modules`, `dist`, `.git`, `.github`, `docs`, `.data`, `*.md`, `.env`, et
`public/_galerie.html` (fichier jetable de T2).

### 3. `docker-compose.yml`

```yaml
services:
  app-cadeaux:
    image: ghcr.io/tylerni/app-cadeaux:latest
    container_name: app-cadeaux
    restart: unless-stopped
    init: true
    ports:
      - "${APP_PORT}:8080"
    environment:
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      SESSION_SECRET: ${SESSION_SECRET}
    volumes:
      - ${DATA_PATH}:/data
```

`init: true` est indispensable (piège 8 du plan). Rien d'autre : pas de réseau dédié, pas de
limites, pas de labels.

### 4. `.env.example`

```
APP_PORT=8080
DATA_PATH=/mnt/tank/app-cadeaux
ADMIN_PASSWORD=change-moi
SESSION_SECRET=remplace-par-openssl-rand-hex-32
```

### 5. `.github/workflows/build.yml`

Copie du workflow d'app-photo avec l'image `ghcr.io/tylerni/app-cadeaux` : déclenché sur `main`,
les tags `v*` et à la main ; `linux/amd64` ; tags `latest` (branche par défaut), `sha` court et tag
git ; cache GitHub Actions.

### 6. `README.md`

En français, court et concret, dans l'esprit de celui d'app-photo :

1. Ce que fait l'app, en trois lignes.
2. **Préparer les secrets** : `openssl rand -hex 32` pour `SESSION_SECRET` ; `ADMIN_PASSWORD` au
   choix de Tyler (long : c'est la seule chose qui protège la gestion des membres).
3. **Données** : un dataset dédié (par exemple `/mnt/tank/app-cadeaux`) monté sur `/data` ; un
   seul fichier `app.db` (et ses `-wal`/`-shm`).
4. **Déployer dans Portainer** : Stacks › Add stack › Web editor, coller le compose, remplir le
   tableau des variables (`APP_PORT`, `DATA_PATH`, `ADMIN_PASSWORD`, `SESSION_SECRET`), Deploy.
   Paquet GHCR à rendre public (même explication que dans app-photo).
5. **Mettre à jour** : *Pull and redeploy* avec *Re-pull image*. Aucune étape manuelle.
6. **Premier lancement** : ouvrir `/admin`, entrer le mot de passe, ajouter les membres, puis
   envoyer le lien à la famille. Propose un texto prêt à copier, très simple, par exemple :
   « Coucou ! Voici notre app pour les listes de cadeaux : https://cadeaux.exemple.com — Appuie sur
   ton nom, puis écris ce qui te ferait plaisir. 🎁 » (en précisant de remplacer l'adresse par la
   vraie).
7. **Sauvegarde** : tout est dans `app.db` : un instantané ou une sauvegarde du dataset suffit.
8. **Développement local** : `npm install`, puis `npm run dev` avec `ADMIN_PASSWORD`,
   `SESSION_SECRET` et `DATA_DIR=./.data` ; l'app sur `http://localhost:8080`.

Le domaine, le tunnel Cloudflare et le dataset TrueNAS ne sont **pas** configurés par le code : le
README le dit en une phrase et renvoie Tyler à sa propre procédure.

## Critères d'acceptation

Une fois T1 fusionnée et ta branche rebasée dessus :

1. `docker build -t app-cadeaux:test .` réussit.
2. `docker run -d --init --name cadeaux-test -p 8090:8080 -e ADMIN_PASSWORD=test -e SESSION_SECRET=test -v <dossier temporaire>:/data app-cadeaux:test`
   → `curl http://localhost:8090/health` répond `ok`, et `docker inspect` montre l'état `healthy`
   après le délai du HEALTHCHECK.
3. Sans `ADMIN_PASSWORD` : le conteneur s'arrête avec le message clair de T1 dans `docker logs`.
4. Créer un membre (par `/admin`, ou par un script jetable si T5 n'est pas encore fusionnée), puis
   supprimer et recréer le conteneur avec le même dossier : le membre est toujours là.
5. `docker stop cadeaux-test` rend la main en moins de 2 secondes (grâce à `--init`).
6. L'image finale ne contient ni `src/`, ni `docs/`, ni `.git` (`docker run --rm app-cadeaux:test ls /app`).
7. `docker compose config` sur `docker-compose.yml`, avec les variables de `.env.example`, ne signale
   aucune erreur.
8. Fais le ménage : conteneur, image de test et dossier temporaire supprimés.

La publication réelle sur GHCR se vérifie après la fusion dans `main` et la poussée : c'est l'agent
principal qui s'en charge.

## Ce que tu ne fais pas

Pas de reverse proxy, pas de TLS, pas de configuration Cloudflare ni TrueNAS, pas de conteneur
supplémentaire (ni base de données, ni nginx), pas d'étape de tests dans la CI, pas de multi-
architecture, pas de `user:` dans le compose.

## Fin de tâche

Committe uniquement les fichiers que tu possèdes, message en français préfixé `T6 : `. **Pas de
push.** Rapporte le résultat de chaque critère, et confirme que le ménage Docker est fait.
