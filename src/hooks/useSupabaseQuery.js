// src/hooks/useSupabaseQuery.js
// Hook générique pour exécuter une requête Supabase (ou toute promesse
// async) et exposer { data, isLoading, error, refresh }. Évite de
// dupliquer le boilerplate useState/useEffect dans chaque écran.

import { useCallback, useEffect, useRef, useState } from 'react';

export function useSupabaseQuery(queryFn, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const run = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) setError(err);
      console.warn('[Everia] useSupabaseQuery error:', err?.message ?? err);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, isLoading, error, refresh: run, setData };
}
