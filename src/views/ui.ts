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

function colorClass(member: Member): string {
  return `c${member.id % 8}`;
}

function describedBy(id: string, hint: string | null, error: string | null): Html | null {
  const ids = [error !== null ? `${id}-error` : '', hint !== null ? `${id}-hint` : ''].join(' ').trim();
  return ids === '' ? null : html` aria-describedby="${ids}"`;
}

function fieldNotes(id: string, hint: string | null, error: string | null): Html {
  return html`${error !== null && html`<p class="error" id="${id}-error">⚠ ${error}</p>`}
${hint !== null && html`<p class="hint" id="${id}-hint">${hint}</p>`}`;
}

export function primaryLink(href: string, label: string): Html {
  return html`<a class="btn btn-primary" href="${href}">${label}</a>`;
}

export function secondaryLink(href: string, label: string): Html {
  return html`<a class="btn btn-secondary" href="${href}">${label}</a>`;
}

export function postButton(action: string, label: string, variant: 'primary' | 'secondary' | 'danger'): Html {
  return html`<form class="post" method="post" action="${action}"><button class="btn btn-${variant}" type="submit">${label}</button></form>`;
}

export function actionRow(buttons: Html[]): Html {
  return html`<div class="row">${buttons}</div>`;
}

export function memberTile(member: Member, href: string, caption: string | null): Html {
  return html`<a class="tile" href="${href}"><span class="dot ${colorClass(member)}" aria-hidden="true">${member.name.charAt(0).toUpperCase()}</span><span class="tile-name">${member.name}</span>${caption !== null && html`<span class="tile-caption">${caption}</span>`}</a>`;
}

export function memberGrid(tiles: Html[]): Html {
  return html`<ul class="grid">${tiles.map((tile) => html`<li>${tile}</li>`)}</ul>`;
}

export function itemCard(item: Item, options: { actions: Html | null; showAuthor: boolean }): Html {
  return html`<article class="card item" id="item-${item.id}">
<h3>${item.title}</h3>
${item.details !== null && html`<p class="details">${item.details}</p>`}
${item.url !== null && html`<a class="btn btn-secondary" href="${item.url}" target="_blank" rel="noopener noreferrer">Voir sur ${domainOf(item.url)}</a>`}
${options.showAuthor && item.authorName !== null && html`<p class="author">Proposée par ${item.authorName}</p>`}
${options.actions}
</article>`;
}

export function card(options: { title: string; text: string | null; actions: Html | null }): Html {
  return html`<article class="card">
<h3>${options.title}</h3>
${options.text !== null && html`<p>${options.text}</p>`}
${options.actions}
</article>`;
}

export function section(title: string, intro: string | null, content: Html): Html {
  return html`<section class="section">
<h2>${title}</h2>
${intro !== null && html`<p>${intro}</p>`}
${content}
</section>`;
}

export function notice(text: string, tone: 'success' | 'info' | 'help'): Html {
  return html`<p class="notice notice-${tone}">${text}</p>`;
}

export function doneNotice(code: unknown): Html | null {
  const text = typeof code === 'string' ? DONE_TEXTS.get(code) : undefined;
  return text === undefined ? null : notice(text, 'success');
}

export function emptyState(text: string): Html {
  return html`<p class="empty">${text}</p>`;
}

export function form(options: {
  action: string;
  fields: Html;
  submitLabel: string;
  cancelHref: string | null;
  cancelLabel?: string;
}): Html {
  return html`<form class="form" method="post" action="${options.action}">
${options.fields}
<button class="btn btn-primary" type="submit">${options.submitLabel}</button>
${options.cancelHref !== null && secondaryLink(options.cancelHref, options.cancelLabel ?? 'Annuler')}
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
  const plain = options.inputMode === 'url' || options.type === 'password';
  return html`<div class="field">
<label for="${id}">${options.label}</label>
<input class="input" id="${id}" name="${options.name}" type="${options.type ?? 'text'}" value="${options.value}" maxlength="${options.maxLength}"${options.inputMode !== undefined && html` inputmode="${options.inputMode}"`}${options.autocomplete !== undefined && html` autocomplete="${options.autocomplete}"`}${plain && html` autocapitalize="off" autocorrect="off" spellcheck="false"`}${options.error !== null && html` aria-invalid="true"`}${describedBy(id, options.hint, options.error)}>
${fieldNotes(id, options.hint, options.error)}
</div>`;
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
  return html`<div class="field">
<label for="${id}">${options.label}</label>
<textarea class="input" id="${id}" name="${options.name}" rows="4" maxlength="${options.maxLength}"${options.error !== null && html` aria-invalid="true"`}${describedBy(id, options.hint, options.error)}>${options.value}</textarea>
${fieldNotes(id, options.hint, options.error)}
</div>`;
}

export function confirmPanel(options: {
  text: string | null;
  action: string;
  confirmLabel: string;
  cancelHref: string;
  cancelLabel: string;
}): Html {
  return html`<div class="confirm">
${options.text !== null && html`<p class="confirm-text">${options.text}</p>`}
${postButton(options.action, options.confirmLabel, 'danger')}
${secondaryLink(options.cancelHref, options.cancelLabel)}
</div>`;
}
