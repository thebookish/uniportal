import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Counselor = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  assignedStudents: number;
  capacity: number;
  conversionRate: number;
  avgResponseTime: string;
};

export function useCounselors() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchCounselors();

    const channel = supabase
      .channel('counselors-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchCounselors();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchCounselors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchCounselors() {
    try {
      setLoading(true);
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .in('role', ['admissions', 'student_success']);

      if (fetchError) throw fetchError;

      const counselorsWithStats = await Promise.all(
        (users || []).map(async (user) => {
          const { count: assignedCount } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('counselor_id', user.id);

          const { count: convertedCount } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('counselor_id', user.id)
            .in('stage', ['active', 'enrollment', 'acceptance']);

          const conversionRate = assignedCount && assignedCount > 0 
            ? Math.round((convertedCount || 0) / assignedCount * 100) 
            : 0;

          return {
            ...user,
            assignedStudents: assignedCount || 0,
            capacity: 50,
            conversionRate,
            avgResponseTime: '2.1h'
          };
        })
      );

      setCounselors(counselorsWithStats);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { counselors, loading, error, refetch: fetchCounselors };
}
