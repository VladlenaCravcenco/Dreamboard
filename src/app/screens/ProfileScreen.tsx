import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDreams } from '../context/DreamContext';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { User, Mail, Lock, LogOut, Trash2, Award, Target, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '../lib/supabase';

export default function ProfileScreen() {
  const { user, signOut, updateName, changePassword, deleteAccount } = useAuth();
  const { dreams, completedDreams, refreshDreams } = useDreams();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  if (!user) return null;

  const activeDreams = dreams.filter((d) => !d.done);
  const totalSaved = activeDreams.reduce((sum, d) => sum + (d.saved_amount ?? 0), 0);

  // ─── Name update ──────────────────────────────────────────────────────────

  const handleUpdateName = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setSavingName(true);
    try {
      await updateName(name.trim());
      toast.success('Name updated');
      setIsEditingName(false);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  // ─── Password change ──────────────────────────────────────────────────────

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(newPassword);
      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  // ─── Clear all data ───────────────────────────────────────────────────────

  const handleClearAllData = async () => {
    setActionLoading(true);
    try {
      // Delete all active and completed dreams from the server
      const allIds = [
        ...dreams.map((d) => d.id),
        ...completedDreams.map((d) => d.id),
      ];
      await Promise.allSettled(
        allIds.map((id) => apiCall(`/dreams/${id}`, { method: 'DELETE' }))
      );
      await refreshDreams();
      toast.success('All data cleared');
      setShowClearConfirm(false);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to clear data');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Delete account ───────────────────────────────────────────────────────

  const handleDeleteAccount = async () => {
    setActionLoading(true);
    try {
      await deleteAccount();
      toast.success('Account deleted');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to delete account');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Sign out ─────────────────────────────────────────────────────────────

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/');
  };

  // ─── UI ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-serif text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground">Manage your account</p>
      </div>

      {/* ── Account Info ─────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
          <User className="w-5 h-5" />
          Account Information
        </h2>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
              Display Name
            </label>
            {isEditingName ? (
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                  placeholder="Your name"
                  autoFocus
                />
                <Button size="sm" onClick={handleUpdateName} disabled={savingName}>
                  {savingName ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setName(user.name);
                    setIsEditingName(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <p className="text-lg">{user.name || 'Not set'}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEditingName(true)}>
                  Edit
                </Button>
              </div>
            )}
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
              Email
            </label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <p className="text-lg">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Your Journey ─────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
          <Award className="w-5 h-5" />
          Your Journey
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{activeDreams.length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{completedDreams.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <span className="text-2xl mx-auto mb-2 block">💰</span>
            <p className="text-2xl font-bold">${totalSaved.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Saved</p>
          </div>
        </div>
      </div>

      {/* ── Change Password ───────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
              New Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
              Confirm New Password
            </label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={savingPassword || !newPassword || !confirmPassword}
          >
            {savingPassword ? 'Changing…' : 'Change Password'}
          </Button>
        </form>
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-medium mb-6">Account Actions</h2>

        <div className="space-y-4">
          {/* Sign Out */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <h3 className="font-medium flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </h3>
              <p className="text-sm text-muted-foreground">Sign out from this device</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>

          {/* Clear All Data */}
          <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
            <div>
              <h3 className="font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Trash2 className="w-4 h-4" />
                Clear All Dreams
              </h3>
              <p className="text-sm text-muted-foreground">
                Delete all your dreams and data — cannot be undone
              </p>
            </div>
            {!showClearConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(true)}
                className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400"
              >
                Clear
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAllData}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Clearing…' : 'Confirm'}
                </Button>
              </div>
            )}
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
            <div>
              <h3 className="font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
              >
                Delete
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Deleting…' : 'Confirm Delete'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
