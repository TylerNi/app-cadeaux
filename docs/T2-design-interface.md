# T2 — Design et composants d'interface

**Modèle : Claude Opus 5.5 · Effort : xhigh · Dépendances : T1**

> **Lis `docs/PLAN-GENERAL.md` en entier avant de commencer**, en particulier les §1 (le critère
> n° 1), §6.7 (tes signatures) et §8 (ergonomie). T1 doit être fusionnée : tu pars de sa version
> brute de `views/layout.ts` et `views/ui.ts`. T3, T4 et T5 travaillent **en même temps que toi** avec
> ces mêmes signatures : tu ne peux en changer aucune.

## Mission

Tu fais de cette app quelque chose que grand-maman utilise sans aide. Tu possèdes toute
l'apparence : la mise en page, chaque composant partagé, la feuille de style, les icônes. Les autres
tâches ne font qu'assembler tes composants : si un bouton est trop petit ou un texte trop pâle,
c'est sur tous les écrans à la fois.

Le public : une dizaine de personnes de tous âges, la plupart très peu à l'aise avec la technologie,
**presque toutes sur iPhone** (Safari), parfois ancien, souvent avec une taille de texte grossie dans
les réglages. Pense « gros, clair, évident, calme » plutôt
que « joli et moderne ». Une touche chaleureuse de fête est bienvenue, jamais au détriment de la
lisibilité.

## Fichiers que tu possèdes

```
src/views/layout.ts             ← tu remplaces la version brute de T1
src/views/ui.ts                 ← idem
public/styles.css
public/manifest.webmanifest
public/icons/icon-32.png
public/icons/icon-180.png
public/icons/icon-192.png
public/icons/icon-512.png
public/favicon.ico
```

## Fichiers auxquels tu ne touches jamais

Tout le reste de `src/` (y compris `html.ts`, `types.ts`, les routes et les vues des autres tâches),
`docs/`, la racine du dépôt.

## Travail détaillé

### 1. Contraintes techniques non négociables

- **Signatures du §6.7 inchangées**, au caractère près. Tu peux ajouter des fonctions internes non
  exportées, rien d'autre.
- Tout passe par `` html`…` `` de `src/html.ts` : aucune concaténation de chaînes HTML à la main.
- **Aucun JavaScript, aucun attribut `style`, aucune balise `<style>`** : la CSP du §6.5 les bloque.
  Tout le style vit dans `public/styles.css`.
- **Compatibilité Safari iOS 12 / Chrome Android 7** (§8.11). Interdits dans le CSS : `gap` sur un
  conteneur flex, `dvh`/`svh`/`lvh`, `:has()`, `:is()`, `:where()`, `aspect-ratio`, `clamp()`,
  `min()`/`max()`, `inset`, la syntaxe de couleur `rgb(r g b / a)`, les couleurs `#rrggbbaa`.
  Permis : grid (avec `grid-gap` **et** `gap` pour les vieux Safari), flexbox avec des marges,
  variables CSS, `env(safe-area-inset-*)`.
- Police système uniquement : `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
  Arial, sans-serif`. Aucune police web (la CSP les bloque de toute façon).

### 2. Direction visuelle

- **Thème clair**, fond légèrement chaud (crème ou blanc cassé), texte presque noir.
- Une couleur principale pour les boutons d'action (un vert sapin profond ou un rouge profond, à
  toi de choisir) et une couleur `danger` **nettement différente** pour supprimer et retirer : on
  ne doit jamais confondre « Ajouter » et « Supprimer ».
- Huit couleurs de membres (`c0` à `c7`), bien distinctes les unes des autres, chacune avec une
  initiale blanche lisible dessus (contraste ≥ 4,5:1).
- Couleurs des bannières : `success` vert pâle et texte vert foncé ; `info` neutre ; `help` jaune
  pâle et texte foncé (le mode aide doit sauter aux yeux).
- Pas d'ombres lourdes, pas de dégradés, pas d'animations (une transition de couleur au toucher
  est la limite).

Mets toutes les couleurs en variables CSS en tête du fichier. **Calcule le contraste de chaque paire
texte/fond** et liste-les dans ton rapport final : texte courant ≥ 7:1, tout le reste ≥ 4,5:1.

### 3. Règles de mise en forme

Le §8 du plan s'applique en entier. En pratique :

