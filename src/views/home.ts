import { html } from '../html.js';
import type { Html } from '../html.js';
import type { Member, Viewer } from '../types.js';
import { page } from './layout.js';
import { doneNotice, emptyState, memberGrid, memberTile, postButton, primaryLink, secondaryLink, section } from './ui.js';

function wishSentence(count: number): string {
  if (count === 0) return 'Ta liste est vide : ajoute ce qui te ferait plaisir !';
  if (count === 1) return 'Tu as 1 souhait dans ta liste.';
  return `Tu as ${count} souhaits dans ta liste.`;
}

function wishCaption(count: number): string {
  if (count === 0) return 'Pas encore de liste';
  if (count === 1) return '1 souhait';
  return `${count} souhaits`;
}

export function whoPage(viewer: Viewer, members: Member[]): Html {
  return page({
    title: 'Qui es-tu ?',
    viewer,
    back: viewer.member ? undefined : null,
    body: members.length === 0
      ? emptyState("Personne n'est encore inscrit. Demande à Tyler de t'ajouter.")
      : html`<p>Appuie sur ton nom.</p>
${memberGrid(members.map((member) => memberTile(member, `/who/${member.id}`, null)))}`,
  });
}

export function whoConfirmPage(viewer: Viewer, member: Member): Html {
  return page({
    title: `Tu es bien ${member.name} ?`,
    viewer,
    back: { href: '/who', label: 'Retour' },
    body: html`${postButton(`/who/${member.id}`, "Oui, c'est moi", 'primary')}
${secondaryLink('/who', 'Non, revenir à la liste')}`,
  });
}

export function homePage(viewer: Viewer, me: Member, others: Member[], wishCounts: Map<number, number>, done: unknown): Html {
  return page({
    title: `Bonjour ${me.name} !`,
    viewer,
    back: null,
    notice: doneNotice(done),
    body: html`${primaryLink(`/list/${me.id}`, '🎁 Ma liste')}
<p>${wishSentence(wishCounts.get(me.id) ?? 0)}</p>
${section(
  'Les listes de la famille',
  others.length === 0 ? null : 'Appuie sur un nom pour voir sa liste.',
  others.length === 0
    ? emptyState("Personne d'autre n'est encore inscrit.")
    : memberGrid(others.map((member) => memberTile(member, `/list/${member.id}`, wishCaption(wishCounts.get(member.id) ?? 0)))),
)}
${viewer.isAdmin && secondaryLink('/admin', '🔧 Mode aide')}`,
  });
}
