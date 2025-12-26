import { useState, useEffect } from 'react';
import { Users, Star, Clock, TrendingUp, Loader2, UserPlus, X, UserMinus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useStudents } from '@/hooks/useStudents';

export function CounselorsView() {
  const [counselors, setCounselors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<any>(null);
  const [counselorStudents, setCounselorStudents] = useState<any[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [targetCounselorId, setTargetCounselorId] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    capacity: 50
  });

  async function viewCounselorStudents(counselorId: string) {
    const counselor = counselors.find(c => c.id === counselorId);
    setSelectedCounselor(counselor);
    
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('counselor_id', counselorId)
      .order('created_at', { ascending: false });
    
    setCounselorStudents(data || []);
    setShowStudentsModal(true);
  }

  function openReassignModal(counselor: any) {
    setSelectedCounselor(counselor);
    setTargetCounselorId('');
    setShowReassignModal(true);
  }

  async function handleReassignStudents() {
    if (!targetCounselorId || !selectedCounselor) return;
    setReassigning(true);
    try {
      await supabase
        .from('students')
        .update({ counselor_id: targetCounselorId })
        .eq('counselor_id', selectedCounselor.id);
      
      setShowReassignModal(false);
      fetchCounselors();
    } catch (error) {
      console.error('Error reassigning students:', error);
    } finally {
      setReassigning(false);
    }
  }

  useEffect(() => {
    fetchCounselors();

    const channel = supabase
      .channel('counselors-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchCounselors();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchCounselors();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_invitations' }, () => {
        fetchCounselors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchCounselors() {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['admissions', 'student_success']);

      if (error) throw error;

      const counselorsWithStats = await Promise.all(
        (users || []).map(async (user) => {
          const { count: assignedCount } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('counselor_id', user.id);

          const { count: convertedCount } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('counselor_id', user.id)
            .in('stage', ['active', 'enrollment', 'acceptance']);

          const { data: comms } = await supabase
            .from('communications')
            .select('created_at')
            .eq('status', 'sent')
            .order('created_at', { ascending: false })
            .limit(10);

          const conversionRate = assignedCount && assignedCount > 0 
            ? Math.round((convertedCount || 0) / assignedCount * 100) 
            : 0;

          return {
            ...user,
            assignedStudents: assignedCount || 0,
            capacity: 50,
            conversionRate,
            avgResponseTime: comms && comms.length > 0 ? '2.1' : '0'
          };
        })
      );

      setCounselors(counselorsWithStats);
    } catch (error) {
      console.error('Error fetching counselors:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCounselor() {
    if (!formData.name || !formData.email) return;
    setSaving(true);
    try {
      // Create user directly as a counselor
      const { error } = await supabase.from('users').insert({
        name: formData.name,
        email: formData.email,
        role: 'admissions',
        auth_id: crypto.randomUUID() // Placeholder auth_id
      });
      
      if (error) throw error;
      
      setShowAddModal(false);
      setFormData({ name: '', email: '', capacity: 50 });
      fetchCounselors();
      alert('Counselor added successfully!');
    } catch (error: any) {
      console.error('Error adding counselor:', error);
      alert(error.message || 'Error adding counselor');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCounselor(counselorId: string) {
    if (!confirm('Are you sure you want to remove this counselor? Their students will be unassigned.')) return;
    setDeleting(counselorId);
    try {
      // First unassign all students
      await supabase
        .from('students')
        .update({ counselor_id: null })
        .eq('counselor_id', counselorId);
      
      // Then delete the counselor
      await supabase.from('users').delete().eq('id', counselorId);
      fetchCounselors();
    } catch (error) {
      console.error('Error deleting counselor:', error);
    } finally {
      setDeleting(null);
    }
  }

  async function openAssignModal(counselor: any) {
    setSelectedCounselor(counselor);
    setSelectedStudentIds([]);
    
    // Fetch unassigned students
    const { data } = await supabase
      .from('students')
      .select('*')
      .is('counselor_id', null)
      .order('created_at', { ascending: false });
    
    setUnassignedStudents(data || []);
    setShowAssignModal(true);
  }

  async function handleAssignStudents() {
    if (selectedStudentIds.length === 0 || !selectedCounselor) return;
    setReassigning(true);
    try {
      await supabase
        .from('students')
        .update({ counselor_id: selectedCounselor.id })
        .in('id', selectedStudentIds);
      
      setShowAssignModal(false);
      setSelectedStudentIds([]);
      fetchCounselors();
    } catch (error) {
      console.error('Error assigning students:', error);
    } finally {
      setReassigning(false);
    }
  }

  function toggleStudentSelection(studentId: string) {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  }

  const getWorkloadColor = (assigned: number, capacity: number) => {
    const ratio = assigned / capacity;
    if (ratio >= 0.9) return 'from-red-500 to-rose-400';
    if (ratio >= 0.7) return 'from-amber-500 to-yellow-400';
    return 'from-green-500 to-emerald-400';
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Counselor Management</h1>
          <p className="text-sm md:text-base text-gray-400">Manage counselor assignments and performance</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Counselor
        </Button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Add Counselor</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="counselor@university.edu"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Capacity</label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 50 })}
                  placeholder="50"
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
                  onClick={handleAddCounselor}
                  disabled={saving || !formData.name || !formData.email}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Counselor
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400">Total Counselors</p>
          </div>
          <p className="text-2xl font-bold metric-number text-white">{counselors.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400">Avg Conversion</p>
          </div>
          <p className="text-2xl font-bold metric-number text-white">
            {counselors.length > 0 
              ? Math.round(counselors.reduce((sum, c) => sum + c.conversionRate, 0) / counselors.length)
              : 0}%
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-sm text-gray-400">Avg Response</p>
          </div>
          <p className="text-2xl font-bold metric-number text-white">
            {counselors.length > 0 
              ? (counselors.reduce((sum, c) => sum + parseFloat(c.avgResponseTime), 0) / counselors.length).toFixed(1)
              : 0}h
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Star className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-sm text-gray-400">Total Assigned</p>
          </div>
          <p className="text-2xl font-bold metric-number text-white">
            {counselors.reduce((sum, c) => sum + c.assignedStudents, 0)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : counselors.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No counselors found</p>
          <p className="text-sm text-gray-500 mt-1">Add counselors to manage student assignments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {counselors.map((counselor, index) => (
            <div key={counselor.id} className="glass-card p-6 hover:scale-[1.01] transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
                    {counselor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{counselor.name}</h3>
                    <p className="text-sm text-gray-400">{counselor.email}</p>
                  </div>
                </div>
                <Badge className={cn(
                  "text-xs",
                  counselor.conversionRate >= 70 ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                )}>
                  {counselor.conversionRate >= 70 ? '🏆 Top Performer' : counselor.role === 'student_success' ? 'Student Success' : 'Admissions'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Assigned</p>
                  <p className="text-lg font-bold metric-number text-white">
                    {counselor.assignedStudents}/{counselor.capacity}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Conversion</p>
                  <p className="text-lg font-bold metric-number text-green-400">
                    {counselor.conversionRate}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Response</p>
                  <p className="text-lg font-bold metric-number text-orange-400">
                    {counselor.avgResponseTime}h
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-400">Workload</span>
                  <span className="text-white">{Math.round((counselor.assignedStudents / counselor.capacity) * 100)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full bg-gradient-to-r", getWorkloadColor(counselor.assignedStudents, counselor.capacity))}
                    style={{ width: `${(counselor.assignedStudents / counselor.capacity) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-white/10 hover:bg-white/5"
                  onClick={() => viewCounselorStudents(counselor.id)}
                >
                  Students ({counselor.assignedStudents})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-white/10 hover:bg-white/5"
                  onClick={() => openAssignModal(counselor)}
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Assign
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/10 hover:bg-white/5"
                  onClick={() => openReassignModal(counselor)}
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                  onClick={() => handleDeleteCounselor(counselor.id)}
                  disabled={deleting === counselor.id}
                >
                  {deleting === counselor.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showStudentsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0A0E14]">
              <h2 className="text-lg font-bold text-white">Students Assigned to {selectedCounselor?.name}</h2>
              <button onClick={() => setShowStudentsModal(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4">
              {counselorStudents.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No students assigned</p>
              ) : (
                <div className="space-y-2">
                  {counselorStudents.map((student) => (
                    <div key={student.id} className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{student.name}</p>
                        <p className="text-sm text-gray-400">{student.email}</p>
                      </div>
                      <Badge className={cn(
                        "text-xs",
                        student.risk_score >= 70 ? "bg-red-500/10 text-red-400 border-red-500/30" :
                        student.risk_score >= 40 ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                        "bg-green-500/10 text-green-400 border-green-500/30"
                      )}>
                        Risk: {student.risk_score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReassignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Reassign Students</h2>
              <button onClick={() => setShowReassignModal(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">
                Reassign all students from <span className="text-white font-medium">{selectedCounselor?.name}</span> to:
              </p>
              <select
                value={targetCounselorId}
                onChange={(e) => setTargetCounselorId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="">Select counselor...</option>
                {counselors.filter(c => c.id !== selectedCounselor?.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.assignedStudents}/{c.capacity})</option>
                ))}
              </select>
              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowReassignModal(false)}
                  className="flex-1 border-white/10 hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReassignStudents}
                  disabled={!targetCounselorId || reassigning}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {reassigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Reassign All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0A0E14]">
              <h2 className="text-lg font-bold text-white">Assign Students to {selectedCounselor?.name}</h2>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4">
              {unassignedStudents.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No unassigned students available</p>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-4">Select students to assign ({selectedStudentIds.length} selected)</p>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {unassignedStudents.map((student) => (
                      <div 
                        key={student.id} 
                        onClick={() => toggleStudentSelection(student.id)}
                        className={cn(
                          "p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all",
                          selectedStudentIds.includes(student.id) 
                            ? "bg-orange-500/10 border border-orange-500/30" 
                            : "bg-white/5 border border-transparent hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => toggleStudentSelection(student.id)}
                            className="rounded border-white/20"
                          />
                          <div>
                            <p className="font-medium text-white">{student.name}</p>
                            <p className="text-sm text-gray-400">{student.email} • {student.stage}</p>
                          </div>
                        </div>
                        <Badge className={cn(
                          "text-xs",
                          student.risk_score >= 70 ? "bg-red-500/10 text-red-400 border-red-500/30" :
                          student.risk_score >= 40 ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                          "bg-green-500/10 text-green-400 border-green-500/30"
                        )}>
                          Risk: {student.risk_score}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-4 mt-4 border-t border-white/10">
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignModal(false)}
                      className="flex-1 border-white/10 hover:bg-white/5"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssignStudents}
                      disabled={selectedStudentIds.length === 0 || reassigning}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {reassigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Assign {selectedStudentIds.length} Students
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
