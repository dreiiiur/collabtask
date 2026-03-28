import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { auth, signOut, db, collection, query, where, onSnapshot } from '../firebase';
import { 
  LayoutDashboard, 
  LogOut, 
  Plus, 
  FolderKanban, 
  Settings, 
  Bell, 
  Search, 
  Menu, 
  X,
  User as UserIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Listen for projects where user is a member
    const q = query(
      collection(db, 'projects'),
      where('members', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-[#141414] text-[#E4E3E0] transition-all duration-300 flex flex-col h-screen shrink-0",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-white/10 h-20">
          <div className={cn("flex items-center gap-3", !isSidebarOpen && "hidden")}>
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold tracking-tighter text-xl">CollabTask</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8">
          <div className="space-y-1">
            <p className={cn("text-[10px] uppercase tracking-widest text-white/40 mb-4 px-2", !isSidebarOpen && "hidden")}>
              Main
            </p>
            <Link 
              to="/" 
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all group",
                location.pathname === '/' ? "bg-white text-black" : "hover:bg-white/5"
              )}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span className={cn("text-sm font-medium", !isSidebarOpen && "hidden")}>Dashboard</span>
            </Link>
          </div>

          <div className="space-y-1">
            <div className={cn("flex items-center justify-between mb-4 px-2", !isSidebarOpen && "hidden")}>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Projects</p>
              <button className="p-1 hover:bg-white/10 rounded transition-colors">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1">
              {projects.map(project => (
                <Link 
                  key={project.id}
                  to={`/project/${project.id}`}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all group",
                    location.pathname === `/project/${project.id}` ? "bg-white text-black" : "hover:bg-white/5"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    location.pathname === `/project/${project.id}` ? "bg-black" : "bg-white/20"
                  )} />
                  <span className={cn("text-sm font-medium truncate", !isSidebarOpen && "hidden")}>
                    {project.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-4">
          <div className={cn("flex items-center gap-3 p-2", !isSidebarOpen && "justify-center")}>
            <img 
              src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} 
              alt={profile?.displayName}
              className="w-8 h-8 rounded-full border border-white/20"
              referrerPolicy="no-referrer"
            />
            <div className={cn("flex-1 min-w-0", !isSidebarOpen && "hidden")}>
              <p className="text-xs font-bold truncate">{profile?.displayName}</p>
              <p className="text-[10px] text-white/40 truncate uppercase tracking-tighter">Production Team</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 text-red-400 transition-all group",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={cn("text-sm font-medium", !isSidebarOpen && "hidden")}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 border-b border-[#141414]/10 bg-white/50 backdrop-blur-sm flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 bg-[#E4E3E0] px-4 py-2 rounded-lg w-96">
            <Search className="w-4 h-4 text-[#141414]/40" />
            <input 
              type="text" 
              placeholder="Search tasks, projects, members..."
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#141414]/40"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 hover:bg-[#141414]/5 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-[1px] bg-[#141414]/10" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold italic serif">March 2026</p>
                <p className="text-[10px] uppercase tracking-widest opacity-50">Operational</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
