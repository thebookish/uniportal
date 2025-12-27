import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type OnboardingTask = {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  university_id: string | null;
  created_at: string;
  students?: { name: string; email: string } | null;
};

export function useOnboardingTasks() {
  const { profile } = useAuth();
  const universityId = profile?.university_id;
  
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!universityId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('onboarding_tasks')
        .select(`
          *,
          students(name, email)
        `)
        .eq('university_id', universityId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTasks(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [universityId]);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel(`onboarding-tasks-changes-${universityId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'onboarding_tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [universityId, fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks };
}
