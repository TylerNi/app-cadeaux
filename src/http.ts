import type { Response } from 'express';
import type { Html } from './html.js';
import { viewerOf } from './viewer.js';
import { notFoundPage } from './views/layout.js';

export function send(res: Response, page: Html, status?: number): void {
  res.status(status ?? 200);
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  res.send(page.__html);
}

export function redirect(res: Response, location: string): void {
  res.redirect(303, location);
}

export function notFound(res: Response): void {
  send(res, notFoundPage(viewerOf(res)), 404);
}

export function parseId(value: unknown): number | null {
  if (typeof value !== 'string' || !/^[1-9][0-9]{0,9}$/.test(value)) return null;
  return Number(value);
}

export function formText(body: unknown, name: string): string {
  if (typeof body !== 'object' || body === null) return '';
  const value = (body as Record<string, unknown>)[name];
  if (typeof value !== 'string') return '';
  return value.trim().replaceAll('\r\n', '\n');
}
