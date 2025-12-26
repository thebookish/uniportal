import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Metric = {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
};

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchMetrics();

    const channel = supabase
      .channel('metrics-changes')
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
  }, []);

  async function fetchMetrics() {
    try {
      setLoading(true);

      const { data: students } = await supabase.from('students').select('stage, risk_score, engagement_score');
      const { count: alertsCount } = await supabase.from('ai_alerts').select('*', { count: 'exact', head: true }).eq('read', false);

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
  }

  return { metrics, loading, error, refetch: fetchMetrics };
}
