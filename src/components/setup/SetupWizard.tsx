import { useState, useEffect } from 'react';
import { Sparkles, Building2, GraduationCap, Workflow, Users, MessageSquare, Brain, Check, ArrowRight, ArrowLeft, Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SetupWizardProps {
  onComplete: () => void;
  isSettings?: boolean;
}

const steps = [
  { id: 1, title: 'University Profile', icon: Building2 },
  { id: 2, title: 'Programs', icon: GraduationCap },
  { id: 3, title: 'Lifecycle Stages', icon: Workflow },
  { id: 4, title: 'Team Members', icon: Users },
  { id: 5, title: 'Templates', icon: MessageSquare },
  { id: 6, title: 'AI Settings', icon: Brain },
];

export function SetupWizard({ onComplete, isSettings = false }: SetupWizardProps) {
  const { profile, university } = useAuth();
  const universityId = profile?.university_id;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [universityData, setUniversityData] = useState({
    name: university?.name || '',
    campuses: ['Main Campus'],
    departments: ['Engineering', 'Business', 'Arts & Sciences'],
  });
  const [programs, setPrograms] = useState([
    { name: '', department: '', intake_date: '', capacity: 100 }
  ]);
  const [teamInvites, setTeamInvites] = useState([
    { email: '', role: 'admissions' }
  ]);
  const [templates, setTemplates] = useState([
    { name: 'Welcome Email', subject: 'Welcome to {university}!', body: 'Hi {name}, welcome to our university!', type: 'email', trigger_stage: 'lead' }
  ]);
  const [aiSettings, setAiSettings] = useState({
    risk_threshold_high: 70,
    risk_threshold_moderate: 40,
    engagement_threshold_low: 40,
    inactivity_days_warning: 5,
    inactivity_days_critical: 10,
    auto_alerts_enabled: true,
    auto_recommendations_enabled: true
  });

  useEffect(() => {
    if (university?.name) {
      setUniversityData(prev => ({ ...prev, name: university.name }));
    }
  }, [university]);

  async function saveUniversityProfile() {
    setLoading(true);
    try {
      // Get university ID from profile
      const uniId = (profile as any)?.university_id;
      
      if (!uniId) {
        console.error('No university ID found in profile:', profile);
        alert('Unable to save. Please try logging out and back in.');
        setLoading(false);
        return;
      }
      
      // Get current settings first
      const { data: currentUni } = await supabase
        .from('universities')
        .select('settings')
        .eq('id', uniId)
        .single();
      
      const currentSettings = (currentUni?.settings as any) || {};
      
      // Update the universities table with the settings
      const { error } = await supabase.from('universities').update({
        name: universityData.name,
        settings: {
          ...currentSettings,
          campuses: universityData.campuses,
          departments: universityData.departments,
          setup_step: 1
        }
      }).eq('id', uniId);
      
      if (error) {
        console.error('Save error:', error);
        throw error;
      }
      
      setCurrentStep(2);
    } catch (error: any) {
      console.error('Error saving university profile:', error);
      alert('Error saving: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function savePrograms() {
    setLoading(true);
    try {
      const uniId = (profile as any)?.university_id;
      const validPrograms = programs.filter(p => p.name && p.department);
      
      if (validPrograms.length > 0 && uniId) {
        const { error } = await supabase.from('programs').insert(
          validPrograms.map(p => ({
            name: p.name,
            department: p.department,
            intake_date: p.intake_date || new Date().toISOString().split('T')[0],
            capacity: p.capacity,
            enrolled: 0,
            university_id: uniId
          }))
        );
        if (error) throw error;
      }
      
      // Get current settings and update
      if (uniId) {
        const { data: currentUni } = await supabase
          .from('universities')
          .select('settings')
          .eq('id', uniId)
          .single();
        
        const currentSettings = (currentUni?.settings as any) || {};
        
        await supabase.from('universities').update({ 
          settings: { ...currentSettings, setup_step: 2 } 
        }).eq('id', uniId);
      }
      
      setCurrentStep(3);
    } catch (error: any) {
      console.error('Error saving programs:', error);
      alert('Error saving: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function saveLifecycleStages() {
    setLoading(true);
    try {
      const uniId = (profile as any)?.university_id;
      
      if (uniId) {
        const defaultRules = [
          { name: 'Low Engagement Alert', trigger_type: 'condition_based', trigger_config: { condition: 'engagement_low' }, action_type: 'create_alert', action_config: {}, is_active: true, university_id: uniId },
          { name: 'Inactivity Warning', trigger_type: 'condition_based', trigger_config: { condition: 'inactive_7_days' }, action_type: 'create_alert', action_config: {}, is_active: true, university_id: uniId },
          { name: 'High Risk Alert', trigger_type: 'condition_based', trigger_config: { condition: 'risk_high' }, action_type: 'create_alert', action_config: {}, is_active: true, university_id: uniId }
        ];
        await supabase.from('automation_rules').insert(defaultRules);
        
        // Get and update settings
        const { data: currentUni } = await supabase.from('universities').select('settings').eq('id', uniId).single();
        const currentSettings = (currentUni?.settings as any) || {};
        await supabase.from('universities').update({ settings: { ...currentSettings, setup_step: 3 } }).eq('id', uniId);
      }
      setCurrentStep(4);
    } catch (error: any) {
      console.error('Error saving lifecycle stages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveTeamInvites() {
    setLoading(true);
    try {
      const uniId = (profile as any)?.university_id;
      const validInvites = teamInvites.filter(i => i.email);
      
      if (validInvites.length > 0 && uniId) {
        const { error } = await supabase.from('team_invitations').insert(
          validInvites.map(i => ({
            email: i.email,
            role: i.role,
            status: 'pending',
            university_id: uniId
          }))
        );
        if (error) throw error;
      }
      
      if (uniId) {
        const { data: currentUni } = await supabase.from('universities').select('settings').eq('id', uniId).single();
        const currentSettings = (currentUni?.settings as any) || {};
        await supabase.from('universities').update({ settings: { ...currentSettings, setup_step: 4 } }).eq('id', uniId);
      }
      setCurrentStep(5);
    } catch (error: any) {
      console.error('Error saving team invites:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveTemplates() {
    setLoading(true);
    try {
      const uniId = (profile as any)?.university_id;
      const validTemplates = templates.filter(t => t.name && t.subject && t.body);
      
      if (validTemplates.length > 0 && uniId) {
        const { error } = await supabase.from('email_templates').insert(
          validTemplates.map(t => ({
            ...t,
            university_id: uniId,
            body_html: t.body,
            category: 'custom'
          }))
        );
        if (error) throw error;
      }
      
      if (uniId) {
        const { data: currentUni } = await supabase.from('universities').select('settings').eq('id', uniId).single();
        const currentSettings = (currentUni?.settings as any) || {};
        await supabase.from('universities').update({ settings: { ...currentSettings, setup_step: 5 } }).eq('id', uniId);
      }
      setCurrentStep(6);
    } catch (error: any) {
      console.error('Error saving templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveAISettings() {
    setLoading(true);
    try {
      const uniId = (profile as any)?.university_id;
      
      if (!uniId) {
        alert('No university found. Please try logging out and back in.');
        setLoading(false);
        return;
      }
      
      // Save AI settings to university settings
      const { data: currentUni } = await supabase
        .from('universities')
        .select('settings')
        .eq('id', uniId)
        .single();
      
      const currentSettings = (currentUni?.settings as any) || {};
      
      const { error } = await supabase.from('universities').update({ 
        settings: {
          ...currentSettings,
          setup_completed: true,
          setup_step: 6,
          ai_settings: aiSettings
        }
      }).eq('id', uniId);
      
      if (error) throw error;
      onComplete();
    } catch (error: any) {
      console.error('Error saving AI settings:', error);
      alert('Error saving: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  const handleNext = () => {
    switch (currentStep) {
      case 1: saveUniversityProfile(); break;
      case 2: savePrograms(); break;
      case 3: saveLifecycleStages(); break;
      case 4: saveTeamInvites(); break;
      case 5: saveTemplates(); break;
      case 6: saveAISettings(); break;
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] flex">
      <div className="w-64 bg-[#1a1f2e] border-r border-white/10 p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">WorldLynk</h1>
            <p className="text-xs text-gray-400">Setup Wizard</p>
          </div>
        </div>

        <div className="space-y-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive && "bg-orange-500/10 border border-orange-500/30",
                  isCompleted && "text-green-400",
                  !isActive && !isCompleted && "text-gray-500"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isActive && "bg-orange-500/20",
                  isCompleted && "bg-green-500/20",
                  !isActive && !isCompleted && "bg-white/5"
                )}>
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Icon className={cn("w-4 h-4", isActive ? "text-orange-400" : "text-gray-500")} />
                  )}
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  isActive && "text-orange-400",
                  isCompleted && "text-green-400"
                )}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">University Profile</h2>
                <p className="text-gray-400">Set up your university's basic information</p>
              </div>

              <div className="glass-card p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">University Name *</label>
                  <Input
                    value={universityData.name}
                    onChange={(e) => setUniversityData({ ...universityData, name: e.target.value })}
                    placeholder="Enter university name"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Campuses</label>
                  {universityData.campuses.map((campus, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <Input
                        value={campus}
                        onChange={(e) => {
                          const newCampuses = [...universityData.campuses];
                          newCampuses[idx] = e.target.value;
                          setUniversityData({ ...universityData, campuses: newCampuses });
                        }}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      {universityData.campuses.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setUniversityData({
                            ...universityData,
                            campuses: universityData.campuses.filter((_, i) => i !== idx)
                          })}
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUniversityData({
                      ...universityData,
                      campuses: [...universityData.campuses, '']
                    })}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Campus
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Departments</label>
                  {universityData.departments.map((dept, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <Input
                        value={dept}
                        onChange={(e) => {
                          const newDepts = [...universityData.departments];
                          newDepts[idx] = e.target.value;
                          setUniversityData({ ...universityData, departments: newDepts });
                        }}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      {universityData.departments.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setUniversityData({
                            ...universityData,
                            departments: universityData.departments.filter((_, i) => i !== idx)
                          })}
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUniversityData({
                      ...universityData,
                      departments: [...universityData.departments, '']
                    })}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Department
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Program Catalog</h2>
                <p className="text-gray-400">Add your programs with intake dates and capacity</p>
              </div>

              <div className="space-y-4">
                {programs.map((program, idx) => (
                  <div key={idx} className="glass-card p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white">Program {idx + 1}</h3>
                      {programs.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPrograms(programs.filter((_, i) => i !== idx))}
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Program Name</label>
                        <Input
                          value={program.name}
                          onChange={(e) => {
                            const newPrograms = [...programs];
                            newPrograms[idx].name = e.target.value;
                            setPrograms(newPrograms);
                          }}
                          placeholder="e.g., Computer Science BSc"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Department</label>
                        <select
                          value={program.department}
                          onChange={(e) => {
                            const newPrograms = [...programs];
                            newPrograms[idx].department = e.target.value;
                            setPrograms(newPrograms);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                        >
                          <option value="">Select department</option>
                          {universityData.departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Intake Date</label>
                        <Input
                          type="date"
                          value={program.intake_date}
                          onChange={(e) => {
                            const newPrograms = [...programs];
                            newPrograms[idx].intake_date = e.target.value;
                            setPrograms(newPrograms);
                          }}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Capacity</label>
                        <Input
                          type="number"
                          value={program.capacity}
                          onChange={(e) => {
                            const newPrograms = [...programs];
                            newPrograms[idx].capacity = parseInt(e.target.value) || 0;
                            setPrograms(newPrograms);
                          }}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setPrograms([...programs, { name: '', department: '', intake_date: '', capacity: 100 }])}
                  className="w-full border-white/10 hover:bg-white/5"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Program
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Lifecycle Stages</h2>
                <p className="text-gray-400">Configure your student lifecycle stages and automation rules</p>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Default Lifecycle Stages</h3>
                <div className="flex flex-wrap gap-2">
                  {['Lead', 'Application', 'Offer', 'Acceptance', 'Enrollment', 'Onboarding', 'Active', 'At-Risk', 'Retained', 'Dropped'].map((stage) => (
                    <div key={stage} className="px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm">
                      {stage}
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Default Automation Rules</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm text-white">Low Engagement Alert - Triggers when engagement score drops below 40</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm text-white">Inactivity Warning - Triggers after 7 days of inactivity</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm text-white">High Risk Alert - Triggers when risk score exceeds 70</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Team Members</h2>
                <p className="text-gray-400">Invite team members and assign roles</p>
              </div>

              <div className="space-y-4">
                {teamInvites.map((invite, idx) => (
                  <div key={idx} className="glass-card p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">Email</label>
                        <Input
                          type="email"
                          value={invite.email}
                          onChange={(e) => {
                            const newInvites = [...teamInvites];
                            newInvites[idx].email = e.target.value;
                            setTeamInvites(newInvites);
                          }}
                          placeholder="colleague@university.edu"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="w-48">
                        <label className="block text-xs text-gray-400 mb-1">Role</label>
                        <select
                          value={invite.role}
                          onChange={(e) => {
                            const newInvites = [...teamInvites];
                            newInvites[idx].role = e.target.value;
                            setTeamInvites(newInvites);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                        >
                          <option value="admissions">Admissions</option>
                          <option value="student_success">Student Success</option>
                          <option value="marketing">Marketing</option>
                          <option value="international_office">International Office</option>
                          <option value="academic_manager">Academic Manager</option>
                          <option value="finance">Finance</option>
                        </select>
                      </div>
                      {teamInvites.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTeamInvites(teamInvites.filter((_, i) => i !== idx))}
                          className="mt-5"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setTeamInvites([...teamInvites, { email: '', role: 'admissions' }])}
                  className="w-full border-white/10 hover:bg-white/5"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Communication Templates</h2>
                <p className="text-gray-400">Set up email templates for automated communications</p>
              </div>

              <div className="space-y-4">
                {templates.map((template, idx) => (
                  <div key={idx} className="glass-card p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white">Template {idx + 1}</h3>
                      {templates.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTemplates(templates.filter((_, i) => i !== idx))}
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Template Name</label>
                        <Input
                          value={template.name}
                          onChange={(e) => {
                            const newTemplates = [...templates];
                            newTemplates[idx].name = e.target.value;
                            setTemplates(newTemplates);
                          }}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Trigger Stage</label>
                        <select
                          value={template.trigger_stage}
                          onChange={(e) => {
                            const newTemplates = [...templates];
                            newTemplates[idx].trigger_stage = e.target.value;
                            setTemplates(newTemplates);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                        >
                          <option value="lead">Lead</option>
                          <option value="application">Application</option>
                          <option value="offer">Offer</option>
                          <option value="acceptance">Acceptance</option>
                          <option value="enrollment">Enrollment</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Subject</label>
                      <Input
                        value={template.subject}
                        onChange={(e) => {
                          const newTemplates = [...templates];
                          newTemplates[idx].subject = e.target.value;
                          setTemplates(newTemplates);
                        }}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Body (use {'{name}'} for personalization)</label>
                      <textarea
                        value={template.body}
                        onChange={(e) => {
                          const newTemplates = [...templates];
                          newTemplates[idx].body = e.target.value;
                          setTemplates(newTemplates);
                        }}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white resize-none"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setTemplates([...templates, { name: '', subject: '', body: '', type: 'email', trigger_stage: 'lead' }])}
                  className="w-full border-white/10 hover:bg-white/5"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Template
                </Button>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">AI Settings</h2>
                <p className="text-gray-400">Configure AI thresholds and automation preferences</p>
              </div>

              <div className="glass-card p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Risk Thresholds</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">High Risk Threshold</label>
                      <Input
                        type="number"
                        value={aiSettings.risk_threshold_high}
                        onChange={(e) => setAiSettings({ ...aiSettings, risk_threshold_high: parseInt(e.target.value) })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">Students above this score are flagged as critical</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Moderate Risk Threshold</label>
                      <Input
                        type="number"
                        value={aiSettings.risk_threshold_moderate}
                        onChange={(e) => setAiSettings({ ...aiSettings, risk_threshold_moderate: parseInt(e.target.value) })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">Students above this score need attention</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Engagement Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Low Engagement Threshold</label>
                      <Input
                        type="number"
                        value={aiSettings.engagement_threshold_low}
                        onChange={(e) => setAiSettings({ ...aiSettings, engagement_threshold_low: parseInt(e.target.value) })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Inactivity Warning (days)</label>
                      <Input
                        type="number"
                        value={aiSettings.inactivity_days_warning}
                        onChange={(e) => setAiSettings({ ...aiSettings, inactivity_days_warning: parseInt(e.target.value) })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Automation</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.auto_alerts_enabled}
                        onChange={(e) => setAiSettings({ ...aiSettings, auto_alerts_enabled: e.target.checked })}
                        className="w-4 h-4 rounded border-white/10 bg-white/5"
                      />
                      <span className="text-sm text-white">Enable automatic AI alerts</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.auto_recommendations_enabled}
                        onChange={(e) => setAiSettings({ ...aiSettings, auto_recommendations_enabled: e.target.checked })}
                        className="w-4 h-4 rounded border-white/10 bg-white/5"
                      />
                      <span className="text-sm text-white">Enable automatic recommendations</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="border-white/10 hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {!isSettings && (
                <Button
                  variant="ghost"
                  onClick={async () => {
                    const uniId = (profile as any)?.university_id;
                    if (uniId) {
                      const { data: currentUni } = await supabase.from('universities').select('settings').eq('id', uniId).single();
                      const currentSettings = (currentUni?.settings as any) || {};
                      await supabase.from('universities').update({ 
                        settings: { ...currentSettings, setup_completed: true, setup_skipped: true } 
                      }).eq('id', uniId);
                    }
                    onComplete();
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  Skip Setup
                </Button>
              )}
            </div>
            <Button
              onClick={handleNext}
              disabled={loading || (currentStep === 1 && !universityData.name)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : currentStep === 6 ? (
                <><Check className="w-4 h-4 mr-2" />Complete Setup</>
              ) : (
                <><ArrowRight className="w-4 h-4 mr-2" />Next</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
