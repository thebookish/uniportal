import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Communication = {
  id: string;
  student_id: string;
  type: string;
  subject: string | null;
  message: string;
  status: string;
  university_id: string | null;
  created_at: string;
  students?: { name: string; email: string } | null;
};

export function useCommunications() {
  const { profile } = useAuth();
  const universityId = profile?.university_id;
  
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCommunications = useCallback(async () => {
    if (!universityId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('communications')
        .select(`
          *,
          students(name, email)
        `)
        .eq('university_id', universityId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      setCommunications(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [universityId]);

  useEffect(() => {
    fetchCommunications();

    const channel = supabase
      .channel(`communications-changes-${universityId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communications' }, () => {
        fetchCommunications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [universityId, fetchCommunications]);

  return { communications, loading, error, refetch: fetchCommunications };
}
