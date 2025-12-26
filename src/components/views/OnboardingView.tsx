import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, Plus, Loader2, Play, Pause, Trash2, FileText, Video, BookOpen, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function OnboardingView() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    student_id: '',
    due_date: ''
  });
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    tasks: [{ title: '', description: '' }]
  });

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('onboarding-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'onboarding_tasks' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    try {
      const [tasksRes, studentsRes, resourcesRes] = await Promise.all([
        supabase.from('onboarding_tasks').select('*, students(name, email)').order('created_at', { ascending: false }),
        supabase.from('students').select('id, name, email').in('stage', ['enrollment', 'onboarding']),
        supabase.from('content_resources').select('*').eq('is_active', true).order('created_at', { ascending: false })
      ]);
      setTasks(tasksRes.data || []);
      setStudents(studentsRes.data || []);
      setResources(resourcesRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createTask() {
    try {
      await supabase.from('onboarding_tasks').insert({
        title: newTask.title,
        description: newTask.description,
        student_id: newTask.student_id,
        due_date: newTask.due_date || null,
        status: 'pending'
      });
      setNewTask({ title: '', description: '', student_id: '', due_date: '' });
      setShowCreateTask(false);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function updateTaskStatus(taskId: string, status: string) {
    try {
      await supabase.from('onboarding_tasks').update({ status }).eq('id', taskId);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return;
    try {
      await supabase.from('onboarding_tasks').delete().eq('id', taskId);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function sendReminder(task: any) {
    try {
      await supabase.from('communications').insert({
        student_id: task.student_id,
        type: 'email',
        subject: `Reminder: ${task.title}`,
        message: `Hi ${task.students?.name}, this is a reminder about your pending task: ${task.title}. ${task.description || ''}`,
        status: 'sent'
      });
      alert('Reminder sent!');
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function applyTemplate(studentId: string) {
    try {
      const defaultTasks = [
        { title: 'Submit ID Document', description: 'Upload a valid government-issued ID' },
        { title: 'Complete Profile', description: 'Fill in all required profile information' },
        { title: 'Watch Orientation Video', description: 'Complete the online orientation module' },
        { title: 'Pay Enrollment Fee', description: 'Complete the initial payment' },
        { title: 'Sign Student Agreement', description: 'Review and sign the enrollment agreement' }
      ];

      await supabase.from('onboarding_tasks').insert(
        defaultTasks.map(t => ({
          ...t,
          student_id: studentId,
          status: 'pending'
        }))
      );
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = tasks.filter(t => t.status === 'pending' && t.due_date && new Date(t.due_date) < new Date());

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    completed: 'bg-green-500/10 text-green-400 border-green-500/30',
    overdue: 'bg-red-500/10 text-red-400 border-red-500/30'
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
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Onboarding Autopilot</h1>
          <p className="text-sm md:text-base text-gray-400">Manage onboarding tasks and checklists</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowCreateTemplate(true)} className="border-white/10 hover:bg-white/5">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => setShowCreateTask(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 md:w-5 h-4 md:h-5 text-amber-400" />
            <span className="text-xs md:text-sm text-gray-400">Pending</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-white">{pendingTasks.length}</p>
        </div>
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 md:w-5 h-4 md:h-5 text-green-400" />
            <span className="text-xs md:text-sm text-gray-400">Completed</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-white">{completedTasks.length}</p>
        </div>
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 md:w-5 h-4 md:h-5 text-red-400" />
            <span className="text-xs md:text-sm text-gray-400">Overdue</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-red-400">{overdueTasks.length}</p>
        </div>
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 md:w-5 h-4 md:h-5 text-blue-400" />
            <span className="text-xs md:text-sm text-gray-400">Students</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-white">{students.length}</p>
        </div>
      </div>

      {showCreateTask && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Create New Task</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Student</label>
              <select
                value={newTask.student_id}
                onChange={(e) => setNewTask({ ...newTask, student_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="">Select student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} - {s.email}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Task Title</label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g., Submit Transcript"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Task details..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setShowCreateTask(false)} className="border-white/10">
                Cancel
              </Button>
              <Button
                onClick={createTask}
                disabled={!newTask.title || !newTask.student_id}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Create Task
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCreateTemplate && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Apply Onboarding Template</h3>
          <p className="text-sm text-gray-400 mb-4">Select a student to apply the default onboarding checklist:</p>
          <div className="space-y-3">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="font-medium text-white">{student.name}</p>
                  <p className="text-sm text-gray-400">{student.email}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => applyTemplate(student.id)}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Apply Template
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => setShowCreateTemplate(false)} className="mt-4 border-white/10">
            Close
          </Button>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">All Tasks</h3>
        </div>
        {tasks.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No onboarding tasks yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tasks.map((task) => {
              const isOverdue = task.status === 'pending' && task.due_date && new Date(task.due_date) < new Date();
              return (
                <div key={task.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white">{task.title}</h4>
                        <Badge className={cn(statusColors[isOverdue ? 'overdue' : task.status])}>
                          {isOverdue ? 'Overdue' : task.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{task.students?.name}</span>
                        {task.due_date && (
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        )}
                        <span>{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => sendReminder(task)}
                            className="hover:bg-blue-500/10"
                          >
                            <Send className="w-4 h-4 text-blue-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="hover:bg-green-500/10"
                          >
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTask(task.id)}
                        className="hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="glass-card p-4 md:p-6">
        <h3 className="text-lg font-bold text-white mb-4">Content Delivery Hub</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Video className="w-5 h-5 text-blue-400" />
              </div>
              <h4 className="font-medium text-white">Orientation Videos</h4>
            </div>
            <p className="text-sm text-gray-400 mb-3">Welcome videos and campus tours</p>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
              {resources.filter(r => r.type === 'video').length} Videos
            </Badge>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <h4 className="font-medium text-white">Student Guides</h4>
            </div>
            <p className="text-sm text-gray-400 mb-3">Handbooks and policy documents</p>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
              {resources.filter(r => r.type === 'document' || r.type === 'guide').length} Documents
            </Badge>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <BookOpen className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="font-medium text-white">Resources</h4>
            </div>
            <p className="text-sm text-gray-400 mb-3">FAQs and support materials</p>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
              {resources.filter(r => r.type === 'faq').length} Resources
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
