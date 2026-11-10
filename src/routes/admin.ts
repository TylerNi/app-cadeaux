import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import {
  countWishesByMember,
  createMember,
  deleteMember,
  getMember,
  isNameTaken,
  listMembers,
  renameMember,
} from '../data.js';
import { formText, notFound, parseId, redirect, send } from '../http.js';
import type { Member } from '../types.js';
import { clearAdmin, setAdmin, viewerOf } from '../viewer.js';
import { dashboardPage, loginPage, removePage, renamePage } from '../views/admin.js';

export const adminRouter = Router();

function adminOnly(_req: Request, res: Response, next: NextFunction): void {
  if (viewerOf(res).isAdmin) {
    next();
    return;
  }
  notFound(res);
}

function memberFromParams(req: Request): Member | null {
  const id = parseId(req.params.id);
  return id === null ? null : getMember(id);
}

function readName(body: unknown): string {
  return formText(body, 'name').replace(/\s+/g, ' ');
}

function nameError(name: string, exceptId?: number): string | null {
  if (name === '') return 'Écris un prénom.';
  if (name.length > 40) return "C'est un peu long : 40 caractères au maximum.";
  if (isNameTaken(name, exceptId)) return 'Ce prénom existe déjà. Ajoute une initiale, par exemple « Marie L. ».';
  return null;
}

function sendDashboard(res: Response, done: unknown, name: string, error: string | null, status?: number): void {
  send(
    res,
    dashboardPage(viewerOf(res), { members: listMembers(), wishCounts: countWishesByMember(), done, name, error }),
    status,
  );
}

adminRouter.get('/admin', (req, res) => {
  const viewer = viewerOf(res);
  if (!viewer.isAdmin) {
    send(res, loginPage(viewer));
    return;
  }
  sendDashboard(res, req.query.done, '', null);
});

adminRouter.post('/admin/login', (_req, res) => {
  setAdmin(res);
  redirect(res, '/admin');
});

adminRouter.post('/admin/logout', adminOnly, (_req, res) => {
  clearAdmin(res);
  redirect(res, '/');
});

adminRouter.post('/admin/members', adminOnly, (req, res) => {
  const name = readName(req.body);
  const error = nameError(name);
  if (error !== null) {
    sendDashboard(res, null, name, error, 400);
    return;
  }
  createMember(name);
  redirect(res, '/admin?done=member-added');
});

adminRouter.get('/admin/members/:id/edit', adminOnly, (req, res) => {
  const member = memberFromParams(req);
  if (member === null) {
    notFound(res);
    return;
  }
  send(res, renamePage(viewerOf(res), member, member.name, null));
});

adminRouter.post('/admin/members/:id', adminOnly, (req, res) => {
  const member = memberFromParams(req);
  if (member === null) {
    notFound(res);
    return;
  }
  const name = readName(req.body);
  const error = nameError(name, member.id);
  if (error !== null) {
    send(res, renamePage(viewerOf(res), member, name, error), 400);
    return;
  }
  renameMember(member.id, name);
  redirect(res, '/admin?done=member-renamed');
});

adminRouter.get('/admin/members/:id/delete', adminOnly, (req, res) => {
  const member = memberFromParams(req);
  if (member === null) {
    notFound(res);
    return;
  }
  send(res, removePage(viewerOf(res), member));
});

adminRouter.post('/admin/members/:id/delete', adminOnly, (req, res) => {
  const member = memberFromParams(req);
  if (member === null) {
    notFound(res);
    return;
  }
  deleteMember(member.id);
  redirect(res, '/admin?done=member-removed');
});
