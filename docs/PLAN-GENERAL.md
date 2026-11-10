# Plan gÃ©nÃ©ral â€” app-cadeaux

> **Ce fichier est le contrat commun.** Chaque Claude assignÃ© Ã  une tÃ¢che lit ce fichier **en entier**
> avant d'ouvrir sa fiche `docs/Tx-*.md`. Tout ce qui est Ã©crit ici est gelÃ© : schÃ©ma SQL, routes,
> fonctions partagÃ©es, composants d'interface, textes communs, variables d'environnement,
> arborescence. Plusieurs tÃ¢ches avancent en parallÃ¨le et dÃ©pendent de ces dÃ©finitions : on n'improvise
> pas un contrat diffÃ©rent dans son coin. En cas de vrai blocage, on s'arrÃªte et on prÃ©vient
> l'agent principal, qui remonte Ã  Tyler.

---

## 1. Objectif

Petite application web pour l'Ã©change de cadeaux d'une famille d'une dizaine de personnes :

1. **Qui es-tu ?** â€” au premier lancement, chacun appuie sur son nom dans la liste des membres.
   L'appareil s'en souvient ensuite.
2. **Ma liste** â€” chacun Ã©crit, modifie et supprime ses souhaits de cadeaux.
3. **Les listes de la famille** â€” chacun consulte la liste de tous les autres.
4. **IdÃ©es secrÃ¨tes** â€” sur la liste de quelqu'un d'autre, on peut ajouter une idÃ©e de cadeau pour
   cette personne (Â« Grand-papa a besoin de gants Â»). Tout le monde la voit, **sauf la personne
   concernÃ©e**.
5. **Mode aide** â€” rÃ©servÃ© Ã  Tyler : gÃ©rer les membres et remplir la liste de quelqu'un qui n'y
   arrive pas.

PubliÃ©e sur un sous-domaine de Tyler, auto-hÃ©bergÃ©e sur son serveur TrueNAS, dÃ©ployÃ©e par
Portainer.

### Le critÃ¨re nÂ° 1 : les gens qui vont s'en servir

La plupart des membres ne savent pas se servir d'un courriel ni de Google Docs. **Chaque dÃ©cision de
code et d'interface passe ce test : quelqu'un qui n'a jamais utilisÃ© d'app y arrive seul, du premier
coup, sur son tÃ©lÃ©phone.** Ce tÃ©lÃ©phone est **presque toujours un iPhone**, dans Safari : c'est la
cible de rÃ©fÃ©rence de chaque vÃ©rification. Les rÃ¨gles concrÃ¨tes sont au Â§8. En rÃ©sumÃ© :

- Une seule chose Ã  faire par Ã©cran, dite en mots simples, au tutoiement.
- De gros boutons avec du texte Ã©crit dessus. Jamais une icÃ´ne seule, jamais un geste cachÃ©
  (glisser, appui long, double-tap), jamais un menu Ã  ouvrir.
- Rien Ã  installer, rien Ã  taper pour entrer, aucun compte.
- Chaque action se termine par un message de confirmation visible ; chaque suppression est demandÃ©e
  une deuxiÃ¨me fois.
- Un bouton Â« Retour Â» visible sur chaque Ã©cran : on ne compte ni sur le geste ni sur le bouton du
  navigateur.

## 2. DÃ©cisions dÃ©jÃ  prises â€” non nÃ©gociables

TranchÃ©es par Tyler (voir `consignes-humains.md`) ou par l'agent principal. Ne pas les rediscuter,
ne pas les Â« amÃ©liorer Â».

| Sujet | DÃ©cision |
|---|---|
| Fonctionnement | **Listes seulement.** Pas de pige (tirage au sort), pas de Â« qui offre Ã  qui Â» : Ã§a se dÃ©cide hors de l'app. |
| RÃ©servation | **Aucune.** Pas de bouton Â« je m'en occupe Â», pas de Â« dÃ©jÃ  pris Â», pas d'Ã©tat Â« achetÃ© Â». |
| AccÃ¨s | **Aucune protection pour la famille** : pas de mot de passe, pas de code, pas de lien secret. ConnaÃ®tre l'adresse suffit. Choix assumÃ© de Tyler. |
| IdentitÃ© | Choisie dans la liste, retenue par un cookie. C'est une **identitÃ©, pas une sÃ©curitÃ©** : n'importe qui peut se dÃ©clarer n'importe qui. Ne pas ajouter de NIP, de mot de passe par personne ni de vÃ©rification. |
| Un appareil = une personne | Aucun lien pour changer de nom dans l'app. Quelqu'un qui n'a pas d'appareil Ã  lui n'utilise pas celui d'un autre : Tyler remplit sa liste en mode aide. Pour corriger un appareil (mauvais nom choisi, appareil donnÃ© Ã  quelqu'un d'autre), Tyler tape `/who` Ã  la main. |
| IdÃ©es secrÃ¨tes | Visibles par tous sauf la personne concernÃ©e. Le filtrage est fait **cÃ´tÃ© serveur** (Â§7) : une idÃ©e secrÃ¨te n'est jamais envoyÃ©e Ã  la personne qu'elle concerne. |
| Mode aide | RÃ©servÃ© Ã  Tyler, derriÃ¨re `ADMIN_PASSWORD`, Ã  l'adresse `/admin`. **Aucun lien** vers cette page n'est visible pour quelqu'un qui n'est pas dÃ©jÃ  en mode aide. |
| Rendu | **HTML produit par le serveur, zÃ©ro JavaScript dans le navigateur.** Choix de l'agent principal : la famille a sÃ»rement de vieux iPad et de vieux tÃ©lÃ©phones ; une page HTML avec des formulaires classiques marche partout, sans Ã©cran blanc, et le bouton Retour du navigateur se comporte normalement. Aucune balise `<script>`, aucun attribut `onâ€¦=` ; c'est verrouillÃ© par la CSP (Â§6.5). |
| Hors pÃ©rimÃ¨tre | Photos, notifications, courriels, pige, budget, date de l'Ã©change, rÃ©servations, commentaires, mode hors ligne, thÃ¨me sombre, version anglaise. |
| Langue | FranÃ§ais, tutoiement. Textes communs figÃ©s au Â§9 ; textes de chaque Ã©cran dans la fiche de sa tÃ¢che. |
| HÃ©bergement | **Un seul conteneur**, image publiÃ©e sur GHCR, stack Portainer collÃ©e dans l'Ã©diteur web avec des variables d'environnement. Mise Ã  jour = *Re-pull image* + *Redeploy*, sans aucune Ã©tape manuelle. |
| HTTPS, domaine | **Hors pÃ©rimÃ¨tre du code.** Tyler publie le port par son tunnel Cloudflare. L'app Ã©coute en HTTP simple ; aucune tÃ¢che ne configure de TLS, de proxy ni de DNS. |
| DÃ©pÃ´t public | Le dÃ©pÃ´t GitHub est **public** et l'app n'a aucune protection : l'adresse rÃ©elle de l'app, l'adresse IP et les chemins du serveur, et les prÃ©noms de la famille ne sont **jamais** Ã©crits dans le dÃ©pÃ´t (code, docs, README, messages de commit). Exemples gÃ©nÃ©riques seulement : `cadeaux.exemple.com`, `/mnt/tank/app-cadeaux`, Â« Grand-maman Â», Â« Marie L. Â». |
| Moteurs de recherche | L'app ne doit pas apparaÃ®tre dans Google : en-tÃªte `X-Robots-Tag: noindex, nofollow` sur toutes les rÃ©ponses. |

