import { Router } from 'express';
import { countWishesByMember, getMember, listMembers } from '../data.js';
import { notFound, parseId, redirect, send } from '../http.js';
import { setMember, viewerOf } from '../viewer.js';
import { homePage, whoConfirmPage, whoPage } from '../views/home.js';

export const homeRouter = Router();

homeRouter.get('/', (req, res) => {
  const viewer = viewerOf(res);
  const me = viewer.member;
  if (!me) {
    redirect(res, '/who');
    return;
  }
  const others = listMembers().filter((member) => member.id !== me.id);
  send(res, homePage(viewer, me, others, countWishesByMember(), req.query.done));
});

homeRouter.get('/who', (_req, res) => {
  send(res, whoPage(viewerOf(res), listMembers()));
});

homeRouter.get('/who/:id', (req, res) => {
  const id = parseId(req.params.id);
  const member = id === null ? null : getMember(id);
  if (!member) {
    notFound(res);
    return;
  }
  send(res, whoConfirmPage(viewerOf(res), member));
});

homeRouter.post('/who/:id', (req, res) => {
  const id = parseId(req.params.id);
  const member = id === null ? null : getMember(id);
  if (!member) {
    notFound(res);
    return;
  }
  setMember(res, member.id);
  redirect(res, '/?done=welcome');
});
