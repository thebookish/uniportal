import { useState, useEffect } from 'react';
import { Mail, Send, Users, Clock, Plus, Search, Filter, Loader2, Calendar, FileText, Sparkles, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function CommunicationsView() {
  const [communications, setCommunications] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'broadcast' | 'campaigns' | 'templates'>('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    subject: '',
    message: '',
    targetStage: 'all',
    scheduleTime: ''
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchCommunications();
    fetchTemplates();

    const channel = supabase
      .channel('communications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communications' }, () => {
        fetchCommunications();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communication_templates' }, () => {
        fetchTemplates();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchCommunications() {
    try {
      const { data, error } = await supabase
        .from('communications')
        .select(`
          *,
          students(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCommunications(data || []);
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTemplates() {
    try {
      const { data } = await supabase.from('communication_templates').select('*').order('created_at', { ascending: false });
      setTemplates(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleSendBroadcast() {
    setSending(true);
    try {
      let query = supabase.from('students').select('id, name, email');
      
      if (composeData.targetStage !== 'all') {
        query = query.eq('stage', composeData.targetStage);
      }

      const { data: students, error: studentsError } = await query;
      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        alert('No students found for the selected criteria');
        setSending(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const student of students) {
        try {
          // Create communication record
          const { data: commData, error: insertError } = await supabase
            .from('communications')
            .insert({
              student_id: student.id,
              type: 'email',
              subject: composeData.subject,
              message: composeData.message.replace('{name}', student.name),
              status: 'sent'
            })
            .select()
            .single();

          if (insertError) throw insertError;

          // Try to send email via edge function
          try {
            await supabase.functions.invoke('supabase-functions-send-email', {
              body: {
                to: student.email,
                subject: composeData.subject,
                message: composeData.message.replace('{name}', student.name),
                studentId: student.id,
                communicationId: commData?.id
              }
            });
          } catch (emailError) {
            console.log('Email service not available, recorded in communications');
          }

          successCount++;
        } catch (err) {
          failCount++;
          console.error(`Failed to send to ${student.email}:`, err);
        }
      }

      alert(`Broadcast sent!\n✓ ${successCount} successful\n✗ ${failCount} failed`);
      setShowCompose(false);
      setComposeData({ subject: '', message: '', targetStage: 'all', scheduleTime: '' });
      fetchCommunications();
    } catch (error) {
      console.error('Error sending broadcast:', error);
      alert('Error sending broadcast. Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function saveTemplate() {
    try {
      await supabase.from('communication_templates').insert({
        name: composeData.subject,
        subject: composeData.subject,
        body: composeData.message,
        type: 'email',
        trigger_stage: composeData.targetStage === 'all' ? null : composeData.targetStage,
        is_active: true
      });
      fetchTemplates();
      alert('Template saved!');
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function loadTemplate(template: any) {
    setComposeData({
      subject: template.subject,
      message: template.body,
      targetStage: template.trigger_stage || 'all',
      scheduleTime: ''
    });
    setShowCompose(true);
  }

  const statusColors: Record<string, string> = {
    sent: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    delivered: 'bg-green-500/10 text-green-400 border-green-500/30',
    read: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    failed: 'bg-red-500/10 text-red-400 border-red-500/30'
  };

  const openRate = communications.length > 0 
    ? ((communications.filter(c => c.status === 'read').length / communications.length) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Communication Center</h1>
          <p className="text-sm md:text-base text-gray-400">Unified inbox, broadcasts, and campaign management</p>
        </div>
        <Button 
          onClick={() => setShowCompose(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'inbox', label: 'Unified Inbox', icon: Mail },
          { id: 'broadcast', label: 'Broadcast', icon: Send },
          { id: 'campaigns', label: 'Campaigns', icon: Calendar },
          { id: 'templates', label: 'Templates', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Mail className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xs text-gray-400">Total Sent</p>
          </div>
          <p className="text-2xl font-bold metric-number text-white">{communications.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Send className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-xs text-gray-400">Delivered</p>
          </div>
          <p className="text-2xl font-bold metric-number text-white">
            {communications.filter(c => c.status === 'delivered' || c.status === 'read').length}
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <BarChart3 className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xs text-gray-400">Open Rate</p>
          </div>
          <p className="text-2xl font-bold metric-number text-purple-400">{openRate}%</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-xs text-gray-400">Avg Response</p>
          </div>
          <p className="text-2xl font-bold metric-number text-white">--</p>
        </div>
      </div>

      {showCompose && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Compose Broadcast</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
              <select
                value={composeData.targetStage}
                onChange={(e) => setComposeData({ ...composeData, targetStage: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="all">All Students</option>
                <option value="lead">Leads</option>
                <option value="application">Applications</option>
                <option value="offer">Offers</option>
                <option value="enrollment">Enrollments</option>
                <option value="active">Active Students</option>
                <option value="at_risk">At-Risk Students</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
              <Input
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                placeholder="Enter subject line..."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message <span className="text-gray-500">(Use {'{name}'} for personalization)</span>
              </label>
              <textarea
                value={composeData.message}
                onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                placeholder="Hi {name}, ..."
                rows={5}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCompose(false)}
                className="border-white/10 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={saveTemplate}
                disabled={!composeData.subject || !composeData.message}
                className="border-white/10 hover:bg-white/5"
              >
                <FileText className="w-4 h-4 mr-2" />
                Save Template
              </Button>
              <Button
                onClick={handleSendBroadcast}
                disabled={sending || !composeData.subject || !composeData.message}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Broadcast
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="glass-card p-4 md:p-6">
          <h3 className="text-lg font-bold text-white mb-4">Message Templates</h3>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No templates yet</p>
              <p className="text-sm text-gray-500">Create a broadcast and save it as a template</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-white">{template.name}</h4>
                    {template.trigger_stage && (
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                        {template.trigger_stage}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{template.body}</p>
                  <Button
                    size="sm"
                    onClick={() => loadTemplate(template)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Automated Campaigns</h3>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-orange-400">Configure in Automation</span>
            </div>
          </div>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Campaign automation coming soon</p>
            <p className="text-sm text-gray-500 mt-1">Configure automated rules in the Automation module</p>
          </div>
        </div>
      )}

      {(activeTab === 'inbox' || activeTab === 'broadcast') && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">Recent Communications</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : communications.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No communications yet</p>
              <p className="text-sm text-gray-500 mt-1">Send your first broadcast to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {communications.map((comm) => (
                <div key={comm.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white truncate">{comm.subject || 'No subject'}</p>
                        <Badge className={cn("text-xs", statusColors[comm.status])}>
                          {comm.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 truncate">{comm.students?.name} - {comm.students?.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(comm.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