## 3. Stack

- **Node 24**, **TypeScript** (`strict`), **Express 5**, modules ES (`"type": "module"`).
- **SQLite** via `better-sqlite3` : un fichier sur le volume montÃ©, aucun serveur de base de donnÃ©es.
- **HTML** produit par un gabarit Ã©tiquetÃ© maison `` html`â€¦` `` qui Ã©chappe automatiquement tout ce
  qu'on y insÃ¨re (Â§6.4). Aucun moteur de templates.
- **CSS** Ã©crit Ã  la main, un seul fichier `public/styles.css`. Aucune librairie d'interface, aucune
  police web.
- **Formulaires HTML classiques** : `GET` pour afficher, `POST` pour toute modification, puis
  redirection `303` (Post/Redirect/Get).

Un seul projet npm, Ã  la racine du dÃ©pÃ´t : contrairement Ã  app-photo, il n'y a pas de `web/`, puisque
rien n'est compilÃ© pour le navigateur.

### DÃ©pendances autorisÃ©es

Aucune autre dÃ©pendance npm sans validation de Tyler. Si une tÃ¢che pense en avoir besoin, elle
**s'arrÃªte et demande** au lieu d'installer.

- `express`, `better-sqlite3`, `cookie-parser`
- dev : `typescript`, `tsx`, `@types/node`, `@types/express`, `@types/better-sqlite3`,
  `@types/cookie-parser`

MÃªmes versions majeures qu'app-photo (dÃ©pÃ´t voisin `~/github/app-photo/server/package.json`).

## 4. Arborescence du dÃ©pÃ´t

Chaque fichier a **un seul propriÃ©taire**. Une tÃ¢che ne touche jamais un fichier qui appartient Ã  une
autre.

```
app-cadeaux/
â”œâ”€â”€ consignes-humains.md        (Tyler â€” lecture seule pour tous)
â”œâ”€â”€ docs/                       (agent principal â€” lecture seule pour les tÃ¢ches)
â”œâ”€â”€ package.json                T1   â† seul T1 modifie les dÃ©pendances
â”œâ”€â”€ package-lock.json           T1
â”œâ”€â”€ tsconfig.json               T1
â”œâ”€â”€ .gitignore                  T1   â† tout premier fichier Ã©crit par T1
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ index.ts                T1   â† monte tous les routeurs ; personne d'autre n'y touche
â”‚   â”œâ”€â”€ config.ts               T1   â† seule lecture des variables d'environnement
â”‚   â”œâ”€â”€ db.ts                   T1   â† ouverture SQLite + application du schÃ©ma
â”‚   â”œâ”€â”€ schema.sql              T1
â”‚   â”œâ”€â”€ types.ts                T1   â† types partagÃ©s (Â§6.2)
â”‚   â”œâ”€â”€ data.ts                 T1   â† TOUT le SQL de l'app (Â§6.3) ; personne d'autre n'Ã©crit de requÃªte
â”‚   â”œâ”€â”€ rules.ts                T1   â† rÃ¨gles d'accÃ¨s et du secret (Â§7)
â”‚   â”œâ”€â”€ html.ts                 T1   â† gabarit html`` et Ã©chappement (Â§6.4)
â”‚   â”œâ”€â”€ http.ts                 T1   â† envoi, redirection, lecture des formulaires (Â§6.5)
â”‚   â”œâ”€â”€ viewer.ts               T1   â† cookies et visiteur courant (Â§6.6)
â”‚   â”œâ”€â”€ routes/
â”‚   â”‚   â”œâ”€â”€ home.ts             T3   â† T1 crÃ©e un routeur vide, T3 le remplit
â”‚   â”‚   â”œâ”€â”€ lists.ts            T4   â† idem
â”‚   â”‚   â””â”€â”€ admin.ts            T5   â† idem
â”‚   â””â”€â”€ views/
â”‚       â”œâ”€â”€ layout.ts           T2   â† T1 crÃ©e une version brute qui marche, T2 la remplace
â”‚       â”œâ”€â”€ ui.ts               T2   â† idem : composants partagÃ©s (Â§6.7)
â”‚       â”œâ”€â”€ home.ts             T3
â”‚       â”œâ”€â”€ lists.ts            T4
â”‚       â””â”€â”€ admin.ts            T5
â”œâ”€â”€ public/                     T2   â† styles.css, icÃ´nes, manifest.webmanifest
â”œâ”€â”€ Dockerfile                  T6
â”œâ”€â”€ docker-compose.yml          T6   â† Ã  coller dans l'Ã©diteur web de Portainer
â”œâ”€â”€ .dockerignore               T6
â”œâ”€â”€ .env.example                T6
â”œâ”€â”€ .github/workflows/build.yml T6
â””â”€â”€ README.md                   T6
```

