import { useState, useEffect } from 'react';
import { Search, X, User, GraduationCap, FileText, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentSelect: (studentId: string) => void;
}

export function SearchModal({ isOpen, onClose, onStudentSelect }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    students: any[];
    programs: any[];
  }>({ students: [], programs: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({ students: [], programs: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (query.length < 2) {
      setResults({ students: [], programs: [] });
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const [studentsRes, programsRes] = await Promise.all([
          supabase
            .from('students')
            .select('id, name, email, stage, engagement_score, risk_score')
            .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(5),
          supabase
            .from('programs')
            .select('id, name, department')
            .ilike('name', `%${query}%`)
            .limit(3)
        ]);

        setResults({
          students: studentsRes.data || [],
          programs: programsRes.data || []
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
      <div className="glass-card w-full max-w-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students, programs, reports..."
              className="pl-10 pr-10 bg-white/5 border-white/10 text-white text-lg h-12"
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-gray-400">
              Searching...
            </div>
          )}

          {!loading && query.length >= 2 && results.students.length === 0 && results.programs.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No results found for "{query}"
            </div>
          )}

          {results.students.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Students</p>
              {results.students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => {
                    onStudentSelect(student.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{student.name}</p>
                    <p className="text-sm text-gray-400 truncate">{student.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      student.risk_score >= 70 ? "bg-red-500/10 text-red-400" :
                      student.risk_score >= 40 ? "bg-amber-500/10 text-amber-400" :
                      "bg-green-500/10 text-green-400"
                    )}>
                      Risk: {student.risk_score}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.programs.length > 0 && (
            <div className="p-2 border-t border-white/10">
              <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Programs</p>
              {results.programs.map((program) => (
                <div
                  key={program.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{program.name}</p>
                    <p className="text-sm text-gray-400 truncate">{program.department}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {query.length < 2 && (
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-4">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
                  <User className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-white">Add New Student</span>
                </button>
                <button className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">View Reports</span>
                </button>
                <button className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white">AI Insights</span>
                </button>
                <button className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
                  <GraduationCap className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white">Programs</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
          <span>Press ESC to close</span>
          <span>⌘K to open search</span>
        </div>
      </div>
    </div>
  );
}
