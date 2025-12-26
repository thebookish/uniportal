import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Portal } from './components/Portal';
import { SetupWizard } from './components/setup/SetupWizard';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (user && profile) {
      checkSetupStatus();
    } else if (!loading) {
      setCheckingSetup(false);
    }
  }, [user, profile, loading]);

  async function checkSetupStatus() {
    try {
      const { data } = await supabase
        .from('university_profile')
        .select('setup_completed')
        .maybeSingle();
      
      setNeedsSetup(!data?.setup_completed && profile?.role === 'super_admin');
    } catch (error) {
      console.error('Error checking setup:', error);
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
