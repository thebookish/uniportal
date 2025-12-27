import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Metric = {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
};

export function useMetrics() {
  const { profile } = useAuth();
  const universityId = profile?.university_id;
  
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!universityId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);

      const { data: students } = await supabase.from('students').select('stage, risk_score, engagement_score').eq('university_id', universityId);
      const { count: alertsCount } = await supabase.from('ai_alerts').select('*', { count: 'exact', head: true }).eq('university_id', universityId).eq('read', false);

      const studentList = students || [];
      const leads = studentList.filter(s => s.stage === 'lead').length;
      const applications = studentList.filter(s => s.stage === 'application').length;
      const offers = studentList.filter(s => s.stage === 'offer').length;
      const enrolled = studentList.filter(s => ['enrollment', 'onboarding', 'active'].includes(s.stage)).length;
      const atRisk = studentList.filter(s => s.risk_score >= 70).length;
      const dropped = studentList.filter(s => s.stage === 'dropped').length;

      const calculatedMetrics: Metric[] = [
        { label: 'Total Leads', value: leads, change: 0, trend: 'neutral' },
        { label: 'Applications', value: applications, change: 0, trend: 'neutral' },
        { label: 'Offers Sent', value: offers, change: 0, trend: 'neutral' },
        { label: 'Enrolled', value: enrolled, change: 0, trend: 'up' },
        { label: 'At Risk', value: atRisk, change: 0, trend: atRisk > 0 ? 'down' : 'neutral' },
        { label: 'Dropouts', value: dropped, change: 0, trend: dropped > 0 ? 'down' : 'neutral' },
      ];

      setMetrics(calculatedMetrics);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [universityId]);

  useEffect(() => {
    fetchMetrics();

    const channel = supabase
      .channel(`metrics-changes-${universityId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchMetrics();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_alerts' }, () => {
        fetchMetrics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [universityId, fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}
