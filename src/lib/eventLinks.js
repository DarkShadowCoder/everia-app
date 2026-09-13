// src/lib/eventLinks.js
// ============================================================
// EVERIA — PUBLIC EVENT LINKS
// ============================================================
// Les invitations doivent fonctionner dans le navigateur mobile afin que
// l'invité puisse rejoindre l'événement sans installer l'application.
// ============================================================

import 'react-native-url-polyfill/auto';

import {
  WEB_APP_URL,
} from '@/constants/config';

function validPublicBaseUrl(value) {
  if (
    !value ||
    typeof value !== 'string'
  ) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    return url.protocol === 'https:'
      ? url
      : null;
  } catch {
    return null;
  }
}

/**
 * Construit un lien universel vers le parcours invité web.
 * Retourne null si l'URL publique n'est pas encore configurée.
 */
export function buildEventJoinUrl(eventCode) {
  const code = typeof eventCode === 'string'
    ? eventCode.trim()
    : '';

  const baseUrl = validPublicBaseUrl(WEB_APP_URL);

  if (
    !code ||
    !baseUrl
  ) {
    return null;
  }

  baseUrl.pathname = `${baseUrl.pathname.replace(/\/$/, '')}/join`;
  baseUrl.search = '';
  baseUrl.searchParams.set('code', code);

  return baseUrl.toString();
}
