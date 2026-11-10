import { html } from '../html.js';
import type { Html } from '../html.js';
import type { Item, Member } from '../types.js';

const DONE_TEXTS = new Map([
  ['welcome', "Bienvenue ! L'app se souviendra de toi sur cet appareil."],
  ['added', "C'est ajouté ✓"],
  ['updated', "C'est modifié ✓"],
  ['deleted', "C'est supprimé ✓"],
  ['member-added', 'Le membre est ajouté ✓'],
  ['member-renamed', 'Le prénom est changé ✓'],
  ['member-removed', 'Le membre est retiré ✓'],
]);

function domainOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '');
}

export function primaryLink(href: string, label: string): Html {
  return html`<p><a href="${href}">${label}</a></p>`;
}

export function secondaryLink(href: string, label: string): Html {
  return html`<p><a href="${href}">${label}</a></p>`;
}

export function postButton(action: string, label: string, variant: 'primary' | 'secondary' | 'danger'): Html {
  return html`<form method="post" action="${action}"><button type="submit">${label}</button></form>`;
}

export function actionRow(buttons: Html[]): Html {
  return html`<div>${buttons}</div>`;
}

export function memberTile(member: Member, href: string, caption: string | null): Html {
  return html`<a href="${href}"><span>${member.name.charAt(0).toUpperCase()}</span> <strong>${member.name}</strong>${caption !== null && html`<br><span>${caption}</span>`}</a>`;
}

export function memberGrid(tiles: Html[]): Html {
  return html`<ul>${tiles.map((tile) => html`<li>${tile}</li>`)}</ul>`;
}

export function itemCard(item: Item, options: { actions: Html | null; showAuthor: boolean }): Html {
  return html`<article id="item-${item.id}">
<h3>${item.title}</h3>
${item.details !== null && html`<p>${item.details.split('\n').map((line, index) => html`${index > 0 && html`<br>`}${line}`)}</p>`}
${item.url !== null && html`<p><a href="${item.url}" target="_blank" rel="noopener noreferrer">Voir sur ${domainOf(item.url)}</a></p>`}
${options.showAuthor && item.authorName !== null && html`<p>Proposée par ${item.authorName}</p>`}
${options.actions}
</article>`;
}

export function card(options: { title: string; text: string | null; actions: Html | null }): Html {
  return html`<article>
<h3>${options.title}</h3>
${options.text !== null && html`<p>${options.text}</p>`}
${options.actions}
</article>`;
}

export function section(title: string, intro: string | null, content: Html): Html {
  return html`<section>
<h2>${title}</h2>
${intro !== null && html`<p>${intro}</p>`}
${content}
</section>`;
}

export function notice(text: string, tone: 'success' | 'info' | 'help'): Html {
  return html`<p><strong>${text}</strong></p>`;
}

export function doneNotice(code: unknown): Html | null {
  const text = typeof code === 'string' ? DONE_TEXTS.get(code) : undefined;
  return text === undefined ? null : notice(text, 'success');
}

export function emptyState(text: string): Html {
  return html`<p>${text}</p>`;
}

export function form(options: {
  action: string;
  fields: Html;
  submitLabel: string;
  cancelHref: string | null;
  cancelLabel?: string;
}): Html {
  return html`<form method="post" action="${options.action}">
${options.fields}
<p><button type="submit">${options.submitLabel}</button></p>
${options.cancelHref !== null && html`<p><a href="${options.cancelHref}">${options.cancelLabel ?? 'Annuler'}</a></p>`}
</form>`;
}

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
}): Html {
  const id = `field-${options.name}`;
  return html`<p>
<label for="${id}">${options.label}</label><br>
<input id="${id}" name="${options.name}" type="${options.type ?? 'text'}" value="${options.value}" maxlength="${options.maxLength}"${options.inputMode !== undefined && html` inputmode="${options.inputMode}"`}${options.autocomplete !== undefined && html` autocomplete="${options.autocomplete}"`}>
${options.hint !== null && html`<br>${options.hint}`}
${options.error !== null && html`<br><strong>${options.error}</strong>`}
</p>`;
}

export function textArea(options: {
  name: string;
  label: string;
  hint: string | null;
  value: string;
  error: string | null;
  maxLength: number;
}): Html {
  const id = `field-${options.name}`;
  return html`<p>
<label for="${id}">${options.label}</label><br>
<textarea id="${id}" name="${options.name}" maxlength="${options.maxLength}">${options.value}</textarea>
${options.hint !== null && html`<br>${options.hint}`}
${options.error !== null && html`<br><strong>${options.error}</strong>`}
</p>`;
}

export function confirmPanel(options: {
  text: string | null;
  action: string;
  confirmLabel: string;
  cancelHref: string;
  cancelLabel: string;
}): Html {
  return html`<div>
${options.text !== null && html`<p>${options.text}</p>`}
${postButton(options.action, options.confirmLabel, 'danger')}
${secondaryLink(options.cancelHref, options.cancelLabel)}
</div>`;
}
