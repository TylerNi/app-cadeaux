import type { Item, Viewer } from './types.js';

export function canSeeIdeasOf(viewer: Viewer, memberId: number): boolean {
  return viewer.member !== null && viewer.member.id !== memberId;
}

export function canAddIdeaFor(viewer: Viewer, memberId: number): boolean {
  return canSeeIdeasOf(viewer, memberId);
}

export function canEditWishesOf(viewer: Viewer, memberId: number): boolean {
  return viewer.member?.id === memberId || viewer.isAdmin;
}

export function canViewItem(viewer: Viewer, item: Item): boolean {
  if (item.kind === 'wish') return true;
  return canSeeIdeasOf(viewer, item.memberId);
}

export function canEditItem(viewer: Viewer, item: Item): boolean {
  if (item.kind === 'wish') return canEditWishesOf(viewer, item.memberId);
  return (
    canSeeIdeasOf(viewer, item.memberId) &&
    (item.authorId === viewer.member?.id || viewer.isAdmin)
  );
}
