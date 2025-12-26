import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type AIAlert = {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  student_id: string | null;
  recommendations: string[] | null;
  read: boolean;
  created_at: string;
  students?: any;
};

export function useAIAlerts() {
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('ai_alerts')
        .select(`
          *,
          students(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setAlerts(data as AIAlert[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel('alerts-realtime-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ai_alerts' 
      }, (payload) => {
        console.log('Alert change received:', payload);
        fetchAlerts();
      })
      .subscribe((status) => {
        console.log('Alert subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  async function markAsRead(alertId: string) {
    await supabase
      .from('ai_alerts')
      .update({ read: true })
      .eq('id', alertId);
    
    fetchAlerts();
  }

  return { alerts, loading, error, refetch: fetchAlerts, markAsRead };
}
