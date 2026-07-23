import React, { useState, useMemo } from 'react';
import { User, UserGroup, UserStatus } from '../types';
import { Search, Plus, Edit2, ShieldAlert, Key, CheckCircle, XCircle, Trash2, Shield, UserX, UserCheck } from 'lucide-react';

interface UserManagerProps {
  users: User[];
  userGroups: UserGroup[];
  onUpdateUsers: (updated: User[]) => void;
  currentUser: string;
}

export default function UserManager({ users, userGroups, onUpdateUsers, currentUser }: UserManagerProps) {
  // Filtering & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Edit / Create Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form Fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [userGroupId, setUserGroupId] = useState('');
  const [status, setStatus] = useState<UserStatus>('Active');

  // Reset Password State
  const [tempPassword, setTempPassword] = useState('');

  // Toast / Status Message State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered users (excluding soft-deleted ones)
  // Let's assume soft delete removes it from active list or we filter out if we want to retain but mark.
  // We'll filter out completely from this view if deleted, but let's just do standard filter.
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const group = userGroups.find(g => g.id === u.userGroupId);
      const matchesSearch = 
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGroup = selectedGroupFilter === 'all' || u.userGroupId === selectedGroupFilter;
      const matchesStatus = selectedStatusFilter === 'all' || u.status === selectedStatusFilter;

      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [users, searchQuery, selectedGroupFilter, selectedStatusFilter, userGroups]);

  // Paginated users
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedUser(null);
    setUsername('');
    setFullName('');
    setEmail('');
    setUserGroupId(userGroups[0]?.id || '');
    setStatus('Active');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setUsername(user.username);
    setFullName(user.fullName);
    setEmail(user.email);
    setUserGroupId(user.userGroupId);
    setStatus(user.status);
    setIsModalOpen(true);
  };

  // Submit Save/Create Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !fullName.trim() || !email.trim() || !userGroupId) {
      showToast('All fields are required', 'error');
      return;
    }

    // Check duplicate username (exclude self in edit)
    const isDuplicate = users.some(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.id !== selectedUser?.id);
    if (isDuplicate) {
      showToast('Username already exists', 'error');
      return;
    }

    let updatedUsers: User[];

    if (selectedUser) {
      // Edit mode
      updatedUsers = users.map((u) => {
        if (u.id === selectedUser.id) {
          return {
            ...u,
            username: username.trim(),
            fullName: fullName.trim(),
            email: email.trim(),
            userGroupId,
            status,
          };
        }
        return u;
      });
      showToast(`User ${username} updated successfully!`);
    } else {
      // Create mode
      const newUser: User = {
        id: `user-${Date.now()}`,
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        userGroupId,
        status: 'Active',
        createdDate: new Date().toISOString(),
        lastLoginDate: 'Never',
      };
      updatedUsers = [...users, newUser];
      showToast(`User ${newUser.username} created! Invitation email sent.`);
    }

    onUpdateUsers(updatedUsers);
    setIsModalOpen(false);
  };

  // Soft Delete User
  const handleDeleteUser = (user: User) => {
    if (user.username === 'admin') {
      showToast('Cannot delete default system admin user', 'error');
      return;
    }
    if (confirm(`Are you sure you want to soft delete user ${user.username}?`)) {
      const updatedUsers = users.filter((u) => u.id !== user.id);
      onUpdateUsers(updatedUsers);
      showToast(`User ${user.username} deleted.`);
    }
  };

  // Toggle user active status
  const handleToggleStatus = (user: User, newStatus: UserStatus) => {
    if (user.username === 'admin' && newStatus !== 'Active') {
      showToast('Cannot deactivate or lock default system admin user', 'error');
      return;
    }
    const updatedUsers = users.map((u) => {
      if (u.id === user.id) {
        return { ...u, status: newStatus };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);
    showToast(`User ${user.username} status set to ${newStatus}.`);
  };

  // Reset Password simulation
  const handleOpenResetPassword = (user: User) => {
    setSelectedUser(user);
    // Generate mock temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
    setIsResetPasswordOpen(true);
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
            <h1 className="text-xl font-bold text-slate-900">User Management</h1>
            <p className="text-xs text-slate-500 mt-1">Manage system staff and administrator accounts, reset passwords, and assign groups</p>
          </div>

          <button
            id="btn-create-user"
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Create User
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-50/65 border-b border-slate-150 p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Search Input */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search keywords..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 shadow-sm placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Group Filter */}
          <div>
            <select
              id="user-group-filter"
              value={selectedGroupFilter}
              onChange={(e) => {
                setSelectedGroupFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 shadow-sm"
            >
              <option value="all">All User Groups</option>
              {userGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="user-status-filter"
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 shadow-sm"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Locked">Locked</option>
            </select>
          </div>

          {/* Total stats */}
          <div className="text-right text-slate-500 font-semibold md:pr-2">
            Found {filteredUsers.length} users
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold">
                <th className="p-4 pl-6">Full Name / Username</th>
                <th className="p-4">Email</th>
                <th className="p-4">User Group</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4">Last Login</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((u) => {
                  const uGroup = userGroups.find(g => g.id === u.userGroupId);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">@{u.username}</div>
                      </td>
                      <td className="p-4 font-medium">{u.email}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                          <Shield className="h-3 w-3 text-slate-500" />
                          {uGroup ? uGroup.name : 'Unknown Group'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full ${
                          u.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          u.status === 'Inactive' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {u.status === 'Active' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <XCircle className="h-3 w-3" />}
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{new Date(u.createdDate).toLocaleDateString()}</td>
                      <td className="p-4 text-slate-500 font-mono text-[10px]">
                        {u.lastLoginDate !== 'Never' ? new Date(u.lastLoginDate).toLocaleString() : 'Never'}
                      </td>
                      <td className="p-4 pr-6 text-right space-x-1">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleOpenResetPassword(u)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <Key className="h-3.5 w-3.5" />
                          </button>

                          {u.status === 'Active' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u, 'Inactive')}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Deactivate Account"
                              disabled={u.username === 'admin'}
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u, 'Active')}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-emerald-600 rounded-lg transition-colors cursor-pointer"
                              title="Activate Account"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete User (Soft Delete)"
                            disabled={u.username === 'admin'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                    No users match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 border-t border-slate-150 flex items-center justify-between bg-slate-50/50">
          <div className="text-slate-500 font-medium text-xs">
            Showing Page <b className="text-slate-800">{currentPage}</b> of <b className="text-slate-800">{totalPages}</b>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-600 font-semibold rounded-lg text-xs cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-600 font-semibold rounded-lg text-xs cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {selectedUser ? 'Edit User Details' : 'Create New User Staff Account'}
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
                <label className="block text-slate-600 font-semibold mb-1">Username (login ID)</label>
                <input
                  id="user-username-input"
                  type="text"
                  required
                  placeholder="e.g. msmith"
                  disabled={!!selectedUser}
                  className="w-full bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Full Name</label>
                <input
                  id="user-fullname-input"
                  type="text"
                  required
                  placeholder="e.g. Robert Smith"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
                <input
                  id="user-email-input"
                  type="email"
                  required
                  placeholder="e.g. r.smith@resortcorp.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Assigned User Group</label>
                <select
                  id="user-group-select"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  value={userGroupId}
                  onChange={(e) => setUserGroupId(e.target.value)}
                  disabled={selectedUser?.username === 'admin'}
                >
                  {userGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {selectedUser && selectedUser.username !== 'admin' && (
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Account Operational Status</label>
                  <select
                    id="user-status-select"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as UserStatus)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Locked">Locked</option>
                  </select>
                </div>
              )}

              {!selectedUser && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-[10px] text-blue-800 leading-normal">
                  <b>Inviting User Notification:</b> Creating a user sends an automated verification link & password generation code to the email address.
                </div>
              )}

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
                  Save User Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD DIALOG MODAL */}
      {isResetPasswordOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-scaleIn p-6 space-y-4">
            <div className="flex justify-center text-amber-500">
              <Key className="h-10 w-10 animate-bounce" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Security Password Reset initiated</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                A secure temporary credential has been generated for <b>@{selectedUser?.username}</b>. They must reset this immediately upon next session login.
              </p>
            </div>

            <div className="bg-slate-950 text-slate-100 font-mono text-center text-sm py-2 px-4 rounded-lg select-all border border-slate-800 tracking-wider">
              {tempPassword}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsResetPasswordOpen(false);
                showToast(`Temporary password generated and copied for ${selectedUser?.username}`);
              }}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer text-center"
            >
              Done, Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