**RÃ¨gle des stubs.** T1 crÃ©e **tous** les fichiers de `src/` sauf `views/home.ts`, `views/lists.ts`
et `views/admin.ts` : les trois routeurs vides, dÃ©jÃ  montÃ©s dans `index.ts`, et une version **brute
mais fonctionnelle** de `views/layout.ts` et `views/ui.ts` qui respecte exactement les signatures du
Â§6.7 (du HTML sans style). RÃ©sultat : dÃ¨s la fin de T1, le serveur dÃ©marre, et T2, T3, T4 et T5
avancent **en mÃªme temps**. T2 rend l'interface belle sans changer une seule signature ; T3, T4 et T5
construisent leurs pages avec les composants tels qu'ils sont, sans attendre T2.

**RÃ¨gle de l'interface.** T3, T4 et T5 n'Ã©crivent **pas de CSS**, pas d'attribut `style`, pas
d'attribut `class` : ils composent leurs pages avec `page()`, les composants de `views/ui.ts` et, au
besoin, des balises simples sans classe (`<p>`, `<strong>`, `<ul>`, `<li>`), que T2 met en forme
globalement. S'il manque un composant, ils le signalent Ã  l'agent principal au lieu de bricoler. Pour
ce public, la cohÃ©rence entre les Ã©crans *est* la facilitÃ© d'usage.

## 5. Variables d'environnement

Liste complÃ¨te. Lues **uniquement** dans `src/config.ts`.

| Variable | DÃ©faut | RÃ´le |
|---|---|---|
| `PORT` | `8080` | Port HTTP Ã©coutÃ© dans le conteneur |
| `DATA_DIR` | `/data` | Dossier des donnÃ©es persistantes (volume montÃ©) |
| `ADMIN_PASSWORD` | â€” (**requis**) | Mot de passe du mode aide (Tyler seulement) |
| `SESSION_SECRET` | â€” (**requis**) | ClÃ© de signature du cookie du mode aide |
| `NODE_ENV` | â€” | Vaut `production` dans l'image Docker : ajoute `Secure` au cookie du mode aide |

Le serveur **refuse de dÃ©marrer**, avec un message clair, si une variable requise manque.

DonnÃ©es : un seul fichier, `DATA_DIR/app.db` (plus ses compagnons `app.db-wal` et `app.db-shm`).
Rien d'autre n'est Ã©crit sur le disque.

## 6. Contrats gelÃ©s

### 6.1 SchÃ©ma SQL â€” `src/schema.sql`

AppliquÃ© Ã  chaque dÃ©marrage (idempotent). T1 l'Ã©crit en entier.

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
  (Ã©crit par elle, ou par Tyler en mode aide). `kind = 'idea'` : une idÃ©e secrÃ¨te Ã©crite **par
  quelqu'un d'autre** pour elle.
- `author_id` : qui a Ã©crit l'Ã©lÃ©ment ; `NULL` si son auteur a Ã©tÃ© retirÃ©, ou si Tyler l'a Ã©crit en
  mode aide sans avoir choisi d'identitÃ©.
- `AUTOINCREMENT` est **voulu** : un identifiant de membre n'est jamais rÃ©utilisÃ©. Sans Ã§a, le cookie
  d'un membre retirÃ© pourrait dÃ©signer le prochain membre crÃ©Ã©.
- `PRAGMA foreign_keys = ON` et `PRAGMA journal_mode = WAL` sont exÃ©cutÃ©s **Ã  l'ouverture de la
  connexion** dans `db.ts`. Le premier n'est pas mÃ©morisÃ© dans le fichier : sans lui, les `ON DELETE`
  ne font rien.
- Dates : ISO 8601 en UTC (`new Date().toISOString()`).

### 6.2 Types partagÃ©s â€” `src/types.ts`

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

### 6.3 AccÃ¨s aux donnÃ©es â€” `src/data.ts`

Tout le SQL de l'app est ici. Les autres tÃ¢ches appellent ces fonctions et **n'Ã©crivent aucune
requÃªte**.

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

- `listMembers` trie par prÃ©nom dans l'ordre franÃ§ais, sans tenir compte des majuscules ni des
  accents (`a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })`) : chacun doit trouver son
  nom lÃ  oÃ¹ il l'attend.
- `isNameTaken` compare sans tenir compte des majuscules, accentuÃ©es comprises
  (`localeCompare(â€¦, 'fr', { sensitivity: 'accent' })` : Â« Ã©mile Â» = Â« Ã‰mile Â», mais Â« Emile Â» â‰ 
  Â« Ã‰mile Â») ; le `COLLATE NOCASE` de la colonne ne replie que les lettres sans accent et ne sert
  que de dernier filet.
- `countWishesByMember` ne compte **que** les souhaits. Un membre sans souhait est absent de la `Map`.
- `listWishes` et `listIdeas` : du plus rÃ©cent au plus ancien (`created_at DESC, id DESC`), avec
  `authorName` joint depuis `members`.
- `listIdeas` et `getItem` **ne font aucun contrÃ´le d'accÃ¨s** : c'est `rules.ts` qui dÃ©cide (Â§7).
  Aucune page n'affiche le rÃ©sultat de `listIdeas` sans Ãªtre passÃ©e par `canSeeIdeasOf`, ni un
  Ã©lÃ©ment de `getItem` sans Ãªtre passÃ©e par `canViewItem`.
- `deleteMember` : la cascade du schÃ©ma efface sa liste et les idÃ©es secrÃ¨tes pour lui ; les idÃ©es
  qu'il a Ã©crites pour les autres restent, sans auteur.

### 6.4 Gabarit HTML â€” `src/html.ts`

```ts
export interface Html {
  readonly __html: string;
}
export function html(strings: TemplateStringsArray, ...values: unknown[]): Html;
```

- Toute valeur insÃ©rÃ©e dans `` html`â€¦` `` est **Ã©chappÃ©e** (`&`, `<`, `>`, `"`, `'`), sauf si c'est
  dÃ©jÃ  un `Html`. Un tableau est concatÃ©nÃ© Ã©lÃ©ment par Ã©lÃ©ment (chacun traitÃ© selon la mÃªme rÃ¨gle).
  `null`, `undefined` et `false` ne produisent rien, ce qui permet `` ${condition && html`â€¦`} ``.