- Taille du texte qui suit le réglage de l'iPhone (§8.13) : sur `html`, `font-size: 17px` (valeur
  des autres navigateurs), puis, dans `@supports (-webkit-touch-callout: none) { … }` (propriété
  qui n'existe que sur iOS), `font: -apple-system-body` (taille choisie dans iOS, 17 px par défaut).
  Sans ce `@supports`, Safari sur Mac appliquerait sa propre valeur de 13 px ; sur `body`, la police système du §1 et `font-size: 1.1765rem` (20 px à la
  taille par défaut) ; **toutes** les autres tailles, marges, hauteurs de boutons et largeurs de
  tuiles en `rem`, pour qu'elles grandissent avec le texte. Les champs de saisie ne descendent
  jamais sous 16 px, même à la plus petite taille d'iOS (sinon Safari zoome à la saisie).
- `body` : `line-height: 1.5`, `-webkit-text-size-adjust: 100%`, marges internes qui respectent
  `env(safe-area-inset-left/right/bottom)`.
- Conteneur central : une colonne, `max-width: 640px`, centré, marge latérale de 16 px. Parfait à
  320 px de large.
- `<h1>` autour de 30 px, `<h2>` autour de 24 px, gras, bien espacés.
- **Boutons et liens-boutons** : hauteur minimale 56 px, pleine largeur, coins arrondis, texte de
  20 px en gras, centré. Un bouton empilé sous un autre a 12 px d'écart. État appuyé visible
  (`:active`). Contour de focus bien visible (`:focus`) pour le clavier et VoiceOver.
- Liens de texte : toujours soulignés.
- Champs : libellé en gras au-dessus, champ de 20 px de texte et d'au moins 56 px de haut, bordure
  de 2 px bien visible, aide en dessous en plus petit (au moins 17 px), erreur en rouge foncé
  précédée de « ⚠ » avec la bordure du champ en rouge.
- Les balises simples que T3, T4 et T5 utilisent sans classe (`<p>`, `<strong>`, `<ul>`, `<li>`)
  doivent être belles telles quelles, à l'intérieur de `page()`.
- `:target` : l'élément visé par l'ancre (`#item-12`) est mis en évidence (bordure épaisse de la
  couleur principale et fond teinté) : la personne voit tout de suite ce qu'elle vient d'ajouter.

### 4. `src/views/layout.ts`

- Constante du nom de l'app : `Cadeaux de la famille` (§9.1).
- `<head>` : `<!doctype html>`, `<html lang="fr">`, `<meta charset="utf-8">`, la balise viewport du
  §8.4 **exactement**, `<title>{titre} · Cadeaux de la famille</title>`,
  `<link rel="stylesheet" href="/styles.css">`, `<link rel="icon" href="/icons/icon-32.png"
  type="image/png">`, `<link rel="apple-touch-icon" href="/icons/icon-180.png">`,
  `<link rel="manifest" href="/manifest.webmanifest">`, `<meta name="theme-color" content="…">`
  accordé à l'en-tête, `<meta name="apple-mobile-web-app-title" content="Cadeaux">` et
  `<meta name="format-detection" content="telephone=no">` (§8.13).
- `<body>` : en-tête « 🎁 Cadeaux de la famille » (lien vers `/`), puis `<main>` avec le bouton
  Retour (« ← {libellé} », style `secondaryLink`, en haut), le `<h1>`, la bannière, le corps ; puis
  le pied de page du §9.4 quand un membre est choisi.
- `notFoundPage` et `errorPage` : textes du §9.4, avec un `primaryLink('/', "Retour à l'accueil")`
  et sans bouton Retour en haut (il ferait doublon).

### 5. `src/views/ui.ts`

Chaque composant du tableau du §6.7, avec ces précisions :

- `itemCard` : titre en 22 px gras ; `details` avec `white-space: pre-line` ; le bouton « Voir sur
  {domaine} » est un `secondaryLink` avec `target="_blank"` et `rel="noopener noreferrer"`, où
  `{domaine}` est le nom d'hôte de `new URL(item.url)` sans le préfixe `www.` ; « Proposée par
  {authorName} » en petit sous le contenu ; `actions` en bas de la carte.
- `memberTile` : toute la tuile est le lien ; pastille ronde de 56 px environ, initiale en
  majuscule (premier caractère du prénom) ; prénom en 20 px gras, qui passe à la ligne s'il est
  long (jamais tronqué) ; légende en dessous, plus petite mais contrastée.
- `memberGrid` : deux colonnes sur téléphone, trois à partir d'environ 560 px, tuiles de même
  hauteur ; une seule colonne quand le texte est très grossi (largeur minimale de tuile en `rem`,
  par exemple `repeat(auto-fill, minmax(8.5rem, 1fr))`).
- `actionRow` : grid à parts égales, pas flexbox avec `gap`.
- `form` : le bouton d'envoi est un gros bouton principal ; « Annuler » est un `secondaryLink` sous
  lui.
- `textField` avec `inputMode: 'url'` : ajoute aussi `autocapitalize="off"`, `autocorrect="off"` et
  `spellcheck="false"`. Avec `type: 'password'` : pareil.
- `confirmPanel` : le texte en gros, puis le bouton `danger` (formulaire `POST`), puis le bouton
  « garder » en principal ou secondaire, à ton jugement, tant qu'on ne confond pas les deux.
- `postButton` : le formulaire ne doit ajouter aucune marge parasite autour du bouton.
- Couleur d'un membre : classe `c{id % 8}`, calculée dans une fonction interne.

### 6. Icônes et manifest

- `public/icons/` : une icône simple et lisible (un cadeau stylisé ou un « C » blanc sur la couleur
  principale), en 32, 180, 192 et 512 px, plus `public/favicon.ico` (32 px). ImageMagick n'est pas
  installé sur le PC de Tyler : produis les PNG avec un script jetable (par exemple `System.Drawing`
  depuis Windows PowerShell), jamais commité. Signale à Tyler qu'il pourra remplacer ces fichiers
  sans toucher au code.
- `public/manifest.webmanifest` : `name` « Cadeaux de la famille », `short_name` « Cadeaux »,
  `lang` `fr`, `start_url` et `scope` `/`, `display` `standalone`, `background_color` et
  `theme_color` accordés au thème, icônes 192 et 512.

### 7. Page de galerie jetable

Pour vérifier ton travail sans attendre T3, T4 et T5 : écris un script jetable (hors du dépôt, ou
supprimé à la fin) qui importe `layout.ts` et `ui.ts` et génère `public/_galerie.html` avec **chaque
composant dans chacun de ses états** : boutons des trois variantes, tuiles avec prénoms courts et
très longs, carte avec et sans précisions, lien, auteur et actions, carte ciblée par `:target`,
section, trois bannières, état vide, formulaire avec et sans erreurs, panneau de confirmation, page
complète avec et sans bouton Retour et pied de page. Ouvre-la avec le serveur de développement de T1
et vérifie-la à 320 px, 375 px, 390 px et 1024 px de large, puis avec une taille de texte doublée
(forcer temporairement `html { font-size: 34px }` dans ta copie de travail, pour simuler la plus
grande taille de texte d'iOS, sans le committer). **Ne committe jamais `_galerie.html`.**

## Critères d'acceptation

1. Les signatures exportées par `layout.ts` et `ui.ts` sont identiques à celles du §6.7 (compare
   ligne à ligne) et `npm run build` passe.
2. Galerie à 320 px : rien ne déborde horizontalement, aucun texte coupé, toutes les cibles
   tactiles font au moins 56 px de haut (boutons) ou 44 px (liens de texte).
3. Galerie à 1024 px : colonne centrée d'environ 640 px, tuiles sur trois colonnes.
4. Zoom du navigateur à 200 %, puis taille de texte doublée (§7) : tout reste lisible et
   utilisable, sans défilement horizontal ; les tuiles passent sur une colonne.
5. Console du navigateur : aucune erreur CSP.
6. `grep` dans `public/styles.css` : aucune des propriétés interdites du §1 ; `grep -ri "<script\|style=" src/views/`
   ne trouve rien.
7. Liste des contrastes calculés dans le rapport : texte courant ≥ 7:1, le reste ≥ 4,5:1, initiales
   des huit couleurs de membres comprises.
8. Les champs de saisie sont en 20 px à la taille par défaut, et jamais sous 16 px (pas de zoom
   automatique d'iOS à la saisie) ; aucune taille en `px` dans le CSS hors des exceptions du §3
   (repli de `html`, bordures).
9. `manifest.webmanifest` est un JSON valide, et les cinq fichiers d'icônes existent aux bonnes
   tailles.
10. Si tu as un moyen de tester un vrai Safari iOS (simulateur ou appareil) : fais-le et dis ce que
    tu as vu ; sinon, dis-le, l'agent principal le fera à la recette.

## Ce que tu ne fais pas

Pas de thème sombre, pas d'animations, pas de police web, pas de framework CSS, pas de JavaScript,
pas de nouveau composant exporté (s'il en manque un à T3, T4 ou T5, l'agent principal tranchera),
aucune modification des pages des autres tâches.

## Fin de tâche

Committe uniquement les fichiers que tu possèdes, message en français préfixé `T2 : `. **Pas de
push.** Rapporte : les contrastes, les captures ou descriptions de la galerie aux trois largeurs, et
que les icônes sont des bouche-trous remplaçables.
