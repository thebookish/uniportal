import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { profile, university } = useAuth();
  const universityId = profile?.university_id;

  const [activeSection, setActiveSection] = useState("university");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [universityData, setUniversityData] = useState({
    name: university?.name || "",
    campuses: (university?.settings as any)?.campuses || ["Main Campus"],
    departments: (university?.settings as any)?.departments || [
      "Engineering",
      "Business",
      "Arts & Sciences",
    ],
  });

  const [aiSettings, setAiSettings] = useState({
    risk_threshold_high:
      (university?.settings as any)?.ai_settings?.risk_threshold_high || 70,
    risk_threshold_moderate:
      (university?.settings as any)?.ai_settings?.risk_threshold_moderate || 40,
    engagement_threshold_low:
      (university?.settings as any)?.ai_settings?.engagement_threshold_low ||
      40,
    inactivity_days_warning:
      (university?.settings as any)?.ai_settings?.inactivity_days_warning || 5,
    inactivity_days_critical:
      (university?.settings as any)?.ai_settings?.inactivity_days_critical ||
      10,
    auto_alerts_enabled:
      (university?.settings as any)?.ai_settings?.auto_alerts_enabled ?? true,
    auto_recommendations_enabled:
      (university?.settings as any)?.ai_settings
        ?.auto_recommendations_enabled ?? true,
  });

  /* =======================
     SAVE UNIVERSITY
  ======================= */

  async function handleSaveUniversity() {
    setLoading(true);
    try {
      const { data: currentUni, error } = await supabase
        .from("universities")
        .select("settings")
        .eq("id", universityId)
        .single();

      if (error) throw error;

      const currentSettings =
        typeof currentUni?.settings === "object" && currentUni.settings !== null
          ? currentUni.settings
          : {};

      const { error: updateError } = await supabase
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

      if (updateError) throw updateError;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error saving university settings:", err);
    } finally {
      setLoading(false);
    }
  }

  /* =======================
     SAVE AI SETTINGS
  ======================= */

  async function handleSaveAI() {
    setLoading(true);
    try {
      const { data: currentUni, error } = await supabase
        .from("universities")
        .select("settings")
        .eq("id", universityId)
        .single();

      if (error) throw error;

      const currentSettings =
        typeof currentUni?.settings === "object" && currentUni.settings !== null
          ? currentUni.settings
          : {};

      const { error: updateError } = await supabase
        .from("universities")
        .update({
          settings: {
            ...currentSettings,
            ai_settings: aiSettings,
          },
        })
        .eq("id", universityId);

      if (updateError) throw updateError;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error saving AI settings:", err);
    } finally {
      setLoading(false);
    }
  }

  /* =======================
     CONTENT RENDERER
  ======================= */

  const renderContent = () => {
    switch (activeSection) {
      case "university":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                University Name
              </label>
              <Input
                value={universityData.name}
                onChange={(e) =>
                  setUniversityData({ ...universityData, name: e.target.value })
                }
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <Button
              onClick={handleSaveUniversity}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        );

      case "ai":
        return (
          <div className="space-y-6">
            <Input
              type="number"
              value={aiSettings.risk_threshold_high}
              onChange={(e) =>
                setAiSettings({
                  ...aiSettings,
                  risk_threshold_high: Number(e.target.value),
                })
              }
              className="bg-white/5 border-white/10 text-white"
            />

            <Button
              onClick={handleSaveAI}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save AI Settings
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Settings className="w-7 h-7 text-orange-400" />
        Settings
      </h1>

      {saved && (
        <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-lg border border-green-500/30">
          ✓ Saved successfully
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="glass-card p-4">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                  isActive
                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                    : "text-gray-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="w-5 h-5" />
                {section.title}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3 glass-card p-6">{renderContent()}</div>
      </div>
    </div>
  );
}
