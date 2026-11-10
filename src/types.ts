export interface Member {
  id: number;
  name: string;
}

export type ItemKind = 'wish' | 'idea';

export interface Item {
  id: number;
  memberId: number;
  kind: ItemKind;
  title: string;
  details: string | null;
  url: string | null;
  authorId: number | null;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemInput {
  title: string;
  details: string | null;
  url: string | null;
}

export interface Viewer {
  member: Member | null;
  isAdmin: boolean;
}
