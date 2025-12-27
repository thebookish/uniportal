import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { usePrograms } from '@/hooks/usePrograms';
import { useAuth } from '@/contexts/AuthContext';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
  const { programs } = usePrograms();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    stage: 'lead',
    program_id: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('students').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        country: formData.country,
        stage: formData.stage,
        program_id: formData.program_id || null,
        university_id: profile?.university_id,
        engagement_score: 50,
        risk_score: 0,
        last_activity: new Date().toISOString(),
        tags: ['new-lead']
      });

      if (insertError) {
        if (insertError.code === '23505' || insertError.message?.includes('unique constraint')) {
          throw new Error('A student with this email already exists in your university.');
        }
        throw insertError;
      }

      setFormData({
        name: '',
        email: '',
        phone: '',
        country: '',
        stage: 'lead',
        program_id: ''
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-lg">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add New Student</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555 0123"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Country *
              </label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="USA"
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stage
            </label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <option value="lead">Lead</option>
              <option value="application">Application</option>
              <option value="offer">Offer</option>
              <option value="acceptance">Acceptance</option>
              <option value="enrollment">Enrollment</option>
              <option value="onboarding">Onboarding</option>
              <option value="active">Active</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Program
            </label>
            <select
              value={formData.program_id}
              onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <option value="">Select a program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/10 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Student'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
