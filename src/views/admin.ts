import { html } from '../html.js';
import type { Html } from '../html.js';
import type { Member, Viewer } from '../types.js';
import { page } from './layout.js';
import {
  actionRow,
  card,
  confirmPanel,
  doneNotice,
  emptyState,
  form,
  postButton,
  secondaryLink,
  section,
  textField,
} from './ui.js';

const BACK_TO_ADMIN = { href: '/admin', label: 'Retour au mode aide' };

function wishCaption(count: number): string {
  if (count === 0) return 'Pas encore de liste';
  if (count === 1) return '1 souhait';
  return `${count} souhaits`;
}

export function loginPage(viewer: Viewer, error: string | null): Html {
  return page({
    title: 'Mode aide',
    viewer,
    body: form({
      action: '/admin/login',
      submitLabel: 'Entrer',
      cancelHref: null,
      fields: textField({
        name: 'password',
        label: 'Mot de passe',
        hint: null,
        value: '',
        error,
        maxLength: 200,
        type: 'password',
        autocomplete: 'current-password',
      }),
    }),
  });
}

export function dashboardPage(
  viewer: Viewer,
  options: { members: Member[]; wishCounts: Map<number, number>; done: unknown; name: string; error: string | null },
): Html {
  const members = options.members;
  const addForm = form({
    action: '/admin/members',
    submitLabel: 'Ajouter',
    cancelHref: null,
    fields: textField({
      name: 'name',
      label: 'Prénom',
      hint: "Comme la famille l'appelle, par exemple « Grand-maman ».",
      value: options.name,
      error: options.error,
      maxLength: 40,
      autocomplete: 'off',
    }),
  });
  const memberCards =
    members.length === 0
      ? emptyState("Aucun membre pour l'instant. Ajoute le premier ci-dessus.")
      : html`${members.map((member) =>
          card({
            title: member.name,
            text: wishCaption(options.wishCounts.get(member.id) ?? 0),
            actions: actionRow([
              secondaryLink(`/list/${member.id}`, 'Voir sa liste'),
              secondaryLink(`/admin/members/${member.id}/edit`, 'Renommer'),
              secondaryLink(`/admin/members/${member.id}/delete`, 'Retirer'),
            ]),
          }),
        )}`;
  return page({
    title: 'Mode aide',
    viewer,
    notice: doneNotice(options.done),
    body: html`${section('Ajouter un membre', null, addForm)}
${section(
  `Les membres (${members.length})`,
  "Pour remplir la liste de quelqu'un à sa place, appuie sur « Voir sa liste ».",
  memberCards,
)}
${postButton('/admin/logout', 'Quitter le mode aide', 'secondary')}`,
  });
}

export function renamePage(viewer: Viewer, member: Member, name: string, error: string | null): Html {
  return page({
    title: `Renommer ${member.name}`,
    viewer,
    back: BACK_TO_ADMIN,
    body: form({
      action: `/admin/members/${member.id}`,
      submitLabel: 'Enregistrer',
      cancelHref: '/admin',
      fields: textField({
        name: 'name',
        label: 'Nouveau prénom',
        hint: null,
        value: name,
        error,
        maxLength: 40,
        autocomplete: 'off',
      }),
    }),
  });
}

export function removePage(viewer: Viewer, member: Member): Html {
  return page({
    title: `Retirer ${member.name} ?`,
    viewer,
    back: BACK_TO_ADMIN,
    body: confirmPanel({
      text: `Sa liste et les idées secrètes pour ${member.name} seront effacées pour de bon. Les idées que ${member.name} a écrites pour les autres resteront.`,
      action: `/admin/members/${member.id}/delete`,
      confirmLabel: 'Oui, retirer',
      cancelHref: '/admin',
      cancelLabel: 'Non, garder',
    }),
  });
}
