import { html } from '../html.js';
import type { Html } from '../html.js';
import type { Viewer } from '../types.js';
import { primaryLink } from './ui.js';

const APP_NAME = 'Cadeaux de la famille';

export interface PageOptions {
  title: string;
  viewer: Viewer;
  back?: { href: string; label: string } | null;
  notice?: Html | null;
  body: Html;
}

export function page(options: PageOptions): Html {
  const back = options.back === undefined ? { href: '/', label: "Retour à l'accueil" } : options.back;
  return html`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${options.title} · ${APP_NAME}</title>
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<header><a href="/">${APP_NAME}</a></header>
<main>
${back && html`<p><a href="${back.href}">← ${back.label}</a></p>`}
<h1>${options.title}</h1>
${options.notice}
${options.body}
</main>
${options.viewer.member && html`<footer><p>Tu es ${options.viewer.member.name}.</p></footer>`}
</body>
</html>
`;
}

export function notFoundPage(viewer: Viewer): Html {
  return page({
    title: 'Page introuvable',
    viewer,
    back: null,
    body: html`<p>Cette page n'existe pas, ou plus.</p>
${primaryLink('/', "Retour à l'accueil")}`,
  });
}

export function errorPage(viewer: Viewer): Html {
  return page({
    title: 'Oups !',
    viewer,
    back: null,
    body: html`<p>Quelque chose n'a pas marché. Réessaie dans un moment.</p>
${primaryLink('/', "Retour à l'accueil")}`,
  });
}
