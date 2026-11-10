# Plan général — app-cadeaux

> **Ce fichier est le contrat commun.** Chaque Claude assigné à une tâche lit ce fichier **en entier**
> avant d'ouvrir sa fiche `docs/Tx-*.md`. Tout ce qui est écrit ici est gelé : schéma SQL, routes,
> fonctions partagées, composants d'interface, textes communs, variables d'environnement,
> arborescence. Plusieurs tâches avancent en parallèle et dépendent de ces définitions : on n'improvise
> pas un contrat différent dans son coin. En cas de vrai blocage, on s'arrête et on prévient
> l'agent principal, qui remonte à Tyler.

---

## 1. Objectif

Petite application web pour l'échange de cadeaux d'une famille d'une dizaine de personnes :

1. **Qui es-tu ?** — au premier lancement, chacun appuie sur son nom dans la liste des membres.
   L'appareil s'en souvient ensuite.
2. **Ma liste** — chacun écrit, modifie et supprime ses souhaits de cadeaux.
3. **Les listes de la famille** — chacun consulte la liste de tous les autres.
4. **Idées secrètes** — sur la liste de quelqu'un d'autre, on peut ajouter une idée de cadeau pour
   cette personne (« Grand-papa a besoin de gants »). Tout le monde la voit, **sauf la personne
   concernée**.
5. **Mode aide** — réservé à Tyler : gérer les membres et remplir la liste de quelqu'un qui n'y
   arrive pas.

Publiée sur un sous-domaine de Tyler, auto-hébergée sur son serveur TrueNAS, déployée par
Portainer.

### Le critère n° 1 : les gens qui vont s'en servir

La plupart des membres ne savent pas se servir d'un courriel ni de Google Docs. **Chaque décision de
code et d'interface passe ce test : quelqu'un qui n'a jamais utilisé d'app y arrive seul, du premier
coup, sur son téléphone.** Ce téléphone est **presque toujours un iPhone**, dans Safari : c'est la
cible de référence de chaque vérification. Les règles concrètes sont au §8. En résumé :

- Une seule chose à faire par écran, dite en mots simples, au tutoiement.
- De gros boutons avec du texte écrit dessus. Jamais une icône seule, jamais un geste caché
  (glisser, appui long, double-tap), jamais un menu à ouvrir.
- Rien à installer, rien à taper pour entrer, aucun compte.
- Chaque action se termine par un message de confirmation visible ; chaque suppression est demandée
  une deuxième fois.
- Un bouton « Retour » visible sur chaque écran : on ne compte ni sur le geste ni sur le bouton du
  navigateur.

## 2. Décisions déjà prises — non négociables

Tranchées par Tyler (voir `consignes-humains.md`) ou par l'agent principal. Ne pas les rediscuter,
ne pas les « améliorer ».

| Sujet | Décision |
|---|---|
| Fonctionnement | **Listes seulement.** Pas de pige (tirage au sort), pas de « qui offre à qui » : ça se décide hors de l'app. |
| Réservation | **Aucune.** Pas de bouton « je m'en occupe », pas de « déjà pris », pas d'état « acheté ». |
| Accès | **Aucune protection pour la famille** : pas de mot de passe, pas de code, pas de lien secret. Connaître l'adresse suffit. Choix assumé de Tyler. |
| Identité | Choisie dans la liste, retenue par un cookie. C'est une **identité, pas une sécurité** : n'importe qui peut se déclarer n'importe qui. Ne pas ajouter de NIP, de mot de passe par personne ni de vérification. |
| Un appareil = une personne | Aucun lien pour changer de nom dans l'app. Quelqu'un qui n'a pas d'appareil à lui n'utilise pas celui d'un autre : Tyler remplit sa liste en mode aide. Pour corriger un appareil (mauvais nom choisi, appareil donné à quelqu'un d'autre), Tyler tape `/who` à la main. |
| Idées secrètes | Visibles par tous sauf la personne concernée. Le filtrage est fait **côté serveur** (§7) : une idée secrète n'est jamais envoyée à la personne qu'elle concerne. |
| Mode aide | Réservé à Tyler, derrière `ADMIN_PASSWORD`, à l'adresse `/admin`. **Aucun lien** vers cette page n'est visible pour quelqu'un qui n'est pas déjà en mode aide. |
| Rendu | **HTML produit par le serveur, zéro JavaScript dans le navigateur.** Choix de l'agent principal : la famille a sûrement de vieux iPad et de vieux téléphones ; une page HTML avec des formulaires classiques marche partout, sans écran blanc, et le bouton Retour du navigateur se comporte normalement. Aucune balise `<script>`, aucun attribut `on…=` ; c'est verrouillé par la CSP (§6.5). |
| Hors périmètre | Photos, notifications, courriels, pige, budget, date de l'échange, réservations, commentaires, mode hors ligne, thème sombre, version anglaise. |
| Langue | Français, tutoiement. Textes communs figés au §9 ; textes de chaque écran dans la fiche de sa tâche. |
| Hébergement | **Un seul conteneur**, image publiée sur GHCR, stack Portainer collée dans l'éditeur web avec des variables d'environnement. Mise à jour = *Re-pull image* + *Redeploy*, sans aucune étape manuelle. |
| HTTPS, domaine | **Hors périmètre du code.** Tyler publie le port par son tunnel Cloudflare. L'app écoute en HTTP simple ; aucune tâche ne configure de TLS, de proxy ni de DNS. |
| Dépôt public | Le dépôt GitHub est **public** et l'app n'a aucune protection : l'adresse réelle de l'app, l'adresse IP et les chemins du serveur, et les prénoms de la famille ne sont **jamais** écrits dans le dépôt (code, docs, README, messages de commit). Exemples génériques seulement : `cadeaux.exemple.com`, `/mnt/tank/app-cadeaux`, « Grand-maman », « Marie L. ». |
| Moteurs de recherche | L'app ne doit pas apparaître dans Google : en-tête `X-Robots-Tag: noindex, nofollow` sur toutes les réponses. |

