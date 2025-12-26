import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type OnboardingTask = {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  created_at: string;
  students?: { name: string; email: string } | null;
};

export function useOnboardingTasks() {
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('onboarding-tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'onboarding_tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('onboarding_tasks')
        .select(`
          *,
          students(name, email)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTasks(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { tasks, loading, error, refetch: fetchTasks };
}
