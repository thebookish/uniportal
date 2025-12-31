import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, UserPlus, Mail, CheckCircle, Users } from 'lucide-react';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  metadata?: {
    name?: string;
    permissions?: any;
  };
}

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);

  useEffect(() => {
    // Check for invitation in URL
    const urlParams = new URLSearchParams(window.location.search);
    const inviteId = urlParams.get('invite');
    
    if (inviteId) {
      fetchInvitation(inviteId);
    } else {
      setLoadingInvite(false);
    }
  }, []);

  async function fetchInvitation(inviteId: string) {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('id', inviteId)
        .eq('status', 'pending')
        .single();
      
      if (data && !error) {
        setInvitation(data);
        setEmail(data.email);
        setName(data.metadata?.name || '');
        setIsSignUp(true);
      }
    } catch (err) {
      console.error('Error fetching invitation:', err);
    } finally {
      setLoadingInvite(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, name, 'super_admin');
        // Show confirmation message after successful signup
        setShowConfirmation(true);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  // Loading invitation
  if (loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827] p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Email confirmation sent screen
  if (showConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827] p-4">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-cyan-500/20 flex items-center justify-center">
                <Mail className="w-10 h-10 text-cyan-400" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-400 mb-6">
              We've sent a confirmation link to:
            </p>
            <p className="text-cyan-400 font-medium mb-6 break-all">
              {email}
            </p>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  Click the link in the email to verify your account
                </p>
              </div>
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  The link will redirect you back to sign in
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  Check your spam folder if you don't see it
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Didn't receive the email? Wait a few minutes and check spam, or try signing up again.
            </p>

            <Button
              onClick={() => {
                setShowConfirmation(false);
                setIsSignUp(false);
                setPassword('');
              }}
              className="w-full bg-white/10 hover:bg-white/20 text-white"
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111827] p-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white text-center mb-2">
            WorldLynk
          </h1>
          <p className="text-gray-400 text-center mb-8">
            University Admin Portal
          </p>

          {invitation && (
            <div className="mb-6 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <p className="text-cyan-400 font-medium">Team Invitation</p>
              </div>
              <p className="text-sm text-gray-300">
                You've been invited to join as <span className="text-white font-medium">{invitation.role.replace('_', ' ')}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Create your password below to complete setup
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-white/5 border-white/10 text-white"
                  required={isSignUp}
                  disabled={!!invitation}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@university.edu"
                className="bg-white/5 border-white/10 text-white"
                required
                disabled={!!invitation}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {!invitation && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-sm text-orange-400 hover:text-orange-300"
              >
                {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
