// src/components/event/EventStatusBadge.js
import React from 'react';
import Badge from '@/components/ui/Badge';
import theme from '@/theme';

export default function EventStatusBadge({ status, size = 'sm' }) {
  const spec = theme.helpers.getEventStatus(mapDbStatus(status));
  return <Badge label={spec.label} backgroundColor={spec.background} textColor={spec.text} size={size} />;
}

// La colonne events.status en base est draft|active|live|closing|completed|archived,
// alors que le design system ne connaît que live|upcoming|finished|draft.
function mapDbStatus(status) {
  const map = {
    draft: 'draft',
    active: 'upcoming',
    live: 'live',
    closing: 'live',
    completed: 'finished',
    archived: 'finished',
  };
  return map[status] || 'draft';
}
