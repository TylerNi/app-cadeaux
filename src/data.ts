import { db } from './db.js';
import type { Item, ItemInput, ItemKind, Member } from './types.js';

interface ItemRow {
  id: number;
  member_id: number;
  kind: ItemKind;
  title: string;
  details: string | null;
  url: string | null;
  author_id: number | null;
  author_name: string | null;
  created_at: string;
  updated_at: string;
}

const ITEM_SELECT = `
  SELECT items.*, authors.name AS author_name
  FROM items
  LEFT JOIN members AS authors ON authors.id = items.author_id
`;

const listMembersStmt = db.prepare('SELECT id, name FROM members');
const getMemberStmt = db.prepare('SELECT id, name FROM members WHERE id = ?');
const nameTakenStmt = db.prepare('SELECT 1 FROM members WHERE name = ? AND id IS NOT ?');
const createMemberStmt = db.prepare('INSERT INTO members (name, created_at) VALUES (?, ?)');
const renameMemberStmt = db.prepare('UPDATE members SET name = ? WHERE id = ?');
const deleteMemberStmt = db.prepare('DELETE FROM members WHERE id = ?');

const countWishesStmt = db.prepare(
  "SELECT member_id, COUNT(*) AS count FROM items WHERE kind = 'wish' GROUP BY member_id",
);
const listItemsStmt = db.prepare(`${ITEM_SELECT}
  WHERE items.member_id = ? AND items.kind = ?
  ORDER BY items.created_at DESC, items.id DESC
`);
const getItemStmt = db.prepare(`${ITEM_SELECT} WHERE items.id = ?`);
const createItemStmt = db.prepare(`
  INSERT INTO items (member_id, kind, title, details, url, author_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const updateItemStmt = db.prepare(
  'UPDATE items SET title = ?, details = ?, url = ?, updated_at = ? WHERE id = ?',
);
const deleteItemStmt = db.prepare('DELETE FROM items WHERE id = ?');

function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    memberId: row.member_id,
    kind: row.kind,
    title: row.title,
    details: row.details,
    url: row.url,
    authorId: row.author_id,
    authorName: row.author_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listMembers(): Member[] {
  return (listMembersStmt.all() as Member[]).sort((a, b) =>
    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }),
  );
}

export function getMember(id: number): Member | null {
  return (getMemberStmt.get(id) as Member | undefined) ?? null;
}

export function isNameTaken(name: string, exceptId?: number): boolean {
  return nameTakenStmt.get(name, exceptId ?? null) !== undefined;
}

export function createMember(name: string): Member {
  const result = createMemberStmt.run(name, new Date().toISOString());
  return { id: Number(result.lastInsertRowid), name };
}

export function renameMember(id: number, name: string): void {
  renameMemberStmt.run(name, id);
}

export function deleteMember(id: number): void {
  deleteMemberStmt.run(id);
}

export function countWishesByMember(): Map<number, number> {
  const rows = countWishesStmt.all() as { member_id: number; count: number }[];
  return new Map(rows.map((row) => [row.member_id, row.count]));
}

export function listWishes(memberId: number): Item[] {
  return (listItemsStmt.all(memberId, 'wish') as ItemRow[]).map(toItem);
}

export function listIdeas(memberId: number): Item[] {
  return (listItemsStmt.all(memberId, 'idea') as ItemRow[]).map(toItem);
}

export function getItem(id: number): Item | null {
  const row = getItemStmt.get(id) as ItemRow | undefined;
  return row ? toItem(row) : null;
}

export function createItem(memberId: number, kind: ItemKind, input: ItemInput, authorId: number | null): Item {
  const now = new Date().toISOString();
  const result = createItemStmt.run(memberId, kind, input.title, input.details, input.url, authorId, now, now);
  return getItem(Number(result.lastInsertRowid)) as Item;
}

export function updateItem(id: number, input: ItemInput): void {
  updateItemStmt.run(input.title, input.details, input.url, new Date().toISOString(), id);
}

export function deleteItem(id: number): void {
  deleteItemStmt.run(id);
}
