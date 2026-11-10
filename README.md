# app-cadeaux

Application web pour l'échange de cadeaux d'une famille : chacun appuie sur son nom, écrit sa liste
de souhaits et consulte celle des autres. Une idée secrète ajoutée sur la liste de quelqu'un est vue
par tous, sauf par la personne concernée. Un mode aide, à l'adresse `/admin`, gère les membres.

Le domaine, le tunnel Cloudflare et le dataset TrueNAS ne sont pas configurés par le code : suis ta
procédure habituelle pour les apps du serveur.

## 1. Données

Crée un dataset dédié (par exemple `/mnt/tank/app-cadeaux`) et note son chemin : c'est la valeur de
`DATA_PATH`, monté sur `/data` dans le conteneur. L'app n'y écrit qu'un seul fichier, `app.db` (et
ses compagnons `app.db-wal` et `app.db-shm`).

## 2. Déployer dans Portainer

1. Stacks › Add stack › Web editor.
2. Colle le contenu de `docker-compose.yml`.
3. Remplis les variables dans « Environment variables » (modèle : `.env.example`) :

| Variable | Exemple | Rôle |
|---|---|---|
| `APP_PORT` | `8080` | Port publié sur l'hôte |
| `DATA_PATH` | `/mnt/tank/app-cadeaux` | Dataset monté sur `/data` |

4. Deploy the stack.

L'image `ghcr.io/tylerni/app-cadeaux:latest` est publiée automatiquement à chaque poussée sur `main`.
Un paquet GHCR est **privé** par défaut, et Portainer ne pourra pas le tirer tel quel. Deux voies :

1. **Recommandé** — rendre le paquet public : GitHub › Packages › `app-cadeaux` › Package settings ›
   Change visibility › Public. C'est une image d'app, elle ne contient ni données ni secrets.
2. Sinon, ajouter le registre `ghcr.io` dans Portainer (Registries) avec un jeton GitHub disposant du
   scope `read:packages`.

## 3. Mettre à jour

Dans Portainer : la stack › **Pull and redeploy**, en cochant **Re-pull image**. C'est tout.

Le schéma de la base s'applique tout seul au démarrage et les données restent dans le dataset :
**aucune étape manuelle**.

## 4. Premier lancement

1. Ouvre `/admin` (par exemple `https://cadeaux.exemple.com/admin`) et appuie sur « Entrer ».
   Le mode aide ne marche que par l'adresse publique en HTTPS, pas par l'adresse locale du serveur
   en HTTP : son cookie n'est accepté par le navigateur qu'en HTTPS.
2. Ajoute les membres de la famille.
3. Envoie le lien à la famille. Texto prêt à copier, en remplaçant l'adresse par la vraie :

```text
Coucou ! Voici notre app pour les listes de cadeaux : https://cadeaux.exemple.com — Appuie sur ton nom, puis écris ce qui te ferait plaisir. 🎁
```

## 5. Sauvegarde

Tout est dans `app.db` : un instantané ou une sauvegarde du dataset suffit.

## 6. Développement local

```sh
npm install
DATA_DIR=./.data npm run dev
```

L'app répond sur `http://localhost:8080`.
