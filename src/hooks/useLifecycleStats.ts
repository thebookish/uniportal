import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface LifecycleStage {
  stage: string;
  count: number;
}

export function useLifecycleStats() {
  const { profile } = useAuth();
  const universityId = profile?.university_id;
  
  const [stages, setStages] = useState<LifecycleStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    if (!universityId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('stage')
        .eq('university_id', universityId);

      if (fetchError) throw fetchError;

      const stageCounts = (data || []).reduce((acc: Record<string, number>, student) => {
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
  }, [universityId]);

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel(`lifecycle-changes-${universityId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [universityId, fetchStats]);

  return { stages, loading, error, refetch: fetchStats };
}
