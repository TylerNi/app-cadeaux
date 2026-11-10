# T5 — Mode aide

**Modèle : Claude Sonnet 5.5 · Effort : medium · Dépendances : T1**

> **Lis `docs/PLAN-GENERAL.md` en entier avant de commencer.** T1 doit être fusionnée. Tu travailles
> en même temps que T2, T3 et T4 : tu construis tes pages avec les composants de `views/ui.ts` tels
> que T1 les a laissés (bruts) ; T2 les rend beaux de son côté, sans changer leurs signatures.

## Mission

Tu écris l'espace de Tyler : entrer en mode aide avec un mot de passe, ajouter, renommer et retirer
les membres de la famille, et ouvrir la liste de n'importe qui pour la remplir à sa place (par
exemple au téléphone avec grand-maman).

La modification des listes elle-même n'est **pas** à toi : les pages de T4 la permettent déjà quand
`viewer.isAdmin` est vrai (règles de `rules.ts`). Toi, tu fournis l'entrée en mode aide et la gestion
des membres, et tu mènes vers ces listes.

Tyler est à l'aise avec la technologie, mais les écrans restent dans le même style que le reste de
l'app : mêmes composants, mêmes mots simples.

## Fichiers que tu possèdes

```
src/routes/admin.ts     ← T1 y a laissé `export const adminRouter = Router();`
src/views/admin.ts
```

## Fichiers auxquels tu ne touches jamais

Tout le reste. En particulier `src/index.ts`, `data.ts`, `rules.ts`, `viewer.ts` (T1),
`views/layout.ts` et `views/ui.ts` (T2), et les pages de listes (T4).

## Travail détaillé

