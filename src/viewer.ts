import type { NextFunction, Request, Response } from 'express';
import { isProduction } from './config.js';
import { getMember } from './data.js';
import { parseId } from './http.js';
import type { Viewer } from './types.js';

const MAX_AGE = 400 * 24 * 60 * 60 * 1000;

interface ViewerLocals {
  viewer?: Viewer;
}

export function loadViewer(req: Request, res: Response, next: NextFunction): void {
  const id = parseId(req.cookies.member);
  const member = id === null ? null : getMember(id);
  if (member) {
    setMember(res, member.id);
  } else if (req.cookies.member !== undefined) {
    res.clearCookie('member', { path: '/' });
  }
  const locals: ViewerLocals = res.locals;
  locals.viewer = { member, isAdmin: req.cookies.admin === '1' };
  next();
}

export function viewerOf(res: Response): Viewer {
  const locals: ViewerLocals = res.locals;
  return locals.viewer ?? { member: null, isAdmin: false };
}

export function setMember(res: Response, memberId: number): void {
  res.cookie('member', String(memberId), {
    httpOnly: true,
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function setAdmin(res: Response): void {
  res.cookie('admin', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
    secure: isProduction,
  });
}

export function clearAdmin(res: Response): void {
  res.clearCookie('admin', { path: '/' });
}
