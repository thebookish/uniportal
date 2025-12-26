import { useState, useEffect } from 'react';
import { Workflow, Plus, Play, Pause, Trash2, Loader2, Zap, Clock, AlertTriangle, History, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function AutomationView() {
  const [rules, setRules] = useState<any[]>([]);
  const [executionLog, setExecutionLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'log'>('rules');
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    trigger_type: 'condition_based',
    trigger_condition: 'engagement_low',
    action_type: 'create_alert'
  });

  useEffect(() => {
    fetchRules();
    fetchExecutionLog();

    const channel = supabase
      .channel('automation-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'automation_rules' }, () => {
        fetchRules();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_alerts' }, () => {
        fetchExecutionLog();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchRules() {
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchExecutionLog() {
    try {
      const { data } = await supabase
        .from('ai_alerts')
        .select('*, students(name)')
        .order('created_at', { ascending: false })
        .limit(50);
      setExecutionLog(data || []);
    } catch (error) {
      console.error('Error fetching log:', error);
    }
  }

  async function testRule(ruleId: string) {
    setTesting(ruleId);
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;

      let query = supabase.from('students').select('id, name');
      
      if (rule.trigger_config?.condition === 'engagement_low') {
        query = query.lt('engagement_score', 40);
      } else if (rule.trigger_config?.condition === 'risk_high') {
        query = query.gte('risk_score', 70);
      }

      const { data: students } = await query.limit(1);

      if (students && students.length > 0) {
        await supabase.from('ai_alerts').insert({
          severity: 'info',
          title: `Test: ${rule.name}`,
          description: `Rule test executed for ${students[0].name}`,
          student_id: students[0].id,
          recommendations: ['This is a test execution'],
          read: false
        });
        alert('Test successful! Check the execution log.');
        fetchExecutionLog();
      } else {
        alert('No matching students found for this rule condition.');
      }
    } catch (error) {
      console.error('Error testing rule:', error);
    } finally {
      setTesting(null);
    }
  }

  async function handleCreateRule() {
    setCreating(true);
    try {
      const { error } = await supabase.from('automation_rules').insert({
        name: newRule.name,
        description: newRule.description,
        trigger_type: newRule.trigger_type,
        trigger_config: { condition: newRule.trigger_condition },
        action_type: newRule.action_type,
        action_config: {},
        is_active: true
      });

      if (error) throw error;
      setShowCreate(false);
      setNewRule({
        name: '',
        description: '',
        trigger_type: 'condition_based',
        trigger_condition: 'engagement_low',
        action_type: 'create_alert'
      });
      fetchRules();
    } catch (error) {
      console.error('Error creating rule:', error);
    } finally {
      setCreating(false);
    }
  }

  async function toggleRule(ruleId: string, isActive: boolean) {
    try {
      await supabase
        .from('automation_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);
      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  }

  async function deleteRule(ruleId: string) {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await supabase.from('automation_rules').delete().eq('id', ruleId);
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  }

  const triggerIcons: Record<string, any> = {
    time_based: Clock,
    event_based: Zap,
    condition_based: AlertTriangle
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Workflow Automation</h1>
          <p className="text-sm md:text-base text-gray-400">Create and manage automated workflows</p>
        </div>
        <Button 
          onClick={() => setShowCreate(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Play className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400">Active Rules</p>
          </div>
          <p className="text-2xl font-bold metric-number text-white">
            {rules.filter(r => r.is_active).length}
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Pause className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-sm text-gray-400">Paused Rules</p>
          </div>
          <p className="text-2xl font-bold metric-number text-white">
            {rules.filter(r => !r.is_active).length}
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400">Total Executions</p>
          </div>
          <p className="text-2xl font-bold metric-number text-white">{executionLog.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'rules'
              ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Workflow className="w-4 h-4 inline mr-2" />
          Rules
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'log'
              ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <History className="w-4 h-4 inline mr-2" />
          Execution Log
        </button>
      </div>

      {showCreate && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Create Automation Rule</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rule Name</label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="e.g., Low Engagement Alert"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <Input
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                placeholder="Describe what this rule does..."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Trigger Type</label>
                <select
                  value={newRule.trigger_type}
                  onChange={(e) => setNewRule({ ...newRule, trigger_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="condition_based">Condition Based</option>
                  <option value="time_based">Time Based</option>
                  <option value="event_based">Event Based</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Condition</label>
                <select
                  value={newRule.trigger_condition}
                  onChange={(e) => setNewRule({ ...newRule, trigger_condition: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="engagement_low">Engagement Score &lt; 40</option>
                  <option value="inactive_7_days">Inactive for 7 days</option>
                  <option value="risk_high">Risk Score &gt; 70</option>
                  <option value="documents_pending">Documents Pending</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Action</label>
              <select
                value={newRule.action_type}
                onChange={(e) => setNewRule({ ...newRule, action_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="create_alert">Create AI Alert</option>
                <option value="send_email">Send Email</option>
                <option value="assign_counselor">Assign Counselor</option>
                <option value="update_stage">Update Stage</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreate(false)}
                className="border-white/10 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRule}
                disabled={creating || !newRule.name}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Rule'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">Automation Rules</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : rules.length === 0 ? (
            <div className="p-8 text-center">
              <Workflow className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No automation rules yet</p>
              <p className="text-sm text-gray-500 mt-1">Create your first rule to automate workflows</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {rules.map((rule) => {
                const TriggerIcon = triggerIcons[rule.trigger_type] || Workflow;
                return (
                  <div key={rule.id} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          rule.is_active ? "bg-green-500/10" : "bg-gray-500/10"
                        )}>
                          <TriggerIcon className={cn(
                            "w-5 h-5",
                            rule.is_active ? "text-green-400" : "text-gray-400"
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-white">{rule.name}</p>
                            <Badge className={cn(
                              "text-xs",
                              rule.is_active 
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : "bg-gray-500/10 text-gray-400 border-gray-500/30"
                            )}>
                              {rule.is_active ? 'Active' : 'Paused'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">{rule.description || 'No description'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {rule.trigger_type} → {rule.action_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => testRule(rule.id)}
                          disabled={testing === rule.id}
                          className="hover:bg-blue-500/10"
                          title="Test Rule"
                        >
                          {testing === rule.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                          ) : (
                            <TestTube className="w-4 h-4 text-blue-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleRule(rule.id, rule.is_active)}
                          className="hover:bg-white/5"
                        >
                          {rule.is_active ? (
                            <Pause className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Play className="w-4 h-4 text-green-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRule(rule.id)}
                          className="hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'log' && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">Execution Log</h3>
          </div>
          {executionLog.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No executions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {executionLog.map((log) => (
                <div key={log.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white">{log.title}</p>
                        <Badge className={cn(
                          "text-xs",
                          log.severity === 'critical' ? "bg-red-500/10 text-red-400 border-red-500/30" :
                          log.severity === 'warning' ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                          "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        )}>
                          {log.severity}
                        </Badge>
                        <Badge className={cn(
                          "text-xs",
                          log.read ? "bg-gray-500/10 text-gray-400 border-gray-500/30" : "bg-green-500/10 text-green-400 border-green-500/30"
                        )}>
                          {log.read ? 'Read' : 'Unread'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">{log.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Student: {log.students?.name || 'N/A'} • {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
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
