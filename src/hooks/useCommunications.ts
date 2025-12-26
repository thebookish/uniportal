import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Communication = {
  id: string;
  student_id: string;
  type: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  students?: { name: string; email: string } | null;
};

export function useCommunications() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchCommunications();

    const channel = supabase
      .channel('communications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communications' }, () => {
        fetchCommunications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchCommunications() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('communications')
        .select(`
          *,
          students(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      setCommunications(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { communications, loading, error, refetch: fetchCommunications };
}
