import { useState } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useLifecycleStats } from '@/hooks/useLifecycleStats';
import { Search, Filter, Download, Mail, UserPlus, Sparkles, Loader2, CheckSquare, Square } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddStudentModal } from '@/components/modals/AddStudentModal';
import { BulkActionsModal } from '@/components/modals/BulkActionsModal';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface StudentsViewProps {
  onStudentClick: (studentId: string) => void;
}

export function StudentsView({ onStudentClick }: StudentsViewProps) {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const { students, loading, refetch } = useStudents(selectedStage);
  const { stages } = useLifecycleStats();

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const selectedStudentData = students.filter(s => selectedStudents.includes(s.id));

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (score >= 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-green-400 bg-green-500/10 border-green-500/30';
  };

  const getEngagementColor = (score: number) => {
    if (score >= 70) return 'from-green-500 to-emerald-400';
    if (score >= 40) return 'from-amber-500 to-yellow-400';
    return 'from-red-500 to-rose-400';
  };

  const stageLabels: Record<string, string> = {
    lead: 'Lead',
    application: 'Application',
    offer: 'Offer',
    acceptance: 'Acceptance',
    enrollment: 'Enrollment',
    onboarding: 'Onboarding',
    active: 'Active',
    at_risk: 'At-Risk'
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Student Registry</h1>
          <p className="text-sm md:text-base text-gray-400">Track and manage students across all lifecycle stages</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-xs md:text-sm">
            <Download className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
            Export
          </Button>
          <Button 
            size="sm" 
            onClick={() => setAddStudentOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs md:text-sm"
          >
            <UserPlus className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search students by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-xs md:text-sm">
          <Filter className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
          Filters
        </Button>
        {selectedStudents.length > 0 && (
          <Button 
            size="sm" 
            onClick={() => setBulkActionsOpen(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white text-xs md:text-sm"
          >
            <CheckSquare className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
            Bulk Actions ({selectedStudents.length})
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedStage('all')}
          className={cn(
            "px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
            selectedStage === 'all'
              ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          All Students ({students.length})
        </button>
        {stages.slice(0, 8).map((stage) => (
          <button
            key={stage.stage}
            onClick={() => setSelectedStage(stage.stage)}
            className={cn(
              "px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
              selectedStage === stage.stage
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            {stageLabels[stage.stage]} ({stage.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left p-3 md:p-4 text-xs md:text-sm font-semibold text-gray-300">
                    <button onClick={toggleSelectAll} className="flex items-center gap-2">
                      {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-orange-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                      Student
                    </button>
                  </th>
                  <th className="text-left p-3 md:p-4 text-xs md:text-sm font-semibold text-gray-300 hidden md:table-cell">Stage</th>
                  <th className="text-left p-3 md:p-4 text-xs md:text-sm font-semibold text-gray-300 hidden lg:table-cell">Program</th>
                  <th className="text-left p-3 md:p-4 text-xs md:text-sm font-semibold text-gray-300">Engagement</th>
                  <th className="text-left p-3 md:p-4 text-xs md:text-sm font-semibold text-gray-300">Risk Score</th>
                  <th className="text-left p-3 md:p-4 text-xs md:text-sm font-semibold text-gray-300 hidden xl:table-cell">Counselor</th>
                  <th className="text-left p-3 md:p-4 text-xs md:text-sm font-semibold text-gray-300 hidden lg:table-cell">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={cn(
                      "border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors",
                      selectedStudents.includes(student.id) && "bg-orange-500/5"
                    )}
                  >
                    <td className="p-3 md:p-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleStudentSelection(student.id); }}
                          className="flex-shrink-0"
                        >
                          {selectedStudents.includes(student.id) ? (
                            <CheckSquare className="w-4 h-4 text-orange-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400 hover:text-white" />
                          )}
                        </button>
                        <div onClick={() => onStudentClick(student.id)}>
                          <p className="font-medium text-white text-sm md:text-base">{student.name}</p>
                          <p className="text-xs md:text-sm text-gray-400 truncate max-w-[150px] md:max-w-none">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 md:p-4 hidden md:table-cell" onClick={() => onStudentClick(student.id)}>
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                        {stageLabels[student.stage] || student.stage}
                      </Badge>
                    </td>
                    <td className="p-3 md:p-4 hidden lg:table-cell" onClick={() => onStudentClick(student.id)}>
                      <p className="text-xs md:text-sm text-gray-300 truncate max-w-[150px]">{student.programs?.name || '-'}</p>
                    </td>
                    <td className="p-3 md:p-4" onClick={() => onStudentClick(student.id)}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 md:gap-2">
                          <span className="text-xs md:text-sm metric-number text-white">{student.engagement_score}</span>
                          <span className="text-xs text-gray-400">/100</span>
                        </div>
                        <div className="w-16 md:w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full bg-gradient-to-r", getEngagementColor(student.engagement_score))}
                            style={{ width: `${student.engagement_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 md:p-4" onClick={() => onStudentClick(student.id)}>
                      <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium", getRiskColor(student.risk_score))}>
                        {student.risk_score >= 70 && <Sparkles className="w-3 h-3" />}
                        {student.risk_score}
                      </div>
                    </td>
                    <td className="p-3 md:p-4 hidden xl:table-cell" onClick={() => onStudentClick(student.id)}>
                      <p className="text-xs md:text-sm text-gray-300">{student.users?.name || '-'}</p>
                    </td>
                    <td className="p-3 md:p-4 hidden lg:table-cell" onClick={() => onStudentClick(student.id)}>
                      <p className="text-xs md:text-sm text-gray-400">
                        {formatDistanceToNow(new Date(student.last_activity), { addSuffix: true })}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddStudentModal
        isOpen={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        onSuccess={refetch}
      />

      <BulkActionsModal
        isOpen={bulkActionsOpen}
        onClose={() => { setBulkActionsOpen(false); setSelectedStudents([]); }}
        selectedStudents={selectedStudentData}
        onSuccess={() => { refetch(); setSelectedStudents([]); }}
      />
    </div>
  );
}