## 3. Stack

- **Node 24**, **TypeScript** (`strict`), **Express 5**, modules ES (`"type": "module"`).
- **SQLite** via `better-sqlite3` : un fichier sur le volume monté, aucun serveur de base de données.
- **HTML** produit par un gabarit étiqueté maison `` html`…` `` qui échappe automatiquement tout ce
  qu'on y insère (§6.4). Aucun moteur de templates.
- **CSS** écrit à la main, un seul fichier `public/styles.css`. Aucune librairie d'interface, aucune
  police web.
- **Formulaires HTML classiques** : `GET` pour afficher, `POST` pour toute modification, puis
  redirection `303` (Post/Redirect/Get).

Un seul projet npm, à la racine du dépôt : contrairement à app-photo, il n'y a pas de `web/`, puisque
rien n'est compilé pour le navigateur.

### Dépendances autorisées

Aucune autre dépendance npm sans validation de Tyler. Si une tâche pense en avoir besoin, elle
**s'arrête et demande** au lieu d'installer.

- `express`, `better-sqlite3`, `cookie-parser`
- dev : `typescript`, `tsx`, `@types/node`, `@types/express`, `@types/better-sqlite3`,
  `@types/cookie-parser`

Mêmes versions majeures qu'app-photo (dépôt voisin `~/github/app-photo/server/package.json`).

## 4. Arborescence du dépôt

Chaque fichier a **un seul propriétaire**. Une tâche ne touche jamais un fichier qui appartient à une
autre.

```
app-cadeaux/
├── consignes-humains.md        (Tyler — lecture seule pour tous)
├── docs/                       (agent principal — lecture seule pour les tâches)
├── package.json                T1   ← seul T1 modifie les dépendances
├── package-lock.json           T1
├── tsconfig.json               T1
├── .gitignore                  T1   ← tout premier fichier écrit par T1
├── src/
│   ├── index.ts                T1   ← monte tous les routeurs ; personne d'autre n'y touche
│   ├── config.ts               T1   ← seule lecture des variables d'environnement
│   ├── db.ts                   T1   ← ouverture SQLite + application du schéma
│   ├── schema.sql              T1
│   ├── types.ts                T1   ← types partagés (§6.2)
│   ├── data.ts                 T1   ← TOUT le SQL de l'app (§6.3) ; personne d'autre n'écrit de requête
│   ├── rules.ts                T1   ← règles d'accès et du secret (§7)
│   ├── html.ts                 T1   ← gabarit html`` et échappement (§6.4)
│   ├── http.ts                 T1   ← envoi, redirection, lecture des formulaires (§6.5)
│   ├── viewer.ts               T1   ← cookies et visiteur courant (§6.6)
│   ├── routes/
│   │   ├── home.ts             T3   ← T1 crée un routeur vide, T3 le remplit
│   │   ├── lists.ts            T4   ← idem
│   │   └── admin.ts            T5   ← idem
│   └── views/
│       ├── layout.ts           T2   ← T1 crée une version brute qui marche, T2 la remplace
│       ├── ui.ts               T2   ← idem : composants partagés (§6.7)
│       ├── home.ts             T3
│       ├── lists.ts            T4
│       └── admin.ts            T5
├── public/                     T2   ← styles.css, icônes, manifest.webmanifest
├── Dockerfile                  T6
├── docker-compose.yml          T6   ← à coller dans l'éditeur web de Portainer
├── .dockerignore               T6
├── .env.example                T6
├── .github/workflows/build.yml T6
└── README.md                   T6
```

**Règle des stubs.** T1 crée **tous** les fichiers de `src/` sauf `views/home.ts`, `views/lists.ts`
et `views/admin.ts` : les trois routeurs vides, déjà montés dans `index.ts`, et une version **brute
mais fonctionnelle** de `views/layout.ts` et `views/ui.ts` qui respecte exactement les signatures du
§6.7 (du HTML sans style). Résultat : dès la fin de T1, le serveur démarre, et T2, T3, T4 et T5
avancent **en même temps**. T2 rend l'interface belle sans changer une seule signature ; T3, T4 et T5
construisent leurs pages avec les composants tels qu'ils sont, sans attendre T2.

**Règle de l'interface.** T3, T4 et T5 n'écrivent **pas de CSS**, pas d'attribut `style`, pas
d'attribut `class` : ils composent leurs pages avec `page()`, les composants de `views/ui.ts` et, au
besoin, des balises simples sans classe (`<p>`, `<strong>`, `<ul>`, `<li>`), que T2 met en forme
globalement. S'il manque un composant, ils le signalent à l'agent principal au lieu de bricoler. Pour
ce public, la cohérence entre les écrans *est* la facilité d'usage.

## 5. Variables d'environnement

Liste complète. Lues **uniquement** dans `src/config.ts`.

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `8080` | Port HTTP écouté dans le conteneur |
| `DATA_DIR` | `/data` | Dossier des données persistantes (volume monté) |
| `ADMIN_PASSWORD` | — (**requis**) | Mot de passe du mode aide (Tyler seulement) |
| `SESSION_SECRET` | — (**requis**) | Clé de signature du cookie du mode aide |
| `NODE_ENV` | — | Vaut `production` dans l'image Docker : ajoute `Secure` au cookie du mode aide |

