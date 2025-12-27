import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Program = {
  id: string;
  name: string;
  department: string;
  intake_date: string;
  capacity: number;
  enrolled: number;
  eligibility: string[] | null;
  university_id: string | null;
  created_at: string;
};

export function usePrograms() {
  const { profile } = useAuth();
  const universityId = profile?.university_id;
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrograms = useCallback(async () => {
    if (!universityId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data: programsData, error: fetchError } = await supabase
        .from('programs')
        .select('*')
        .eq('university_id', universityId)
        .order('name');

      if (fetchError) throw fetchError;

      const programsWithEnrollment = await Promise.all(
        (programsData || []).map(async (program) => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('program_id', program.id)
            .eq('university_id', universityId)
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
  }, [universityId]);

  useEffect(() => {
    fetchPrograms();

    const channel = supabase
      .channel(`programs-changes-${universityId}`)
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
  }, [universityId, fetchPrograms]);

  return { programs, loading, error, refetch: fetchPrograms };
}
