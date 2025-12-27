import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  GraduationCap,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

/* =======================
   TYPES
======================= */

interface ObligationsPanelProps {
  student: any;
}

type ObligationStatus = "met" | "warning" | "breach";

type Obligation = {
  id: string;
  name: string;
  requirement: string;
  current_value: string | null;
  status: ObligationStatus;
  consequence: string | null;
  due_date: string | null;
};

/** Raw DB row (Supabase returns string for enums) */
type DbObligation = {
  id: string;
  name: string;
  requirement: string;
  current_value: string | null;
  status: string;
  consequence: string | null;
  due_date: string | null;
  student_id: string;
  university_id: string;
  created_at: string;
  updated_at: string;
};

/* =======================
   COMPONENT
======================= */

export function ObligationsPanel({ student }: ObligationsPanelProps) {
  const [dbObligations, setDbObligations] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student?.id) fetchObligations();
  }, [student?.id]);

  /* =======================
     FETCH DB OBLIGATIONS
  ======================= */

  async function fetchObligations() {
    try {
      const { data, error } = await supabase
        .from("obligations")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: Obligation[] = (data as DbObligation[]).map((o) => ({
          id: o.id,
          name: o.name,
          requirement: o.requirement,
          current_value: o.current_value,
          consequence: o.consequence,
          due_date: o.due_date,
          status:
            o.status === "met" ||
            o.status === "warning" ||
            o.status === "breach"
              ? o.status
              : "warning", // safe fallback
        }));

        setDbObligations(mapped);
      }
    } catch (err) {
      console.error("Error fetching obligations:", err);
    } finally {
      setLoading(false);
    }
  }

  /* =======================
     CALCULATED OBLIGATIONS
  ======================= */

  const attendanceRate = Math.max(0, 100 - (student.risk_score || 0));
  const attendanceStatus: ObligationStatus =
    attendanceRate >= 80 ? "met" : attendanceRate >= 60 ? "warning" : "breach";

  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(student.last_activity).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const visaCheckDue = new Date(
    Date.now() + (30 - daysSinceActivity) * 24 * 60 * 60 * 1000,
  );

  const visaStatus: ObligationStatus =
    daysSinceActivity < 14
      ? "met"
      : daysSinceActivity < 21
        ? "warning"
        : "breach";

  const feeStatus: ObligationStatus =
    student.engagement_score >= 50
      ? "met"
      : student.engagement_score >= 30
        ? "warning"
        : "breach";

  const academicStatus: ObligationStatus =
    student.risk_score < 40
      ? "met"
      : student.risk_score < 70
        ? "warning"
        : "breach";

  const calculatedObligations = [
    {
      name: "Attendance Requirement",
      requirement: "≥ 80%",
      current: `${attendanceRate}%`,
      status: attendanceStatus,
      icon: Calendar,
      consequence: "Visa cancellation risk",
    },
    {
      name: "Visa Check-in",
      requirement: "Every 30 days",
      current: visaCheckDue.toLocaleDateString(),
      status: visaStatus,
      icon: FileText,
      consequence: "Immigration compliance breach",
    },
    {
      name: "Fee Payment",
      requirement: "Current",
      current:
        feeStatus === "met"
          ? "Paid"
          : feeStatus === "warning"
            ? "Due Soon"
            : "Overdue",
      status: feeStatus,
      icon: DollarSign,
      consequence: "Enrollment suspension",
    },
    {
      name: "Academic Progress",
      requirement: "Satisfactory",
      current:
        academicStatus === "met"
          ? "On Track"
          : academicStatus === "warning"
            ? "At Risk"
            : "Failing",
      status: academicStatus,
      icon: GraduationCap,
      consequence: "Academic probation",
    },
  ];

  /* =======================
     SOURCE OF TRUTH
  ======================= */

  const obligations =
    dbObligations.length > 0
      ? dbObligations.map((o) => ({
          name: o.name,
          requirement: o.requirement,
          current: o.current_value || "N/A",
          status: o.status,
          icon: o.name.toLowerCase().includes("attendance")
            ? Calendar
            : o.name.toLowerCase().includes("visa")
              ? FileText
              : o.name.toLowerCase().includes("fee")
                ? DollarSign
                : GraduationCap,
          consequence: o.consequence || "N/A",
        }))
      : calculatedObligations;

  /* =======================
     HELPERS
  ======================= */

  const getStatusIcon = (status: ObligationStatus) => {
    if (status === "met")
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status === "warning")
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  const breachCount = obligations.filter((o) => o.status === "breach").length;
  const warningCount = obligations.filter((o) => o.status === "warning").length;

  /* =======================
     RENDER
  ======================= */

  if (loading) {
    return <p className="text-xs text-gray-400">Loading obligations…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-orange-400" />
          Active Obligations
        </h3>

        <div className="flex items-center gap-2">
          {breachCount > 0 && (
            <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">
              {breachCount} Breach
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
              {warningCount} Warning
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {obligations.map((o, i) => {
          const Icon = o.icon;
          return (
            <div
              key={i}
              className={cn(
                "p-3 rounded-lg border",
                o.status === "breach"
                  ? "bg-red-500/5 border-red-500/20"
                  : o.status === "warning"
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-white/5 border-white/10",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-1.5 rounded-lg",
                      o.status === "met"
                        ? "bg-green-500/10"
                        : o.status === "warning"
                          ? "bg-amber-500/10"
                          : "bg-red-500/10",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        o.status === "met"
                          ? "text-green-400"
                          : o.status === "warning"
                            ? "text-amber-400"
                            : "text-red-400",
                      )}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">{o.name}</p>
                    <p className="text-xs text-gray-400">
                      Required: {o.requirement} • Current: {o.current}
                    </p>
                    {o.status !== "met" && (
                      <p className="text-xs text-red-400 mt-1">
                        ⚠️ {o.consequence}
                      </p>
                    )}
                  </div>
                </div>

                {getStatusIcon(o.status)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
