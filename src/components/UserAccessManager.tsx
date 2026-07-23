import React, { useState } from 'react';
import { UserGroup, UserAccessRights, AppModule, PermissionAction, UamAuditLog } from '../types';
import { ShieldCheck, CheckSquare, Square, Save, RotateCcw, AlertCircle, History, User } from 'lucide-react';

interface UserAccessManagerProps {
  userGroups: UserGroup[];
  accessRights: UserAccessRights[];
  uamLogs: UamAuditLog[];
  onUpdateAccessRights: (updated: UserAccessRights[]) => void;
  onUpdateUamLogs: (updated: UamAuditLog[]) => void;
  currentUser: string;
  initialSelectedGroupId?: string;
}

// Config of valid actions per module (matching requested matrix)
const MODULE_ACTIONS: Record<AppModule, PermissionAction[]> = {
  'Dashboard': ['view', 'export'],
  'Customer Feedback': ['view', 'edit', 'delete', 'reply', 'export'],
  'Form Builder': ['view', 'create', 'edit', 'delete'],
  'Category': ['view', 'create', 'edit', 'delete'],
  'User': ['view', 'create', 'edit', 'delete'],
  'User Group': ['view', 'create', 'edit', 'delete'],
  'Setting': ['view', 'edit'],
};

const ALL_ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'reply', label: 'Reply' },
  { key: 'export', label: 'Export' },
];