Le serveur **refuse de démarrer**, avec un message clair, si une variable requise manque.

Données : un seul fichier, `DATA_DIR/app.db` (plus ses compagnons `app.db-wal` et `app.db-shm`).
Rien d'autre n'est écrit sur le disque.

## 6. Contrats gelés

### 6.1 Schéma SQL — `src/schema.sql`

Appliqué à chaque démarrage (idempotent). T1 l'écrit en entier.

```sql
CREATE TABLE IF NOT EXISTS members (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id  INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('wish','idea')),
  title      TEXT NOT NULL,
  details    TEXT,
  url        TEXT,
  author_id  INTEGER REFERENCES members(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_member ON items (member_id, kind, created_at DESC);
```

- `member_id` : la personne **dont c'est la liste**. `kind = 'wish'` : un souhait de cette personne
  (écrit par elle, ou par Tyler en mode aide). `kind = 'idea'` : une idée secrète écrite **par
  quelqu'un d'autre** pour elle.
- `author_id` : qui a écrit l'élément ; `NULL` si son auteur a été retiré, ou si Tyler l'a écrit en
  mode aide sans avoir choisi d'identité.
- `AUTOINCREMENT` est **voulu** : un identifiant de membre n'est jamais réutilisé. Sans ça, le cookie
  d'un membre retiré pourrait désigner le prochain membre créé.
- `PRAGMA foreign_keys = ON` et `PRAGMA journal_mode = WAL` sont exécutés **à l'ouverture de la
  connexion** dans `db.ts`. Le premier n'est pas mémorisé dans le fichier : sans lui, les `ON DELETE`
  ne font rien.
- Dates : ISO 8601 en UTC (`new Date().toISOString()`).

### 6.2 Types partagés — `src/types.ts`

```ts
export interface Member {
  id: number;
  name: string;
}

export type ItemKind = 'wish' | 'idea';

export interface Item {
  id: number;
  memberId: number;
  kind: ItemKind;
  title: string;
  details: string | null;
  url: string | null;
  authorId: number | null;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemInput {
  title: string;
  details: string | null;
  url: string | null;
}

export interface Viewer {
  member: Member | null;
  isAdmin: boolean;
}
```

### 6.3 Accès aux données — `src/data.ts`

Tout le SQL de l'app est ici. Les autres tâches appellent ces fonctions et **n'écrivent aucune
requête**.

```ts
export function listMembers(): Member[];
export function getMember(id: number): Member | null;
export function isNameTaken(name: string, exceptId?: number): boolean;
export function createMember(name: string): Member;
export function renameMember(id: number, name: string): void;
export function deleteMember(id: number): void;

export function countWishesByMember(): Map<number, number>;
export function listWishes(memberId: number): Item[];
export function listIdeas(memberId: number): Item[];
export function getItem(id: number): Item | null;
export function createItem(memberId: number, kind: ItemKind, input: ItemInput, authorId: number | null): Item;
export function updateItem(id: number, input: ItemInput): void;
export function deleteItem(id: number): void;
```

- `listMembers` trie par prénom dans l'ordre français, sans tenir compte des majuscules ni des
  accents (`a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })`) : chacun doit trouver son
  nom là où il l'attend.
- `isNameTaken` compare sans tenir compte des majuscules, accentuées comprises
  (`localeCompare(…, 'fr', { sensitivity: 'accent' })` : « émile » = « Émile », mais « Emile » ≠
  « Émile ») ; le `COLLATE NOCASE` de la colonne ne replie que les lettres sans accent et ne sert
  que de dernier filet.
- `countWishesByMember` ne compte **que** les souhaits. Un membre sans souhait est absent de la `Map`.
- `listWishes` et `listIdeas` : du plus récent au plus ancien (`created_at DESC, id DESC`), avec
  `authorName` joint depuis `members`.
- `listIdeas` et `getItem` **ne font aucun contrôle d'accès** : c'est `rules.ts` qui décide (§7).
  Aucune page n'affiche le résultat de `listIdeas` sans être passée par `canSeeIdeasOf`, ni un
  élément de `getItem` sans être passée par `canViewItem`.
- `deleteMember` : la cascade du schéma efface sa liste et les idées secrètes pour lui ; les idées
  qu'il a écrites pour les autres restent, sans auteur.

### 6.4 Gabarit HTML — `src/html.ts`

```ts
export interface Html {
  readonly __html: string;
}
export function html(strings: TemplateStringsArray, ...values: unknown[]): Html;
```

- Toute valeur insérée dans `` html`…` `` est **échappée** (`&`, `<`, `>`, `"`, `'`), sauf si c'est
  déjà un `Html`. Un tableau est concaténé élément par élément (chacun traité selon la même règle).
  `null`, `undefined` et `false` ne produisent rien, ce qui permet `` ${condition && html`…`} ``.
- Il n'existe **pas** de fonction `raw()` : rien ne doit pouvoir injecter du HTML non échappé. Le
  doctype et les balises vivent dans la partie fixe des gabarits, qui n'est pas échappée.

### 6.5 HTTP — `src/http.ts` et comportements communs de `src/index.ts`

```ts
export function send(res: Response, page: Html, status?: number): void;
export function redirect(res: Response, location: string): void;
export function notFound(res: Response): void;
export function parseId(value: unknown): number | null;
export function formText(body: unknown, name: string): string;
```

