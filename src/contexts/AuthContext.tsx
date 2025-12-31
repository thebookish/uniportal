import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type UserProfile = Database['public']['Tables']['users']['Row'] & { university_id?: string };

interface University {
  id: string;
  name: string;
  domain?: string;
  logo_url?: string;
  settings?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  university: University | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: string, universityName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip auth initialization if Supabase is not configured
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.warn('Failed to get session:', err);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .maybeSingle();

      if (error) {
        // If it's a network error, just set loading to false and continue
        console.warn('Profile fetch error:', error.message);
        setLoading(false);
        return;
      }
      
      if (!data) {
        // Profile doesn't exist yet, check for pending invitation
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const userEmail = currentUser?.email;
        
        if (userEmail) {
          // Check for pending invitation
          const { data: invitation } = await supabase
            .from('team_invitations')
            .select('*')
            .eq('email', userEmail)
            .eq('status', 'pending')
            .maybeSingle();
          
          if (invitation) {
            // Accept invitation and create user
            const { data: result } = await supabase.rpc('accept_invitation', {
              p_invitation_id: invitation.id,
              p_auth_id: userId
            });
            
            if (result?.success) {
              // Fetch the newly created profile
              const { data: newProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', result.user_id)
                .single();
              
              if (newProfile) {
                setProfile(newProfile);
                if (newProfile.university_id) {
                  const { data: uniData } = await supabase
                    .from('universities')
                    .select('*')
                    .eq('id', newProfile.university_id)
                    .single();
                  if (uniData) {
                    setUniversity(uniData);
                  }
                }
              }
              setLoading(false);
              return;
            }
          }
          
          // No invitation found, create a new university for this user
          try {
            const { data: newUniversity, error: uniError } = await supabase
              .from('universities')
              .insert({
                name: `${userEmail.split('@')[0]}'s University`,
                domain: userEmail.split('@')[1]
              })
              .select()
              .single();
            
            if (uniError) {
              console.warn('Could not create university:', uniError);
              setLoading(false);
              return;
            }

            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .insert({
                auth_id: userId,
                email: userEmail,
                name: userEmail.split('@')[0],
                role: 'super_admin',
                university_id: newUniversity.id
              })
              .select()
              .single();
            
            if (!createError && newProfile) {
              setProfile(newProfile);
              setUniversity(newUniversity);
            }
          } catch (insertError) {
            console.warn('Could not create profile:', insertError);
          }
        }
      } else {
        setProfile(data);
        // Fetch university data
        if (data.university_id) {
          const { data: uniData } = await supabase
            .from('universities')
            .select('*')
            .eq('id', data.university_id)
            .single();
          if (uniData) {
            setUniversity(uniData);
          }
        }
      }
    } catch (error: any) {
      // Handle network errors gracefully
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
        console.warn('Network error fetching profile, will retry on next action');
      } else {
        console.error('Error fetching profile:', error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      throw err;
    }
  }

  async function signUp(email: string, password: string, name: string, role: string, universityName?: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
    }
    try {
      // First check if user already exists in the users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (existingUser) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }

      // Use the deployed URL for email confirmation redirect
      const siteUrl = window.location.origin;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/`,
        }
      });
      if (error) throw error;

      if (data.user) {
        // Create a new university for this user
        const { data: newUniversity, error: uniError } = await supabase
          .from('universities')
          .insert({
            name: universityName || `${name}'s University`,
            domain: email.split('@')[1]
          })
          .select()
          .single();
        
        if (uniError) throw uniError;

        const { error: profileError } = await supabase.from('users').insert({
          auth_id: data.user.id,
          email,
          name,
          role: role as any,
          university_id: newUniversity.id
        });
        if (profileError) {
          // Handle duplicate email error
          if (profileError.message?.includes('duplicate key') || profileError.code === '23505') {
            throw new Error('An account with this email already exists. Please sign in instead.');
          }
          throw profileError;
        }
      }
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      if (err?.message?.includes('duplicate key') || err?.code === '23505') {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      throw err;
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        university,
        session,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
