import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

/* =========================
   LOCAL JSON TYPE (Supabase-safe)
========================= */

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/* =========================
   TYPES
========================= */

type AutomationRule = {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  is_active: boolean;
  university_id: string | null;
  created_at: string;
  updated_at: string;
};

/* =========================
   HELPERS
========================= */

function normalizeJsonObject(value: Json | null): Record<string, any> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value;
  }
  return {};
}

/* =========================
   HOOK
========================= */

export function useAutomationRules() {
  const { profile } = useAuth();
  const universityId = profile?.university_id;

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRules = useCallback(async () => {
    if (!universityId) {
      setRules([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("university_id", universityId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const normalized: AutomationRule[] = (data ?? []).map((rule: any) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        trigger_type: rule.trigger_type,
        trigger_config: normalizeJsonObject(rule.trigger_config),
        action_type: rule.action_type,
        action_config: normalizeJsonObject(rule.action_config),
        is_active: rule.is_active,
        university_id: rule.university_id,
        created_at: rule.created_at,
        updated_at: rule.updated_at,
      }));

      setRules(normalized);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [universityId]);

  useEffect(() => {
    fetchRules();

    if (!universityId) return;

    const channel = supabase
      .channel(`automation-rules-${universityId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "automation_rules" },
        () => {
          fetchRules();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [universityId, fetchRules]);

  return {
    rules,
    loading,
    error,
    refetch: fetchRules,
  };
}
