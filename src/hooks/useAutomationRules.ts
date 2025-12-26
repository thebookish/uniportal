import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type AutomationRule = {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function useAutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchRules();

    const channel = supabase
      .channel('automation-rules-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'automation_rules' }, () => {
        fetchRules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchRules() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setRules(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { rules, loading, error, refetch: fetchRules };
}