- Il n'existe **pas** de fonction `raw()` : rien ne doit pouvoir injecter du HTML non Ã©chappÃ©. Le
  doctype et les balises vivent dans la partie fixe des gabarits, qui n'est pas Ã©chappÃ©e.

### 6.5 HTTP â€” `src/http.ts` et comportements communs de `src/index.ts`

```ts
export function send(res: Response, page: Html, status?: number): void;
export function redirect(res: Response, location: string): void;
export function notFound(res: Response): void;
export function parseId(value: unknown): number | null;
export function formText(body: unknown, name: string): string;
```

- `send` : `Content-Type: text/html; charset=utf-8`, `Cache-Control: no-store`, statut 200 par dÃ©faut.
- `redirect` : statut **303**.
- `notFound` : `send(res, notFoundPage(viewerOf(res)), 404)`.
- `parseId` : un entier positif Ã©crit en chiffres (`/^[1-9][0-9]{0,9}$/`), sinon `null`.
- `formText` : la valeur du champ si c'est une chaÃ®ne, sinon `''` ; espaces de dÃ©but et de fin
  retirÃ©s, `\r\n` ramenÃ©s Ã  `\n`.

Sur **toutes** les rÃ©ponses (middleware de `index.ts`) :

- `X-Robots-Tag: noindex, nofollow`
- `Content-Security-Policy: default-src 'none'; style-src 'self'; img-src 'self'; manifest-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`
  â€” interdit tout script et tout style en ligne : c'est la garantie mÃ©canique du Â« zÃ©ro JavaScript Â»
  et du Â« pas d'attribut `style` Â».
- `X-Content-Type-Options: nosniff` et `Referrer-Policy: no-referrer`
- Pas de `X-Powered-By`.

