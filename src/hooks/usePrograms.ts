import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Program = {
  id: string;
  name: string;
  department: string;
  intake_date: string;
  capacity: number;
  enrolled: number;
  eligibility: string[] | null;
  created_at: string;
};

export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchPrograms();

    const channel = supabase
      .channel('programs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'programs' }, () => {
        fetchPrograms();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchPrograms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPrograms() {
    try {
      setLoading(true);
      const { data: programsData, error: fetchError } = await supabase
        .from('programs')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;

      const programsWithEnrollment = await Promise.all(
        (programsData || []).map(async (program) => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('program_id', program.id)
            .in('stage', ['enrollment', 'onboarding', 'active', 'retained']);

          return {
            ...program,
            enrolled: count || 0
          };
        })
      );

      setPrograms(programsWithEnrollment);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { programs, loading, error, refetch: fetchPrograms };
}
