import cookieParser from 'cookie-parser';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import path from 'node:path';
import { port } from './config.js';
import { notFound, redirect, send } from './http.js';
import { adminRouter } from './routes/admin.js';
import { homeRouter } from './routes/home.js';
import { listsRouter } from './routes/lists.js';
import { loadViewer, viewerOf } from './viewer.js';
import { errorPage } from './views/layout.js';

const app = express();

app.disable('x-powered-by');

app.use((_req, res, next) => {
  res.set({
    'X-Robots-Tag': 'noindex, nofollow',
    'Content-Security-Policy':
      "default-src 'none'; style-src 'self'; img-src 'self'; manifest-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  next();
});

app.use(express.static(path.join(import.meta.dirname, '..', 'public'), { index: false }));

app.get('/health', (_req, res) => {
  res.type('text/plain').send('ok');
});

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(loadViewer);

app.use((req, res, next) => {
  const viewer = viewerOf(res);
  if (
    viewer.member ||
    viewer.isAdmin ||
    req.path.startsWith('/who') ||
    req.path.startsWith('/admin') ||
    req.path === '/health'
  ) {
    next();
    return;
  }
  redirect(res, '/who');
});

app.use('/', homeRouter);
app.use('/', listsRouter);
app.use('/', adminRouter);

app.use((_req, res) => {
  notFound(res);
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  send(res, errorPage(viewerOf(res)), 500);
});

app.listen(port, (error) => {
  if (error) throw error;
  console.log(`app-cadeaux écoute sur le port ${port}`);
});
