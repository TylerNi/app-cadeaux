# T3 — « Qui es-tu ? » et accueil

**Modèle : Claude Sonnet 5.5 · Effort : medium · Dépendances : T1**

> **Lis `docs/PLAN-GENERAL.md` en entier avant de commencer.** T1 doit être fusionnée. Tu travailles
> en même temps que T2, T4 et T5 : tu construis tes pages avec les composants de `views/ui.ts` tels
> que T1 les a laissés (bruts) ; T2 les rend beaux de son côté, sans changer leurs signatures.

## Mission

Tu écris les deux premiers écrans que verra chaque membre de la famille : choisir qui il est, puis
l'accueil. C'est la première impression : si quelqu'un bloque ici, il ne reviendra pas. Chaque écran
a **un seul** gros choix évident.

## Fichiers que tu possèdes

```
src/routes/home.ts      ← T1 y a laissé `export const homeRouter = Router();`
src/views/home.ts
```

## Fichiers auxquels tu ne touches jamais

Tout le reste. En particulier `src/index.ts` (ton routeur y est déjà monté), `views/layout.ts` et
`views/ui.ts` (T2), et `data.ts` (si une requête te manque, signale-le à l'agent principal).

## Travail détaillé

`routes/home.ts` lit la requête, vérifie, appelle `data.ts`, puis envoie avec `send`/`redirect`/
`notFound`. `views/home.ts` exporte une fonction par écran, qui reçoit des données déjà prêtes et
renvoie un `Html` construit avec `page()` et les composants de `ui.ts` uniquement (règle de
l'interface, §4 du plan).

### 1. `GET /who` — « Qui es-tu ? »

- Titre : « Qui es-tu ? ».
- Bouton Retour : aucun (`back: null`) si le visiteur n'a pas de membre ; sinon le bouton par
  défaut (c'est Tyler qui corrige un appareil en tapant `/who` à la main : aucun écran n'y mène
  une fois le nom choisi, §2 du plan).
- Corps :
  - `<p>Appuie sur ton nom.</p>`
  - `memberGrid` de **tous** les membres (`listMembers`, déjà triés), chaque `memberTile` menant à
    `/who/{id}`, sans légende.
  - Aucun membre : `emptyState("Personne n'est encore inscrit. Demande à Tyler de t'ajouter.")`.

### 2. `GET /who/:id` — « Tu es bien {Nom} ? »

Une étape de confirmation : un doigt qui glisse sur la mauvaise tuile ne doit pas faire de
quelqu'un un autre membre sans qu'il s'en rende compte.

- `parseId` puis `getMember` ; introuvable → `notFound`.
- Titre : « Tu es bien {Nom} ? », bouton Retour `{ href: '/who', label: 'Retour' }`.
- Corps : `postButton('/who/{id}', "Oui, c'est moi", 'primary')`, puis
  `secondaryLink('/who', 'Non, revenir à la liste')`.

### 3. `POST /who/:id`

- `parseId` puis `getMember` ; introuvable → `notFound`.
- `setMember(res, id)` puis `redirect(res, '/?done=welcome')`.

### 4. `GET /` — accueil

- Sans membre (y compris en mode aide sans identité) → `redirect(res, '/who')`.
- Titre : « Bonjour {Nom} ! », `back: null`, `notice: doneNotice(req.query.done)`.
- Corps, dans cet ordre :
  1. `primaryLink('/list/{monId}', '🎁 Ma liste')`.
  2. Sous le bouton, une phrase selon le nombre de souhaits (`countWishesByMember`) :
     - 0 : « Ta liste est vide : ajoute ce qui te ferait plaisir ! »
     - 1 : « Tu as 1 souhait dans ta liste. »
     - n : « Tu as {n} souhaits dans ta liste. »
  3. `section('Les listes de la famille', 'Appuie sur un nom pour voir sa liste.', …)` avec un
     `memberGrid` de **tous les autres membres** (toi exclu), chaque tuile menant à `/list/{id}`,
     légende selon le nombre de souhaits : 0 → « Pas encore de liste », 1 → « 1 souhait »,
     n → « {n} souhaits ».
     Si tu es le seul membre : `emptyState("Personne d'autre n'est encore inscrit.")` à la place de
     la grille.
  4. Seulement si `viewer.isAdmin` : `secondaryLink('/admin', '🔧 Mode aide')` tout en bas. Un
     visiteur qui n'est pas en mode aide ne doit voir **aucune** trace de `/admin`.

**Secret (§7)** : l'accueil ne compte que les souhaits. N'appelle jamais `listIdeas`, n'affiche
jamais un nombre d'idées, même pour les autres membres.

## Critères d'acceptation

Avec le serveur de développement de T1 et quelques membres créés par un script jetable (T5 n'existe
peut-être pas encore) :

1. Sans cookie, `GET /` → `/who`, qui affiche tous les membres dans l'ordre de `listMembers`.
2. Base vide → message « Personne n'est encore inscrit… ».
3. Tuile → « Tu es bien {Nom} ? » → « Oui, c'est moi » → accueil avec la bannière de bienvenue, et
   un `Set-Cookie: member=…` de 400 jours dans la réponse du `POST`.
4. « Non, revenir à la liste » → `/who`, aucun cookie posé.
5. Rouvrir `/` (sans `?done`) → accueil direct, sans bannière et sans repasser par le choix du
   nom.
6. L'accueil ne contient pas le membre courant dans la grille ; les légendes et la phrase sous
   « Ma liste » suivent le nombre de souhaits (0, 1, plusieurs) ; avec seulement des idées
   secrètes pour un membre, sa légende reste « Pas encore de liste ».
7. `GET /who/999999` et `POST /who/abc` → 404.
8. Une fois un nom choisi, aucun lien vers `/who` dans l'accueil ; taper `/who` à la main affiche
   la liste avec un bouton Retour, et choisir un autre nom change bien d'identité.
9. Avec un cookie `admin` valide : le lien « 🔧 Mode aide » apparaît en bas de l'accueil ; sans lui,
   le mot `admin` n'apparaît nulle part dans le HTML de l'accueil.
10. `npm run build` passe ; aucune classe, aucun attribut `style` dans `views/home.ts`.

## Ce que tu ne fais pas

Pas de liste de souhaits (T4), pas de mode aide (T5), pas de CSS, pas de nouveau composant, pas de
photo ni d'avatar, pas de recherche de membre, pas de compte à rebours.

## Fin de tâche

Committe uniquement tes deux fichiers, message en français préfixé `T3 : `. **Pas de push.**
Rapporte le résultat de chaque critère à l'agent principal.
