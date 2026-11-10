import { Router } from 'express';
import type { Request } from 'express';
import { createItem, deleteItem, getItem, getMember, listIdeas, listWishes, updateItem } from '../data.js';
import { formText, notFound, parseId, redirect, send } from '../http.js';
import { canAddIdeaFor, canEditItem, canEditWishesOf, canSeeIdeasOf, canViewItem } from '../rules.js';
import type { Item, ItemInput, ItemKind, Member, Viewer } from '../types.js';
import { viewerOf } from '../viewer.js';
import { deleteItemPage, editItemPage, listPage, newItemPage } from '../views/lists.js';
import type { ItemDraft } from '../views/lists.js';

export const listsRouter = Router();

function normalizeUrl(text: string): string | null {
  const found = /https?:\/\/\S*/i.exec(text);
  let url: URL;
  try {
    url = new URL(found ? found[0] : `https://${text}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (!url.hostname.includes('.') || url.href.length > 2000) return null;
  return url.href;
}

function validateItem(body: unknown): { input: ItemInput } | { draft: ItemDraft } {
  const draft: ItemDraft = {
    title: formText(body, 'title'),
    details: formText(body, 'details'),
    url: formText(body, 'url'),
    errors: {},
  };
  if (draft.title === '') draft.errors.title = "Écris au moins ce que c'est.";
  else if (draft.title.length > 150) draft.errors.title = "C'est un peu long : 150 caractères au maximum.";
  if (draft.details.length > 1000) draft.errors.details = "C'est un peu long : 1000 caractères au maximum.";
  const url = draft.url === '' ? null : normalizeUrl(draft.url);
  if (draft.url !== '' && url === null) {
    draft.errors.url = 'Ce lien ne semble pas valide. Vérifie-le, ou laisse la case vide.';
  }
  if (Object.keys(draft.errors).length > 0) return { draft };
  return { input: { title: draft.title, details: draft.details === '' ? null : draft.details, url } };
}

function kindOf(value: unknown): ItemKind | null {
  return value === 'wish' || value === 'idea' ? value : null;
}

function addTarget(req: Request, viewer: Viewer): { member: Member; kind: ItemKind } | null {
  const id = parseId(req.params.id);
  const member = id === null ? null : getMember(id);
  const kind = kindOf(req.query.kind);
  if (member === null || kind === null) return null;
  const allowed = kind === 'wish' ? canEditWishesOf(viewer, member.id) : canAddIdeaFor(viewer, member.id);
  return allowed ? { member, kind } : null;
}

function latestItem(viewer: Viewer, memberId: number, kind: ItemKind): Item | undefined {
  if (kind === 'wish') return listWishes(memberId)[0];
  return canSeeIdeasOf(viewer, memberId) ? listIdeas(memberId)[0] : undefined;
}

function editableItem(req: Request, viewer: Viewer): Item | null {
  const id = parseId(req.params.id);
  const item = id === null ? null : getItem(id);
  if (item === null || !canViewItem(viewer, item) || !canEditItem(viewer, item)) return null;
  return item;
}

function draftOf(item: Item): ItemDraft {
  return { title: item.title, details: item.details ?? '', url: item.url ?? '', errors: {} };
}

listsRouter.get('/list/:id', (req, res) => {
  const viewer = viewerOf(res);
  const id = parseId(req.params.id);
  const member = id === null ? null : getMember(id);
  if (member === null) {
    notFound(res);
    return;
  }
  const ideas = canSeeIdeasOf(viewer, member.id) ? listIdeas(member.id) : null;
  send(res, listPage(viewer, member, listWishes(member.id), ideas, req.query.done));
});

listsRouter.get('/list/:id/new', (req, res) => {
  const viewer = viewerOf(res);
  const target = addTarget(req, viewer);
  if (target === null) {
    notFound(res);
    return;
  }
  send(res, newItemPage(viewer, target.member, target.kind, { title: '', details: '', url: '', errors: {} }));
});

listsRouter.post('/list/:id/items', (req, res) => {
  const viewer = viewerOf(res);
  const target = addTarget(req, viewer);
  if (target === null) {
    notFound(res);
    return;
  }
  const { member, kind } = target;
  const result = validateItem(req.body);
  if ('draft' in result) {
    send(res, newItemPage(viewer, member, kind, result.draft), 400);
    return;
  }
  const authorId = viewer.member?.id ?? null;
  const latest = latestItem(viewer, member.id, kind);
  if (
    latest !== undefined &&
    latest.title === result.input.title &&
    latest.authorId === authorId &&
    Date.now() - Date.parse(latest.createdAt) < 10000
  ) {
    redirect(res, `/list/${member.id}?done=added#item-${latest.id}`);
    return;
  }
  const item = createItem(member.id, kind, result.input, authorId);
  redirect(res, `/list/${member.id}?done=added#item-${item.id}`);
});

listsRouter.get('/items/:id/edit', (req, res) => {
  const viewer = viewerOf(res);
  const item = editableItem(req, viewer);
  if (item === null) {
    notFound(res);
    return;
  }
  send(res, editItemPage(viewer, item, draftOf(item)));
});

listsRouter.post('/items/:id', (req, res) => {
  const viewer = viewerOf(res);
  const item = editableItem(req, viewer);
  if (item === null) {
    notFound(res);
    return;
  }
  const result = validateItem(req.body);
  if ('draft' in result) {
    send(res, editItemPage(viewer, item, result.draft), 400);
    return;
  }
  updateItem(item.id, result.input);
  redirect(res, `/list/${item.memberId}?done=updated#item-${item.id}`);
});

listsRouter.get('/items/:id/delete', (req, res) => {
  const viewer = viewerOf(res);
  const item = editableItem(req, viewer);
  if (item === null) {
    notFound(res);
    return;
  }
  send(res, deleteItemPage(viewer, item));
});

listsRouter.post('/items/:id/delete', (req, res) => {
  const viewer = viewerOf(res);
  const item = editableItem(req, viewer);
  if (item === null) {
    notFound(res);
    return;
  }
  deleteItem(item.id);
  redirect(res, `/list/${item.memberId}?done=deleted`);
});
