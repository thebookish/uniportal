import { useState } from 'react';
import { X, Send, UserPlus, Workflow, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface BulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: any[];
  onSuccess: () => void;
}

export function BulkActionsModal({ isOpen, onClose, selectedStudents, onSuccess }: BulkActionsModalProps) {
  const [action, setAction] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [selectedCounselor, setSelectedCounselor] = useState('');
  const [counselors, setCounselors] = useState<any[]>([]);

  if (!isOpen) return null;

  async function loadCounselors() {
    const { data } = await supabase.from('users').select('id, name').eq('role', 'admissions');
    setCounselors(data || []);
  }

  async function executeBulkAction() {
    setLoading(true);
    setProgress(0);
    let success = 0;
    let failed = 0;

    try {
      for (let i = 0; i < selectedStudents.length; i++) {
        const student = selectedStudents[i];
        try {
          if (action === 'send_message') {
            await supabase.from('communications').insert({
              student_id: student.id,
              type: 'email',
              subject: messageSubject,
              message: messageBody.replace('{name}', student.name),
              status: 'sent'
            });
          } else if (action === 'assign_counselor') {
            await supabase.from('students').update({ counselor_id: selectedCounselor }).eq('id', student.id);
          } else if (action === 'trigger_workflow') {
            await supabase.from('ai_alerts').insert({
              severity: 'info',
              title: 'Workflow Triggered',
              description: `Bulk workflow triggered for ${student.name}`,
              student_id: student.id,
              recommendations: ['Review student profile', 'Follow up within 48 hours'],
              read: false
            });
          }
          success++;
        } catch {
          failed++;
        }
        setProgress(Math.round(((i + 1) / selectedStudents.length) * 100));
      }
      setResult({ success, failed });
      if (success > 0) onSuccess();
    } finally {
      setLoading(false);
    }
  }

  function exportData() {
    const csvContent = [
      ['Name', 'Email', 'Stage', 'Engagement', 'Risk', 'Country'].join(','),
      ...selectedStudents.map(s => 
        [s.name, s.email, s.stage, s.engagement_score, s.risk_score, s.country].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-lg">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Bulk Actions</h2>
            <p className="text-sm text-gray-400">{selectedStudents.length} students selected</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {result ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Action Completed</h3>
              <div className="flex items-center justify-center gap-4">
                <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                  {result.success} Successful
                </Badge>
                {result.failed > 0 && (
                  <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
                    {result.failed} Failed
                  </Badge>
                )}
              </div>
              <Button onClick={onClose} className="mt-6 bg-orange-500 hover:bg-orange-600 text-white">
                Done
              </Button>
            </div>
          ) : loading ? (
            <div className="text-center py-6">
              <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
              <p className="text-white mb-2">Processing {selectedStudents.length} students...</p>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">{progress}% complete</p>
            </div>
          ) : !action ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 mb-4">Select an action to perform:</p>
              <button
                onClick={() => setAction('send_message')}
                className="w-full flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Send className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Send Message</p>
                  <p className="text-sm text-gray-400">Send bulk email to selected students</p>
                </div>
              </button>
              <button
                onClick={() => { setAction('assign_counselor'); loadCounselors(); }}
                className="w-full flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-green-500/10">
                  <UserPlus className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Assign Counselor</p>
                  <p className="text-sm text-gray-400">Assign a counselor to selected students</p>
                </div>
              </button>
              <button
                onClick={() => setAction('trigger_workflow')}
                className="w-full flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Workflow className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Trigger Workflow</p>
                  <p className="text-sm text-gray-400">Start automated workflow for students</p>
                </div>
              </button>
              <button
                onClick={exportData}
                className="w-full flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Download className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Export Data</p>
                  <p className="text-sm text-gray-400">Download selected students as CSV</p>
                </div>
              </button>
            </div>
          ) : action === 'send_message' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <Input
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message <span className="text-gray-500">(Use {'{name}'} for personalization)</span>
                </label>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Hi {name}, ..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setAction('')} className="flex-1 border-white/10">
                  Back
                </Button>
                <Button 
                  onClick={executeBulkAction}
                  disabled={!messageSubject || !messageBody}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Send to {selectedStudents.length} Students
                </Button>
              </div>
            </div>
          ) : action === 'assign_counselor' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Counselor</label>
                <select
                  value={selectedCounselor}
                  onChange={(e) => setSelectedCounselor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="">Choose a counselor...</option>
                  {counselors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setAction('')} className="flex-1 border-white/10">
                  Back
                </Button>
                <Button 
                  onClick={executeBulkAction}
                  disabled={!selectedCounselor}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Assign to {selectedStudents.length} Students
                </Button>
              </div>
            </div>
          ) : action === 'trigger_workflow' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm text-purple-400">
                  This will trigger the default follow-up workflow for all selected students, 
                  creating AI alerts and scheduling automated check-ins.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setAction('')} className="flex-1 border-white/10">
                  Back
                </Button>
                <Button 
                  onClick={executeBulkAction}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Trigger for {selectedStudents.length} Students
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
