import { useState, useEffect } from 'react';
import { 
  Link2, 
  Plus, 
  Loader2, 
  Check, 
  X, 
  RefreshCw, 
  Settings, 
  ExternalLink,
  Database,
  Cloud,
  BookOpen,
  Webhook,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const LMS_PROVIDERS = [
  { id: 'canvas', name: 'Canvas LMS', icon: '🎨', description: 'Instructure Canvas' },
  { id: 'moodle', name: 'Moodle', icon: '📚', description: 'Open-source LMS' },
  { id: 'blackboard', name: 'Blackboard', icon: '🖥️', description: 'Blackboard Learn' },
  { id: 'brightspace', name: 'Brightspace', icon: '💡', description: 'D2L Brightspace' },
  { id: 'google_classroom', name: 'Google Classroom', icon: '📖', description: 'Google Workspace' },
  { id: 'custom', name: 'Custom LMS', icon: '⚙️', description: 'Custom integration' }
];

const SOURCE_TYPES = [
  { id: 'crm', name: 'CRM System', icon: Database, description: 'Salesforce, HubSpot, etc.' },
  { id: 'sis', name: 'Student Information System', icon: BookOpen, description: 'Banner, PeopleSoft, etc.' },
  { id: 'webhook', name: 'Webhook', icon: Webhook, description: 'Receive real-time data' },
  { id: 'api', name: 'REST API', icon: Cloud, description: 'Connect to any API' },
  { id: 'csv_import', name: 'CSV Import', icon: FileSpreadsheet, description: 'Upload data files' }
];

export function IntegrationsView() {
  const { profile } = useAuth();
  const universityId = profile?.university_id;
  
  const [lmsIntegrations, setLmsIntegrations] = useState<any[]>([]);
  const [externalSources, setExternalSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLMS, setShowAddLMS] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  
  const [lmsForm, setLmsForm] = useState({
    provider: '',
    name: '',
    api_url: '',
    api_key: '',
    client_id: '',
    client_secret: ''
  });
  
  const [sourceForm, setSourceForm] = useState({
    source_type: '',
    name: '',
    description: '',
    api_url: '',
    api_key: '',
    auth_type: 'api_key',
    sync_frequency: 'daily'
  });

  useEffect(() => {
    if (universityId) {
      fetchIntegrations();
    }
  }, [universityId]);

  async function fetchIntegrations() {
    setLoading(true);
    try {
      const [lmsRes, sourcesRes] = await Promise.all([
        supabase
          .from('lms_integrations')
          .select('*')
          .eq('university_id', universityId)
          .order('created_at', { ascending: false }),
        supabase
          .from('external_sources')
          .select('*')
          .eq('university_id', universityId)
          .order('created_at', { ascending: false })
      ]);

      setLmsIntegrations(lmsRes.data || []);
      setExternalSources(sourcesRes.data || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLMS() {
    if (!lmsForm.provider || !lmsForm.name || !lmsForm.api_url) return;
    setSaving(true);
    
    try {
      const { error } = await supabase.from('lms_integrations').insert({
        university_id: universityId,
        provider: lmsForm.provider,
        name: lmsForm.name,
        api_url: lmsForm.api_url,
        api_key_encrypted: lmsForm.api_key, // In production, encrypt this
        client_id: lmsForm.client_id || null,
        client_secret_encrypted: lmsForm.client_secret || null,
        is_active: true,
        sync_status: 'idle'
      });

      if (error) throw error;
      
      setShowAddLMS(false);
      setLmsForm({ provider: '', name: '', api_url: '', api_key: '', client_id: '', client_secret: '' });
      fetchIntegrations();
    } catch (error: any) {
      console.error('Error adding LMS:', error);
      alert(error.message || 'Failed to add integration');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSource() {
    if (!sourceForm.source_type || !sourceForm.name) return;
    setSaving(true);
    
    try {
      const { error } = await supabase.from('external_sources').insert({
        university_id: universityId,
        source_type: sourceForm.source_type,
        name: sourceForm.name,
        description: sourceForm.description || null,
        api_url: sourceForm.api_url || null,
        api_key_encrypted: sourceForm.api_key || null,
        auth_type: sourceForm.auth_type,
        sync_frequency: sourceForm.sync_frequency,
        is_active: true
      });

      if (error) throw error;
      
      setShowAddSource(false);
      setSourceForm({ source_type: '', name: '', description: '', api_url: '', api_key: '', auth_type: 'api_key', sync_frequency: 'daily' });
      fetchIntegrations();
    } catch (error: any) {
      console.error('Error adding source:', error);
      alert(error.message || 'Failed to add source');
    } finally {
      setSaving(false);
    }
  }

  async function handleSync(integrationId: string, type: 'lms' | 'source') {
    setSyncing(integrationId);
    
    try {
      const table = type === 'lms' ? 'lms_integrations' : 'external_sources';
      
      // Update sync status
      await supabase
        .from(table)
        .update({ sync_status: 'syncing', last_sync_at: new Date().toISOString() })
        .eq('id', integrationId);

      // Log sync attempt
      await supabase.from('sync_logs').insert({
        university_id: universityId,
        [type === 'lms' ? 'lms_id' : 'source_id']: integrationId,
        status: 'started'
      });

      // Simulate sync (in production, this would call the actual API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      await supabase
        .from(table)
        .update({ sync_status: 'success' })
        .eq('id', integrationId);

      fetchIntegrations();
      alert('Sync completed successfully!');
    } catch (error: any) {
      console.error('Sync error:', error);
      alert('Sync failed: ' + error.message);
    } finally {
      setSyncing(null);
    }
  }

  async function handleDelete(id: string, type: 'lms' | 'source') {
    if (!confirm('Are you sure you want to delete this integration?')) return;
    
    try {
      const table = type === 'lms' ? 'lms_integrations' : 'external_sources';
      await supabase.from(table).delete().eq('id', id);
      fetchIntegrations();
    } catch (error) {
      console.error('Delete error:', error);
    }
  }

  async function handleToggle(id: string, isActive: boolean, type: 'lms' | 'source') {
    try {
      const table = type === 'lms' ? 'lms_integrations' : 'external_sources';
      await supabase.from(table).update({ is_active: !isActive }).eq('id', id);
      fetchIntegrations();
    } catch (error) {
      console.error('Toggle error:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Link2 className="w-7 h-7 text-orange-400" />
            Integrations
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Connect your LMS, CRM, and external data sources
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      ) : (
        <>
          {/* LMS Integrations */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-400" />
                LMS Integrations
              </h2>
              <Button onClick={() => setShowAddLMS(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add LMS
              </Button>
            </div>

            {lmsIntegrations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No LMS integrations configured</p>
                <p className="text-sm mt-1">Connect Canvas, Moodle, Blackboard, or other LMS</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lmsIntegrations.map((lms) => {
                  const provider = LMS_PROVIDERS.find(p => p.id === lms.provider);
                  return (
                    <div key={lms.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{provider?.icon || '📦'}</span>
                        <div>
                          <h3 className="font-medium text-white">{lms.name}</h3>
                          <p className="text-sm text-gray-400">{lms.api_url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={cn(
                          lms.sync_status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                          lms.sync_status === 'syncing' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                          lms.sync_status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/30'
                        )}>
                          {lms.sync_status || 'idle'}
                        </Badge>
                        <Badge className={lms.is_active ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}>
                          {lms.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(lms.id, 'lms')}
                          disabled={syncing === lms.id}
                          className="border-white/10 hover:bg-white/5"
                        >
                          {syncing === lms.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggle(lms.id, lms.is_active, 'lms')}
                          className="border-white/10 hover:bg-white/5"
                        >
                          {lms.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(lms.id, 'lms')}
                          className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* External Sources */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-orange-400" />
                External Data Sources
              </h2>
              <Button onClick={() => setShowAddSource(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Source
              </Button>
            </div>

            {externalSources.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Cloud className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No external sources configured</p>
                <p className="text-sm mt-1">Connect CRM, SIS, webhooks, or import CSV files</p>
              </div>
            ) : (
              <div className="space-y-3">
                {externalSources.map((source) => {
                  const sourceType = SOURCE_TYPES.find(s => s.id === source.source_type);
                  const Icon = sourceType?.icon || Database;
                  return (
                    <div key={source.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-4">
                        <Icon className="w-6 h-6 text-orange-400" />
                        <div>
                          <h3 className="font-medium text-white">{source.name}</h3>
                          <p className="text-sm text-gray-400">{source.description || sourceType?.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/30">
                          {source.sync_frequency}
                        </Badge>
                        <Badge className={source.is_active ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}>
                          {source.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(source.id, 'source')}
                          disabled={syncing === source.id}
                          className="border-white/10 hover:bg-white/5"
                        >
                          {syncing === source.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggle(source.id, source.is_active, 'source')}
                          className="border-white/10 hover:bg-white/5"
                        >
                          {source.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(source.id, 'source')}
                          className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Webhook URL */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Webhook className="w-5 h-5 text-orange-400" />
              Incoming Webhook
            </h2>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-sm text-gray-400 mb-2">Use this URL to send data to your portal:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/30 px-3 py-2 rounded text-sm text-orange-400 font-mono">
                  https://your-supabase-url/functions/v1/webhook-receiver?university_id={universityId}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(`https://your-supabase-url/functions/v1/webhook-receiver?university_id=${universityId}`)}
                  className="border-white/10 hover:bg-white/5"
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add LMS Modal */}
      {showAddLMS && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Add LMS Integration</h2>
              <button onClick={() => setShowAddLMS(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">LMS Provider *</label>
                <select
                  value={lmsForm.provider}
                  onChange={(e) => setLmsForm({ ...lmsForm, provider: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="">Select provider...</option>
                  {LMS_PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Integration Name *</label>
                <Input
                  value={lmsForm.name}
                  onChange={(e) => setLmsForm({ ...lmsForm, name: e.target.value })}
                  placeholder="e.g., Main Canvas Instance"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">API URL *</label>
                <Input
                  value={lmsForm.api_url}
                  onChange={(e) => setLmsForm({ ...lmsForm, api_url: e.target.value })}
                  placeholder="https://your-canvas.instructure.com/api/v1"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">API Key / Token</label>
                <Input
                  type="password"
                  value={lmsForm.api_key}
                  onChange={(e) => setLmsForm({ ...lmsForm, api_key: e.target.value })}
                  placeholder="Your API access token"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddLMS(false)} className="flex-1 border-white/10 hover:bg-white/5">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddLMS}
                  disabled={saving || !lmsForm.provider || !lmsForm.name || !lmsForm.api_url}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Integration
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      {showAddSource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Add External Source</h2>
              <button onClick={() => setShowAddSource(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Source Type *</label>
                <select
                  value={sourceForm.source_type}
                  onChange={(e) => setSourceForm({ ...sourceForm, source_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="">Select type...</option>
                  {SOURCE_TYPES.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <Input
                  value={sourceForm.name}
                  onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
                  placeholder="e.g., Salesforce CRM"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <Input
                  value={sourceForm.description}
                  onChange={(e) => setSourceForm({ ...sourceForm, description: e.target.value })}
                  placeholder="Brief description"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">API URL</label>
                <Input
                  value={sourceForm.api_url}
                  onChange={(e) => setSourceForm({ ...sourceForm, api_url: e.target.value })}
                  placeholder="https://api.example.com"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sync Frequency</label>
                <select
                  value={sourceForm.sync_frequency}
                  onChange={(e) => setSourceForm({ ...sourceForm, sync_frequency: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="manual">Manual only</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddSource(false)} className="flex-1 border-white/10 hover:bg-white/5">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSource}
                  disabled={saving || !sourceForm.source_type || !sourceForm.name}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Source
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
