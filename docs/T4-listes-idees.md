# T4 — Listes, souhaits et idées secrètes

**Modèle : Claude Opus 5.5 · Effort : xhigh · Dépendances : T1**

> **Lis `docs/PLAN-GENERAL.md` en entier avant de commencer**, et relis le §7 (le secret) deux fois.
> T1 doit être fusionnée. Tu travailles en même temps que T2, T3 et T5 : tu construis tes pages avec
> les composants de `views/ui.ts` tels que T1 les a laissés (bruts) ; T2 les rend beaux de son côté,
> sans changer leurs signatures.

## Mission

Tu écris le cœur de l'app : voir une liste, y ajouter un souhait, le modifier, le supprimer, et
glisser des idées secrètes sur la liste des autres. Deux exigences dominent tout le reste :

1. **Le secret ne fuit jamais.** Une idée pour X n'atteint jamais le navigateur de X, sous aucune
   forme, même en mode aide, même en forgeant une adresse à la main.
2. **Personne ne se perd.** Chaque formulaire est évident, chaque erreur se corrige sans rien
   perdre, chaque action se termine par un retour visible sur la liste.

Le mode aide de Tyler (modifier la liste de quelqu'un d'autre) passe par **tes** pages : il n'y a
pas de pages séparées, seulement les règles de `rules.ts`, qui tiennent déjà compte de
`viewer.isAdmin`.

## Fichiers que tu possèdes

```
src/routes/lists.ts     ← T1 y a laissé `export const listsRouter = Router();`
src/views/lists.ts
```

## Fichiers auxquels tu ne touches jamais

