import { useState, useEffect } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { Search, Filter, Star, AlertTriangle, CheckCircle, XCircle, Loader2, Sparkles, RefreshCw, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface LeadInboxViewProps {
  onStudentClick: (studentId: string) => void;
}

export function LeadInboxView({ onStudentClick }: LeadInboxViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'quality' | 'date'>('quality');
  const { students, loading, refetch } = useStudents('lead');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Record<string, string[]>>({});

  useEffect(() => {
    detectDuplicates();
  }, [students]);

  function detectDuplicates() {
    const emailMap: Record<string, string[]> = {};
    students.forEach(s => {
      const email = s.email.toLowerCase();
      if (!emailMap[email]) emailMap[email] = [];
      emailMap[email].push(s.id);
    });
    const dups: Record<string, string[]> = {};
    Object.entries(emailMap).forEach(([email, ids]) => {
      if (ids.length > 1) {
        ids.forEach(id => { dups[id] = ids.filter(i => i !== id); });
      }
    });
    setDuplicates(dups);
  }

  const filteredLeads = students
    .filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'quality') return (b.quality_score || 50) - (a.quality_score || 50);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  async function autoAssignLead(leadId: string) {
    setActionLoading(leadId);
    try {
      const { data: counselors } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'admissions');

      if (counselors && counselors.length > 0) {
        const randomCounselor = counselors[Math.floor(Math.random() * counselors.length)];
        await supabase.from('students').update({ counselor_id: randomCounselor.id }).eq('id', leadId);
        refetch();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function qualifyLead(leadId: string) {
    setActionLoading(leadId);
    try {
      await supabase.from('students').update({ stage: 'application' }).eq('id', leadId);
      refetch();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function rejectLead(leadId: string) {
    if (!confirm('Are you sure you want to reject this lead?')) return;
    setActionLoading(leadId);
    try {
      await supabase.from('students').update({ stage: 'dropped' }).eq('id', leadId);
      refetch();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'High Quality';
    if (score >= 60) return 'Medium Quality';
    return 'Low Quality';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Lead Inbox</h1>
          <p className="text-sm md:text-base text-gray-400">Triage and qualify incoming leads with AI scoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetch} className="border-white/10 hover:bg-white/5">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-xs md:text-sm font-medium text-orange-400">AI Scoring Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-gray-400 mb-1">Total Leads</p>
          <p className="text-2xl font-bold metric-number text-white">{students.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-gray-400 mb-1">High Quality</p>
          <p className="text-2xl font-bold metric-number text-green-400">
            {students.filter(s => (s.quality_score || 50) >= 80).length}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-gray-400 mb-1">Unassigned</p>
          <p className="text-2xl font-bold metric-number text-amber-400">
            {students.filter(s => !s.counselor_id).length}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-gray-400 mb-1">Duplicates</p>
          <p className="text-2xl font-bold metric-number text-red-400">
            {Object.keys(duplicates).length}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={sortBy === 'quality' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('quality')}
            className={sortBy === 'quality' ? 'bg-orange-500 text-white' : 'border-white/10'}
          >
            <Star className="w-4 h-4 mr-1" />
            By Quality
          </Button>
          <Button
            variant={sortBy === 'date' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('date')}
            className={sortBy === 'date' ? 'bg-orange-500 text-white' : 'border-white/10'}
          >
            By Date
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredLeads.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Star className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No leads in inbox</p>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const qualityScore = lead.quality_score || 50;
            const isDuplicate = duplicates[lead.id];

            return (
              <div
                key={lead.id}
                className={cn(
                  "glass-card p-4 hover:scale-[1.005] transition-all",
                  isDuplicate && "border border-amber-500/30"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 cursor-pointer" onClick={() => onStudentClick(lead.id)}>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{lead.name}</h3>
                      <Badge className={cn("text-xs", getQualityColor(qualityScore))}>
                        <Star className="w-3 h-3 mr-1" />
                        {qualityScore} - {getQualityLabel(qualityScore)}
                      </Badge>
                      {qualityScore >= 80 && (
                        <span className="ai-badge">
                          <Sparkles className="w-3 h-3" />
                          High-Fit
                        </span>
                      )}
                      {isDuplicate && (
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                          <Copy className="w-3 h-3 mr-1" />
                          Duplicate
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{lead.email}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{lead.country}</span>
                      <span>{lead.source || 'Direct'}</span>
                      <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
                      {lead.users?.name && <span>Assigned: {lead.users.name}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!lead.counselor_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => autoAssignLead(lead.id)}
                        disabled={actionLoading === lead.id}
                        className="border-white/10 hover:bg-white/5"
                      >
                        Auto-Assign
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => qualifyLead(lead.id)}
                      disabled={actionLoading === lead.id}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {actionLoading === lead.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Qualify
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectLead(lead.id)}
                      disabled={actionLoading === lead.id}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
