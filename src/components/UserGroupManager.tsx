import React, { useState, useMemo } from 'react';
import { User, UserGroup } from '../types';
import { Plus, Edit2, Shield, Users, CheckCircle, XCircle, Trash2, ShieldAlert, ArrowRight } from 'lucide-react';

interface UserGroupManagerProps {
  userGroups: UserGroup[];
  users: User[];
  onUpdateUserGroups: (updated: UserGroup[]) => void;
  onConfigurePermissions: (groupId: string) => void;
}

export default function UserGroupManager({ userGroups, users, onUpdateUserGroups, onConfigurePermissions }: UserGroupManagerProps) {
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  // Toast Status
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedGroup(null);
    setName('');
    setCode('');
    setDescription('');
    setStatus('Active');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (group: UserGroup) => {
    setSelectedGroup(group);
    setName(group.name);
    setCode(group.code);
    setDescription(group.description);
    setStatus(group.status);
    setIsModalOpen(true);
  };

  // Submit Save Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !code.trim() || !description.trim()) {
      showToast('All fields are required', 'error');
      return;
    }

    const formattedCode = code.trim().toUpperCase().replace(/\s+/g, '_');

    // Check duplicate code
    const isDuplicate = userGroups.some(g => g.code === formattedCode && g.id !== selectedGroup?.id);
    if (isDuplicate) {
      showToast(`Group code ${formattedCode} already exists`, 'error');
      return;
    }

    let updatedGroups: UserGroup[];

    if (selectedGroup) {
      updatedGroups = userGroups.map((g) => {
        if (g.id === selectedGroup.id) {
          return {
            ...g,
            name: name.trim(),
            code: formattedCode,
            description: description.trim(),
            status,
          };
        }
        return g;
      });
      showToast(`User Group '${name}' updated successfully!`);
    } else {
      const newGroup: UserGroup = {
        id: `group-${Date.now()}`,
        name: name.trim(),
        code: formattedCode,
        description: description.trim(),
        status,
      };
      updatedGroups = [...userGroups, newGroup];
      showToast(`User Group '${newGroup.name}' created!`);
    }

    onUpdateUserGroups(updatedGroups);
    setIsModalOpen(false);
  };

  // Delete User Group
  const handleDeleteGroup = (group: UserGroup) => {
    const isDefault = ['SUPER_ADMIN', 'MANAGER', 'AGENT', 'VIEWER'].includes(group.code);
    if (isDefault) {
      showToast(`Cannot delete default system user group '${group.name}'`, 'error');
      return;
    }

    // Check if any users are assigned to this group
    const assignedUsers = users.filter((u) => u.userGroupId === group.id);
    if (assignedUsers.length > 0) {
      showToast(`Cannot delete. There are ${assignedUsers.length} users assigned to '${group.name}'.`, 'error');
      return;
    }

    if (confirm(`Are you sure you want to delete user group '${group.name}'?`)) {
      const updatedGroups = userGroups.filter((g) => g.id !== group.id);
      onUpdateUserGroups(updatedGroups);
      showToast(`User Group '${group.name}' deleted.`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-xs">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border transition-all animate-slideIn ${
          toastMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <ShieldAlert className="h-4 w-4 text-red-600" />}
          <span className="font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header and top controls */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">User Groups & Roles</h1>
            <p className="text-xs text-slate-500 mt-1">Define user roles, view group headcounts, and map granular system access rights</p>
          </div>

          <button
            id="btn-create-group"
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Create User Group
          </button>
        </div>

        {/* User Group Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50/40">
          {userGroups.map((group) => {
            const groupUsers = users.filter((u) => u.userGroupId === group.id);
            const isDefault = ['SUPER_ADMIN', 'MANAGER', 'AGENT', 'VIEWER'].includes(group.code);

            return (
              <div key={group.id} className="bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-blue-600" />
                      {group.name}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                      group.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {group.status}
                    </span>
                  </div>

                  <p className="text-slate-500 leading-normal line-clamp-3 min-h-12.5">
                    {group.description}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <Users className="h-3.5 w-3.5 text-slate-500" />
                    <span>Headcount:</span>
                    <b className="text-slate-800">{groupUsers.length} Active Accounts</b>
                  </div>

                  {/* Render inline list of avatars of users in this group */}
                  {groupUsers.length > 0 && (
                    <div className="flex -space-x-1.5 overflow-hidden py-1">
                      {groupUsers.slice(0, 5).map((usr) => (
                        <div
                          key={usr.id}
                          className="inline-block h-6 w-6 rounded-full bg-slate-100 border-2 border-white items-center justify-center font-bold text-[9px] text-slate-700 capitalize"
                          title={usr.fullName}
                        >
                          {usr.username.charAt(0)}
                        </div>
                      ))}
                      {groupUsers.length > 5 && (
                        <div className="inline-block h-6 w-6 rounded-full bg-slate-200 border-2 border-white items-center justify-center font-bold text-[9px] text-slate-600">
                          +{groupUsers.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(group)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                      title="Edit Group"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete Group"
                      disabled={isDefault}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onConfigurePermissions(group.id)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold transition-colors cursor-pointer"
                  >
                    Set Rights <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE / EDIT USER GROUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {selectedGroup ? 'Edit User Group' : 'Create New User Group / Role'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Group Name</label>
                <input
                  id="group-name-input"
                  type="text"
                  required
                  placeholder="e.g. Duty Manager"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Group Code (Uppercase, unique)</label>
                <input
                  id="group-code-input"
                  type="text"
                  required
                  disabled={selectedGroup ? ['SUPER_ADMIN', 'MANAGER', 'AGENT', 'VIEWER'].includes(selectedGroup.code) : false}
                  placeholder="e.g. DUTY_MANAGER"
                  className="w-full bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white font-mono uppercase"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Role Description</label>
                <textarea
                  id="group-description-input"
                  required
                  rows={3}
                  placeholder="Summarize the purpose of this group and its access boundaries..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Operational Status</label>
                <select
                  id="group-status-select"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
