import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Student = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string;
  stage: string;
  engagement_score: number;
  risk_score: number;
  quality_score: number | null;
  source: string | null;
  program_id: string | null;
  counselor_id: string | null;
  university_id: string | null;
  last_activity: string;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  programs?: any;
  users?: any;
  documents?: any[];
};

export function useStudents(stage?: string) {
  const { profile } = useAuth();
  const universityId = profile?.university_id;
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!universityId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      let query = supabase
        .from('students')
        .select(`
          *,
          programs(*),
          users!students_counselor_id_fkey(*),
          documents(*)
        `)
        .eq('university_id', universityId)
        .order('created_at', { ascending: false });

      if (stage && stage !== 'all') {
        query = query.eq('stage', stage);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setStudents(data as Student[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [stage, universityId]);

  useEffect(() => {
    fetchStudents();

    const channel = supabase
      .channel(`students-realtime-${stage || 'all'}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'students' 
      }, (payload) => {
        console.log('Student change received:', payload);
        fetchStudents();
      })
      .subscribe((status) => {
        console.log('Student subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stage, fetchStudents]);

  return { students, loading, error, refetch: fetchStudents };
}