- `send` : `Content-Type: text/html; charset=utf-8`, `Cache-Control: no-store`, statut 200 par défaut.
- `redirect` : statut **303**.
- `notFound` : `send(res, notFoundPage(viewerOf(res)), 404)`.
- `parseId` : un entier positif écrit en chiffres (`/^[1-9][0-9]{0,9}$/`), sinon `null`.
- `formText` : la valeur du champ si c'est une chaîne, sinon `''` ; espaces de début et de fin
  retirés, `\r\n` ramenés à `\n`.

Sur **toutes** les réponses (middleware de `index.ts`) :

- `X-Robots-Tag: noindex, nofollow`
- `Content-Security-Policy: default-src 'none'; style-src 'self'; img-src 'self'; manifest-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`
  — interdit tout script et tout style en ligne : c'est la garantie mécanique du « zéro JavaScript »
  et du « pas d'attribut `style` ».
- `X-Content-Type-Options: nosniff` et `Referrer-Policy: no-referrer`
- Pas de `X-Powered-By`.

Autres comportements de `index.ts` : `express.urlencoded({ extended: false })`,
`cookieParser(SESSION_SECRET)`, `express.static` sur `public/` (sans page d'index), `GET /health` →
`200` avec le texte `ok`, toute route inconnue → `notFound`, toute erreur non gérée → `errorPage`
avec le statut 500 et un `console.error`.

### 6.6 Cookies et visiteur — `src/viewer.ts`

| Cookie | Contenu | Attributs |
|---|---|---|
| `member` | identifiant du membre choisi | `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` de 400 jours (le maximum accepté par Chrome), **renouvelé à chaque visite** |
| `admin` | `1`, **signé** avec `SESSION_SECRET` (`signed: true` de cookie-parser) | `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` de 400 jours, plus `Secure` si `NODE_ENV=production` |

```ts
export function loadViewer(req: Request, res: Response, next: NextFunction): void;
export function viewerOf(res: Response): Viewer;
export function setMember(res: Response, memberId: number): void;
export function setAdmin(res: Response): void;
export function clearAdmin(res: Response): void;
```

- `loadViewer` (middleware) lit `member` : si l'identifiant n'existe plus en base, le visiteur n'a
  pas de membre et le cookie est effacé ; sinon le cookie est renouvelé. Tant que quelqu'un ouvre
  l'app au moins une fois par an, il n'a jamais à rechoisir son nom.
- `isAdmin` = cookie `admin` signé et valide.
- **Portillon** (dans `index.ts`, juste après `loadViewer`) : une requête qui n'est ni `/who…`, ni
  `/admin…`, ni `/health`, ni un fichier de `public/`, venant d'un visiteur sans membre **et** sans
  mode aide → `redirect('/who')`.
- Aucun autre stockage dans le navigateur (il n'y a de toute façon pas de JavaScript).

### 6.7 Composants d'interface — `src/views/layout.ts` et `src/views/ui.ts`

Signatures gelées : T1 en écrit une version brute, T2 la remplace **sans changer une signature**,
T3, T4 et T5 ne composent qu'avec ça.

```ts
// layout.ts
export interface PageOptions {
  title: string;
  viewer: Viewer;
  back?: { href: string; label: string } | null;
  notice?: Html | null;
  body: Html;
}
export function page(options: PageOptions): Html;
export function notFoundPage(viewer: Viewer): Html;
export function errorPage(viewer: Viewer): Html;
```

- `title` sert au `<title>` et au `<h1>`.
- `back` : bouton Retour en haut de l'écran. Absent → `{ href: '/', label: "Retour à l'accueil" }` ;
  `null` → aucun bouton (accueil et « Qui es-tu ? »). Le composant ajoute la flèche lui-même : on
  passe le libellé sans « ← ».
- `notice` : bannière placée sous le titre (confirmation, mode aide).
- `page()` affiche, dans l'ordre : le nom de l'app en en-tête (lien vers `/`), le bouton Retour, le
  `<h1>`, la bannière, le corps, puis, si `viewer.member` existe, le pied de page du §9.4.

```ts
// ui.ts
export function primaryLink(href: string, label: string): Html;
export function secondaryLink(href: string, label: string): Html;
export function postButton(action: string, label: string, variant: 'primary' | 'secondary' | 'danger'): Html;
export function actionRow(buttons: Html[]): Html;

export function memberTile(member: Member, href: string, caption: string | null): Html;
export function memberGrid(tiles: Html[]): Html;

export function itemCard(item: Item, options: { actions: Html | null; showAuthor: boolean }): Html;
export function card(options: { title: string; text: string | null; actions: Html | null }): Html;
export function section(title: string, intro: string | null, content: Html): Html;

export function notice(text: string, tone: 'success' | 'info' | 'help'): Html;
export function doneNotice(code: unknown): Html | null;
export function emptyState(text: string): Html;

export function form(options: {
  action: string;
  fields: Html;
  submitLabel: string;
  cancelHref: string | null;
  cancelLabel?: string;
}): Html;
export function textField(options: {
  name: string;
  label: string;
  hint: string | null;
  value: string;
  error: string | null;
  maxLength: number;
  type?: 'text' | 'password';
  inputMode?: 'text' | 'url';
  autocomplete?: string;
}): Html;
export function textArea(options: {
  name: string;
  label: string;
  hint: string | null;
  value: string;
  error: string | null;
  maxLength: number;
}): Html;
export function confirmPanel(options: {
  text: string | null;
  action: string;
  confirmLabel: string;
  cancelHref: string;
  cancelLabel: string;
}): Html;
```

| Composant | Rendu attendu |
|---|---|
| `primaryLink`, `secondaryLink` | Lien `<a>` en forme de gros bouton, plein ou en contour, pleine largeur |
| `postButton` | `<form method="post" action="…">` qui ne contient qu'un bouton |
| `actionRow` | Boutons côte à côte, à parts égales (Modifier / Supprimer) |
| `memberTile` | Grande tuile cliquable : pastille ronde de la couleur du membre avec son initiale, prénom en gros, légende en dessous |
| `memberGrid` | Grille de tuiles, deux colonnes sur téléphone |
| `itemCard` | Titre en gros, précisions (retours à la ligne conservés), bouton « Voir sur {domaine} » si `url`, « Proposée par {auteur} » si `showAuthor` et `authorName`, actions en bas ; l'élément porte `id="item-{id}"` pour l'ancre |
| `card` | Carte générique : titre, texte, actions (lignes de la page du mode aide) |
| `section` | Bloc avec un `<h2>`, une phrase d'introduction facultative et son contenu |
| `notice` | Bannière : `success` (vert), `info` (neutre), `help` (jaune, mode aide) |
| `doneNotice` | Bannière `success` correspondant au code `?done=` (§9.3), `null` si le code est inconnu |
| `emptyState` | Message centré quand une liste est vide |
| `form` | Formulaire `POST` : les champs, un gros bouton d'envoi, et un lien « Annuler » (ou `cancelLabel`) si `cancelHref` |
| `textField`, `textArea` | Libellé toujours visible au-dessus, aide en dessous, message d'erreur sous le champ et bordure rouge si `error` |
| `confirmPanel` | Le texte, un gros bouton `danger` (formulaire `POST` vers `action`) et un gros bouton « garder » vers `cancelHref` |

La couleur d'un membre se déduit de son identifiant (`id % 8`, huit classes définies par T2) : elle
ne change pas quand on le renomme.

### 6.8 Routes

| Méthode | Route | Rôle | Tâche |
|---|---|---|---|
| `GET` | `/health` | `200 ok` pour le HEALTHCHECK Docker | T1 |
| `GET` | `/` | Accueil ; sans membre → `/who` | T3 |
| `GET` | `/who` | « Qui es-tu ? » : tuiles de tous les membres | T3 |
| `GET` | `/who/:id` | « Tu es bien {Nom} ? » | T3 |
| `POST` | `/who/:id` | Retient le membre, puis → `/?done=welcome` | T3 |
| `GET` | `/list/:id` | La liste d'un membre (« Ma liste » si c'est moi) | T4 |
| `GET` | `/list/:id/new?kind=wish\|idea` | Formulaire d'ajout | T4 |
| `POST` | `/list/:id/items?kind=wish\|idea` | Crée, puis → `/list/:id?done=added#item-{id}` | T4 |
| `GET` | `/items/:id/edit` | Formulaire de modification | T4 |
| `POST` | `/items/:id` | Enregistre, puis → `/list/{memberId}?done=updated#item-{id}` | T4 |
| `GET` | `/items/:id/delete` | « Supprimer ce souhait ? » | T4 |
| `POST` | `/items/:id/delete` | Supprime, puis → `/list/{memberId}?done=deleted` | T4 |
| `GET` | `/admin` | Mot de passe, ou tableau du mode aide | T5 |
| `POST` | `/admin/login` | Ouvre le mode aide | T5 |
| `POST` | `/admin/logout` | Quitte le mode aide | T5 |
| `POST` | `/admin/members` | Ajoute un membre | T5 |
| `GET` | `/admin/members/:id/edit` | Formulaire « Renommer » | T5 |
| `POST` | `/admin/members/:id` | Renomme | T5 |
| `GET` | `/admin/members/:id/delete` | « Retirer {Nom} ? » | T5 |
| `POST` | `/admin/members/:id/delete` | Retire le membre et sa liste | T5 |

- Toute modification passe par `POST`, jamais par `GET` : le cookie `SameSite=Lax` n'est alors
  jamais envoyé par un autre site, ce qui protège le mode aide sans jeton CSRF.
- Un identifiant invalide, un membre ou un élément inexistant, ou une action que le visiteur n'a pas
  le droit de faire → `notFound` (404). Jamais de 403 : il avouerait qu'une idée secrète existe.

## 7. Règles d'accès et du secret — `src/rules.ts`

```ts
export function canSeeIdeasOf(viewer: Viewer, memberId: number): boolean;
export function canAddIdeaFor(viewer: Viewer, memberId: number): boolean;
export function canEditWishesOf(viewer: Viewer, memberId: number): boolean;
export function canViewItem(viewer: Viewer, item: Item): boolean;
export function canEditItem(viewer: Viewer, item: Item): boolean;
```

| Fonction | Vraie si… |
|---|---|
| `canSeeIdeasOf` | `viewer.member` existe **et** `viewer.member.id !== memberId` |
| `canAddIdeaFor` | même règle que `canSeeIdeasOf` |
| `canEditWishesOf` | `viewer.member?.id === memberId` **ou** `viewer.isAdmin` |
| `canViewItem` | souhait → toujours ; idée → `canSeeIdeasOf(viewer, item.memberId)` |
| `canEditItem` | souhait → `canEditWishesOf(viewer, item.memberId)` ; idée → `canSeeIdeasOf(viewer, item.memberId)` **et** (`item.authorId === viewer.member.id` **ou** `viewer.isAdmin`) |

**Le mode aide ne lève jamais le secret.** Tyler est aussi un membre de la famille : en mode aide, il
ne voit toujours pas les idées pour lui. Et sans identité choisie, personne ne voit d'idée, puisqu'on
ne sait pas qui regarde.

Le secret, partout :

- Une page vue par X ne contient **jamais** rien sur les idées pour X : ni leur texte, ni leur
  nombre, ni une section vide « Idées secrètes », ni un indice.
- Les tuiles de l'accueil ne comptent que les **souhaits**.
- Toute route qui reçoit un élément que le visiteur n'a pas le droit de voir ou de modifier répond
  404.
- C'est une protection d'interface, pas une sécurité : X peut se faire passer pour quelqu'un d'autre
  et lire ses idées. Assumé (§2).

## 8. Ergonomie — règles pour toutes les pages

1. **Taille** : texte de base de 20 px, interligne 1,5 ; boutons d'au moins 56 px de haut, pleine
   largeur sur téléphone ; champs de saisie en 20 px (sous 16 px, iOS zoome tout seul à la saisie).
2. **Contraste** : au moins 4,5:1 partout (WCAG AA), 7:1 visé pour le texte courant.
3. **Mise en page** : une seule colonne, largeur maximale d'environ 640 px, centrée sur tablette et
   ordinateur. Doit rester impeccable à 320 px de large (iPhone SE de première génération).
4. **Zoom permis** : `<meta name="viewport" content="width=device-width, initial-scale=1">`, sans
   `user-scalable=no` ni `maximum-scale` (contrairement à app-photo : ici, beaucoup de gens
   zoomeront).
5. **Boutons** : un verbe d'action explicite (« Ajouter un souhait », « Oui, supprimer »), jamais
   « OK », jamais une icône seule. Un emoji est permis comme repère visuel, toujours accompagné de
   texte. Les liens de texte sont toujours soulignés.
6. **Liens vers un produit** : `target="_blank" rel="noopener noreferrer"`, libellé « Voir sur
   amazon.ca » (domaine sans `www.`) pour qu'on sache où l'on va.
7. **Après chaque action** : retour à la page concernée, bannière de confirmation (§9.3) et élément
   touché mis en évidence (ancre `#item-{id}` + style `:target`).
8. **Suppression** : toujours une page de confirmation à deux gros boutons.
9. **Erreurs de formulaire** : le formulaire revient **avec ce qui a été tapé**, et le message en
   mots simples sous le champ concerné.
10. **Champ lien** : `type="text"` avec `inputmode="url"`, jamais `type="url"` : la validation du
    navigateur refuserait `amazon.ca/…` sans `https://` avec un message obscur. C'est le serveur qui
    complète l'adresse (§9.2).
11. **Compatibilité** : doit fonctionner sur Safari iOS 12 et Chrome Android 7 et plus récents. Le
    CSS s'en tient à ce qu'ils comprennent : grid et variables CSS oui ; pas de `gap` en flexbox
    (marges, ou grid), pas de `dvh`, pas de `:has()`, pas d'`aspect-ratio`, pas de `clamp()`, pas
    d'`inset`.
12. **Aucun JavaScript** (§2) : tout est lien ou formulaire.
13. **iPhone d'abord** :
    - largeurs de référence 320, 375 et 390 px, en portrait ;
    - la taille du texte suit le réglage *Taille du texte* de l'iPhone (beaucoup de gens l'ont
      grossie) : `font: -apple-system-body` sur `html`, toutes les tailles en `rem`, de façon qu'à
      la taille par défaut d'iOS le texte courant fasse environ 20 px (§8.1). L'app reste
      utilisable même avec la plus grande taille de texte ;
    - `<meta name="apple-mobile-web-app-title" content="Cadeaux">` (nom sous l'icône si on ajoute
      l'app à l'écran d'accueil) et `<meta name="format-detection" content="telephone=no">` (iOS
      transformerait un numéro de modèle en lien d'appel, sur lequel on appuierait par erreur).

## 9. Textes communs figés

Les textes propres à chaque écran sont dans la fiche de sa tâche.

### 9.1 Nom de l'app

**« Cadeaux de la famille »** : en-tête, `<title>` (`{titre de la page} · Cadeaux de la famille`) et
manifest. Tyler peut le changer : une constante dans `views/layout.ts`, et le manifest.

### 9.2 Validation (côté serveur)

Les longueurs se comptent avec `.length`, après `formText`. Les mêmes limites sont posées en
`maxlength` sur les champs.

**Élément (T4)**

| Champ | Règle | Message |
|---|---|---|
| `title` | requis | « Écris au moins ce que c'est. » |
| `title` | 150 caractères au maximum | « C'est un peu long : 150 caractères au maximum. » |
| `details` | facultatif (vide → `null`), 1000 caractères au maximum | « C'est un peu long : 1000 caractères au maximum. » |
| `url` | facultatif (vide → `null`), voir ci-dessous | « Ce lien ne semble pas valide. Vérifie-le, ou laisse la case vide. » |

Adresse d'un lien : si le texte contient quelque part une adresse qui commence par `http://` ou
`https://` (majuscules ou non), on ne garde que la première, jusqu'au premier espace — le bouton
*Partager › Copier* d'une app iPhone colle souvent une phrase avec le lien dedans. Sinon, si le
texte ne commence pas par `http://` ou `https://`, on ajoute `https://` devant. Elle doit ensuite se lire avec `new URL()`, avoir le protocole `http:` ou
`https:`, un nom d'hôte qui contient un point, et 2000 caractères au maximum. On enregistre
`url.href`.

**Prénom (T5)** — espaces multiples ramenés à un seul.

| Règle | Message |
|---|---|
| requis | « Écris un prénom. » |
| 40 caractères au maximum | « C'est un peu long : 40 caractères au maximum. » |
| pas déjà pris (majuscules ou non) | « Ce prénom existe déjà. Ajoute une initiale, par exemple « Marie L. ». » |

**Mot de passe du mode aide (T5)** : « Mauvais mot de passe. »

### 9.3 Bannières de confirmation (`?done=`)

| Code | Texte |
|---|---|
| `welcome` | « Bienvenue ! L'app se souviendra de toi sur cet appareil. » |
| `added` | « C'est ajouté ✓ » |
| `updated` | « C'est modifié ✓ » |
| `deleted` | « C'est supprimé ✓ » |
| `member-added` | « Le membre est ajouté ✓ » |
| `member-renamed` | « Le prénom est changé ✓ » |
| `member-removed` | « Le membre est retiré ✓ » |

### 9.4 Éléments communs

- Pied de page, quand un membre est choisi : « Tu es {Nom}. », sans lien (§2 : un appareil = une
  personne).
- Bouton Retour par défaut : « ← Retour à l'accueil ».
- Lien d'annulation par défaut d'un formulaire : « Annuler ».
- Page 404 — titre « Page introuvable », texte « Cette page n'existe pas, ou plus. », bouton
  « Retour à l'accueil ».
- Page 500 — titre « Oups ! », texte « Quelque chose n'a pas marché. Réessaie dans un moment. »,
  bouton « Retour à l'accueil ».

## 10. Conventions de code

- **Aucun commentaire dans le code**, sauf demande explicite de Tyler.
- Français pour l'interface, les messages destinés à l'humain et les messages de commit. Anglais
  pour les identifiants (variables, fonctions, tables, routes).
- **Aucun embellissement** : pas de fonctionnalité, d'option, de champ, de fichier, d'abstraction, de
  logging décoratif ni de gestion d'erreur défensive au-delà de ce que la fiche demande. Si quelque
  chose semble manquer, le signaler en une phrase à la fin, sans l'écrire d'office.
- Pas de framework de test ni de tests automatisés commités : chaque tâche se vérifie avec les
  critères d'acceptation de sa fiche, à la main (`curl`, navigateur, scripts jetables non commités).
- TypeScript `strict`, pas de `any`.
- **Git** : chaque tâche travaille dans son propre worktree, sur une branche `tN-…` partie de `main`,
  et ne committe **que les fichiers qu'elle possède**, avec un message en français préfixé par son
  code (`T4 : listes, souhaits et idées secrètes`). Jamais de `push`, jamais de réécriture
  d'historique. L'agent principal relit, déroule les critères d'acceptation, fusionne dans `main` et
  pousse.

## 11. Découpage en tâches

| Tâche | Fiche | Dépend de | Modèle · effort |
|---|---|---|---|
| **T1** Socle serveur, données et règles du secret | `docs/T1-socle-serveur.md` | — | Opus 5.5 · xhigh |
| **T2** Design et composants d'interface | `docs/T2-design-interface.md` | T1 | Opus 5.5 · xhigh |
| **T3** « Qui es-tu ? » et accueil | `docs/T3-identite-accueil.md` | T1 | Opus 5.5 · xhigh |
| **T4** Listes, souhaits et idées secrètes | `docs/T4-listes-idees.md` | T1 | Opus 5.5 · xhigh |
| **T5** Mode aide | `docs/T5-mode-aide.md` | T1 | Opus 5.5 · xhigh |
| **T6** Docker, Portainer et CI | `docs/T6-docker-deploiement.md` | — (build vérifié après T1) | Opus 5.5 · xhigh |

Toutes les tâches tournent en Opus 5.5, effort xhigh, un sous-agent par tâche (demande de Tyler du
2026-11-10).

Ordre : **T1** et **T6** en parallèle → dès que T1 est fusionnée, **T2**, **T3**, **T4** et **T5**
en parallèle → recette finale (§13).

### Rôle de l'agent principal

- Lance chaque tâche (sous-agent avec le modèle indiqué, dans un worktree isolé) en lui donnant ce
  plan et sa fiche.
- À chaque livraison : relit le code **en partant du principe qu'il contient des erreurs** (contrats
  du §6, secret du §7, ergonomie du §8), déroule les critères d'acceptation, renvoie la tâche si
  besoin, puis fusionne et pousse.
