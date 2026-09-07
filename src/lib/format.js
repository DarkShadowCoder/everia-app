// src/lib/format.js
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

/** Formate une date ISO en libellé lisible ("Aujourd'hui", "Demain", "24 mai 2025"...). */
export function formatEventDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isToday(date)) return `Aujourd'hui, ${format(date, 'HH:mm')}`;
  if (isTomorrow(date)) return `Demain, ${format(date, 'HH:mm')}`;
  if (isYesterday(date)) return `Hier, ${format(date, 'HH:mm')}`;
  return format(date, 'd MMMM yyyy', { locale: fr });
}

export function formatShortDate(isoString) {
  if (!isoString) return '';
  return format(new Date(isoString), 'd MMM yyyy', { locale: fr });
}

export function formatTime(isoString) {
  if (!isoString) return '';
  return format(new Date(isoString), 'HH:mm');
}

export function formatRelative(isoString) {
  if (!isoString) return '';
  return formatDistanceToNow(new Date(isoString), { addSuffix: true, locale: fr });
}

/** Formate un prix stocké en centimes (billing_plans.price_cents, payments.amount_cents). */
export function formatPrice(cents, currency = 'EUR') {
  if (cents === null || cents === undefined) return '';
  const amount = cents / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** Formate un compteur compact (1 200 -> "1,2 k"). */
export function formatCompactNumber(value) {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function initialsFromName(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('');
}

/**
 * notifications.type utilise un enum très détaillé côté base
 * ('event_invitation', 'media_approved', 'challenge_submitted', 'badge_unlocked'...)
 * alors que le design system ne définit que 5 grandes catégories visuelles
 * (event | media | social | challenge | system). Ce helper fait le pont.
 */
export function mapNotificationCategory(dbType) {
  if (!dbType) return 'system';
  if (dbType.startsWith('event_')) return 'event';
  if (dbType.startsWith('media_') || dbType === 'replay_ready' || dbType === 'best_of_ready' || dbType === 'export_ready') return 'media';
  if (['comment', 'reaction', 'mention'].includes(dbType)) return 'social';
  if (dbType.startsWith('challenge_') || dbType === 'badge_unlocked') return 'challenge';
  return 'system';
}

/**
 * La colonne media.moderation_status utilise l'enum Postgres
 * ('not_checked' | 'safe' | 'review' | 'blocked' | 'approved'), alors que
 * le design system (theme.helpers.getModerationStatus) raisonne en libellés
 * génériques ('pending' | 'approved' | 'rejected' | 'flagged'). Ce helper
 * fait le pont entre les deux pour l'affichage.
 */
export function mapModerationStatus(dbStatus) {
  const map = {
    not_checked: 'pending',
    review: 'pending',
    safe: 'approved',
    approved: 'approved',
    blocked: 'rejected',
  };
  return map[dbStatus] || 'pending';
}
