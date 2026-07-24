import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  FolderKanban,
  LogOut,
  Clock,
  User as UserIcon,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Volume2,
  Users,
  Shield,
  Fingerprint
} from 'lucide-react';
import { Category, FeedbackItem, FormTemplate, User, UserGroup, UserAccessRights, UamAuditLog } from './types';
import {
  getStoredCategories,
  saveStoredCategories,
  getStoredFeedback,
  saveStoredFeedback,
  getStoredForms,
  saveStoredForms,
  getStoredUsers,
  saveStoredUsers,
  getStoredUserGroups,
  saveStoredUserGroups,
  getStoredUamAccess,
  saveStoredUamAccess,
  getStoredUamLogs,
  saveStoredUamLogs
} from './initialData';

// Component imports
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import FeedbackManager from './components/FeedbackManager';
import FormBuilder from './components/FormBuilder';
import CategoryManager from './components/CategoryManager';
import UserManager from './components/UserManager';
import UserGroupManager from './components/UserGroupManager';
import UserAccessManager from './components/UserAccessManager';

export default function App() {
  // Authentication & session state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('feedback_mgt_auth') === 'true';
  });
  const [username, setUsername] = useState<string | null>(() => {
    return localStorage.getItem('feedback_mgt_user');
  });

  // Navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'feedback' | 'form-builder' | 'categories' | 'users' | 'user-groups' | 'uam'>('dashboard');

  // Deep linking helper state
  const [initialSelectedUamGroupId, setInitialSelectedUamGroupId] = useState<string | undefined>(undefined);

  // Database collections (categories, feedback list, form templates)
  const [categories, setCategories] = useState<Category[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userGroupsList, setUserGroupsList] = useState<UserGroup[]>([]);
  const [accessRightsList, setAccessRightsList] = useState<UserAccessRights[]>([]);
  const [uamLogsList, setUamLogsList] = useState<UamAuditLog[]>([]);

  // Selection cross-linking (Dashboard to Feedback Manager)
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  // Inactivity session timeout state (5 minutes total, warning modal at 4m 30s)
  const [idleTime, setIdleTime] = useState(0);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(30);

  // UTC and Local time state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Refs for tracking timers
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const loadedCategories = getStoredCategories();
    const loadedFeedback = getStoredFeedback();
    const loadedForms = getStoredForms();
    const loadedUsers = getStoredUsers();
    const loadedGroups = getStoredUserGroups();
    const loadedAccess = getStoredUamAccess();
    const loadedLogs = getStoredUamLogs();

    setCategories(loadedCategories);
    setFeedback(loadedFeedback);
    setForms(loadedForms);
    setUsersList(loadedUsers);
    setUserGroupsList(loadedGroups);
    setAccessRightsList(loadedAccess);
    setUamLogsList(loadedLogs);
  }, []);

  // Update clock every second
  useEffect(() => {
    clockTimerRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (clockTimerRef.current) clearInterval(clockTimerRef.current);
    };
  }, []);

  // Inactivity timer logic (tracks idle counts in seconds)
  useEffect(() => {
    if (!isAuthenticated) {
      setIdleTime(0);
      setShowTimeoutWarning(false);
      return;
    }

    const resetIdleTimer = () => {
      setIdleTime(0);
      setShowTimeoutWarning(false);
    };

    // Listen to standard interactive events to detect user activity
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('mousedown', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);

    // Increment idle counter every second
    idleTimerRef.current = setInterval(() => {
      setIdleTime((prev) => {
        const nextTime = prev + 1;
        
        // At 4 minutes 30 seconds (270 seconds), trigger warning dialog
        if (nextTime === 270) {
          setShowTimeoutWarning(true);
          setWarningCountdown(30);
        }
        
        // At 5 minutes (300 seconds), log the user out
        if (nextTime >= 300) {
          handleLogout();
        }

        return nextTime;
      });
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('mousedown', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [isAuthenticated]);

  // Handle countdown on the warning modal
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showTimeoutWarning && warningCountdown > 0) {
      timer = setTimeout(() => {
        setWarningCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [showTimeoutWarning, warningCountdown]);

  // Auth helper callbacks
  const handleLoginSuccess = (usr: string) => {
    setIsAuthenticated(true);
    setUsername(usr);
    localStorage.setItem('feedback_mgt_auth', 'true');
    localStorage.setItem('feedback_mgt_user', usr);
    setIdleTime(0);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    localStorage.removeItem('feedback_mgt_auth');
    localStorage.removeItem('feedback_mgt_user');
    setActiveTab('dashboard');
    setShowTimeoutWarning(false);
    setIdleTime(0);
  };

  const handleExtendSession = () => {
    setIdleTime(0);
    setShowTimeoutWarning(false);
  };

  // State modification wrappers synced to local storage
  const handleUpdateCategories = (updated: Category[]) => {
    setCategories(updated);
    saveStoredCategories(updated);
  };

  const handleUpdateFeedback = (updated: FeedbackItem[]) => {
    setFeedback(updated);
    saveStoredFeedback(updated);
  };

  const handleUpdateForms = (updated: FormTemplate[]) => {
    setForms(updated);
    saveStoredForms(updated);
  };

  const handleUpdateUsers = (updated: User[]) => {
    setUsersList(updated);
    saveStoredUsers(updated);
  };

  const handleUpdateUserGroups = (updated: UserGroup[]) => {
    setUserGroupsList(updated);
    saveStoredUserGroups(updated);
  };

  const handleUpdateAccessRights = (updated: UserAccessRights[]) => {
    setAccessRightsList(updated);
    saveStoredUamAccess(updated);
  };

  const handleUpdateUamLogs = (updated: UamAuditLog[]) => {
    setUamLogsList(updated);
    saveStoredUamLogs(updated);
  };

  const handleConfigurePermissions = (groupId: string) => {
    setInitialSelectedUamGroupId(groupId);
    setActiveTab('uam');
  };

  // Cross-link routing helper (Dashboard to Feedback Detail)
  const handleViewFeedbackDetail = (ticketId: string) => {
    setActiveTicketId(ticketId);
    setActiveTab('feedback');
  };

  // Quick sandbox helper to clear and restore initial data
  const handleResetSandboxDatabase = () => {
    if (confirm('Operational Alert: Re-initializing sandbox database will erase all custom tickets, form builds, and custom categories, reverting to factory defaults. Proceed?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // format idle display
  const formatIdleTime = () => {
    const totalRemaining = 300 - idleTime;
    if (totalRemaining <= 0) return '0:00';
    const mins = Math.floor(totalRemaining / 60);
    const secs = totalRemaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render Login state
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen max-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      
      {/* ------------------ GLOBAL HEADER BAR ------------------ */}
      <header className="bg-slate-900 text-white h-14 px-6 flex items-center justify-between border-b border-slate-800 shadow-md shrink-0">
        <div>
          <span className="font-semibold text-slate-200 text-sm">Feedback Center</span>
        </div>

        {/* Middle Stats & Clock Display */}
        <div className="hidden lg:flex items-center gap-6 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-mono">{currentTime.toLocaleString('en-US', { hour12: false })}</span>
          </div>
        </div>

        {/* User context & Logout actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-right">
            <div className="hidden md:block">
              <p className="text-xs font-bold text-slate-200 leading-none capitalize">{username}</p>
              <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-bold">Admin Privileges</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs capitalize">
              {username?.charAt(0)}
            </div>
          </div>

          <button
            id="btn-global-logout"
            type="button"
            onClick={handleLogout}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Securely exit staff session"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ------------------ MAIN CONTAINER ------------------ */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-50 bg-slate-900 border-r border-slate-800 text-slate-400 flex flex-col justify-between shrink-0 select-none">
          
          {/* Main Tabs */}
          <nav className="p-4 space-y-1.5 text-xs font-medium">
            {/* Dashboard Link */}
            <button
              id="tab-dashboard"
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/10'
                  : 'hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Dashboard</span>
            </button>

            {/* Customer Tickets */}
            <button
              id="tab-feedback"
              type="button"
              onClick={() => setActiveTab('feedback')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'feedback'
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/10'
                  : 'hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Customer Feedback</span>
            </button>

            {/* Form Builder */}
            <button
              id="tab-form-builder"
              type="button"
              onClick={() => setActiveTab('form-builder')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'form-builder'
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/10'
                  : 'hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Form Builder</span>
            </button>

            {/* Category Manager */}
            <button
              id="tab-categories"
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/10'
                  : 'hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <FolderKanban className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Categories</span>
            </button>

            {/* User Accounts tab */}
            <button
              id="tab-users"
              type="button"
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/10'
                  : 'hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">User Management</span>
            </button>

            {/* User Groups tab */}
            <button
              id="tab-user-groups"
              type="button"
              onClick={() => setActiveTab('user-groups')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'user-groups'
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/10'
                  : 'hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">User Groups</span>
            </button>

            {/* User Access Management tab */}
            <button
              id="tab-uam"
              type="button"
              onClick={() => setActiveTab('uam')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'uam'
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/10'
                  : 'hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Fingerprint className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Access Rights</span>
            </button>
          </nav>
        </aside>

        {/* WORKSPACE AREA */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          <div className="max-w-[1600px] w-full mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard
                categories={categories}
                feedback={feedback}
                onViewFeedback={handleViewFeedbackDetail}
              />
            )}

            {activeTab === 'feedback' && (
              <FeedbackManager
                categories={categories}
                feedback={feedback}
                onUpdateFeedback={handleUpdateFeedback}
                activeTicketId={activeTicketId}
                onClearActiveTicket={() => setActiveTicketId(null)}
                currentUser={username || 'System Admin'}
              />
            )}

            {activeTab === 'form-builder' && (
              <FormBuilder
                categories={categories}
                forms={forms}
                onUpdateForms={handleUpdateForms}
              />
            )}

            {activeTab === 'categories' && (
              <CategoryManager
                categories={categories}
                feedback={feedback}
                forms={forms}
                onUpdateCategories={handleUpdateCategories}
              />
            )}

            {activeTab === 'users' && (
              <UserManager
                users={usersList}
                userGroups={userGroupsList}
                onUpdateUsers={handleUpdateUsers}
                currentUser={username || 'admin'}
              />
            )}

            {activeTab === 'user-groups' && (
              <UserGroupManager
                userGroups={userGroupsList}
                users={usersList}
                onUpdateUserGroups={handleUpdateUserGroups}
                onConfigurePermissions={handleConfigurePermissions}
              />
            )}

            {activeTab === 'uam' && (
              <UserAccessManager
                userGroups={userGroupsList}
                accessRights={accessRightsList}
                uamLogs={uamLogsList}
                onUpdateAccessRights={handleUpdateAccessRights}
                onUpdateUamLogs={handleUpdateUamLogs}
                currentUser={username || 'admin'}
                initialSelectedGroupId={initialSelectedUamGroupId}
              />
            )}
          </div>
        </main>
      </div>

      {/* ------------------ SESSION TIMEOUT WARNING MODAL ------------------ */}
      {showTimeoutWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-999 flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 max-w-md w-full space-y-5 text-center animate-scaleIn">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-red-600 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-lg">Inactivity Auto-Logout Security Alert</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                You have been inactive for over 4 minutes and 30 seconds. To comply with resort data compliance regulations, your session will be locked automatically.
              </p>
            </div>

            <div className="inline-flex flex-col items-center justify-center bg-red-50 border border-red-100 rounded-xl px-4 py-3 w-full font-mono">
              <span className="text-[10px] text-red-600 uppercase tracking-widest font-bold mb-1">Logging out in</span>
              <span className="text-2xl font-extrabold text-red-700">{warningCountdown} SECONDS</span>
            </div>

            <div className="flex gap-3">
              <button
                id="btn-extend-session"
                type="button"
                onClick={handleExtendSession}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Extend Session Activity
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
              >
                Lock Session Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
