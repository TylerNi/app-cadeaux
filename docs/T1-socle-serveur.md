# T1 — Socle serveur, données et règles du secret

**Modèle : Claude Opus 5.5 · Effort : high · Dépendances : aucune**

> **Lis `docs/PLAN-GENERAL.md` en entier avant de commencer.** Tu es la première tâche : T2, T3, T4
> et T5 démarrent dès que tu es fusionnée, toutes en même temps, en s'appuyant uniquement sur ce que
> tu livres. T6 avance en parallèle de toi.

## Mission

Tu poses les fondations : un serveur Express qui démarre, la base SQLite, **toutes** les fonctions
d'accès aux données, les règles du secret, le gabarit HTML qui échappe tout, les cookies, et les
stubs des fichiers des autres tâches. À la fin, `npm run dev` démarre, `/health` répond, et chaque
page inconnue tombe sur une page 404 brute mais correcte.

Tu es le gardien des contrats du plan : tout ce que tu exposes doit correspondre **au caractère
près** aux signatures des §6.2 à §6.7 et au §7. Les autres tâches codent contre le plan, pas contre
ton code ; un écart casse leur travail.

## Fichiers que tu possèdes

```
.gitignore
package.json
package-lock.json
tsconfig.json
src/index.ts
src/config.ts
src/db.ts
src/schema.sql
src/types.ts
src/data.ts
src/rules.ts
src/html.ts
src/http.ts
src/viewer.ts
src/routes/home.ts       ← routeur vide uniquement, T3 le remplit
src/routes/lists.ts      ← routeur vide uniquement, T4 le remplit
src/routes/admin.ts      ← routeur vide uniquement, T5 le remplit
src/views/layout.ts      ← version brute uniquement, T2 la remplace
src/views/ui.ts          ← version brute uniquement, T2 la remplace
```

## Fichiers auxquels tu ne touches jamais

`docs/`, `consignes-humains.md`, `public/` (T2), `src/views/home.ts` (T3), `src/views/lists.ts` (T4),
`src/views/admin.ts` (T5), et tout ce qui appartient à T6 (`Dockerfile`, `docker-compose.yml`,
`.dockerignore`, `.env.example`, `.github/`, `README.md`).

## Travail détaillé

### 1. `.gitignore`

Ton tout premier fichier, avant le moindre `npm install` :

```
node_modules/
dist/
.data/
.env
```

### 2. Projet npm

`package.json` :

- `"name": "app-cadeaux"`, `"private": true`, `"type": "module"`, `"engines": { "node": ">=24" }`.
- Scripts :
  - `dev` : `tsx watch src/index.ts`
  - `build` : `tsc && node -e "require('fs').copyFileSync('src/schema.sql','dist/schema.sql')"`
  - `start` : `node dist/index.js`
- Dépendances : exactement celles du §3 du plan, rien d'autre. Reprends les versions majeures de
  `~/github/app-photo/server/package.json`.

`tsconfig.json` : reprends celui d'app-photo (`~/github/app-photo/server/tsconfig.json` : `strict`,
`ES2023`, `NodeNext`, `rootDir: src`, `outDir: dist`).

**Committe `package-lock.json`** : l'image Docker de T6 se construit avec `npm ci`, qui échoue sans.

### 3. `src/config.ts`

Lit les variables du §5 et les exporte (`port`, `dataDir`, `adminPassword`, `sessionSecret`,
`isProduction`). Si `ADMIN_PASSWORD` ou `SESSION_SECRET` manque ou est vide : message
`Variable d'environnement manquante : ADMIN_PASSWORD` sur la sortie d'erreur, puis
`process.exit(1)`. Aucun autre fichier ne lit `process.env`.

### 4. `src/schema.sql` et `src/db.ts`

- `schema.sql` : copie conforme du §6.1.
- `db.ts` : crée `dataDir` s'il n'existe pas (`recursive: true`), ouvre `dataDir/app.db`, exécute
  `PRAGMA journal_mode = WAL` et `PRAGMA foreign_keys = ON`, puis le contenu de `schema.sql`, lu à
  côté du fichier compilé (`path.join(import.meta.dirname, 'schema.sql')` : `src/` en développement,
  `dist/` en production grâce à la copie du script `build`). Exporte l'objet base de données.

