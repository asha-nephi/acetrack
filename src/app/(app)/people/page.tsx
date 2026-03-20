"use client";

import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, Timestamp, orderBy, getDocs, where } from 'firebase/firestore';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppContext } from '@/context/AppContext';
import { Eye, EyeOff, Shield, UserCheck, UserPlus, UserX, Users, Cloud, CloudOff, Mail, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string | null;
    isActive: boolean;
    createdAt: any;
}

const ROLES = ['admin', 'md', 'site_manager', 'supervisor', 'factory_manager', 'viewer'];
const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    md: 'Managing Director',
    site_manager: 'Site Manager',
    supervisor: 'Site Supervisor',
    factory_manager: 'Factory Head',
    viewer: 'Viewer Only',
};

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    md: 'bg-purple-100 text-purple-700 border-purple-200',
    site_manager: 'bg-blue-100 text-blue-700 border-blue-200',
    supervisor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    factory_manager: 'bg-amber-100 text-amber-700 border-amber-200',
    viewer: 'bg-gray-100 text-gray-700 border-gray-100',
};

export default function PeoplePage() {
    const { user: currentUser } = useAppContext();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'supervisor', phone: '' });
    const [isOnline, setIsOnline] = useState(true);

    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'md';

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleStatusChange = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);

        const q = query(collection(db, 'users'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snap) => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as User[]);
            setLoading(false);
        });

        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
            unsubscribe();
        };
    }, []);

    const handleRoleChange = async (userId: string, role: string) => {
        if (!isAdmin) return;
        try {
            await updateDoc(doc(db, 'users', userId), { role, updatedAt: Timestamp.now() });
        } catch (e) { console.error(e); }
    };

    const handleDeactivate = async (userId: string) => {
        if (!isAdmin || !confirm('Deactivate this user? They will no longer be able to log in.')) return;
        try {
            await updateDoc(doc(db, 'users', userId), { isActive: false, updatedAt: Timestamp.now() });
        } catch (e) { console.error(e); }
    };

    const handleReactivate = async (userId: string) => {
        if (!isAdmin) return;
        try {
            await updateDoc(doc(db, 'users', userId), { isActive: true, updatedAt: Timestamp.now() });
        } catch (e) { console.error(e); }
    };

    const handleCreateUser = async () => {
        setFormError('');
        if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
            setFormError('Name, email and password are required.');
            return;
        }
        setSaving(true);
        try {
            await addDoc(collection(db, 'users'), {
                ...form,
                isActive: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            setIsSheetOpen(false);
            setForm({ name: '', email: '', password: '', role: 'supervisor', phone: '' });
        } catch (e) {
            setFormError('Failed to create user');
        }
        setSaving(false);
    };

    const activeUsers = users.filter(u => u.isActive);
    const inactiveUsers = users.filter(u => !u.isActive);

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-text-main">Team Management</h1>
                        {isOnline ? (
                            <div className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                <Cloud size={10} /> Online
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                                <CloudOff size={10} /> Offline mode
                            </div>
                        )}
                    </div>
                    <p className="text-text-muted text-sm mt-0.5">Manage roles and permissions for site staff.</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => setIsSheetOpen(true)} className="flex items-center gap-2">
                        <UserPlus size={16} /> Add Member
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                    <p className="text-2xl font-black text-text-main">{users.length}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Staff</p>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                    <p className="text-2xl font-black text-primary-600">{users.filter(m => m.role === 'admin' || m.role === 'md').length}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Admins/MD</p>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                    <p className="text-2xl font-black text-blue-600">{users.filter(m => m.role === 'site_manager').length}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Managers</p>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                    <p className="text-2xl font-black text-emerald-600">{users.filter(m => m.role === 'supervisor').length}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Supervisors</p>
                </Card>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-8 h-8 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
                    <p className="text-sm font-bold text-text-muted">Syncing team records...</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Active */}
                    <div className="space-y-3">
                        {activeUsers.length > 0 && <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Active Staff</h3>}
                        {activeUsers.map(user => (
                            <Card key={user.id} className="group hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary-500">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-surface/80 border border-border flex items-center justify-center font-black text-xl text-primary-600 shrink-0">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-text-main truncate text-base">{user.name}</h3>
                                                {user.id === currentUser.id && <span className="text-[8px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-black uppercase tracking-widest leading-none">You</span>}
                                            </div>
                                            <div className="flex items-center gap-x-4 gap-y-1 text-xs text-text-muted flex-wrap">
                                                <div className="flex items-center gap-1"><Mail size={12} /> {user.email}</div>
                                                {user.phone && <div className="flex items-center gap-1"><Phone size={12} /> {user.phone}</div>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {isAdmin && user.id !== currentUser.id ? (
                                            <select 
                                                value={user.role} 
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer ${ROLE_COLORS[user.role] || 'bg-gray-50'}`}
                                            >
                                                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                                            </select>
                                        ) : (
                                            <div className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border ${ROLE_COLORS[user.role] || 'bg-gray-50'}`}>
                                                {ROLE_LABELS[user.role] || user.role}
                                            </div>
                                        )}

                                        {isAdmin && user.id !== currentUser.id && (
                                            <button onClick={() => handleDeactivate(user.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100">
                                                <UserX size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Deactivated */}
                    {inactiveUsers.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">Deactivated Items</h3>
                            {inactiveUsers.map(user => (
                                <Card key={user.id} className="opacity-60 bg-surface/50 grayscale hover:grayscale-0 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-border flex items-center justify-center font-black text-xl text-gray-400 shrink-0">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-text-main line-through">{user.name}</h3>
                                                <p className="text-xs text-text-muted">{user.email}</p>
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <Button variant="secondary" onClick={() => handleReactivate(user.id)} className="flex items-center gap-2 h-8 px-3 text-[10px] uppercase font-black">
                                                <UserCheck size={14} /> Reactivate
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {users.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl bg-surface/30">
                            <Users size={64} className="mx-auto text-text-muted/20 mb-4" />
                            <h3 className="text-xl font-bold text-text-main mb-2">Build Your Team</h3>
                            <p className="text-text-muted text-sm max-w-md mx-auto mb-8 px-4">Add your site supervisors, project managers, and factory heads to start coordinating site operations.</p>
                            {isAdmin && <Button onClick={() => setIsSheetOpen(true)}>Add First Member</Button>}
                        </div>
                    )}
                </div>
            )}

            {/* Permissions Overview */}
            <div className="p-6 bg-surface border border-border rounded-3xl space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <ShieldCheck size={120} />
                </div>
                <h3 className="text-xs font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} className="text-primary-600" />
                    Security & RBAC Matrix
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
                    <div className="space-y-2">
                        <p className="font-black text-text-main flex items-center gap-2 uppercase tracking-tight"><CheckCircle2 size={12} className="text-primary-600" /> MD & Administrators</p>
                        <p className="text-text-muted pl-5 border-l-2 border-primary-100 italic leading-relaxed">Full system governance. Access to global settings, user management, and advanced reporting. Can override any site logs.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-black text-text-main flex items-center gap-2 uppercase tracking-tight"><CheckCircle2 size={12} className="text-blue-600" /> Site Managers</p>
                        <p className="text-text-muted pl-5 border-l-2 border-blue-100 italic leading-relaxed">Operational oversight. Full access to Task Boards, QA Snagging, and Project Timelines. Can assign work to Supervisors.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-black text-text-main flex items-center gap-2 uppercase tracking-tight"><CheckCircle2 size={12} className="text-emerald-600" /> Site Supervisors</p>
                        <p className="text-text-muted pl-5 border-l-2 border-emerald-100 italic leading-relaxed">Field data entry. Access to Daily Progress, Attendance tracking, and HSE logs. Offline-first workflow for site conditions.</p>
                    </div>
                     <div className="space-y-2">
                        <p className="font-black text-text-main flex items-center gap-2 uppercase tracking-tight"><CheckCircle2 size={12} className="text-amber-600" /> Factory Management</p>
                        <p className="text-text-muted pl-5 border-l-2 border-amber-100 italic leading-relaxed">Logistics & Supply. Exclusive tools for Material Scanning, QR verification, and shipment tracking from factory to site.</p>
                    </div>
                </div>
            </div>

            {/* Add Member Sheet */}
            <BottomSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Register Team Member">
                <div className="space-y-4 pb-6">
                    <Input label="Display Name" placeholder="e.g. John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                    <Input label="Corporate Email" type="email" placeholder="e.g. john@acefacades.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    <div className="relative">
                        <Input label="Secret Key (Password)" type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                        <button onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-[34px] p-2 text-text-muted hover:text-text-main rounded-lg transition-colors">
                            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <Input label="Contact Number" type="tel" placeholder="+234 ..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    <div>
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Site Access Level</label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.map(r => (
                                <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))} className={`py-3 px-4 rounded-2xl text-xs font-bold border-2 text-left flex items-center gap-2 transition-all ${form.role === r ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm' : 'border-border bg-surface text-text-muted hover:border-text-muted/20'}`}>
                                    <Shield size={14} className={form.role === r ? 'text-primary-600' : 'text-text-muted/40'} /> {ROLE_LABELS[r]}
                                </button>
                            ))}
                        </div>
                    </div>
                    {formError && <p className="text-red-500 text-[10px] font-bold uppercase tracking-tight bg-red-50 p-3 rounded-xl border border-red-100">{formError}</p>}
                    <div className="pt-2">
                        <Button fullWidth onClick={handleCreateUser} disabled={saving}>
                            {saving ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Syncing Records...</span>
                                </div>
                            ) : 'Provision Account'}
                        </Button>
                    </div>
                    <p className="text-[10px] text-center text-text-muted italic px-4">Accounts provisioned here are immediately available for sign-in over the site network. Permissions sync across all supervisor devices in real-time.</p>
                </div>
            </BottomSheet>
        </div>
    );
}