`routes/admin.ts` lit la requête, vérifie, valide, appelle `data.ts`, puis envoie. `views/admin.ts`
exporte une fonction par écran, construite avec `page()` et les composants de `ui.ts` uniquement
(règle de l'interface, §4 du plan).

**Toute route sauf `GET /admin` et `POST /admin/login` exige `viewer.isAdmin` ; sinon →
`notFound`.** Une route qui reçoit un identifiant de membre invalide ou inexistant → `notFound`.

### 1. `GET /admin` sans mode aide — le mot de passe

- Titre : « Mode aide ». Bouton Retour par défaut.
- Corps : `form({ action: '/admin/login', submitLabel: 'Entrer', cancelHref: null, fields: textField({ name: 'password', label: 'Mot de passe', hint: null, value: '', error, maxLength: 200, type: 'password', autocomplete: 'current-password' }) })`.

### 2. `POST /admin/login`

- Compare `formText(body, 'password')` à `ADMIN_PASSWORD` **en temps constant** : empreintes
  SHA-256 des deux valeurs (`node:crypto`), puis `timingSafeEqual` (les deux empreintes ont la même
  longueur, ce qui évite l'exception de `timingSafeEqual` sur des longueurs différentes).
- Bon → `setAdmin(res)` puis `redirect(res, '/admin')`.
- Mauvais → l'écran du §1 avec l'erreur « Mauvais mot de passe. », statut 401. Le champ revient
  vide.

### 3. `GET /admin` en mode aide — le tableau

- Titre : « Mode aide ». Bouton Retour par défaut. `notice: doneNotice(req.query.done)`.
- Corps, dans cet ordre :
  1. `section('Ajouter un membre', null, form({ action: '/admin/members', submitLabel: 'Ajouter', cancelHref: null, fields: textField({ name: 'name', label: 'Prénom', hint: 'Comme la famille l'appelle, par exemple « Grand-maman ».', maxLength: 40, autocomplete: 'off', … }) }))`.
  2. `section('Les membres ({n})', 'Pour remplir la liste de quelqu'un à sa place, appuie sur « Voir sa liste ».', …)` contenant, pour chaque membre de `listMembers()` :
     `card({ title: nom, text: légende, actions: actionRow([secondaryLink('/list/{id}', 'Voir sa liste'), secondaryLink('/admin/members/{id}/edit', 'Renommer'), secondaryLink('/admin/members/{id}/delete', 'Retirer')]) })`,
     avec la légende de T3 (`countWishesByMember` : « Pas encore de liste », « 1 souhait »,
     « {n} souhaits »). Aucun membre : `emptyState("Aucun membre pour l'instant. Ajoute le premier ci-dessus.")`.
  3. `postButton('/admin/logout', 'Quitter le mode aide', 'secondary')`.
- **Secret** : ne compte et n'affiche **aucune idée**, pour personne. Tyler est un membre comme les
  autres.

### 4. `POST /admin/members`

- Validation du prénom (§9.2) : `formText`, espaces multiples ramenés à un seul, requis, 40
  caractères au maximum, `isNameTaken` faux.
- Erreur → l'écran du §3, avec le prénom tapé et le message sous le champ, statut 400.
- Sinon `createMember(nom)` puis `redirect(res, '/admin?done=member-added')`.

### 5. `GET /admin/members/:id/edit` et `POST /admin/members/:id` — renommer

- Titre : « Renommer {Nom} » ; bouton Retour `{ href: '/admin', label: 'Retour au mode aide' }`.
- Corps : `form({ action: '/admin/members/{id}', submitLabel: 'Enregistrer', cancelHref: '/admin', fields: textField({ name: 'name', label: 'Nouveau prénom', hint: null, value: nomActuel, maxLength: 40, autocomplete: 'off', … }) })`.
- `POST` : même validation qu'au §4, avec `isNameTaken(nom, id)` (le membre peut garder son propre
  prénom, ou seulement en changer les majuscules). Erreur → même écran, statut 400. Sinon
  `renameMember` puis `redirect(res, '/admin?done=member-renamed')`.

### 6. `GET /admin/members/:id/delete` et `POST /admin/members/:id/delete` — retirer

- Titre : « Retirer {Nom} ? » ; bouton Retour `{ href: '/admin', label: 'Retour au mode aide' }`.
- Corps : `confirmPanel({ text: 'Sa liste et les idées secrètes pour {Nom} seront effacées pour de bon. Les idées que {Nom} a écrites pour les autres resteront.', action: '/admin/members/{id}/delete', confirmLabel: 'Oui, retirer', cancelHref: '/admin', cancelLabel: 'Non, garder' })`.
- `POST` : `deleteMember(id)` puis `redirect(res, '/admin?done=member-removed')`. Si Tyler retire le
  membre qu'il incarne, le middleware de T1 efface son cookie à la requête suivante : rien à faire de
  plus.

### 7. `POST /admin/logout`

`clearAdmin(res)` puis `redirect(res, '/')`.

## Critères d'acceptation

1. `GET /admin` sans cookie : écran du mot de passe. Mauvais mot de passe → 401 et le message ;
   bon → `Set-Cookie: admin=s%3A…` signé, `HttpOnly`, `SameSite=Lax`, 400 jours (et `Secure` avec
   `NODE_ENV=production`), puis le tableau.
2. Sans mode aide, `POST /admin/members`, `GET /admin/members/1/edit`, `POST /admin/members/1`,
   `GET` et `POST /admin/members/1/delete`, `POST /admin/logout` → 404, rien n'est modifié.
3. Un cookie `admin` falsifié (`admin=1` non signé, ou signature modifiée) → traité comme sans mode
   aide.
4. Ajouter « Anne », puis « anne » → « Ce prénom existe déjà… » ; « Anne   Marie » est enregistré
   « Anne Marie » ; un prénom vide ou de 41 caractères → le bon message, le texte tapé conservé.
5. Renommer « Anne » en « ANNE » est accepté ; renommer « Anne » en « Zoé » quand Zoé existe est
   refusé.
6. Retirer un membre qui a des souhaits et des idées pour lui → le tout disparaît ; les idées qu'il
   avait écrites restent chez les autres, sans « Proposée par ».
7. Le tableau n'affiche aucun nombre d'idées ; la liste des membres suit l'ordre de `listMembers`.
8. « Voir sa liste » mène à `/list/{id}` (les boutons de modification y apparaissent dès que T4 est
   fusionnée — si elle ne l'est pas encore, dis-le).
9. « Quitter le mode aide » efface le cookie et ramène à l'accueil ; `/admin` redemande le mot de
   passe.
10. `npm run build` passe ; aucune classe, aucun attribut `style` dans `views/admin.ts`.

## Ce que tu ne fais pas

Pas d'autres comptes administrateurs, pas de changement de mot de passe depuis l'app, pas de limite
de tentatives, pas de journal d'audit, pas d'export, pas d'ordre personnalisé des membres, pas de
lien vers `/admin` ailleurs que dans tes pages (T3 s'occupe du lien de l'accueil), pas de CSS, pas
de nouveau composant.

## Fin de tâche

Committe uniquement tes deux fichiers, message en français préfixé `T5 : `. **Pas de push.**
Rapporte le résultat de chaque critère à l'agent principal.
