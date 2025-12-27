import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useUniversity() {
  const { profile, university } = useAuth();
  
  const universityId = profile?.university_id;
  
  // Helper to add university filter to queries
  function withUniversity<T extends Record<string, any>>(data: T): T & { university_id: string | undefined } {
    return {
      ...data,
      university_id: universityId
    };
  }
  
  // Helper to filter by university
  function filterByUniversity(query: any) {
    if (universityId) {
      return query.eq('university_id', universityId);
    }
    return query;
  }
  
  return {
    universityId,
    university,
    withUniversity,
    filterByUniversity
  };
}

// Export a utility function for edge functions to use
export async function getUniversityIdFromUser(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('university_id')
    .eq('auth_id', userId)
    .single();
  
  return data?.university_id;
}