- Tient le §15 à jour, ainsi que la mémoire du projet (le travail se poursuit sur plusieurs
  sessions et plusieurs PC).
- Mène le déploiement (§14) et la recette (§13) avec Tyler.

## 12. Pièges connus

À vérifier au moment de l'implémentation. Aucun n'autorise à changer une décision du §2.

1. **`foreign_keys`** n'est pas mémorisé par SQLite : à exécuter à chaque ouverture, sinon la
   suppression d'un membre laisse sa liste orpheline.
2. **Réutilisation des identifiants** : sans `AUTOINCREMENT`, SQLite peut redonner l'identifiant d'un
   membre supprimé, et un vieux cookie désignerait la mauvaise personne.
3. **Durée des cookies** : Chrome plafonne un cookie à 400 jours, d'où le renouvellement à chaque
   visite. Safari limite à 7 jours ce qui est écrit **par JavaScript** ; un cookie posé par la
   réponse du serveur, sur le même domaine que la page, n'est pas visé. Encore une raison de ne pas
   avoir de JavaScript.
4. **App ajoutée à l'écran d'accueil sur iOS** : elle a ses propres cookies, séparés de ceux de
   Safari. La personne rechoisit son nom une fois dans l'app installée : c'est normal.
5. **Express 5** : `req.body` vaut `undefined` sans `express.urlencoded`, et une valeur de formulaire
   peut être un tableau si le champ est en double ; on ne lit les champs qu'avec `formText`. La
   syntaxe des jokers de routes a changé en v5 : ne pas en utiliser ; la 404 est un dernier
   middleware.
