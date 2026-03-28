import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { 
  Plus, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  FolderKanban,
  Calendar,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    if (!user) return;

    // Listen for projects
    const projectsQuery = query(
      collection(db, 'projects'),
      where('members', 'array-contains', user.uid)
    );

    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'projects');
    });

    // Listen for tasks assigned to user
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('assigneeId', '==', user.uid)
    );

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
    });

    return () => {
      unsubscribeProjects();
      unsubscribeTasks();
    };
  }, [user]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProjectName.trim()) return;

    try {
      await addDoc(collection(db, 'projects'), {
        name: newProjectName,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
        description: 'New production project'
      });
      setNewProjectName('');
      setShowNewProjectModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    }
  };

  const stats = [
    { label: 'Active Projects', value: projects.length, icon: FolderKanban, color: 'text-blue-500' },
    { label: 'Pending Tasks', value: tasks.filter(t => t.status !== 'done').length, icon: Clock, color: 'text-amber-500' },
    { label: 'Completed', value: tasks.filter(t => t.status === 'done').length, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'High Priority', value: tasks.filter(t => t.priority === 'high').length, icon: AlertCircle, color: 'text-red-500' },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#141414]/20" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-[#141414]/40">Overview</p>
          <h1 className="text-4xl font-light tracking-tighter italic serif">Production Dashboard</h1>
        </div>
        <button 
          onClick={() => setShowNewProjectModal(true)}
          className="bg-[#141414] text-[#E4E3E0] px-6 py-3 rounded-full flex items-center gap-2 hover:scale-105 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">New Project</span>
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-[#141414]/5 space-y-4 group hover:border-[#141414]/20 transition-all">
            <div className="flex items-center justify-between">
              <div className={cn("p-2 rounded-lg bg-[#E4E3E0]/50", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-3xl font-light tracking-tighter italic serif">{stat.value}</span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-[#141414]/40 font-bold">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Projects List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold uppercase tracking-widest opacity-40 italic serif">Active Projects</h2>
            <Link to="/projects" className="text-[10px] uppercase tracking-widest hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Link 
                key={project.id}
                to={`/project/${project.id}`}
                className="bg-white p-6 rounded-2xl border border-[#141414]/5 group hover:border-[#141414]/20 transition-all space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight group-hover:underline">{project.name}</h3>
                  <p className="text-xs text-[#141414]/60 line-clamp-2 leading-relaxed">{project.description}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[#141414]/5">
                  <div className="flex -space-x-2">
                    {project.members.slice(0, 3).map((m: string, i: number) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-[#E4E3E0] border-2 border-white flex items-center justify-center text-[8px] font-bold">
                        {m.slice(0, 2).toUpperCase()}
                      </div>
                    ))}
                    {project.members.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-[#141414] text-white border-2 border-white flex items-center justify-center text-[8px] font-bold">
                        +{project.members.length - 3}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
            {projects.length === 0 && (
              <div className="col-span-2 py-12 text-center border-2 border-dashed border-[#141414]/10 rounded-2xl">
                <p className="text-xs uppercase tracking-widest opacity-40">No projects found</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold uppercase tracking-widest opacity-40 italic serif">Assigned to You</h2>
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div 
                key={task.id}
                className="bg-white p-4 rounded-xl border border-[#141414]/5 flex items-center gap-4 group hover:border-[#141414]/20 transition-all"
              >
                <div className={cn(
                  "w-1 h-8 rounded-full",
                  task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                )} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate">{task.title}</h4>
                  <p className="text-[10px] uppercase tracking-tighter opacity-40">
                    {task.status} • {task.dueDate ? format(task.dueDate.toDate(), 'MMM d') : 'No date'}
                  </p>
                </div>
                <CheckCircle2 className={cn(
                  "w-5 h-5 transition-colors",
                  task.status === 'done' ? "text-emerald-500" : "text-[#141414]/10"
                )} />
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-[#141414]/10 rounded-2xl">
                <p className="text-xs uppercase tracking-widest opacity-40">No tasks assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 space-y-8 animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest opacity-40">New Initiative</p>
              <h2 className="text-3xl font-light tracking-tighter italic serif">Create Project</h2>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Project Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Q2 Production Roadmap"
                  className="w-full bg-[#E4E3E0] p-4 rounded-xl outline-none focus:ring-2 ring-[#141414]/10 transition-all text-sm"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="flex-1 py-4 rounded-full border border-[#141414]/10 text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="flex-1 py-4 rounded-full bg-[#141414] text-[#E4E3E0] text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
