import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, doc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, getDoc, Timestamp, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { 
  Plus, 
  MoreVertical, 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Trash2,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function ProjectView() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', status: 'todo' });
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  useEffect(() => {
    if (!projectId || !user) return;

    // Listen for project details
    const unsubscribeProject = onSnapshot(doc(db, 'projects', projectId), (snapshot) => {
      if (snapshot.exists()) {
        setProject({ id: snapshot.id, ...snapshot.data() });
      } else {
        navigate('/');
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `projects/${projectId}`);
    });

    // Listen for tasks in this project
    const q = query(collection(db, 'tasks'), where('projectId', '==', projectId));
    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
    });

    return () => {
      unsubscribeProject();
      unsubscribeTasks();
    };
  }, [projectId, user, navigate]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !projectId || !newTask.title.trim()) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        projectId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        assigneeId: user.uid, // Default to self
        dueDate: null
      });
      setNewTask({ title: '', priority: 'medium', status: 'todo' });
      setShowNewTaskModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: currentStatus === 'done' ? 'todo' : 'done'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newMemberEmail.trim()) return;

    // In a real app, you'd search for the user by email
    // For this demo, we'll assume the email is the UID for simplicity
    // or just add it to the members array.
    // Ideally, you'd have a cloud function or a search index.
    
    try {
      // Mocking member addition - in real app, find UID by email first
      const updatedMembers = [...project.members, newMemberEmail];
      await updateDoc(doc(db, 'projects', project.id), {
        members: updatedMembers
      });
      setNewMemberEmail('');
      setShowAddMemberModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${project.id}`);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#141414]/20" />
      </div>
    );
  }

  const columns = [
    { id: 'todo', label: 'To Do', icon: Clock, color: 'text-zinc-400' },
    { id: 'in-progress', label: 'In Progress', icon: AlertCircle, color: 'text-amber-500' },
    { id: 'done', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-end justify-between">
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Dashboard
          </button>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-[#141414]/40">Project Workspace</p>
            <h1 className="text-4xl font-light tracking-tighter italic serif">{project?.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2 mr-4">
            {project?.members.map((m: string, i: number) => (
              <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-[#E4E3E0] flex items-center justify-center text-[10px] font-bold shadow-sm">
                {m.slice(0, 2).toUpperCase()}
              </div>
            ))}
            <button 
              onClick={() => setShowAddMemberModal(true)}
              className="w-8 h-8 rounded-full bg-[#141414] text-white border-2 border-[#E4E3E0] flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setShowNewTaskModal(true)}
            className="bg-[#141414] text-[#E4E3E0] px-6 py-3 rounded-full flex items-center gap-2 hover:scale-105 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">New Task</span>
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[600px]">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <column.icon className={cn("w-4 h-4", column.color)} />
                <h2 className="text-xs font-bold uppercase tracking-widest opacity-40 italic serif">{column.label}</h2>
              </div>
              <span className="text-[10px] font-mono opacity-20">
                {tasks.filter(t => t.status === column.id).length}
              </span>
            </div>
            
            <div className="flex-1 bg-[#141414]/5 rounded-3xl p-4 space-y-4 border border-transparent hover:border-[#141414]/5 transition-colors overflow-y-auto max-h-[70vh]">
              {tasks.filter(t => t.status === column.id).map((task) => (
                <div 
                  key={task.id}
                  className="bg-white p-6 rounded-2xl border border-[#141414]/5 space-y-4 group hover:border-[#141414]/20 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          "text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full",
                          task.priority === 'high' ? 'bg-red-100 text-red-600' : 
                          task.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 
                          'bg-blue-100 text-blue-600'
                        )}>
                          {task.priority}
                        </span>
                      </div>
                      <h4 className={cn(
                        "text-sm font-bold leading-tight group-hover:underline",
                        task.status === 'done' && "line-through opacity-40"
                      )}>
                        {task.title}
                      </h4>
                    </div>
                    <button 
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className={cn(
                        "p-1 rounded-lg transition-colors",
                        task.status === 'done' ? "text-emerald-500 bg-emerald-50" : "text-[#141414]/10 hover:bg-[#141414]/5 hover:text-[#141414]"
                      )}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#141414]/5">
                    <div className="flex items-center gap-2 opacity-40">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[10px] uppercase tracking-tighter">
                        {task.dueDate ? format(task.dueDate.toDate(), 'MMM d') : 'No date'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-6 h-6 rounded-full bg-[#E4E3E0] flex items-center justify-center text-[8px] font-bold border border-white">
                        {task.assigneeId?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status === column.id).length === 0 && (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-[#141414]/5 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-widest opacity-20">Empty</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 space-y-8 animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest opacity-40">Task Definition</p>
              <h2 className="text-3xl font-light tracking-tighter italic serif">Create Task</h2>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Task Title</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g. Finalize production assets"
                  className="w-full bg-[#E4E3E0] p-4 rounded-xl outline-none focus:ring-2 ring-[#141414]/10 transition-all text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Priority</label>
                  <select 
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full bg-[#E4E3E0] p-4 rounded-xl outline-none text-sm appearance-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Status</label>
                  <select 
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    className="w-full bg-[#E4E3E0] p-4 rounded-xl outline-none text-sm appearance-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="flex-1 py-4 rounded-full border border-[#141414]/10 text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newTask.title.trim()}
                  className="flex-1 py-4 rounded-full bg-[#141414] text-[#E4E3E0] text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 space-y-8 animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest opacity-40">Collaboration</p>
              <h2 className="text-3xl font-light tracking-tighter italic serif">Add Member</h2>
            </div>
            <form onSubmit={handleAddMember} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Member Email or UID</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Enter email or UID"
                  className="w-full bg-[#E4E3E0] p-4 rounded-xl outline-none focus:ring-2 ring-[#141414]/10 transition-all text-sm"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 py-4 rounded-full border border-[#141414]/10 text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newMemberEmail.trim()}
                  className="flex-1 py-4 rounded-full bg-[#141414] text-[#E4E3E0] text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
                >
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
