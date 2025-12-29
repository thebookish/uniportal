import { useState, useEffect } from "react";
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
  Loader2,
  Plus,
  X,
  Trash2,
  Mail,
  UserX,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const settingsSections = [
  {
    id: "university",
    title: "University Profile",
    icon: Building2,
    description: "Update university name, campuses, and departments",
  },
  {
    id: "programs",
    title: "Programs",
    icon: GraduationCap,
    description: "Manage programs and intakes",
  },
  {
    id: "automation",
    title: "Automation Rules",
    icon: Workflow,
    description: "Configure lifecycle automation",
  },
  {
    id: "team",
    title: "Team Members",
    icon: Users,
    description: "Manage team invitations",
  },
  {
    id: "templates",
    title: "Email Templates",
    icon: MessageSquare,
    description: "Customize communication templates",
  },
  {
    id: "ai",
    title: "AI Settings",
    icon: Brain,
    description: "Configure AI thresholds and alerts",
  },
];

export function SettingsView() {
  const { profile } = useAuth();
  const universityId = (profile as any)?.university_id;

  const [activeSection, setActiveSection] = useState("university");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // University data
  const [universityData, setUniversityData] = useState({
    name: "",
    campuses: ["Main Campus"],
    departments: ["Engineering", "Business", "Arts & Sciences"],
  });

  // Programs data
  const [programs, setPrograms] = useState<any[]>([]);
  const [newProgram, setNewProgram] = useState({ name: "", department: "", capacity: 50 });

  // Team members
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [newInvite, setNewInvite] = useState({ 
    email: "", 
    name: "", 
    role: "admissions",
    permissions: {
      dashboard: true,
      students: true,
      admissions: true,
      communications: false,
      reports: false,
      settings: false,
    }
  });
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [newTemplate, setNewTemplate] = useState({ name: "", subject: "", body: "" });

  // AI settings
  const [aiSettings, setAiSettings] = useState({
    risk_threshold_high: 70,
    risk_threshold_moderate: 40,
    engagement_threshold_low: 40,
    inactivity_days_warning: 5,
    inactivity_days_critical: 10,
    auto_alerts_enabled: true,
    auto_recommendations_enabled: true,
  });

  // Automation rules
  const [automationRules, setAutomationRules] = useState<any[]>([]);

  useEffect(() => {
    if (universityId) {
      fetchAllData();
    }
  }, [universityId]);

  async function fetchAllData() {
    setDataLoading(true);
    try {
      // Fetch university settings
      const { data: uniData } = await supabase
        .from("universities")
        .select("*")
        .eq("id", universityId)
        .single();

      if (uniData) {
        setUniversityData({
          name: uniData.name || "",
          campuses: (uniData.settings as any)?.campuses || ["Main Campus"],
          departments: (uniData.settings as any)?.departments || ["Engineering", "Business", "Arts & Sciences"],
        });
        setAiSettings({
          risk_threshold_high: (uniData.settings as any)?.ai_settings?.risk_threshold_high || 70,
          risk_threshold_moderate: (uniData.settings as any)?.ai_settings?.risk_threshold_moderate || 40,
          engagement_threshold_low: (uniData.settings as any)?.ai_settings?.engagement_threshold_low || 40,
          inactivity_days_warning: (uniData.settings as any)?.ai_settings?.inactivity_days_warning || 5,
          inactivity_days_critical: (uniData.settings as any)?.ai_settings?.inactivity_days_critical || 10,
          auto_alerts_enabled: (uniData.settings as any)?.ai_settings?.auto_alerts_enabled ?? true,
          auto_recommendations_enabled: (uniData.settings as any)?.ai_settings?.auto_recommendations_enabled ?? true,
        });
      }

      // Fetch programs
      const { data: programsData } = await supabase
        .from("programs")
        .select("*")
        .eq("university_id", universityId)
        .order("created_at", { ascending: false });
      setPrograms(programsData || []);

      // Fetch team members
      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .eq("university_id", universityId);
      setTeamMembers(usersData || []);

      // Fetch templates
      const { data: templatesData } = await supabase
        .from("email_templates")
        .select("*")
        .eq("university_id", universityId)
        .order("created_at", { ascending: false });
      setTemplates(templatesData || []);

      // Fetch automation rules
      const { data: rulesData } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("university_id", universityId)
        .order("created_at", { ascending: false });
      setAutomationRules(rulesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setDataLoading(false);
    }
  }

  async function handleSaveUniversity() {
    if (!universityId) return;
    setLoading(true);
    try {
      const { data: currentUni } = await supabase
        .from("universities")
        .select("settings")
        .eq("id", universityId)
        .single();

      const currentSettings = (currentUni?.settings as any) || {};

      const { error } = await supabase
        .from("universities")
        .update({
          name: universityData.name,
          settings: {
            ...currentSettings,
            campuses: universityData.campuses,
            departments: universityData.departments,
          },
        })
        .eq("id", universityId);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error saving university settings:", err);
      alert("Error saving settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAI() {
    if (!universityId) return;
    setLoading(true);
    try {
      const { data: currentUni } = await supabase
        .from("universities")
        .select("settings")
        .eq("id", universityId)
        .single();

      const currentSettings = (currentUni?.settings as any) || {};

      const { error } = await supabase
        .from("universities")
        .update({
          settings: {
            ...currentSettings,
            ai_settings: aiSettings,
          },
        })
        .eq("id", universityId);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error saving AI settings:", err);
      alert("Error saving settings");
    } finally {
      setLoading(false);
    }
  }

  async function addProgram() {
    if (!universityId || !newProgram.name) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("programs").insert({
        name: newProgram.name,
        department: newProgram.department,
        capacity: newProgram.capacity,
        enrolled: 0,
        university_id: universityId,
        intake_date: new Date().toISOString().split("T")[0],
      });
      if (error) throw error;
      setNewProgram({ name: "", department: "", capacity: 50 });
      fetchAllData();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error adding program:", err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteProgram(id: string) {
    if (!confirm("Delete this program?")) return;
    try {
      await supabase.from("programs").delete().eq("id", id);
      fetchAllData();
    } catch (err) {
      console.error("Error deleting program:", err);
    }
  }

  async function addTemplate() {
    if (!universityId || !newTemplate.name || !newTemplate.subject) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("email_templates").insert({
        name: newTemplate.name,
        subject: newTemplate.subject,
        body_html: newTemplate.body,
        category: "custom",
        university_id: universityId,
      });
      if (error) throw error;
      setNewTemplate({ name: "", subject: "", body: "" });
      fetchAllData();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error adding template:", err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    try {
      await supabase.from("email_templates").delete().eq("id", id);
      fetchAllData();
    } catch (err) {
      console.error("Error deleting template:", err);
    }
  }

  async function toggleAutomationRule(id: string, isActive: boolean) {
    try {
      await supabase.from("automation_rules").update({ is_active: !isActive }).eq("id", id);
      fetchAllData();
    } catch (err) {
      console.error("Error toggling rule:", err);
    }
  }

  async function sendInvitation() {
    if (!universityId || !newInvite.email || !newInvite.name) return;
    setLoading(true);
    try {
      // Create user with permissions
      const { error } = await supabase.from("users").insert({
        name: newInvite.name,
        email: newInvite.email,
        role: newInvite.role,
        auth_id: crypto.randomUUID(), // Placeholder
        university_id: universityId,
        permissions: newInvite.permissions,
      });
      
      if (error) throw error;
      
      setNewInvite({ 
        email: "", 
        name: "", 
        role: "admissions",
        permissions: {
          dashboard: true,
          students: true,
          admissions: true,
          communications: false,
          reports: false,
          settings: false,
        }
      });
      setShowInviteModal(false);
      fetchAllData();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error("Error sending invitation:", err);
      alert(err.message || "Error sending invitation");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTeamMember(id: string) {
    if (!confirm("Remove this team member?")) return;
    try {
      await supabase.from("users").delete().eq("id", id);
      fetchAllData();
    } catch (err) {
      console.error("Error deleting team member:", err);
    }
  }

  function togglePermission(key: string) {
    setNewInvite({
      ...newInvite,
      permissions: {
        ...newInvite.permissions,
        [key]: !newInvite.permissions[key as keyof typeof newInvite.permissions],
      }
    });
  }

  function addCampus() {
    setUniversityData({
      ...universityData,
      campuses: [...universityData.campuses, ""],
    });
  }

  function removeCampus(index: number) {
    const newCampuses = universityData.campuses.filter((_, i) => i !== index);
    setUniversityData({ ...universityData, campuses: newCampuses });
  }

  function updateCampus(index: number, value: string) {
    const newCampuses = [...universityData.campuses];
    newCampuses[index] = value;
    setUniversityData({ ...universityData, campuses: newCampuses });
  }

  function addDepartment() {
    setUniversityData({
      ...universityData,
      departments: [...universityData.departments, ""],
    });
  }

  function removeDepartment(index: number) {
    const newDepartments = universityData.departments.filter((_, i) => i !== index);
    setUniversityData({ ...universityData, departments: newDepartments });
  }

  function updateDepartment(index: number, value: string) {
    const newDepartments = [...universityData.departments];
    newDepartments[index] = value;
    setUniversityData({ ...universityData, departments: newDepartments });
  }

  const renderContent = () => {
    if (dataLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      );
    }

    switch (activeSection) {
      case "university":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">University Name</label>
              <Input
                value={universityData.name}
                onChange={(e) => setUniversityData({ ...universityData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">Campuses</label>
                <Button variant="ghost" size="sm" onClick={addCampus} className="text-orange-400 hover:text-orange-300">
                  <Plus className="w-4 h-4 mr-1" /> Add Campus
                </Button>
              </div>
              <div className="space-y-2">
                {universityData.campuses.map((campus, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={campus}
                      onChange={(e) => updateCampus(index, e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Campus name"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeCampus(index)} className="text-red-400 hover:text-red-300">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">Departments</label>
                <Button variant="ghost" size="sm" onClick={addDepartment} className="text-orange-400 hover:text-orange-300">
                  <Plus className="w-4 h-4 mr-1" /> Add Department
                </Button>
              </div>
              <div className="space-y-2">
                {universityData.departments.map((dept, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={dept}
                      onChange={(e) => updateDepartment(index, e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Department name"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeDepartment(index)} className="text-red-400 hover:text-red-300">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSaveUniversity} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        );

      case "programs":
        return (
          <div className="space-y-6">
            <div className="p-4 border border-white/10 rounded-lg bg-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Add New Program</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                  placeholder="Program name"
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  value={newProgram.department}
                  onChange={(e) => setNewProgram({ ...newProgram, department: e.target.value })}
                  placeholder="Department"
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  type="number"
                  value={newProgram.capacity}
                  onChange={(e) => setNewProgram({ ...newProgram, capacity: Number(e.target.value) })}
                  placeholder="Capacity"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <Button onClick={addProgram} disabled={loading || !newProgram.name} className="mt-4 bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" /> Add Program
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Existing Programs ({programs.length})</h3>
              {programs.length === 0 ? (
                <p className="text-gray-400">No programs added yet</p>
              ) : (
                programs.map((program) => (
                  <div key={program.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <p className="text-white font-medium">{program.name}</p>
                      <p className="text-sm text-gray-400">{program.department} • Capacity: {program.capacity}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteProgram(program.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "automation":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Automation Rules ({automationRules.length})</h3>
            {automationRules.length === 0 ? (
              <p className="text-gray-400">No automation rules configured. Go to Automation view to create rules.</p>
            ) : (
              automationRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <p className="text-white font-medium">{rule.name}</p>
                    <p className="text-sm text-gray-400">
                      Trigger: {rule.trigger_type} • Action: {rule.action_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={rule.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                      {rule.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Switch checked={rule.is_active} onCheckedChange={() => toggleAutomationRule(rule.id, rule.is_active)} />
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case "team":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Team Members ({teamMembers.length})</h3>
              <Button onClick={() => setShowInviteModal(true)} className="bg-orange-500 hover:bg-orange-600">
                <Mail className="w-4 h-4 mr-2" /> Invite Member
              </Button>
            </div>

            {showInviteModal && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-[#0A0E14] border border-white/10 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">Invite Team Member</h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowInviteModal(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                      <Input
                        value={newInvite.name}
                        onChange={(e) => setNewInvite({ ...newInvite, name: e.target.value })}
                        placeholder="Full name"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <Input
                        type="email"
                        value={newInvite.email}
                        onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                        placeholder="email@university.edu"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                      <Select value={newInvite.role} onValueChange={(value) => setNewInvite({ ...newInvite, role: value })}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admissions">Admissions Officer</SelectItem>
                          <SelectItem value="student_success">Student Success Team</SelectItem>
                          <SelectItem value="marketing">Marketing Team</SelectItem>
                          <SelectItem value="international_office">International Office</SelectItem>
                          <SelectItem value="academic_manager">Academic Manager</SelectItem>
                          <SelectItem value="finance">Finance Team</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        <Shield className="w-4 h-4 inline mr-1" />
                        Access Permissions
                      </label>
                      <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
                        {[
                          { key: 'dashboard', label: 'Dashboard & Analytics' },
                          { key: 'students', label: 'Student Management' },
                          { key: 'admissions', label: 'Admissions & Offers' },
                          { key: 'communications', label: 'Communications Center' },
                          { key: 'reports', label: 'Reports & Exports' },
                          { key: 'settings', label: 'Settings & Configuration' },
                        ].map((perm) => (
                          <div key={perm.key} className="flex items-center justify-between">
                            <span className="text-gray-300 text-sm">{perm.label}</span>
                            <Switch
                              checked={newInvite.permissions[perm.key as keyof typeof newInvite.permissions]}
                              onCheckedChange={() => togglePermission(perm.key)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={sendInvitation} 
                        disabled={loading || !newInvite.email || !newInvite.name} 
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                        Send Invitation
                      </Button>
                      <Button variant="ghost" onClick={() => setShowInviteModal(false)} className="text-gray-400">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {teamMembers.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No team members yet. Invite your first member to get started.</p>
              ) : (
                teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <span className="text-orange-400 font-medium">{member.name?.[0]?.toUpperCase() || "?"}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{member.name}</p>
                        <p className="text-sm text-gray-400">{member.email}</p>
                        {member.permissions && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(member.permissions).filter(([_, v]) => v).map(([k]) => (
                              <span key={k} className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">
                                {k}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-cyan-500/20 text-cyan-400">{member.role}</Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteTeamMember(member.id)} 
                        className="text-red-400 hover:text-red-300"
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "templates":
        return (
          <div className="space-y-6">
            <div className="p-4 border border-white/10 rounded-lg bg-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Add New Template</h3>
              <div className="space-y-4">
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Template name"
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  placeholder="Email subject"
                  className="bg-white/5 border-white/10 text-white"
                />
                <textarea
                  value={newTemplate.body}
                  onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                  placeholder="Email body (use {name} for personalization)"
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white placeholder:text-gray-500"
                />
              </div>
              <Button
                onClick={addTemplate}
                disabled={loading || !newTemplate.name || !newTemplate.subject}
                className="mt-4 bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Template
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Existing Templates ({templates.length})</h3>
              {templates.length === 0 ? (
                <p className="text-gray-400">No templates added yet</p>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <p className="text-white font-medium">{template.name}</p>
                      <p className="text-sm text-gray-400">Subject: {template.subject}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteTemplate(template.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "ai":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">High Risk Threshold (%)</label>
                <Input
                  type="number"
                  value={aiSettings.risk_threshold_high}
                  onChange={(e) => setAiSettings({ ...aiSettings, risk_threshold_high: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Students above this score are flagged as high risk</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Moderate Risk Threshold (%)</label>
                <Input
                  type="number"
                  value={aiSettings.risk_threshold_moderate}
                  onChange={(e) => setAiSettings({ ...aiSettings, risk_threshold_moderate: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Students above this score need attention</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Low Engagement Threshold (%)</label>
                <Input
                  type="number"
                  value={aiSettings.engagement_threshold_low}
                  onChange={(e) => setAiSettings({ ...aiSettings, engagement_threshold_low: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Students below this engagement score get flagged</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Inactivity Warning (Days)</label>
                <Input
                  type="number"
                  value={aiSettings.inactivity_days_warning}
                  onChange={(e) => setAiSettings({ ...aiSettings, inactivity_days_warning: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Days of inactivity before warning alert</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Inactivity Critical (Days)</label>
                <Input
                  type="number"
                  value={aiSettings.inactivity_days_critical}
                  onChange={(e) => setAiSettings({ ...aiSettings, inactivity_days_critical: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Days of inactivity before critical alert</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Auto Alerts</p>
                  <p className="text-sm text-gray-400">Automatically create alerts for at-risk students</p>
                </div>
                <Switch
                  checked={aiSettings.auto_alerts_enabled}
                  onCheckedChange={(checked) => setAiSettings({ ...aiSettings, auto_alerts_enabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Auto Recommendations</p>
                  <p className="text-sm text-gray-400">Generate AI recommendations for interventions</p>
                </div>
                <Switch
                  checked={aiSettings.auto_recommendations_enabled}
                  onCheckedChange={(checked) => setAiSettings({ ...aiSettings, auto_recommendations_enabled: checked })}
                />
              </div>
            </div>

            <Button onClick={handleSaveAI} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save AI Settings
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
        <Settings className="w-6 h-6 md:w-7 md:h-7 text-orange-400" />
        Settings
      </h1>

      {saved && (
        <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-lg border border-green-500/30">
          ✓ Saved successfully
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Mobile: Horizontal scrollable tabs */}
        <div className="glass-card p-3 md:p-4 lg:block">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg whitespace-nowrap lg:w-full lg:mb-1",
                    isActive
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span className="text-xs md:text-sm">{section.title}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto hidden lg:block" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 glass-card p-4 md:p-6">{renderContent()}</div>
      </div>
    </div>
  );
}
