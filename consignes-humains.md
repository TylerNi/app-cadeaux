# Consignes de Tyler

## Demande initiale (2026-11-10)

> on va travailler sur une nouvelle app site web qu on ba publier sur mon domaine. le but est que l'app soit le plus facile possible a utiliser car la dizaine de personne qui va l utiliser estmajoritairement vraiment tech noob (ils savent pas utiliser email google docs etc). c est une app pour un echangede cadeau entre une famille. donc mon plan est que quand tu ouvre l app pour la premiere fois tu choisisses qui tu es parmi la liste de tous les membres et ensuite tu puisses ajouter modfier ta liste et voir celle des autres. tu es le main agent du projet donc crer toi un .md principale et des sous taches avec chacun leurs .md comme app ffc app finances et app photo. pause moi des question si jamais et hesite pas a y ajouter ta touche

## Réponses aux questions de l'agent principal (2026-11-10)

| Question | Réponse de Tyler |
|---|---|
| Comment fonctionne l'échange ? | **Listes seulement** : chacun voit toutes les listes, qui offre à qui se décide en dehors de l'app. |
| L'app note-t-elle qui compte acheter quoi (réservation) ? | **Non.** |
| Comment la famille entre dans l'app ? | **Aucune protection** : connaître l'adresse suffit. |
| Extras retenus | **Idées secrètes** (ajouter une idée à la liste de quelqu'un d'autre, visible par tous sauf lui) et **mode aide pour Tyler** (gérer les membres, remplir la liste de quelqu'un à sa place). |
| Extras écartés | Photo d'un article, date et budget de l'échange. |

## Précisions (2026-11-10, suite)

> Juste mon compte (tyler peut ajouter pour les autres)
> On fais le tout en public repo sur gh aussi

Compris par l'agent principal comme : un appareil = une personne, sans lien pour changer de nom ;
quelqu'un sans appareil à lui, c'est Tyler qui remplit sa liste en mode aide. Le dépôt GitHub est
public.

## Précisions (2026-11-10, déploiement)

> je veux pas de secret. c une app light on s en fou

Compris par l'agent principal comme : aucun secret à fournir au déploiement, ni `ADMIN_PASSWORD`
ni `SESSION_SECRET`. Le mode aide s'ouvre sans mot de passe, en tapant `/admin` puis « Entrer ».
