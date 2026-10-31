import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { EventItem } from './types';

/** Loads every event with its sessions and ticket tiers. */
export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // silent = refresh the numbers in the background without flashing the loading state
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { events: list } = await apiRequest<{ events: any[] }>('/events');
      const full: EventItem[] = await Promise.all(
        list.map(async (event) => {
          const { sessions } = await apiRequest<{ sessions: any[] }>(`/events/${event.id}/sessions`);
          const withTiers = await Promise.all(
            sessions.map(async (session) => {
              const { slots } = await apiRequest<{ slots: any[] }>(`/sessions/${session.id}/slots`);
              return { ...session, slots };
            })
          );
          return { ...event, sessions: withTiers };
        })
      );
      setEvents(full);
    } catch (e: any) {
      setError(e.message || 'Could not load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { events, loading, error, reload: load };
}