### 5. `src/types.ts`

Copie conforme du §6.2. Rien d'autre.

### 6. `src/data.ts`

Les fonctions du §6.3, exactement ces noms et ces signatures, avec des requêtes préparées. Les
règles du §6.3 sont toutes à respecter ; en particulier :

- conversion des lignes `snake_case` vers les objets `camelCase` du §6.2 ;
- tri des membres en JavaScript avec `localeCompare(…, 'fr', { sensitivity: 'base' })` (le
  `ORDER BY` de SQLite ne connaît pas l'ordre français) ;
- `authorName` obtenu par `LEFT JOIN members` sur `author_id` ;
- `updateItem` met à jour `updated_at`.

Aucun contrôle d'accès ici : c'est le rôle de `rules.ts`.

### 7. `src/rules.ts`

Les cinq fonctions du §7, exactement selon le tableau. Elles sont pures (aucun accès à la base) :
T4 et T5 les appelleront partout. Relis deux fois la règle : **le mode aide ne lève jamais le
secret**, et un visiteur sans membre ne voit aucune idée.

### 8. `src/html.ts`

Le gabarit du §6.4.

- Une petite classe interne implémente `Html` ; `html` produit une instance.
- Échappement : `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&#39;`.
- Valeur insérée : `Html` → telle quelle ; tableau → chaque élément selon la même règle, concaténés ;
  `null`, `undefined`, `false` → rien ; tout le reste → `String(valeur)` échappé.
- Pas de `raw()`, pas d'autre export.

### 9. `src/http.ts`

Les fonctions du §6.5, exactement. `notFound` importe `notFoundPage` de `views/layout.ts` et
`viewerOf` de `viewer.ts`.

### 10. `src/viewer.ts`

Le §6.6, exactement.

- Le visiteur courant est rangé dans `res.locals.viewer` par `loadViewer` ; `viewerOf` le relit. Le
  typage de `res.locals` reste local à ce fichier (pas d'augmentation globale des types d'Express).
- 400 jours = `400 * 24 * 60 * 60 * 1000` ms pour `maxAge` d'Express.
- Cookie `member` : on le lit, `parseId`, `getMember`. Absent ou invalide → pas de membre, rien à
  effacer s'il n'y avait pas de cookie ; membre disparu → `clearCookie('member', { path: '/' })` ;
  membre trouvé → on repose le cookie (renouvellement glissant).
- Cookie `admin` : `req.signedCookies.admin === '1'`. `setAdmin` le pose avec `signed: true` et
  `secure: isProduction` ; `clearAdmin` l'efface.

### 11. `src/index.ts`

Dans cet ordre :

1. `express()`, `app.disable('x-powered-by')`.
2. Middleware des en-têtes communs du §6.5 (sur toutes les réponses, y compris les fichiers
   statiques et `/health`).
3. `express.static(path.join(import.meta.dirname, '..', 'public'), { index: false })` — le même
   chemin relatif marche depuis `src/` (développement) et `dist/` (image Docker, où T6 copie
   `public/` à côté de `dist/`).
4. `GET /health` → `200`, texte `ok`.
5. `express.urlencoded({ extended: false })`, `cookieParser(sessionSecret)`, `loadViewer`.
6. Le portillon du §6.6.
7. Les trois routeurs, montés sur `/` : `homeRouter`, `listsRouter`, `adminRouter` (chacun exporté
   sous ce nom par son fichier, `Router()` d'Express). Les routeurs déclarent eux-mêmes leurs chemins
   complets (`/who`, `/list/:id`, `/admin/…`).
8. Dernier middleware : `notFound`.
9. Gestionnaire d'erreurs (quatre arguments) : `console.error(err)` puis
   `send(res, errorPage(viewerOf(res)), 500)`. Si l'erreur survient avant `loadViewer`, utilise un
   visiteur vide `{ member: null, isAdmin: false }`.
10. `listen(port)` et une seule ligne de log : `app-cadeaux écoute sur le port 8080`.

### 12. Stubs pour les autres tâches

- `src/routes/home.ts`, `lists.ts`, `admin.ts` : `export const homeRouter = Router();` (et ses
  équivalents), rien d'autre.
- `src/views/layout.ts` et `src/views/ui.ts` : **toutes** les fonctions du §6.7, avec exactement
  leurs signatures, en HTML brut et sémantique, sans aucune classe ni mise en forme. Elles doivent
  vraiment marcher (liens, formulaires `POST`, champs avec `name`, `value`, `maxlength`, messages
  d'erreur, `id="item-{id}"`, bouton « Voir sur {domaine} », textes du §9) : T3, T4 et T5 vont
  développer et tester leurs pages avec elles avant que T2 ne les remplace. `page()` produit un
  document complet : `<!doctype html>`, `<html lang="fr">`, `<meta charset="utf-8">`, la balise
  viewport du §8.4, le `<title>` du §9.1, `<link rel="stylesheet" href="/styles.css">`.
  `doneNotice` contient déjà la table du §9.3.

## Critères d'acceptation

Vérifie chacun et rapporte le résultat. Les scripts de vérification sont jetables : lance-les avec
`npx tsx` depuis un dossier hors du dépôt ou supprime-les, ne les committe pas.

1. `npm install` puis `npm run build` : aucune erreur TypeScript, `dist/schema.sql` présent.
2. `npm run dev` avec `ADMIN_PASSWORD=test SESSION_SECRET=test DATA_DIR=./.data` : le serveur
   démarre et crée `.data/app.db`. Sans `ADMIN_PASSWORD` : message clair et code de sortie non nul.
3. `curl -i http://localhost:8080/health` → `200 ok`, avec `X-Robots-Tag`, la CSP exacte du §6.5,
   `X-Content-Type-Options`, `Referrer-Policy`, et sans `X-Powered-By`.
4. `curl -i http://localhost:8080/` sans cookie → `303` vers `/who` ; `curl -i
   http://localhost:8080/who` → `404` (le routeur de T3 est encore vide), **sans boucle de
   redirection**.
5. Script sur `data.ts` : créer « Zoé », « émile » et « Anne » → `listMembers` rend Anne, émile, Zoé ;
   `isNameTaken('ANNE')` vrai ; `isNameTaken('Anne', idDAnne)` faux ; `createMember('anne')` lève
   une erreur de contrainte.
6. Script : souhaits et idées croisés, puis `deleteMember(Anne)` → ses souhaits et les idées pour
   elle ont disparu ; les idées qu'elle avait écrites pour Zoé restent avec `authorId` et
   `authorName` à `null` ; un nouveau membre créé ensuite **ne reçoit pas** l'ancien identifiant
   d'Anne.
7. Script sur `rules.ts`, table de vérité complète : membre X, membre Y, admin avec identité X, admin
   avec identité Y, admin sans identité, visiteur vide. En particulier : X ne voit jamais les idées
   pour X, même admin ; un admin sans identité ne voit aucune idée mais peut modifier tous les
   souhaits ; Y ne peut modifier l'idée de Z que s'il est admin.
8. Script sur `html.ts` : `` html`<p>${'<script>"x"&\'y\''}</p>` `` donne
   `<p>&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;</p>` ; un tableau de `Html` est concaténé ;
   `null`, `undefined` et `false` ne produisent rien ; un `Html` imbriqué n'est pas échappé deux fois.
9. Cookies, avec `curl` : un cookie `member` valide est renouvelé (`Set-Cookie` avec
   `Max-Age=34560000`) ; celui d'un membre supprimé est effacé ; un cookie `admin` modifié à la main
   donne `isAdmin` faux.
10. `grep -ri "<script" src/` ne trouve rien.

## Ce que tu ne fais pas

Aucune page de l'app (T3, T4, T5), aucun CSS ni icône (T2), rien de Docker (T6). Pas d'ORM, pas de
système de migrations, pas de middleware de log, pas de limite de débit, pas de framework de test,
pas de `raw()`.

## Fin de tâche

Committe uniquement les fichiers que tu possèdes, message en français préfixé `T1 : `. **Pas de
push.** Rapporte à l'agent principal le résultat de chaque critère, et tout écart que tu aurais dû
faire par rapport au plan (il ne devrait y en avoir aucun).
