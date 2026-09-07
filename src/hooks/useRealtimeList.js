// src/hooks/useRealtimeList.js
// ------------------------------------------------------------
// S'abonne aux INSERT/UPDATE/DELETE Postgres Changes d'une table
// filtrée (typiquement event_id=eq.<id>) et maintient une liste
// locale à jour. Utilisé par le Live Wall, la Galerie, le
// Guestbook, les Défis, etc. pour un rendu temps réel sans
// re-fetch complet.
// ------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeList({
  table,
  filter, // ex: `event_id=eq.${eventId}`
  initialFetch, // async () => rows[]
  sortFn,
  enabled = true,
}) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let isMounted = true;

    (async () => {
      setIsLoading(true);
      try {
        const rows = initialFetch ? await initialFetch() : [];
        if (isMounted) setItems(sortFn ? [...rows].sort(sortFn) : rows);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    const channel = supabase
      .channel(`realtime:${table}:${filter}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        (payload) => {
          setItems((current) => {
            if (payload.eventType === 'INSERT') {
              const next = [payload.new, ...current.filter((i) => i.id !== payload.new.id)];
              return sortFn ? next.sort(sortFn) : next;
            }
            if (payload.eventType === 'UPDATE') {
              return current.map((i) => (i.id === payload.new.id ? { ...i, ...payload.new } : i));
            }
            if (payload.eventType === 'DELETE') {
              return current.filter((i) => i.id !== payload.old.id);
            }
            return current;
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, enabled]);

  return { items, setItems, isLoading };
}
