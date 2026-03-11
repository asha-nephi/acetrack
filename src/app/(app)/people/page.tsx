"use client";

import { createUser, deactivateUser, getUsers, reactivateUser, updateUserRole } from '@/actions/people';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppContext } from '@/context/AppContext';
import { Eye, EyeOff, Shield, UserCheck, UserPlus, UserX, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string | null;
    isActive: boolean;
    createdAt: Date;
}

const ROLES = ['admin', 'md', 'site_manager', 'factory_manager'];
const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    md: 'Managing Director',
    site_manager: 'Site Manager',
    factory_manager: 'Factory Head',
};
const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    md: 'bg-purple-100 text-purple-700 border-purple-200',
    site_manager: 'bg-blue-100 text-blue-700 border-blue-200',
    factory_manager: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function PeoplePage() {
    const { user: currentUser } = useAppContext();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'site_manager', phone: '' });

    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'md';

    const load = async () => {
        setLoading(true);
        const res = await getUsers();
        if (res.success && res.users) setUsers(res.users as unknown as User[]);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleRoleChange = async (userId: string, role: string) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
        await updateUserRole(userId, role);
    };

    const handleDeactivate = async (userId: string) => {
        if (!confirm('Deactivate this user? They will no longer be able to log in.')) return;
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: false } : u));
        await deactivateUser(userId);
    };

    const handleReactivate = async (userId: string) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: true } : u));
        await reactivateUser(userId);
    };

    const handleCreateUser = async () => {
        setFormError('');
        if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
            setFormError('Name, email and password are required.');
            return;
        }
        if (form.password.length < 8) {
            setFormError('Password must be at least 8 characters.');
            return;
        }
        setSaving(true);
        const res = await createUser(form);
        if (res.success) {
            setIsSheetOpen(false);
            setForm({ name: '', email: '', password: '', role: 'site_manager', phone: '' });
            load();
        } else {
            setFormError(res.error || 'Failed to create user.');
        }
        setSaving(false);
    };

    const activeUsers = users.filter(u => u.isActive);
    const inactiveUsers = users.filter(u => !u.isActive);

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5 animate-in fade-in duration-500 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">People</h1>
                    <p className="text-text-muted text-sm mt-0.5">{activeUsers.length} active {activeUsers.length === 1 ? 'member' : 'members'}</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => { setFormError(''); setIsSheetOpen(true); }} className="flex items-center gap-2">
                        <UserPlus size={16} /> Add User
                    </Button>
                )}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface border border-border rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-text-main">{users.length}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-emerald-900">{activeUsers.length}</p>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active</p>
                </div>
                <div className="bg-surface-muted border border-border rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-text-muted">{inactiveUsers.length}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Inactive</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10"><div className="w-7 h-7 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : (
                <div className="space-y-6">
                    {/* Active Users */}
                    <div className="space-y-3">
                        {activeUsers.map(user => (
                            <Card key={user.id} className="hover:border-primary-200 hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-black text-lg shrink-0">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-text-main truncate">{user.name}</p>
                                        <p className="text-xs text-text-muted truncate">{user.email}</p>
                                        {user.phone && <p className="text-xs text-text-muted">{user.phone}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {isAdmin && user.id !== currentUser.id ? (
                                            <select
                                                value={user.role}
                                                onChange={e => handleRoleChange(user.id, e.target.value)}
                                                className={`text-xs font-bold rounded-full px-3 py-1 border cursor-pointer focus:outline-none ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                                            >
                                                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                                            </select>
                                        ) : (
                                            <span className={`text-xs font-bold rounded-full px-3 py-1 border ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                        )}
                                        {isAdmin && user.id !== currentUser.id && (
                                            <button onClick={() => handleDeactivate(user.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1" title="Deactivate">
                                                <UserX size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Inactive Users */}
                    {inactiveUsers.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Deactivated ({inactiveUsers.length})</h3>
                            <div className="space-y-2">
                                {inactiveUsers.map(user => (
                                    <Card key={user.id} className="opacity-60 group hover:opacity-80 transition-opacity">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center font-black text-lg shrink-0 grayscale">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-text-muted truncate line-through">{user.name}</p>
                                                <p className="text-xs text-text-muted truncate">{user.email}</p>
                                            </div>
                                            {isAdmin && (
                                                <button onClick={() => handleReactivate(user.id)} className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-full transition-colors">
                                                    <UserCheck size={14} /> Reactivate
                                                </button>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {users.length === 0 && (
                        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
                            <Users size={48} className="mx-auto text-text-muted/40 mb-4" />
                            <p className="font-bold text-text-main">No users yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create User Sheet */}
            <BottomSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Add New Team Member">
                <div className="space-y-4 pb-4">
                    <Input label="Full Name *" placeholder="e.g. Emeka Johnson" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                    <Input label="Email Address *" type="email" placeholder="e.g. emeka@acefacades.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    <div className="relative">
                        <Input label="Temporary Password *" type={showPwd ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                        <button onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-9 text-text-muted hover:text-text-main">
                            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <Input label="Phone (Optional)" type="tel" placeholder="+234 812 345 6789" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    <div>
                        <label className="block text-sm font-semibold text-text-muted mb-1.5">Role</label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.map(r => (
                                <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))} className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 text-left flex items-center gap-2 transition-all ${form.role === r ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-border bg-surface text-text-muted'}`}>
                                    <Shield size={14} /> {ROLE_LABELS[r]}
                                </button>
                            ))}
                        </div>
                    </div>
                    {formError && <p className="text-red-500 text-sm">{formError}</p>}
                    <p className="text-xs text-text-muted">The user will log in with this email and their temporary password then change it from Settings.</p>
                    <Button fullWidth onClick={handleCreateUser} disabled={saving}>{saving ? 'Creating...' : 'Create User'}</Button>
                </div>
            </BottomSheet>
        </div>
    );
}
