import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Portal } from './components/Portal';
import { SetupWizard } from './components/setup/SetupWizard';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, profile, university, loading } = useAuth();
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [envError, setEnvError] = useState(false);

  useEffect(() => {
    // Check if environment variables are set
    if (!isSupabaseConfigured) {
      setEnvError(true);
      setCheckingSetup(false);
      return;
    }

    if (user && profile) {
      checkSetupStatus();
    } else if (!loading) {
      setCheckingSetup(false);
    }
  }, [user, profile, loading, university]);

  async function checkSetupStatus() {
    try {
      // Check if university has completed setup via the settings field
      const universityId = (profile as any)?.university_id;
      
      if (!universityId) {
        // No university assigned - this shouldn't happen but skip setup for now
        console.warn('No university_id found in profile');
        setNeedsSetup(false);
        setCheckingSetup(false);
        return;
      }

      // Use university from context if available to avoid extra fetch
      if (university) {
        const setupCompleted = (university?.settings as any)?.setup_completed === true;
        setNeedsSetup(!setupCompleted && profile?.role === 'super_admin');
        setCheckingSetup(false);
        return;
      }

      // Fallback to fetching if university not in context
      try {
        const { data, error } = await supabase
          .from('universities')
          .select('settings')
          .eq('id', universityId)
          .single();
        
        if (error) {
          console.warn('Error fetching university settings, skipping setup check:', error.message);
          setNeedsSetup(false);
          setCheckingSetup(false);
          return;
        }
        
        const setupCompleted = (data?.settings as any)?.setup_completed === true;
        setNeedsSetup(!setupCompleted && profile?.role === 'super_admin');
      } catch (fetchError) {
        console.warn('Network error fetching university, skipping setup check');
        setNeedsSetup(false);
      }
    } catch (error) {
      console.warn('Error checking setup:', error);
      setNeedsSetup(false);
    } finally {
      setCheckingSetup(false);
    }
  }

  if (envError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827]">
        <div className="text-center max-w-lg p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Configuration Error</h1>
          <p className="text-gray-300 mb-4">Missing Supabase environment variables.</p>
          <div className="text-left bg-black/30 p-4 rounded-lg text-sm mb-4">
            <p className="text-gray-400 mb-2">Add these to your Vercel Environment Variables:</p>
            <code className="text-cyan-400 block">VITE_SUPABASE_URL = your-project-url</code>
            <code className="text-cyan-400 block">VITE_SUPABASE_ANON_KEY = your-anon-key</code>
          </div>
          <div className="text-left bg-black/30 p-4 rounded-lg text-sm">
            <p className="text-gray-400 mb-2">Steps:</p>
            <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
              <li>Go to Vercel Dashboard → Your Project → Settings → Environment Variables</li>
              <li>Add both variables for Production, Preview, and Development</li>
              <li>Redeploy your project</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (loading || checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (needsSetup) {
    return <SetupWizard onComplete={() => setNeedsSetup(false)} />;
  }

  return <Portal />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
