import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, MessageSquare, FileText, FolderKanban, LogOut, Clock, Users, Shield, Fingerprint } from 'lucide-react';
import { Category, FeedbackItem, FormTemplate, User, UserGroup, UserAccessRights, UamAuditLog } from './types';
import { getStoredCategories, saveStoredCategories, getStoredFeedback, saveStoredFeedback, getStoredForms, saveStoredForms, getStoredUsers, saveStoredUsers, getStoredUserGroups, saveStoredUserGroups, getStoredUamAccess, saveStoredUamAccess, getStoredUamLogs, saveStoredUamLogs } from './initialData';

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
  
  const [currentTime, setCurrentTime] = useState(new Date());

  // Refs for tracking timers
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

  // Auth helper callbacks
  const handleLoginSuccess = (usr: string) => {
    setIsAuthenticated(true);
    setUsername(usr);
    localStorage.setItem('feedback_mgt_auth', 'true');
    localStorage.setItem('feedback_mgt_user', usr);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    localStorage.removeItem('feedback_mgt_auth');
    localStorage.removeItem('feedback_mgt_user');
    setActiveTab('dashboard');
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
    </div>
  );
}
