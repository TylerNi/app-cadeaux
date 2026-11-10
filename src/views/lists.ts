import { html } from '../html.js';
import type { Html } from '../html.js';
import { canEditItem, canEditWishesOf } from '../rules.js';
import type { Item, ItemKind, Member, Viewer } from '../types.js';
import { page } from './layout.js';
import {
  actionRow,
  confirmPanel,
  doneNotice,
  emptyState,
  form,
  itemCard,
  notice,
  primaryLink,
  secondaryLink,
  section,
  textArea,
  textField,
} from './ui.js';

export interface ItemDraft {
  title: string;
  details: string;
  url: string;
  errors: { title?: string; details?: string; url?: string };
}

function itemWithActions(viewer: Viewer, item: Item, showAuthor: boolean): Html {
  return itemCard(item, {
    showAuthor,
    actions: canEditItem(viewer, item)
      ? actionRow([
          secondaryLink(`/items/${item.id}/edit`, 'Modifier'),
          secondaryLink(`/items/${item.id}/delete`, 'Supprimer'),
        ])
      : null,
  });
}

function itemForm(action: string, submitLabel: string, cancelHref: string, draft: ItemDraft): Html {
  return form({
    action,
    submitLabel,
    cancelHref,
    fields: html`${textField({
      name: 'title',
      label: "C'est quoi ?",
      hint: 'Par exemple : un foulard bleu, un livre de recettes…',
      value: draft.title,
      error: draft.errors.title ?? null,
      maxLength: 150,
      autocomplete: 'off',
    })}
${textArea({
      name: 'details',
      label: 'Des précisions ?',
      hint: 'Pas obligatoire. La taille, la couleur, le magasin…',
      value: draft.details,
      error: draft.errors.details ?? null,
      maxLength: 1000,
    })}
${textField({
      name: 'url',
      label: 'Un lien Internet ?',
      hint: "Pas obligatoire. Colle ici l'adresse de la page du produit.",
      value: draft.url,
      error: draft.errors.url ?? null,
      maxLength: 2000,
      inputMode: 'url',
      autocomplete: 'off',
    })}`,
  });
}

export function listPage(viewer: Viewer, member: Member, wishes: Item[], ideas: Item[] | null, done: unknown): Html {
  const isMine = viewer.member?.id === member.id;
  const canEditWishes = canEditWishesOf(viewer, member.id);
  const doneBanner = doneNotice(done);
  const helpBanner =
    !isMine && canEditWishes ? notice(`Mode aide : tu peux modifier la liste de ${member.name}.`, 'help') : null;
  return page({
    title: isMine ? 'Ma liste' : `La liste de ${member.name}`,
    viewer,
    notice: doneBanner && helpBanner ? html`${doneBanner}${helpBanner}` : (doneBanner ?? helpBanner),
    body: html`${isMine && html`<p>Écris ce qui te ferait plaisir. Toute la famille peut voir ta liste.</p>
${primaryLink(`/list/${member.id}/new?kind=wish`, '+ Ajouter un souhait')}`}
${!isMine && canEditWishes && primaryLink(`/list/${member.id}/new?kind=wish`, `+ Ajouter un souhait pour ${member.name}`)}
${wishes.length > 0
  ? wishes.map((item) => itemWithActions(viewer, item, false))
  : emptyState(
      isMine
        ? "Ta liste est vide pour l'instant. Appuie sur « Ajouter un souhait » pour commencer."
        : `${member.name} n'a encore rien écrit.`,
    )}
${ideas !== null &&
  section(
    `🤫 Idées secrètes pour ${member.name}`,
    `${member.name} ne voit jamais cette partie. Écris-y tes idées de cadeaux : toute la famille les verra, sauf ${member.name}.`,
    html`${secondaryLink(`/list/${member.id}/new?kind=idea`, '+ Ajouter une idée secrète')}
${ideas.length > 0
  ? ideas.map((item) => itemWithActions(viewer, item, true))
  : emptyState("Aucune idée secrète pour l'instant.")}`,
  )}`,
  });
}

export function newItemPage(viewer: Viewer, member: Member, kind: ItemKind, draft: ItemDraft): Html {
  const isMine = viewer.member?.id === member.id;
  return page({
    title:
      kind === 'idea'
        ? `Une idée secrète pour ${member.name}`
        : isMine
          ? 'Ajouter un souhait'
          : `Ajouter un souhait pour ${member.name}`,
    viewer,
    back: { href: `/list/${member.id}`, label: 'Retour à la liste' },
    body: html`${kind === 'idea' && html`<p>${member.name} ne verra pas cette idée.</p>`}
${itemForm(`/list/${member.id}/items?kind=${kind}`, 'Ajouter', `/list/${member.id}`, draft)}`,
  });
}

export function editItemPage(viewer: Viewer, item: Item, draft: ItemDraft): Html {
  return page({
    title: item.kind === 'wish' ? 'Modifier ce souhait' : 'Modifier cette idée',
    viewer,
    back: { href: `/list/${item.memberId}`, label: 'Retour à la liste' },
    body: itemForm(`/items/${item.id}`, 'Enregistrer', `/list/${item.memberId}#item-${item.id}`, draft),
  });
}

export function deleteItemPage(viewer: Viewer, item: Item): Html {
  return page({
    title: item.kind === 'wish' ? 'Supprimer ce souhait ?' : 'Supprimer cette idée ?',
    viewer,
    back: { href: `/list/${item.memberId}`, label: 'Retour à la liste' },
    body: confirmPanel({
      text: `« ${item.title} » sera effacé pour de bon.`,
      action: `/items/${item.id}/delete`,
      confirmLabel: 'Oui, supprimer',
      cancelHref: `/list/${item.memberId}#item-${item.id}`,
      cancelLabel: 'Non, garder',
    }),
  });
}