Tout le reste. En particulier `src/index.ts`, `rules.ts` et `data.ts` (T1 ; si une règle ou une
requête te semble fausse ou manquante, arrête-toi et signale-le à l'agent principal), `views/layout.ts`
et `views/ui.ts` (T2).

## Travail détaillé

`routes/lists.ts` lit la requête, vérifie les droits **avec `rules.ts` uniquement**, valide, appelle
`data.ts`, puis envoie. `views/lists.ts` exporte une fonction par écran, construite avec `page()` et
les composants de `ui.ts` uniquement (règle de l'interface, §4 du plan).

Dans tout ce qui suit : « introuvable » = `notFound(res)`. Un identifiant invalide, un membre ou un
élément inexistant, un `kind` inconnu et **toute action non permise** sont introuvables. Jamais de
403.

### 1. Validation (§9.2 du plan)

Une seule fonction interne `validateItem(body)` qui lit `title`, `details` et `url` avec `formText`
et renvoie soit un `ItemInput` propre, soit des messages d'erreur par champ **et** les valeurs telles
que tapées (pour réafficher le formulaire). Règles et messages exacts : §9.2. Pour le lien, dans
l'ordre :

1. Vide → `null`.
2. Ne commence pas par `http://` ni `https://` (sans tenir compte des majuscules) → préfixer
   `https://`.
3. `new URL()` qui lève une erreur, protocole autre que `http:`/`https:`, nom d'hôte sans point, ou
   plus de 2000 caractères → erreur.
4. Sinon → `url.href`.

Cas à vérifier : `amazon.ca/dp/B0123` → `https://amazon.ca/dp/B0123` ; `HTTPS://Exemple.com/a` →
accepté ; `www.canadiantire.ca/fr/p/123` → accepté ; `javascript:alert(1)` → refusé ;
`bonjour` → refusé ; `ftp://exemple.com` → refusé.

### 2. `GET /list/:id`

- Membre introuvable → introuvable.
- `isMine` = `viewer.member?.id === id`.
- Titre : « Ma liste » si `isMine`, sinon « La liste de {Nom} ».
- `notice` : `doneNotice(req.query.done)`, suivi, si `!isMine` et `canEditWishesOf(viewer, id)`
  (donc mode aide), de `notice('Mode aide : tu peux modifier la liste de {Nom}.', 'help')`.
- Bouton Retour : par défaut.

**Partie souhaits** (`listWishes`) :

- Si `isMine` : `<p>Écris ce qui te ferait plaisir. Toute la famille peut voir ta liste.</p>` puis
  `primaryLink('/list/{id}/new?kind=wish', '+ Ajouter un souhait')`.
- Sinon, si `canEditWishesOf` (mode aide) : `primaryLink('/list/{id}/new?kind=wish', '+ Ajouter un souhait pour {Nom}')`.
- Chaque souhait : `itemCard(item, { showAuthor: false, actions })`, où `actions` vaut
  `actionRow([secondaryLink('/items/{id}/edit', 'Modifier'), secondaryLink('/items/{id}/delete', 'Supprimer')])`
  si `canEditItem`, sinon `null`.
- Aucun souhait :
  - `isMine` : `emptyState('Ta liste est vide pour l'instant. Appuie sur « Ajouter un souhait » pour commencer.')`
  - sinon : `emptyState('{Nom} n'a encore rien écrit.')`

**Partie idées secrètes** — **uniquement si `canSeeIdeasOf(viewer, id)`**. Sinon, rien du tout :
pas de section, pas de titre, pas de message, et `listIdeas` n'est **pas appelée**.

- `section('🤫 Idées secrètes pour {Nom}', '{Nom} ne voit jamais cette partie. Écris-y tes idées de cadeaux : toute la famille les verra, sauf {Nom}.', …)` contenant :
  - `secondaryLink('/list/{id}/new?kind=idea', '+ Ajouter une idée secrète')` ;
  - chaque idée : `itemCard(item, { showAuthor: true, actions })`, avec Modifier/Supprimer si
    `canEditItem` ;
  - aucune idée : `emptyState('Aucune idée secrète pour l'instant.')`.

### 3. `GET /list/:id/new?kind=wish|idea`

- Membre introuvable, `kind` ni `wish` ni `idea` → introuvable.
- `kind=wish` exige `canEditWishesOf(viewer, id)` ; `kind=idea` exige `canAddIdeaFor(viewer, id)`.
  Sinon → introuvable.
- Titre :
  - souhait, `isMine` : « Ajouter un souhait » ;
  - souhait, mode aide : « Ajouter un souhait pour {Nom} » ;
  - idée : « Une idée secrète pour {Nom} ».
- Bouton Retour : `{ href: '/list/{id}', label: 'Retour à la liste' }`.
- Corps : pour une idée seulement, `<p>{Nom} ne verra pas cette idée.</p>` d'abord ; puis le
  formulaire du §6.

### 4. `POST /list/:id/items?kind=wish|idea`

- Mêmes vérifications que le §3 (membre, `kind`, droits), refaites ici : on ne fait jamais confiance
  au fait que le formulaire venait de la bonne page.
- `validateItem` ; erreurs → on renvoie le **même écran que le §3**, avec les valeurs tapées et les
  messages, statut 400.
- **Anti-doublon** : si l'élément le plus récent de ce membre et de ce `kind` (premier de
  `listWishes` ou `listIdeas`) a le **même titre**, le **même auteur** et a été créé il y a moins de
  10 secondes, on ne crée rien et on redirige vers lui comme s'il venait d'être créé.
- Sinon `createItem(id, kind, input, viewer.member?.id ?? null)`.
- `redirect(res, '/list/{id}?done=added#item-{nouvelId}')`.

### 5. `GET /items/:id/edit` et `POST /items/:id`

- `getItem` ; introuvable, ou `!canViewItem`, ou `!canEditItem` → introuvable (dans cet ordre, pour
  qu'une idée cachée ne se distingue jamais d'un élément inexistant).
- Titre : « Modifier ce souhait » ou « Modifier cette idée » ; bouton Retour
  `{ href: '/list/{memberId}', label: 'Retour à la liste' }`.
- Formulaire du §6 prérempli, envoi « Enregistrer », annulation vers
  `/list/{memberId}#item-{id}`.
- `POST` : mêmes vérifications, `validateItem` (erreurs → même écran, statut 400), `updateItem`, puis
  `redirect(res, '/list/{memberId}?done=updated#item-{id}')`.

### 6. Le formulaire d'un élément

Un seul formulaire, partagé par l'ajout et la modification :

```
form({
  action,                       // '/list/{id}/items?kind=…' ou '/items/{id}'
  submitLabel,                  // 'Ajouter' ou 'Enregistrer'
  cancelHref,                   // la liste (avec l'ancre en modification)
  fields: html`
    ${textField({ name: 'title', label: "C'est quoi ?",
      hint: 'Par exemple : un foulard bleu, un livre de recettes…',
      maxLength: 150, autocomplete: 'off', … })}
    ${textArea({ name: 'details', label: 'Des précisions ?',
      hint: 'Pas obligatoire. La taille, la couleur, le magasin…',
      maxLength: 1000, … })}
    ${textField({ name: 'url', label: 'Un lien Internet ?',
      hint: "Pas obligatoire. Colle ici l'adresse de la page du produit.",
      maxLength: 2000, inputMode: 'url', autocomplete: 'off', … })}
  `,
})
```

Pas d'attribut `required` : le message du serveur est plus clair que la bulle du navigateur.

### 7. `GET /items/:id/delete` et `POST /items/:id/delete`

- Mêmes vérifications que le §5.
- Titre : « Supprimer ce souhait ? » ou « Supprimer cette idée ? » ; bouton Retour
  `{ href: '/list/{memberId}', label: 'Retour à la liste' }`.
- Corps : `confirmPanel({ text: '« {titre} » sera effacé pour de bon.', action: '/items/{id}/delete', confirmLabel: 'Oui, supprimer', cancelHref: '/list/{memberId}#item-{id}', cancelLabel: 'Non, garder' })`.
- `POST` : mêmes vérifications, `deleteItem`, puis `redirect(res, '/list/{memberId}?done=deleted')`.

## Critères d'acceptation

Prépare avec un script jetable trois membres X, Y, Z, des souhaits pour chacun, et des idées : une de
Y pour X, une de Z pour X, une de X pour Y. Vérifie avec `curl` (cookies à la main) **et** dans un
navigateur.

**Le secret** — rapporte chaque point :

1. En tant que X : le HTML de `/list/{X}` ne contient **ni** le titre des idées pour X, **ni**
   « Idées secrètes », **ni** « idée » ; même chose avec en plus un cookie `admin` valide.
2. En tant que X : `GET` et `POST` sur `/items/{idée pour X}/edit`, `/items/{idée pour X}` et
   `/items/{idée pour X}/delete` → 404, et l'idée existe toujours en base.
3. En tant que X : `GET /list/{X}/new?kind=idea` et `POST /list/{X}/items?kind=idea` → 404, rien
   n'est créé.
4. Mode aide **sans** identité : `/list/{X}` n'a pas de partie idées ; les souhaits ont leurs boutons
   Modifier/Supprimer.
5. En tant que Y : `/list/{X}` montre les deux idées pour X avec « Proposée par … » ; Modifier et
   Supprimer seulement sur l'idée de Y ; forcer `/items/{idée de Z}/edit` → 404 ; avec en plus le
   mode aide, les deux sont modifiables.

**Les droits sur les souhaits**

6. En tant que Y : aucun bouton sur les souhaits de X ; forcer `/items/{souhait de X}/edit`, le
   `POST` et la suppression → 404.
7. Mode aide avec identité Y : bannière jaune sur `/list/{X}`, bouton « + Ajouter un souhait pour X »,
   le souhait créé apparaît chez X **comme un souhait** (X le voit et peut le modifier).

**Formulaires**

8. Titre vide → « Écris au moins ce que c'est. », les précisions et le lien tapés sont conservés.
   Titre de 151 caractères envoyé à la main (sans `maxlength`) → message de longueur.
9. Les six cas de lien du §1 donnent le résultat attendu ; le bouton affiche « Voir sur amazon.ca »
   pour `https://www.amazon.ca/…`.
10. Titre `<script>alert(1)</script>` → affiché comme du texte, rien ne s'exécute.
11. Deux `POST` identiques à moins de 10 secondes → un seul élément ; le même titre 11 secondes plus
    tard → deux éléments.
12. Après un ajout, l'adresse finit par `?done=added#item-{id}` et la bannière « C'est ajouté ✓ »
    s'affiche ; même chose pour la modification et la suppression.
13. `npm run build` passe ; aucune classe, aucun attribut `style` dans `views/lists.ts` ; aucun appel
    à `listIdeas` qui ne soit pas précédé d'un `canSeeIdeasOf` vrai.

## Ce que tu ne fais pas

Pas de réservation, pas de « déjà acheté », pas de tri ni de priorité, pas de prix, pas de photo,
pas d'aperçu automatique des liens (aucun appel réseau vers les sites de produits), pas de
commentaires, pas de CSS, pas de nouveau composant, pas de page de mode aide séparée.

## Fin de tâche

Committe uniquement tes deux fichiers, message en français préfixé `T4 : `. **Pas de push.**
Rapporte le résultat de chaque critère, en commençant par les cinq points du secret.