Autres comportements de `index.ts` : `express.urlencoded({ extended: false })`,
`cookieParser(SESSION_SECRET)`, `express.static` sur `public/` (sans page d'index), `GET /health` â†’
`200` avec le texte `ok`, toute route inconnue â†’ `notFound`, toute erreur non gÃ©rÃ©e â†’ `errorPage`
avec le statut 500 et un `console.error`.

### 6.6 Cookies et visiteur â€” `src/viewer.ts`

| Cookie | Contenu | Attributs |
|---|---|---|
| `member` | identifiant du membre choisi | `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` de 400 jours (le maximum acceptÃ© par Chrome), **renouvelÃ© Ã  chaque visite** |
| `admin` | `1`, **signÃ©** avec `SESSION_SECRET` (`signed: true` de cookie-parser) | `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` de 400 jours, plus `Secure` si `NODE_ENV=production` |

```ts
export function loadViewer(req: Request, res: Response, next: NextFunction): void;
export function viewerOf(res: Response): Viewer;
export function setMember(res: Response, memberId: number): void;
export function setAdmin(res: Response): void;
export function clearAdmin(res: Response): void;
```

- `loadViewer` (middleware) lit `member` : si l'identifiant n'existe plus en base, le visiteur n'a
  pas de membre et le cookie est effacÃ© ; sinon le cookie est renouvelÃ©. Tant que quelqu'un ouvre
  l'app au moins une fois par an, il n'a jamais Ã  rechoisir son nom.
- `isAdmin` = cookie `admin` signÃ© et valide.
- **Portillon** (dans `index.ts`, juste aprÃ¨s `loadViewer`) : une requÃªte qui n'est ni `/whoâ€¦`, ni
  `/adminâ€¦`, ni `/health`, ni un fichier de `public/`, venant d'un visiteur sans membre **et** sans
  mode aide â†’ `redirect('/who')`.
- Aucun autre stockage dans le navigateur (il n'y a de toute faÃ§on pas de JavaScript).

### 6.7 Composants d'interface â€” `src/views/layout.ts` et `src/views/ui.ts`

Signatures gelÃ©es : T1 en Ã©crit une version brute, T2 la remplace **sans changer une signature**,
T3, T4 et T5 ne composent qu'avec Ã§a.

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
- `back` : bouton Retour en haut de l'Ã©cran. Absent â†’ `{ href: '/', label: "Retour Ã  l'accueil" }` ;
  `null` â†’ aucun bouton (accueil et Â« Qui es-tu ? Â»). Le composant ajoute la flÃ¨che lui-mÃªme : on
  passe le libellÃ© sans Â« â† Â».
- `notice` : banniÃ¨re placÃ©e sous le titre (confirmation, mode aide).
- `page()` affiche, dans l'ordre : le nom de l'app en en-tÃªte (lien vers `/`), le bouton Retour, le
  `<h1>`, la banniÃ¨re, le corps, puis, si `viewer.member` existe, le pied de page du Â§9.4.

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
| `postButton` | `<form method="post" action="â€¦">` qui ne contient qu'un bouton |
| `actionRow` | Boutons cÃ´te Ã  cÃ´te, Ã  parts Ã©gales (Modifier / Supprimer) |
| `memberTile` | Grande tuile cliquable : pastille ronde de la couleur du membre avec son initiale, prÃ©nom en gros, lÃ©gende en dessous |
| `memberGrid` | Grille de tuiles, deux colonnes sur tÃ©lÃ©phone |
| `itemCard` | Titre en gros, prÃ©cisions (retours Ã  la ligne conservÃ©s), bouton Â« Voir sur {domaine} Â» si `url`, Â« ProposÃ©e par {auteur} Â» si `showAuthor` et `authorName`, actions en bas ; l'Ã©lÃ©ment porte `id="item-{id}"` pour l'ancre |
| `card` | Carte gÃ©nÃ©rique : titre, texte, actions (lignes de la page du mode aide) |
| `section` | Bloc avec un `<h2>`, une phrase d'introduction facultative et son contenu |
| `notice` | BanniÃ¨re : `success` (vert), `info` (neutre), `help` (jaune, mode aide) |
| `doneNotice` | BanniÃ¨re `success` correspondant au code `?done=` (Â§9.3), `null` si le code est inconnu |
| `emptyState` | Message centrÃ© quand une liste est vide |
| `form` | Formulaire `POST` : les champs, un gros bouton d'envoi, et un lien Â« Annuler Â» (ou `cancelLabel`) si `cancelHref` |
| `textField`, `textArea` | LibellÃ© toujours visible au-dessus, aide en dessous, message d'erreur sous le champ et bordure rouge si `error` |
| `confirmPanel` | Le texte, un gros bouton `danger` (formulaire `POST` vers `action`) et un gros bouton Â« garder Â» vers `cancelHref` |

La couleur d'un membre se dÃ©duit de son identifiant (`id % 8`, huit classes dÃ©finies par T2) : elle
ne change pas quand on le renomme.

### 6.8 Routes

| MÃ©thode | Route | RÃ´le | TÃ¢che |
|---|---|---|---|
| `GET` | `/health` | `200 ok` pour le HEALTHCHECK Docker | T1 |
| `GET` | `/` | Accueil ; sans membre â†’ `/who` | T3 |
| `GET` | `/who` | Â« Qui es-tu ? Â» : tuiles de tous les membres | T3 |
| `GET` | `/who/:id` | Â« Tu es bien {Nom} ? Â» | T3 |
| `POST` | `/who/:id` | Retient le membre, puis â†’ `/?done=welcome` | T3 |
| `GET` | `/list/:id` | La liste d'un membre (Â« Ma liste Â» si c'est moi) | T4 |
| `GET` | `/list/:id/new?kind=wish\|idea` | Formulaire d'ajout | T4 |
| `POST` | `/list/:id/items?kind=wish\|idea` | CrÃ©e, puis â†’ `/list/:id?done=added#item-{id}` | T4 |
| `GET` | `/items/:id/edit` | Formulaire de modification | T4 |
| `POST` | `/items/:id` | Enregistre, puis â†’ `/list/{memberId}?done=updated#item-{id}` | T4 |
| `GET` | `/items/:id/delete` | Â« Supprimer ce souhait ? Â» | T4 |
| `POST` | `/items/:id/delete` | Supprime, puis â†’ `/list/{memberId}?done=deleted` | T4 |
| `GET` | `/admin` | Mot de passe, ou tableau du mode aide | T5 |
| `POST` | `/admin/login` | Ouvre le mode aide | T5 |
| `POST` | `/admin/logout` | Quitte le mode aide | T5 |
| `POST` | `/admin/members` | Ajoute un membre | T5 |
| `GET` | `/admin/members/:id/edit` | Formulaire Â« Renommer Â» | T5 |
| `POST` | `/admin/members/:id` | Renomme | T5 |
| `GET` | `/admin/members/:id/delete` | Â« Retirer {Nom} ? Â» | T5 |
| `POST` | `/admin/members/:id/delete` | Retire le membre et sa liste | T5 |

- Toute modification passe par `POST`, jamais par `GET` : le cookie `SameSite=Lax` n'est alors
  jamais envoyÃ© par un autre site, ce qui protÃ¨ge le mode aide sans jeton CSRF.
- Un identifiant invalide, un membre ou un Ã©lÃ©ment inexistant, ou une action que le visiteur n'a pas
  le droit de faire â†’ `notFound` (404). Jamais de 403 : il avouerait qu'une idÃ©e secrÃ¨te existe.

## 7. RÃ¨gles d'accÃ¨s et du secret â€” `src/rules.ts`

```ts
export function canSeeIdeasOf(viewer: Viewer, memberId: number): boolean;
export function canAddIdeaFor(viewer: Viewer, memberId: number): boolean;
export function canEditWishesOf(viewer: Viewer, memberId: number): boolean;
export function canViewItem(viewer: Viewer, item: Item): boolean;
export function canEditItem(viewer: Viewer, item: Item): boolean;
```

| Fonction | Vraie siâ€¦ |
|---|---|
| `canSeeIdeasOf` | `viewer.member` existe **et** `viewer.member.id !== memberId` |
| `canAddIdeaFor` | mÃªme rÃ¨gle que `canSeeIdeasOf` |
| `canEditWishesOf` | `viewer.member?.id === memberId` **ou** `viewer.isAdmin` |
| `canViewItem` | souhait â†’ toujours ; idÃ©e â†’ `canSeeIdeasOf(viewer, item.memberId)` |
| `canEditItem` | souhait â†’ `canEditWishesOf(viewer, item.memberId)` ; idÃ©e â†’ `canSeeIdeasOf(viewer, item.memberId)` **et** (`item.authorId === viewer.member.id` **ou** `viewer.isAdmin`) |

**Le mode aide ne lÃ¨ve jamais le secret.** Tyler est aussi un membre de la famille : en mode aide, il
ne voit toujours pas les idÃ©es pour lui. Et sans identitÃ© choisie, personne ne voit d'idÃ©e, puisqu'on
ne sait pas qui regarde.

Le secret, partout :

- Une page vue par X ne contient **jamais** rien sur les idÃ©es pour X : ni leur texte, ni leur
  nombre, ni une section vide Â« IdÃ©es secrÃ¨tes Â», ni un indice.
- Les tuiles de l'accueil ne comptent que les **souhaits**.
- Toute route qui reÃ§oit un Ã©lÃ©ment que le visiteur n'a pas le droit de voir ou de modifier rÃ©pond
  404.
- C'est une protection d'interface, pas une sÃ©curitÃ© : X peut se faire passer pour quelqu'un d'autre
  et lire ses idÃ©es. AssumÃ© (Â§2).

## 8. Ergonomie â€” rÃ¨gles pour toutes les pages

1. **Taille** : texte de base de 20 px, interligne 1,5 ; boutons d'au moins 56 px de haut, pleine
   largeur sur tÃ©lÃ©phone ; champs de saisie en 20 px (sous 16 px, iOS zoome tout seul Ã  la saisie).
2. **Contraste** : au moins 4,5:1 partout (WCAG AA), 7:1 visÃ© pour le texte courant.
3. **Mise en page** : une seule colonne, largeur maximale d'environ 640 px, centrÃ©e sur tablette et
   ordinateur. Doit rester impeccable Ã  320 px de large (iPhone SE de premiÃ¨re gÃ©nÃ©ration).
4. **Zoom permis** : `<meta name="viewport" content="width=device-width, initial-scale=1">`, sans
   `user-scalable=no` ni `maximum-scale` (contrairement Ã  app-photo : ici, beaucoup de gens
   zoomeront).
5. **Boutons** : un verbe d'action explicite (Â« Ajouter un souhait Â», Â« Oui, supprimer Â»), jamais
   Â« OK Â», jamais une icÃ´ne seule. Un emoji est permis comme repÃ¨re visuel, toujours accompagnÃ© de
   texte. Les liens de texte sont toujours soulignÃ©s.
6. **Liens vers un produit** : `target="_blank" rel="noopener noreferrer"`, libellÃ© Â« Voir sur
   amazon.ca Â» (domaine sans `www.`) pour qu'on sache oÃ¹ l'on va.
7. **AprÃ¨s chaque action** : retour Ã  la page concernÃ©e, banniÃ¨re de confirmation (Â§9.3) et Ã©lÃ©ment
   touchÃ© mis en Ã©vidence (ancre `#item-{id}` + style `:target`).
8. **Suppression** : toujours une page de confirmation Ã  deux gros boutons.
9. **Erreurs de formulaire** : le formulaire revient **avec ce qui a Ã©tÃ© tapÃ©**, et le message en
   mots simples sous le champ concernÃ©.
10. **Champ lien** : `type="text"` avec `inputmode="url"`, jamais `type="url"` : la validation du
    navigateur refuserait `amazon.ca/â€¦` sans `https://` avec un message obscur. C'est le serveur qui
    complÃ¨te l'adresse (Â§9.2).
11. **CompatibilitÃ©** : doit fonctionner sur Safari iOS 12 et Chrome Android 7 et plus rÃ©cents. Le
    CSS s'en tient Ã  ce qu'ils comprennent : grid et variables CSS oui ; pas de `gap` en flexbox
    (marges, ou grid), pas de `dvh`, pas de `:has()`, pas d'`aspect-ratio`, pas de `clamp()`, pas
    d'`inset`.
12. **Aucun JavaScript** (Â§2) : tout est lien ou formulaire.
13. **iPhone d'abord** :
    - largeurs de rÃ©fÃ©rence 320, 375 et 390 px, en portrait ;
    - la taille du texte suit le rÃ©glage *Taille du texte* de l'iPhone (beaucoup de gens l'ont
      grossie) : `font: -apple-system-body` sur `html`, toutes les tailles en `rem`, de faÃ§on qu'Ã 
      la taille par dÃ©faut d'iOS le texte courant fasse environ 20 px (Â§8.1). L'app reste
      utilisable mÃªme avec la plus grande taille de texte ;
    - `<meta name="apple-mobile-web-app-title" content="Cadeaux">` (nom sous l'icÃ´ne si on ajoute
      l'app Ã  l'Ã©cran d'accueil) et `<meta name="format-detection" content="telephone=no">` (iOS
      transformerait un numÃ©ro de modÃ¨le en lien d'appel, sur lequel on appuierait par erreur).

## 9. Textes communs figÃ©s

Les textes propres Ã  chaque Ã©cran sont dans la fiche de sa tÃ¢che.

### 9.1 Nom de l'app

**Â« Cadeaux de la famille Â»** : en-tÃªte, `<title>` (`{titre de la page} Â· Cadeaux de la famille`) et
manifest. Tyler peut le changer : une constante dans `views/layout.ts`, et le manifest.

### 9.2 Validation (cÃ´tÃ© serveur)

Les longueurs se comptent avec `.length`, aprÃ¨s `formText`. Les mÃªmes limites sont posÃ©es en
`maxlength` sur les champs.

**Ã‰lÃ©ment (T4)**

| Champ | RÃ¨gle | Message |
|---|---|---|
| `title` | requis | Â« Ã‰cris au moins ce que c'est. Â» |
| `title` | 150 caractÃ¨res au maximum | Â« C'est un peu long : 150 caractÃ¨res au maximum. Â» |
| `details` | facultatif (vide â†’ `null`), 1000 caractÃ¨res au maximum | Â« C'est un peu long : 1000 caractÃ¨res au maximum. Â» |
| `url` | facultatif (vide â†’ `null`), voir ci-dessous | Â« Ce lien ne semble pas valide. VÃ©rifie-le, ou laisse la case vide. Â» |

Adresse d'un lien : si le texte contient quelque part une adresse qui commence par `http://` ou
`https://` (majuscules ou non), on ne garde que la premiÃ¨re, jusqu'au premier espace â€” le bouton
*Partager â€º Copier* d'une app iPhone colle souvent une phrase avec le lien dedans. Sinon, si le
texte ne commence pas par `http://` ou `https://`, on ajoute `https://` devant. Elle doit ensuite se lire avec `new URL()`, avoir le protocole `http:` ou
`https:`, un nom d'hÃ´te qui contient un point, et 2000 caractÃ¨res au maximum. On enregistre
`url.href`.

**PrÃ©nom (T5)** â€” espaces multiples ramenÃ©s Ã  un seul.

| RÃ¨gle | Message |
|---|---|
| requis | Â« Ã‰cris un prÃ©nom. Â» |
| 40 caractÃ¨res au maximum | Â« C'est un peu long : 40 caractÃ¨res au maximum. Â» |
| pas dÃ©jÃ  pris (majuscules ou non) | Â« Ce prÃ©nom existe dÃ©jÃ . Ajoute une initiale, par exemple Â« Marie L. Â». Â» |

**Mot de passe du mode aide (T5)** : Â« Mauvais mot de passe. Â»

### 9.3 BanniÃ¨res de confirmation (`?done=`)

| Code | Texte |
|---|---|
| `welcome` | Â« Bienvenue ! L'app se souviendra de toi sur cet appareil. Â» |
| `added` | Â« C'est ajoutÃ© âœ“ Â» |
| `updated` | Â« C'est modifiÃ© âœ“ Â» |
| `deleted` | Â« C'est supprimÃ© âœ“ Â» |
| `member-added` | Â« Le membre est ajoutÃ© âœ“ Â» |
| `member-renamed` | Â« Le prÃ©nom est changÃ© âœ“ Â» |
| `member-removed` | Â« Le membre est retirÃ© âœ“ Â» |

### 9.4 Ã‰lÃ©ments communs

- Pied de page, quand un membre est choisi : Â« Tu es {Nom}. Â», sans lien (Â§2 : un appareil = une
  personne).
- Bouton Retour par dÃ©faut : Â« â† Retour Ã  l'accueil Â».
- Lien d'annulation par dÃ©faut d'un formulaire : Â« Annuler Â».
- Page 404 â€” titre Â« Page introuvable Â», texte Â« Cette page n'existe pas, ou plus. Â», bouton
  Â« Retour Ã  l'accueil Â».
- Page 500 â€” titre Â« Oups ! Â», texte Â« Quelque chose n'a pas marchÃ©. RÃ©essaie dans un moment. Â»,
  bouton Â« Retour Ã  l'accueil Â».

## 10. Conventions de code

- **Aucun commentaire dans le code**, sauf demande explicite de Tyler.
- FranÃ§ais pour l'interface, les messages destinÃ©s Ã  l'humain et les messages de commit. Anglais
  pour les identifiants (variables, fonctions, tables, routes).
- **Aucun embellissement** : pas de fonctionnalitÃ©, d'option, de champ, de fichier, d'abstraction, de
  logging dÃ©coratif ni de gestion d'erreur dÃ©fensive au-delÃ  de ce que la fiche demande. Si quelque
  chose semble manquer, le signaler en une phrase Ã  la fin, sans l'Ã©crire d'office.
- Pas de framework de test ni de tests automatisÃ©s commitÃ©s : chaque tÃ¢che se vÃ©rifie avec les
  critÃ¨res d'acceptation de sa fiche, Ã  la main (`curl`, navigateur, scripts jetables non commitÃ©s).
- TypeScript `strict`, pas de `any`.
- **Git** : chaque tÃ¢che travaille dans son propre worktree, sur une branche `tN-â€¦` partie de `main`,
  et ne committe **que les fichiers qu'elle possÃ¨de**, avec un message en franÃ§ais prÃ©fixÃ© par son
  code (`T4 : listes, souhaits et idÃ©es secrÃ¨tes`). Jamais de `push`, jamais de rÃ©Ã©criture
  d'historique. L'agent principal relit, dÃ©roule les critÃ¨res d'acceptation, fusionne dans `main` et
  pousse.

## 11. DÃ©coupage en tÃ¢ches

| TÃ¢che | Fiche | DÃ©pend de | ModÃ¨le Â· effort |
|---|---|---|---|
| **T1** Socle serveur, donnÃ©es et rÃ¨gles du secret | `docs/T1-socle-serveur.md` | â€” | Opus 5.5 Â· xhigh |
| **T2** Design et composants d'interface | `docs/T2-design-interface.md` | T1 | Opus 5.5 Â· xhigh |
| **T3** Â« Qui es-tu ? Â» et accueil | `docs/T3-identite-accueil.md` | T1 | Opus 5.5 Â· xhigh |
| **T4** Listes, souhaits et idÃ©es secrÃ¨tes | `docs/T4-listes-idees.md` | T1 | Opus 5.5 Â· xhigh |
| **T5** Mode aide | `docs/T5-mode-aide.md` | T1 | Opus 5.5 Â· xhigh |
| **T6** Docker, Portainer et CI | `docs/T6-docker-deploiement.md` | â€” (build vÃ©rifiÃ© aprÃ¨s T1) | Opus 5.5 Â· xhigh |

Toutes les tÃ¢ches tournent en Opus 5.5, effort xhigh, un sous-agent par tÃ¢che (demande de Tyler du
2026-11-10).

Ordre : **T1** et **T6** en parallÃ¨le â†’ dÃ¨s que T1 est fusionnÃ©e, **T2**, **T3**, **T4** et **T5**
en parallÃ¨le â†’ recette finale (Â§13).

### RÃ´le de l'agent principal

- Lance chaque tÃ¢che (sous-agent avec le modÃ¨le indiquÃ©, dans un worktree isolÃ©) en lui donnant ce
  plan et sa fiche.
- Ã€ chaque livraison : relit le code **en partant du principe qu'il contient des erreurs** (contrats
  du Â§6, secret du Â§7, ergonomie du Â§8), dÃ©roule les critÃ¨res d'acceptation, renvoie la tÃ¢che si
  besoin, puis fusionne et pousse.
