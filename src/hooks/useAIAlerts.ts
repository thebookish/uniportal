import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type AIAlert = {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  student_id: string | null;
  recommendations: string[] | null;
  read: boolean;
  university_id: string | null;
  created_at: string;
  students?: any;
};

export function useAIAlerts() {
  const { profile } = useAuth();
  const universityId = profile?.university_id;
  
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!universityId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('ai_alerts')
        .select(`
          *,
          students(*)
        `)
        .eq('university_id', universityId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setAlerts(data as AIAlert[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [universityId]);

  useEffect(() => {
    fetchAlerts();

    if (!universityId) return;

    const channel = supabase
      .channel(`alerts-realtime-${universityId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'ai_alerts',
        filter: `university_id=eq.${universityId}`
      }, (payload) => {
        console.log('New alert received:', payload);
        // Immediately add the new alert to state for instant UI update
        if (payload.new) {
          setAlerts(prev => [payload.new as AIAlert, ...prev]);
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'ai_alerts',
        filter: `university_id=eq.${universityId}`
      }, (payload) => {
        console.log('Alert updated:', payload);
        if (payload.new) {
          setAlerts(prev => prev.map(alert => 
            alert.id === (payload.new as AIAlert).id ? payload.new as AIAlert : alert
          ));
        }
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'ai_alerts'
      }, (payload) => {
        console.log('Alert deleted:', payload);
        if (payload.old) {
          setAlerts(prev => prev.filter(alert => alert.id !== (payload.old as any).id));
        }
      })
      .subscribe((status) => {
        console.log('Alert subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts, universityId]);

  async function markAsRead(alertId: string) {
    await supabase
      .from('ai_alerts')
      .update({ read: true })
      .eq('id', alertId);
    
    fetchAlerts();
  }

  return { alerts, loading, error, refetch: fetchAlerts, markAsRead };
}
