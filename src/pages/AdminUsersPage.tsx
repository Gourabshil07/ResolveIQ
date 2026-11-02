import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  Shield,
  CheckCircle2,
  X,
  Trash2,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, UserProfile, UserRole } from '../services/api';

export const AdminUsersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole | 'BLOCKED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Action busy indicator per user ID
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleBlockUser = async (user: UserProfile) => {
    if (user.role === 'ADMIN' || user.id === currentUser?.id) {
      setError('Safety protection: Administrator accounts cannot be blocked.');
      return;
    }

    const isCurrentlyBlocked = user.status === 'BLOCKED' || user.isBlocked === true;
    const nextStatus: 'ACTIVE' | 'BLOCKED' = isCurrentlyBlocked ? 'ACTIVE' : 'BLOCKED';

    setActionUserId(user.id);
    setError(null);

    try {
      const res = await api.updateUserStatus(user.id, nextStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, status: nextStatus, isBlocked: nextStatus === 'BLOCKED' }
            : u
        )
      );
      setSuccessMessage(res.message || `User ${user.fullName} is now ${nextStatus === 'BLOCKED' ? 'blocked' : 'active'}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update user status.');
    } finally {
      setActionUserId(null);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmUser) return;
    if (deleteConfirmUser.role === 'ADMIN' || deleteConfirmUser.id === currentUser?.id) {
      setError('Safety protection: Administrator accounts cannot be deleted.');
      setDeleteConfirmUser(null);
      return;
    }

    setDeletingUser(true);
    setError(null);

    try {
      const res = await api.deleteUser(deleteConfirmUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirmUser.id));
      setSuccessMessage(res.message || `User ${deleteConfirmUser.fullName} has been permanently deleted.`);
      setDeleteConfirmUser(null);
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to permanently delete user account.');
    } finally {
      setDeletingUser(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (roleFilter === 'ALL') return true;
    if (roleFilter === 'BLOCKED') return u.status === 'BLOCKED' || u.isBlocked === true;
    return u.role === roleFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            User Management & Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage user accounts, roles, access permissions, and account lifecycle controls.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5 text-xs font-medium"
          title="Refresh Users"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Role & Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start md:self-auto text-xs flex-wrap">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              roleFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              roleFilter === 'ADMIN'
                ? 'bg-white text-purple-900 shadow-2xs'
                : 'text-slate-600 hover:text-purple-800'
            }`}
          >
            Admins ({users.filter((u) => u.role === 'ADMIN').length})
          </button>
          <button
            onClick={() => setRoleFilter('SUPPORT_ENGINEER')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              roleFilter === 'SUPPORT_ENGINEER'
                ? 'bg-white text-blue-900 shadow-2xs'
                : 'text-slate-600 hover:text-blue-800'
            }`}
          >
            Engineers ({users.filter((u) => u.role === 'SUPPORT_ENGINEER').length})
          </button>
          <button
            onClick={() => setRoleFilter('IT_USER')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              roleFilter === 'IT_USER'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            IT Users ({users.filter((u) => u.role === 'IT_USER').length})
          </button>
          <button
            onClick={() => setRoleFilter('BLOCKED')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              roleFilter === 'BLOCKED'
                ? 'bg-white text-red-900 shadow-2xs'
                : 'text-slate-600 hover:text-red-800'
            }`}
          >
            Blocked ({users.filter((u) => u.status === 'BLOCKED' || u.isBlocked).length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading user directory...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No users found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Account ID</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const isBlocked = user.status === 'BLOCKED' || user.isBlocked === true;
                  const isSelfOrAdmin = user.role === 'ADMIN' || user.id === currentUser?.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* User Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full font-bold text-white text-xs flex items-center justify-center shrink-0 ${
                              user.role === 'ADMIN'
                                ? 'bg-purple-600'
                                : user.role === 'SUPPORT_ENGINEER'
                                ? 'bg-blue-600'
                                : 'bg-slate-600'
                            }`}
                          >
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{user.fullName}</div>
                            {user.id === currentUser?.id && (
                              <span className="text-[10px] text-blue-600 font-medium">(You)</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email Address */}
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {user.email}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[11px] font-medium px-2 py-0.5 rounded ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'SUPPORT_ENGINEER'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {user.role === 'ADMIN' && <Shield className="w-3 h-3 text-purple-700" />}
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                            BLOCKED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            ACTIVE
                          </span>
                        )}
                      </td>

                      {/* Account ID */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        <span className="truncate max-w-[120px] inline-block" title={user.id}>
                          {user.id}
                        </span>
                      </td>

                      {/* Registered */}
                      <td className="py-3 px-4 text-slate-500 font-mono tabular-nums whitespace-nowrap">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isSelfOrAdmin ? (
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-flex items-center gap-1">
                            <Shield className="w-3 h-3 text-purple-600" />
                            Admin Protected
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Block / Unblock Button */}
                            <button
                              onClick={() => handleToggleBlockUser(user)}
                              disabled={actionUserId === user.id}
                              className={`text-[11px] font-semibold px-2 py-1 rounded-md border transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50 ${
                                isBlocked
                                  ? 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                  : 'text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-200'
                              }`}
                              title={isBlocked ? 'Unblock User Account' : 'Block User Account'}
                            >
                              <Ban className="w-3 h-3" />
                              <span>{isBlocked ? 'Unblock' : 'Block'}</span>
                            </button>

                            {/* Delete User Button */}
                            <button
                              onClick={() => setDeleteConfirmUser(user)}
                              disabled={actionUserId === user.id}
                              className="text-[11px] font-semibold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md border border-red-200 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              title="Permanently Delete User"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete User Professional Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Permanently Delete User</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to permanently remove this user account?
                </p>
              </div>
              <button
                onClick={() => {
                  if (!deletingUser) setDeleteConfirmUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Clearly display user's name and email */}
            <div className="my-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Full Name:</span>
                <span className="text-slate-900 font-bold">{deleteConfirmUser.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Email Address:</span>
                <span className="text-slate-900 font-mono font-medium">{deleteConfirmUser.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Role:</span>
                <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">
                  {deleteConfirmUser.role}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Account ID:</span>
                <span className="font-mono text-[10px] text-slate-500 truncate max-w-[200px]">
                  {deleteConfirmUser.id}
                </span>
              </div>
            </div>

            {/* Operational notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-relaxed mb-5 flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Operational History Preserved:</strong> The account will be permanently purged from authentication and the user directory. Incident tickets, message updates, and audit records are safely unlinked and preserved for organizational continuity.
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                disabled={deletingUser}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deletingUser}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {deletingUser ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting User...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
