import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface LifecycleStage {
  stage: string;
  count: number;
}

export function useLifecycleStats() {
  const [stages, setStages] = useState<LifecycleStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('lifecycle-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('stage');

      if (fetchError) throw fetchError;

      const stageCounts = data.reduce((acc: Record<string, number>, student) => {
        acc[student.stage] = (acc[student.stage] || 0) + 1;
        return acc;
      }, {});

      const stageOrder = ['lead', 'application', 'offer', 'acceptance', 'enrollment', 'onboarding', 'active', 'at_risk', 'retained', 'dropped'];
      
      const formattedStages = stageOrder.map(stage => ({
        stage,
        count: stageCounts[stage] || 0
      }));

      setStages(formattedStages);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { stages, loading, error, refetch: fetchStats };
}
