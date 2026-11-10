import { html } from '../html.js';
import type { Html } from '../html.js';
import type { Viewer } from '../types.js';
import { primaryLink, secondaryLink } from './ui.js';

const APP_NAME = 'Cadeaux de la famille';

export interface PageOptions {
  title: string;
  viewer: Viewer;
  back?: { href: string; label: string } | null;
  notice?: Html | null;
  body: Html;
}

function frenchSpaces(text: string): string {
  return text.replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« ');
}

export function page(options: PageOptions): Html {
  const back = options.back === undefined ? { href: '/', label: "Retour à l'accueil" } : options.back;
  const title = frenchSpaces(options.title);
  return html`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · ${APP_NAME}</title>
<link rel="stylesheet" href="/styles.css">
<link rel="icon" href="/icons/icon-32.png" type="image/png">
<link rel="apple-touch-icon" href="/icons/icon-180.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#1e5c3a">
<meta name="apple-mobile-web-app-title" content="Cadeaux">
<meta name="format-detection" content="telephone=no">
</head>
<body>
<header class="top"><a href="/">🎁 ${APP_NAME}</a></header>
<main class="main">
${back && secondaryLink(back.href, `← ${back.label}`)}
<h1>${title}</h1>
${options.notice}
${options.body}
</main>
${options.viewer.member && html`<footer class="foot"><p>Tu es ${options.viewer.member.name}${!options.viewer.member.name.endsWith('.') && '.'}</p></footer>`}
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
