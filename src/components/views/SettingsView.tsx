import { useState } from 'react';
import { 
  Settings, 
  Building2, 
  GraduationCap, 
  Workflow, 
  Users, 
  MessageSquare, 
  Brain,
  ChevronRight,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const settingsSections = [
  { id: 'university', title: 'University Profile', icon: Building2, description: 'Update university name, campuses, and departments' },
  { id: 'programs', title: 'Programs', icon: GraduationCap, description: 'Manage programs and intakes' },
  { id: 'automation', title: 'Automation Rules', icon: Workflow, description: 'Configure lifecycle automation' },
  { id: 'team', title: 'Team Members', icon: Users, description: 'Manage team invitations' },
  { id: 'templates', title: 'Email Templates', icon: MessageSquare, description: 'Customize communication templates' },
  { id: 'ai', title: 'AI Settings', icon: Brain, description: 'Configure AI thresholds and alerts' },
];

export function SettingsView() {
  const { profile, university } = useAuth();
  const universityId = profile?.university_id;
  
  const [activeSection, setActiveSection] = useState('university');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [universityData, setUniversityData] = useState({
    name: university?.name || '',
    campuses: (university?.settings as any)?.campuses || ['Main Campus'],
    departments: (university?.settings as any)?.departments || ['Engineering', 'Business', 'Arts & Sciences'],
  });
  
  const [aiSettings, setAiSettings] = useState({
    risk_threshold_high: (university?.settings as any)?.ai_settings?.risk_threshold_high || 70,
    risk_threshold_moderate: (university?.settings as any)?.ai_settings?.risk_threshold_moderate || 40,
    engagement_threshold_low: (university?.settings as any)?.ai_settings?.engagement_threshold_low || 40,
    inactivity_days_warning: (university?.settings as any)?.ai_settings?.inactivity_days_warning || 5,
    inactivity_days_critical: (university?.settings as any)?.ai_settings?.inactivity_days_critical || 10,
    auto_alerts_enabled: (university?.settings as any)?.ai_settings?.auto_alerts_enabled ?? true,
    auto_recommendations_enabled: (university?.settings as any)?.ai_settings?.auto_recommendations_enabled ?? true
  });

  async function handleSaveUniversity() {
    setLoading(true);
    try {
      const { data: currentUni } = await supabase
        .from('universities')
        .select('settings')
        .eq('id', universityId)
        .single();
      
      const currentSettings = currentUni?.settings || {};
      
      const { error } = await supabase.from('universities').update({
        name: universityData.name,
        settings: {
          ...currentSettings,
          campuses: universityData.campuses,
          departments: universityData.departments,
        }
      }).eq('id', universityId);
      
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAI() {
    setLoading(true);
    try {
      const { data: currentUni } = await supabase
        .from('universities')
        .select('settings')
        .eq('id', universityId)
        .single();
      
      const currentSettings = currentUni?.settings || {};
      
      const { error } = await supabase.from('universities').update({
        settings: {
          ...currentSettings,
          ai_settings: aiSettings
        }
      }).eq('id', universityId);
      
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'university':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">University Name</label>
              <Input
                value={universityData.name}
                onChange={(e) => setUniversityData({ ...universityData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter university name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Campuses</label>
              <div className="space-y-2">
                {universityData.campuses.map((campus, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={campus}
                      onChange={(e) => {
                        const newCampuses = [...universityData.campuses];
                        newCampuses[idx] = e.target.value;
                        setUniversityData({ ...universityData, campuses: newCampuses });
                      }}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newCampuses = universityData.campuses.filter((_, i) => i !== idx);
                        setUniversityData({ ...universityData, campuses: newCampuses });
                      }}
                      className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUniversityData({ ...universityData, campuses: [...universityData.campuses, ''] })}
                  className="border-white/10 hover:bg-white/5"
                >
                  + Add Campus
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Departments</label>
              <div className="space-y-2">
                {universityData.departments.map((dept, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={dept}
                      onChange={(e) => {
                        const newDepts = [...universityData.departments];
                        newDepts[idx] = e.target.value;
                        setUniversityData({ ...universityData, departments: newDepts });
                      }}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDepts = universityData.departments.filter((_, i) => i !== idx);
                        setUniversityData({ ...universityData, departments: newDepts });
                      }}
                      className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUniversityData({ ...universityData, departments: [...universityData.departments, ''] })}
                  className="border-white/10 hover:bg-white/5"
                >
                  + Add Department
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSaveUniversity}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">High Risk Threshold</label>
                <Input
                  type="number"
                  value={aiSettings.risk_threshold_high}
                  onChange={(e) => setAiSettings({ ...aiSettings, risk_threshold_high: parseInt(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Students above this score are critical</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Moderate Risk Threshold</label>
                <Input
                  type="number"
                  value={aiSettings.risk_threshold_moderate}
                  onChange={(e) => setAiSettings({ ...aiSettings, risk_threshold_moderate: parseInt(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Students above this score need attention</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Low Engagement Threshold</label>
                <Input
                  type="number"
                  value={aiSettings.engagement_threshold_low}
                  onChange={(e) => setAiSettings({ ...aiSettings, engagement_threshold_low: parseInt(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Inactivity Warning (days)</label>
                <Input
                  type="number"
                  value={aiSettings.inactivity_days_warning}
                  onChange={(e) => setAiSettings({ ...aiSettings, inactivity_days_warning: parseInt(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Inactivity Critical (days)</label>
                <Input
                  type="number"
                  value={aiSettings.inactivity_days_critical}
                  onChange={(e) => setAiSettings({ ...aiSettings, inactivity_days_critical: parseInt(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={aiSettings.auto_alerts_enabled}
                  onChange={(e) => setAiSettings({ ...aiSettings, auto_alerts_enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500"
                />
                <span className="text-white">Enable automatic AI alerts</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={aiSettings.auto_recommendations_enabled}
                  onChange={(e) => setAiSettings({ ...aiSettings, auto_recommendations_enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500"
                />
                <span className="text-white">Enable automatic recommendations</span>
              </label>
            </div>

            <Button
              onClick={handleSaveAI}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save AI Settings
            </Button>
          </div>
        );

      case 'programs':
        return (
          <div className="text-center py-8 text-gray-400">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Programs can be managed from the Programs view in the sidebar</p>
            <p className="text-sm mt-1">Navigate to Programs to add, edit, or remove programs</p>
          </div>
        );

      case 'automation':
        return (
          <div className="text-center py-8 text-gray-400">
            <Workflow className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Automation rules can be managed from the Automation view</p>
            <p className="text-sm mt-1">Navigate to Automation to configure workflows</p>
          </div>
        );

      case 'team':
        return (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Team members can be managed from the Counselors view</p>
            <p className="text-sm mt-1">Navigate to Counselors to invite team members</p>
          </div>
        );

      case 'templates':
        return (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Email templates can be managed from the Communications view</p>
            <p className="text-sm mt-1">Navigate to Communications to manage templates</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-orange-400" />
            Settings
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure your university portal settings
          </p>
        </div>
        {saved && (
          <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-lg border border-green-500/30">
            ✓ Saved successfully
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="glass-card p-4">
          <div className="space-y-1">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                    isActive 
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{section.title}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {settingsSections.find(s => s.id === activeSection)?.title}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {settingsSections.find(s => s.id === activeSection)?.description}
          </p>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
