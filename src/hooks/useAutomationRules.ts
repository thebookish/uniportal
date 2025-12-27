import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type AutomationRule = {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  is_active: boolean;
  university_id: string | null;
  created_at: string;
  updated_at: string;
};

export function useAutomationRules() {
  const { profile } = useAuth();
  const universityId = profile?.university_id;
  
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRules = useCallback(async () => {
    if (!universityId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('university_id', universityId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setRules(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [universityId]);

  useEffect(() => {
    fetchRules();

    const channel = supabase
      .channel(`automation-rules-changes-${universityId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'automation_rules' }, () => {
        fetchRules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [universityId, fetchRules]);

  return { rules, loading, error, refetch: fetchRules };
}