- Tient le Â§15 Ã  jour, ainsi que la mÃ©moire du projet (le travail se poursuit sur plusieurs
  sessions et plusieurs PC).
- MÃ¨ne le dÃ©ploiement (Â§14) et la recette (Â§13) avec Tyler.

## 12. PiÃ¨ges connus

Ã€ vÃ©rifier au moment de l'implÃ©mentation. Aucun n'autorise Ã  changer une dÃ©cision du Â§2.

1. **`foreign_keys`** n'est pas mÃ©morisÃ© par SQLite : Ã  exÃ©cuter Ã  chaque ouverture, sinon la
   suppression d'un membre laisse sa liste orpheline.
2. **RÃ©utilisation des identifiants** : sans `AUTOINCREMENT`, SQLite peut redonner l'identifiant d'un
   membre supprimÃ©, et un vieux cookie dÃ©signerait la mauvaise personne.
3. **DurÃ©e des cookies** : Chrome plafonne un cookie Ã  400 jours, d'oÃ¹ le renouvellement Ã  chaque
   visite. Safari limite Ã  7 jours ce qui est Ã©crit **par JavaScript** ; un cookie posÃ© par la
   rÃ©ponse du serveur, sur le mÃªme domaine que la page, n'est pas visÃ©. Encore une raison de ne pas
   avoir de JavaScript.