export default function UserAccessManager({
  userGroups,
  accessRights,
  uamLogs,
  onUpdateAccessRights,
  onUpdateUamLogs,
  currentUser,
  initialSelectedGroupId,
}: UserAccessManagerProps) {
  // Current Selected User Group to configure
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    if (initialSelectedGroupId && userGroups.some(g => g.id === initialSelectedGroupId)) {
      return initialSelectedGroupId;
    }
    return userGroups[0]?.id || '';
  });

  // State to hold temporary edited permissions
  const [tempPermissions, setTempPermissions] = useState<Record<AppModule, Record<PermissionAction, boolean>> | null>(null);

  // Load permissions for selected group
  const activeRights = accessRights.find(r => r.userGroupId === selectedGroupId);
  const activeGroup = userGroups.find(g => g.id === selectedGroupId);

  // Initialize/Sync temp state
  const currentPermissions = tempPermissions || (activeRights ? activeRights.permissions : {} as Record<AppModule, Record<PermissionAction, boolean>>);

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    setTempPermissions(null); // Reset edits
  };

  // Toggle permission
  const handleTogglePermission = (module: AppModule, action: PermissionAction) => {
    if (activeGroup?.code === 'SUPER_ADMIN') {
      return; // Super Admin cannot be downgraded for security
    }

    const nextPermissions = JSON.parse(JSON.stringify(currentPermissions));
    if (!nextPermissions[module]) {
      nextPermissions[module] = { view: false, create: false, edit: false, delete: false, reply: false, export: false };
    }
    const oldValue = nextPermissions[module][action];
    const newValue = !oldValue;
    nextPermissions[module][action] = newValue;

    setTempPermissions(nextPermissions);
  };

  // Save Permissions & Log Changes
  const handleSave = () => {
    if (!activeGroup || !tempPermissions) return;

    // Build the new access rights object
    const updatedAccessRights = accessRights.map((rights) => {
      if (rights.userGroupId === selectedGroupId) {
        return {
          ...rights,
          permissions: tempPermissions as Record<AppModule, any>,
        };
      }
      return rights;
    });

    // Create Audit Logs for each change
    const originalPerms = activeRights ? activeRights.permissions : {} as Record<AppModule, any>;
    const newLogs: UamAuditLog[] = [];

    (Object.keys(tempPermissions) as AppModule[]).forEach((mod) => {
      (Object.keys(tempPermissions[mod]) as PermissionAction[]).forEach((act) => {
        const origVal = !!originalPerms[mod]?.[act];
        const newVal = !!tempPermissions[mod][act];

        if (origVal !== newVal) {
          newLogs.push({
            id: `uam-log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            changedBy: currentUser,
            changedAt: new Date().toISOString(),
            userGroupName: activeGroup.name,
            moduleName: mod,
            actionName: act,
            newValue: newVal,
          });
        }
      });
    });

    onUpdateAccessRights(updatedAccessRights);
    onUpdateUamLogs([...newLogs, ...uamLogs]);
    setTempPermissions(null); // Reset edit state to loaded
    alert(`Access permissions for '${activeGroup.name}' updated successfully!`);
  };

  // Reset Changes
  const handleReset = () => {
    setTempPermissions(null);
  };

  const isSuperAdminSelected = activeGroup?.code === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 animate-fadeIn text-xs">
      {/* Header Panel */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-150 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/20">
          <div>
            <h1 className="text-xl font-bold text-slate-900">User Access Management (UAM)</h1>
            <p className="text-xs text-slate-500 mt-1">Configure granular system capability permissions for each staff user group</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-600 whitespace-nowrap">Selected Group:</span>
            <select
              id="uam-group-select"
              value={selectedGroupId}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {userGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} Role</option>
              ))}
            </select>
          </div>
        </div>

        {isSuperAdminSelected && (
          <div className="mx-5 my-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-blue-800 leading-normal">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              <b>System Lock Exception:</b> The <b>Super Admin</b> group maintains permanent full read/write permission coverage to prevent lockout situations.
            </span>
          </div>
        )}

        {/* Matrix Area */}
        <div className="p-5 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">System Module</th>
                {ALL_ACTIONS.map((action) => (
                  <th key={action.key} className="py-3 px-4 text-center">{action.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(Object.keys(MODULE_ACTIONS) as AppModule[]).map((moduleName) => {
                const supportedActions = MODULE_ACTIONS[moduleName];

                return (
                  <tr key={moduleName} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">{moduleName}</td>
                    {ALL_ACTIONS.map((action) => {
                      const isSupported = supportedActions.includes(action.key);
                      const isChecked = isSupported && !!currentPermissions[moduleName]?.[action.key];

                      return (
                        <td key={action.key} className="py-4 px-4 text-center">
                          {isSupported ? (
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(moduleName, action.key)}
                              disabled={isSuperAdminSelected}
                              className={`inline-flex items-center justify-center p-1 rounded-md transition-colors cursor-pointer ${
                                isSuperAdminSelected ? 'opacity-80' : 'hover:bg-slate-100'
                              }`}
                            >
                              {isChecked ? (
                                <CheckSquare className={`h-5 w-5 ${isSuperAdminSelected ? 'text-blue-500' : 'text-blue-600'}`} />
                              ) : (
                                <div className="h-5 w-5 border-2 border-slate-300 rounded-md bg-white hover:border-slate-400" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-300 font-mono text-[10px] select-none">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Toolbar Footer */}
        {!isSuperAdminSelected && (
          <div className="p-5 border-t border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              {tempPermissions ? 'You have unsaved access changes' : 'Permissions are fully synchronized'}
            </span>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={!tempPermissions}
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Discard Changes
              </button>
              <button
                type="button"
                disabled={!tempPermissions}
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" /> Save access rights
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Logs History Panel */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-150 flex items-center gap-2 bg-slate-50/10">
          <History className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900">Permission Configuration Change Log</h2>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {uamLogs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {uamLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/30 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-800 leading-normal">
                      Role <b>{log.userGroupName}</b> was modified: Module <b>{log.moduleName}</b>, Action <b>{log.actionName}</b> permission was set to{' '}
                      <b className={log.newValue ? 'text-emerald-600' : 'text-red-600'}>
                        {log.newValue ? 'ENABLED' : 'DISABLED'}
                      </b>.
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-500" /> Changed by: <b className="text-slate-600">{log.changedBy}</b>
                      </span>
                      <span>•</span>
                      <span>{new Date(log.changedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 font-medium">
              No permission changes recorded in this session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
