import { useState, useEffect } from 'react';
import { usePrograms } from '@/hooks/usePrograms';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, Calendar, Users, CheckCircle2, Plus, Loader2, X, Edit, Trash2, LayoutList, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { IntakeCalendarView } from '@/components/programs/IntakeCalendarView';
import { cn } from '@/lib/utils';

export function ProgramsView() {
  const { profile } = useAuth();
  const universityId = profile?.university_id;
  const { programs, loading, refetch } = usePrograms();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'programs' | 'calendar'>('programs');
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    intake_date: '',
    capacity: 100,
    eligibility: ''
  });
  
  // State for assigning students to program
  const [showAssignStudents, setShowAssignStudents] = useState(false);
  const [selectedProgramForAssign, setSelectedProgramForAssign] = useState<any>(null);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [assigningStudents, setAssigningStudents] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  async function loadAvailableStudents() {
    if (!universityId) return;
    setLoadingStudents(true);
    try {
      const { data } = await supabase
        .from('students')
        .select('id, name, email, program_id')
        .eq('university_id', universityId)
        .order('name');
      setAvailableStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoadingStudents(false);
    }
  }

  function openAssignStudents(program: any) {
    setSelectedProgramForAssign(program);
    setSelectedStudentIds([]);
    setShowAssignStudents(true);
    loadAvailableStudents();
  }

  async function assignStudentsToProgram() {
    if (!universityId || !selectedProgramForAssign || selectedStudentIds.length === 0) return;
    setAssigningStudents(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ program_id: selectedProgramForAssign.id })
        .in('id', selectedStudentIds)
        .eq('university_id', universityId);
      
      if (error) throw error;
      
      refetch();
      setShowAssignStudents(false);
      setSelectedStudentIds([]);
      alert(`${selectedStudentIds.length} student(s) assigned to ${selectedProgramForAssign.name} successfully!`);
    } catch (error) {
      console.error('Error assigning students:', error);
      alert('Error assigning students. Please try again.');
    } finally {
      setAssigningStudents(false);
    }
  }

  async function handleSaveProgram() {
    if (!formData.name || !formData.department) {
      alert('Please fill in program name and department');
      return;
    }
    if (!universityId) {
      alert('University not found. Please refresh and try again.');
      return;
    }
    setSaving(true);
    try {
      const eligibilityArray = formData.eligibility
        ? formData.eligibility.split(',').map(e => e.trim()).filter(Boolean)
        : [];

      if (editingProgram) {
        const { error } = await supabase.from('programs').update({
          name: formData.name,
          department: formData.department,
          intake_date: formData.intake_date || new Date().toISOString().split('T')[0],
          capacity: formData.capacity,
          eligibility: eligibilityArray
        }).eq('id', editingProgram.id);
        
        if (error) {
          console.error('Update error:', error);
          alert('Error updating program: ' + error.message);
          return;
        }
      } else {
        const { error } = await supabase.from('programs').insert({
          name: formData.name,
          department: formData.department,
          intake_date: formData.intake_date || new Date().toISOString().split('T')[0],
          capacity: formData.capacity,
          enrolled: 0,
          eligibility: eligibilityArray,
          university_id: universityId
        });
        
        if (error) {
          console.error('Insert error:', error);
          alert('Error adding program: ' + error.message);
          return;
        }
      }
      setShowAddModal(false);
      setEditingProgram(null);
      setFormData({ name: '', department: '', intake_date: '', capacity: 100, eligibility: '' });
      refetch();
    } catch (error: any) {
      console.error('Error saving program:', error);
      alert('Error saving program: ' + (error?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProgram(programId: string) {
    if (!confirm('Are you sure you want to delete this program?')) return;
    try {
      await supabase.from('programs').delete().eq('id', programId);
      refetch();
    } catch (error) {
      console.error('Error deleting program:', error);
    }
  }

  function openEditModal(program: any) {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      department: program.department,
      intake_date: program.intake_date,
      capacity: program.capacity,
      eligibility: program.eligibility?.join(', ') || ''
    });
    setShowAddModal(true);
  }

  function openAddModal() {
    setEditingProgram(null);
    setFormData({ name: '', department: '', intake_date: '', capacity: 100, eligibility: '' });
    setShowAddModal(true);
  }

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
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Program Management</h1>
          <p className="text-sm md:text-base text-gray-400">Manage programs, intakes, and enrollment capacity</p>
        </div>
        <Button onClick={openAddModal} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Program
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('programs')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'programs'
              ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <LayoutList className="w-4 h-4" />
          Programs
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'calendar'
              ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Calendar className="w-4 h-4" />
          Intake Calendar
        </button>
      </div>

      {activeTab === 'calendar' && <IntakeCalendarView />}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingProgram ? 'Edit Program' : 'Add New Program'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Program Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Computer Science BSc"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Department *</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Engineering"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Intake Date</label>
                  <Input
                    type="date"
                    value={formData.intake_date}
                    onChange={(e) => setFormData({ ...formData, intake_date: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Capacity</label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Eligibility Requirements (comma-separated)</label>
                <Input
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder="e.g., High School Diploma, English Proficiency"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border-white/10 hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProgram}
                  disabled={saving || !formData.name || !formData.department}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingProgram ? 'Update Program' : 'Create Program'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'programs' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="glass-card p-4 md:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <GraduationCap className="w-4 md:w-5 h-4 md:h-5 text-orange-400" />
                </div>
                <p className="text-xs md:text-sm text-gray-400">Total Programs</p>
              </div>
              <p className="text-2xl md:text-3xl font-bold metric-number text-white">{programs.length}</p>
            </div>

            <div className="glass-card p-4 md:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="w-4 md:w-5 h-4 md:h-5 text-green-400" />
                </div>
                <p className="text-xs md:text-sm text-gray-400">Total Enrolled</p>
              </div>
              <p className="text-2xl md:text-3xl font-bold metric-number text-white">
                {programs.reduce((sum, p) => sum + p.enrolled, 0)}
              </p>
            </div>

            <div className="glass-card p-4 md:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <CheckCircle2 className="w-4 md:w-5 h-4 md:h-5 text-blue-400" />
            </div>
            <p className="text-xs md:text-sm text-gray-400">Total Capacity</p>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-white">
            {programs.reduce((sum, p) => sum + p.capacity, 0)}
          </p>
        </div>

        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Calendar className="w-4 md:w-5 h-4 md:h-5 text-purple-400" />
            </div>
            <p className="text-xs md:text-sm text-gray-400">Avg Fill Rate</p>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-white">
            {programs.length > 0 ? Math.round((programs.reduce((sum, p) => sum + (p.enrolled / p.capacity), 0) / programs.length) * 100) : 0}%
          </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {programs.map((program) => {
          const fillRate = (program.enrolled / program.capacity) * 100;
          const spotsLeft = program.capacity - program.enrolled;

          return (
            <div key={program.id} className="glass-card p-4 md:p-6 hover:scale-[1.01] transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">{program.name}</h3>
                  <p className="text-xs md:text-sm text-gray-400">{program.department}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openAssignStudents(program)}
                    className="hover:bg-cyan-500/10"
                    title="Assign Students"
                  >
                    <UserPlus className="w-4 h-4 text-cyan-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(program)}
                    className="hover:bg-white/5"
                  >
                    <Edit className="w-4 h-4 text-gray-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteProgram(program.id)}
                    className="hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Enrollment</span>
                    <span className="metric-number text-white">
                      {program.enrolled} / {program.capacity}
                    </span>
                  </div>
                  <Progress value={fillRate} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {spotsLeft} spots remaining ({fillRate.toFixed(1)}% filled)
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">
                    Intake: {format(new Date(program.intake_date), 'MMM d, yyyy')}
                  </span>
                </div>

                {program.eligibility && program.eligibility.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Eligibility Requirements:</p>
                    <div className="flex flex-wrap gap-1">
                      {program.eligibility.slice(0, 3).map((req, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-white/10 text-gray-400">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
          })}
          </div>
        </>
      )}

      {/* Assign Students Modal */}
      {showAssignStudents && selectedProgramForAssign && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1f2e] rounded-xl border border-white/10 w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Assign Students to Program</h3>
                <p className="text-sm text-gray-400">{selectedProgramForAssign.name}</p>
              </div>
              <button 
                onClick={() => setShowAssignStudents(false)}
                className="p-1 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                </div>
              ) : availableStudents.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No students available</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 mb-3">Select students to assign ({selectedStudentIds.length} selected)</p>
                  {availableStudents.map((student) => {
                    const isSelected = selectedStudentIds.includes(student.id);
                    const isAlreadyAssigned = student.program_id === selectedProgramForAssign.id;
                    return (
                      <button
                        key={student.id}
                        onClick={() => {
                          if (isAlreadyAssigned) return;
                          setSelectedStudentIds(prev => 
                            isSelected 
                              ? prev.filter(id => id !== student.id)
                              : [...prev, student.id]
                          );
                        }}
                        disabled={isAlreadyAssigned}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left",
                          isAlreadyAssigned 
                            ? "bg-green-500/10 border border-green-500/30 cursor-not-allowed"
                            : isSelected
                              ? "bg-cyan-500/10 border border-cyan-500/30"
                              : "bg-white/5 hover:bg-white/10 border border-transparent"
                        )}
                      >
                        <div>
                          <p className="font-medium text-white text-sm">{student.name}</p>
                          <p className="text-xs text-gray-400">{student.email}</p>
                        </div>
                        {isAlreadyAssigned ? (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">Already Assigned</Badge>
                        ) : isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAssignStudents(false)}
                className="flex-1 border-white/10 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={assignStudentsToProgram}
                disabled={assigningStudents || selectedStudentIds.length === 0}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {assigningStudents ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Assigning...</>
                ) : (
                  <>Assign {selectedStudentIds.length} Student{selectedStudentIds.length !== 1 ? 's' : ''}</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
