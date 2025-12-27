import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Portal } from './components/Portal';
import { SetupWizard } from './components/setup/SetupWizard';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, profile, university, loading } = useAuth();
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
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

      const { data, error } = await supabase
        .from('universities')
        .select('settings')
        .eq('id', universityId)
        .single();
      
      if (error) {
        console.error('Error fetching university settings:', error);
        setNeedsSetup(false);
        setCheckingSetup(false);
        return;
      }
      
      const setupCompleted = (data?.settings as any)?.setup_completed === true;
      setNeedsSetup(!setupCompleted && profile?.role === 'super_admin');
    } catch (error) {
      console.error('Error checking setup:', error);
      setNeedsSetup(false);
    } finally {
      setCheckingSetup(false);
    }
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