6. **CSP** : elle bloque tout attribut `style` et toute balise `<style>` en ligne. Les couleurs des
   membres passent donc par des classes (`c0` à `c7`).
7. **`better-sqlite3`** est un module natif : l'étape de build de l'image doit pouvoir le compiler si
   aucun binaire précompilé ne convient, et l'étape finale doit tourner sur la même distribution
   (même schéma qu'app-photo : `node:24-trixie` puis `node:24-trixie-slim`).
8. **Node en PID 1** ne réagit pas à `SIGTERM` : sans `init: true` dans la stack, chaque *Redeploy*
   attend 10 secondes avant de tuer le conteneur.
9. **Derrière le tunnel Cloudflare**, l'app reçoit du HTTP simple : ne jamais rediriger vers HTTPS
   dans l'app.
10. **Double envoi** : sur une connexion lente, quelqu'un appuiera deux fois sur « Ajouter ». Sans
    JavaScript, on ne peut pas désactiver le bouton : T4 ignore donc un doublon exact envoyé dans les
    10 secondes (sa fiche précise la règle).
11. **Cookie du mode aide en `Secure`** en production : le navigateur ne le garde que sur une page en
    HTTPS. Le mode aide marche donc par l'adresse publique en HTTPS, pas par l'adresse locale du
    serveur en HTTP. C'est voulu.

## 13. Recette finale

Chaque tâche vérifie sa part ; personne ne vérifie l'assemblage. C'est le rôle de cette recette, à
dérouler par l'agent principal avec Tyler une fois les six tâches fusionnées et l'app déployée
derrière son adresse publique en HTTPS.

1. Ouvrir l'adresse sur l'iPhone de Tyler → « Qui es-tu ? » avec « Personne n'est encore inscrit ».
2. `/admin` : mauvais mot de passe refusé, bon mot de passe accepté ; ajouter trois membres de test
   (dont un avec un accent, « Émile », et vérifier qu'il se classe entre « Anne » et « Zoé »).
3. Choisir un nom → « Tu es bien … ? » → « Oui, c'est moi » → accueil et bannière de bienvenue.
   Fermer Safari, rouvrir → toujours le bon nom, sans rien refaire. Aucun écran ne propose de
   changer de nom ; taper `/who` à la main le permet.
4. Ajouter un souhait avec le lien `amazon.ca/…` tapé sans `https://` → bouton « Voir sur
   amazon.ca » qui ouvre bien le produit.
5. Depuis un deuxième appareil, sous un autre nom : voir ce souhait, puis ajouter une idée secrète
   pour le premier membre.
6. Sur le premier appareil : l'idée n'apparaît **nulle part** (vérifier aussi le code source de la
   page), et ouvrir à la main `/items/{id de l'idée}/edit` répond « Page introuvable ».
7. Mode aide : ajouter un souhait sur la liste d'un autre membre ; ce membre le voit comme le sien
   et peut le modifier.
8. Retirer un membre de test → son appareil revient sur « Qui es-tu ? ».
9. Sur le plus vieil iPhone de la famille : tout s'affiche et tout marche.
10. Zoom à deux doigts permis ; affichage correct à 320 px de large ; *Réglages › Luminosité et
    affichage › Taille du texte* au maximum : le texte grossit et tout reste utilisable ; lecture
    d'une page avec VoiceOver.
11. En-têtes d'une réponse : `X-Robots-Tag`, CSP, aucune erreur CSP dans la console du navigateur.
12. Portainer : *Re-pull image* puis *Redeploy* → listes intactes, tout le monde reste identifié.
13. Le lendemain : la copie de `app.db` figure dans la sauvegarde hors site.
14. Retirer les membres de test, ajouter les vrais membres, puis envoyer le lien à la famille par
    texto (message proposé dans le `README.md`).

## 14. Déploiement — hors code

Fait par l'agent principal avec Tyler, après la fusion de T6, selon la procédure habituelle de Tyler
pour ses apps. Les adresses et les chemins réels sont dans la mémoire du projet, pas dans ce dépôt
public. Rien de tout ça n'est écrit par une tâche.

1. Dataset dédié sur le TrueNAS, monté sur `/data`.
2. Sa tâche de sauvegarde hors site, comme pour chaque app.
3. Stack Portainer `app-cadeaux` collée depuis `docker-compose.yml`, sur un port hôte libre.
4. Paquet GHCR `app-cadeaux` rendu public (sinon Portainer ne peut pas le tirer).
5. Route du tunnel Cloudflare vers ce port.
6. Mise à jour de la documentation du serveur.

## 15. Avancement

| Tâche | État | Commit de fusion |
|---|---|---|
| T1 | fusionnée | `5265d80` |
| T2 | en cours | — |
| T3 | en cours | — |
| T4 | en cours | — |
| T5 | en cours | — |
| T6 | fichiers écrits ; vérification Docker en cours ; fusion après T2 | — |
| Déploiement | à faire | — |
| Recette | à faire | — |