4. **App ajoutÃ©e Ã  l'Ã©cran d'accueil sur iOS** : elle a ses propres cookies, sÃ©parÃ©s de ceux de
   Safari. La personne rechoisit son nom une fois dans l'app installÃ©e : c'est normal.
5. **Express 5** : `req.body` vaut `undefined` sans `express.urlencoded`, et une valeur de formulaire
   peut Ãªtre un tableau si le champ est en double ; on ne lit les champs qu'avec `formText`. La
   syntaxe des jokers de routes a changÃ© en v5 : ne pas en utiliser ; la 404 est un dernier
   middleware.
6. **CSP** : elle bloque tout attribut `style` et toute balise `<style>` en ligne. Les couleurs des
   membres passent donc par des classes (`c0` Ã  `c7`).
7. **`better-sqlite3`** est un module natif : l'Ã©tape de build de l'image doit pouvoir le compiler si
   aucun binaire prÃ©compilÃ© ne convient, et l'Ã©tape finale doit tourner sur la mÃªme distribution
   (mÃªme schÃ©ma qu'app-photo : `node:24-trixie` puis `node:24-trixie-slim`).
8. **Node en PID 1** ne rÃ©agit pas Ã  `SIGTERM` : sans `init: true` dans la stack, chaque *Redeploy*
   attend 10 secondes avant de tuer le conteneur.
9. **DerriÃ¨re le tunnel Cloudflare**, l'app reÃ§oit du HTTP simple : ne jamais rediriger vers HTTPS
   dans l'app.
10. **Double envoi** : sur une connexion lente, quelqu'un appuiera deux fois sur Â« Ajouter Â». Sans
    JavaScript, on ne peut pas dÃ©sactiver le bouton : T4 ignore donc un doublon exact envoyÃ© dans les
    10 secondes (sa fiche prÃ©cise la rÃ¨gle).
11. **Cookie du mode aide en `Secure`** en production : le navigateur ne le garde que sur une page en
    HTTPS. Le mode aide marche donc par l'adresse publique en HTTPS, pas par l'adresse locale du
    serveur en HTTP. C'est voulu.

## 13. Recette finale

Chaque tÃ¢che vÃ©rifie sa part ; personne ne vÃ©rifie l'assemblage. C'est le rÃ´le de cette recette, Ã 
dÃ©rouler par l'agent principal avec Tyler une fois les six tÃ¢ches fusionnÃ©es et l'app dÃ©ployÃ©e
derriÃ¨re son adresse publique en HTTPS.

1. Ouvrir l'adresse sur l'iPhone de Tyler â†’ Â« Qui es-tu ? Â» avec Â« Personne n'est encore inscrit Â».
2. `/admin` : mauvais mot de passe refusÃ©, bon mot de passe acceptÃ© ; ajouter trois membres de test
   (dont un avec un accent, Â« Ã‰mile Â», et vÃ©rifier qu'il se classe entre Â« Anne Â» et Â« ZoÃ© Â»).
3. Choisir un nom â†’ Â« Tu es bien â€¦ ? Â» â†’ Â« Oui, c'est moi Â» â†’ accueil et banniÃ¨re de bienvenue.
   Fermer Safari, rouvrir â†’ toujours le bon nom, sans rien refaire. Aucun Ã©cran ne propose de
   changer de nom ; taper `/who` Ã  la main le permet.
4. Ajouter un souhait avec le lien `amazon.ca/â€¦` tapÃ© sans `https://` â†’ bouton Â« Voir sur
   amazon.ca Â» qui ouvre bien le produit.
5. Depuis un deuxiÃ¨me appareil, sous un autre nom : voir ce souhait, puis ajouter une idÃ©e secrÃ¨te
   pour le premier membre.
6. Sur le premier appareil : l'idÃ©e n'apparaÃ®t **nulle part** (vÃ©rifier aussi le code source de la
   page), et ouvrir Ã  la main `/items/{id de l'idÃ©e}/edit` rÃ©pond Â« Page introuvable Â».
7. Mode aide : ajouter un souhait sur la liste d'un autre membre ; ce membre le voit comme le sien
   et peut le modifier.
8. Retirer un membre de test â†’ son appareil revient sur Â« Qui es-tu ? Â».
9. Sur le plus vieil iPhone de la famille : tout s'affiche et tout marche.
10. Zoom Ã  deux doigts permis ; affichage correct Ã  320 px de large ; *RÃ©glages â€º LuminositÃ© et
    affichage â€º Taille du texte* au maximum : le texte grossit et tout reste utilisable ; lecture
    d'une page avec VoiceOver.
11. En-tÃªtes d'une rÃ©ponse : `X-Robots-Tag`, CSP, aucune erreur CSP dans la console du navigateur.
12. Portainer : *Re-pull image* puis *Redeploy* â†’ listes intactes, tout le monde reste identifiÃ©.
13. Le lendemain : la copie de `app.db` figure dans la sauvegarde hors site.
14. Retirer les membres de test, ajouter les vrais membres, puis envoyer le lien Ã  la famille par
    texto (message proposÃ© dans le `README.md`).

## 14. DÃ©ploiement â€” hors code

Fait par l'agent principal avec Tyler, aprÃ¨s la fusion de T6, selon la procÃ©dure habituelle de Tyler
pour ses apps. Les adresses et les chemins rÃ©els sont dans la mÃ©moire du projet, pas dans ce dÃ©pÃ´t
public. Rien de tout Ã§a n'est Ã©crit par une tÃ¢che.

1. Dataset dÃ©diÃ© sur le TrueNAS, montÃ© sur `/data`.
2. Sa tÃ¢che de sauvegarde hors site, comme pour chaque app.
3. Stack Portainer `app-cadeaux` collÃ©e depuis `docker-compose.yml`, sur un port hÃ´te libre.
4. Paquet GHCR `app-cadeaux` rendu public (sinon Portainer ne peut pas le tirer).
5. Route du tunnel Cloudflare vers ce port.
6. Mise Ã  jour de la documentation du serveur.

## 15. Avancement

| TÃ¢che | Ã‰tat | Commit de fusion |
|---|---|---|
| T1 | fusionnÃ©e | `5265d80` |
| T2 | en cours | â€” |
| T3 | fusionnÃ©e | `c69ed69` |
| T4 | fusionnÃ©e | `126eb3c` |
| T5 | fusionnÃ©e | `cce77a4` |
| T6 | vÃ©rifiÃ©e (critÃ¨res Docker OK) ; fusion aprÃ¨s T2 | â€” |
| DÃ©ploiement | Ã  faire | â€” |
| Recette | Ã  faire | â€” |
