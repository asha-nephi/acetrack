"use client";

import { auth, db } from '@/lib/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppContext } from '@/context/AppContext';
import { CheckCircle2, Eye, EyeOff, Lock, Palette, User } from 'lucide-react';
import { useState } from 'react';

const COLORS = [
    { label: 'Ace Blue', value: '#1d4ed8' },
    { label: 'Safety Orange', value: '#ea580c' },
    { label: 'Emerald Green', value: '#10b981' },
    { label: 'Charcoal', value: '#374151' },
    { label: 'Crimson', value: '#dc2626' },
    { label: 'Purple', value: '#7c3aed' },
];

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    md: 'Managing Director',
    executive_director: 'Executive Director',
    supervisor: 'Site Supervisor',
    factory_head: 'Factory Head',
};

export default function SettingsPage() {
    const { user, settings, updateSettings } = useAppContext();
    const [phone, setPhone] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');

    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [savingPwd, setSavingPwd] = useState(false);
    const [pwdMsg, setPwdMsg] = useState('');
    const [pwdError, setPwdError] = useState('');

    async function handleSaveProfile() {
        if (!user.id) return;
        setSavingProfile(true);
        setProfileMsg('');
        try {
            await updateDoc(doc(db, 'users', user.id), { phone: phone || '' });
            setProfileMsg('Profile updated.');
        } catch (e) { console.error(e); }
        setSavingProfile(false);
    }

    async function handleChangePassword() {
        setPwdError('');
        setPwdMsg('');
        if (!currentPwd || !newPwd || !confirmPwd) { setPwdError('All fields are required.'); return; }
        if (newPwd !== confirmPwd) { setPwdError('New passwords do not match.'); return; }
        if (newPwd.length < 8) { setPwdError('New password must be at least 8 characters.'); return; }

        setSavingPwd(true);
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser || !firebaseUser.email) { setPwdError('Not authenticated.'); setSavingPwd(false); return; }
            const credential = EmailAuthProvider.credential(firebaseUser.email, currentPwd);
            await reauthenticateWithCredential(firebaseUser, credential);
            await updatePassword(firebaseUser, newPwd);
            setPwdMsg('Password changed successfully.');
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        } catch (e: any) {
            setPwdError(e.code === 'auth/wrong-password' ? 'Current password is incorrect.' : 'Failed to change password.');
        }
        setSavingPwd(false);
    }


    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto animate-in fade-in duration-500 pb-24 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-main">Settings</h1>
                <p className="text-text-muted text-sm mt-0.5">Manage your account and preferences.</p>
            </div>

            {/* Profile Card */}
            <Card>
                <div className="flex items-center gap-3 mb-5">
                    <User size={20} className="text-primary-600" />
                    <h2 className="text-base font-bold text-text-main">My Profile</h2>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-surface-muted rounded-xl border border-border">
                        <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-black text-xl shrink-0">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-text-main">{user.name}</p>
                            <p className="text-sm text-primary-600 font-semibold">{ROLE_LABELS[user.role || ''] || user.role}</p>
                        </div>
                    </div>
                    <Input label="Phone Number (Optional)" placeholder="e.g. +234 812 345 6789" value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
                    {profileMsg && <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 size={14} /> {profileMsg}</p>}
                    <Button onClick={handleSaveProfile} disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Profile'}</Button>
                </div>
            </Card>

            {/* Change Password Card */}
            <Card>
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <Lock size={20} className="text-primary-600" />
                        <h2 className="text-base font-bold text-text-main">Change Password</h2>
                    </div>
                    <button onClick={() => setShowPwd(p => !p)} className="text-text-muted hover:text-text-main transition-colors">
                        {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                <div className="space-y-4">
                    <Input label="Current Password" type={showPwd ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="Enter current password" />
                    <Input label="New Password" type={showPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 characters" />
                    <Input label="Confirm New Password" type={showPwd ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Repeat new password" />
                    {pwdError && <p className="text-xs text-red-600 font-semibold">{pwdError}</p>}
                    {pwdMsg && <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 size={14} /> {pwdMsg}</p>}
                    <Button onClick={handleChangePassword} disabled={savingPwd}>{savingPwd ? 'Changing...' : 'Change Password'}</Button>
                </div>
            </Card>

            {/* Report Color */}
            <Card>
                <div className="flex items-center gap-3 mb-4">
                    <Palette size={20} className="text-primary-600" />
                    <h2 className="text-base font-bold text-text-main">PDF Report Color</h2>
                </div>
                <p className="text-sm text-text-muted mb-4">Primary accent color used in your generated reports.</p>
                <div className="grid grid-cols-3 gap-2">
                    {COLORS.map(color => (
                        <button key={color.value} onClick={() => updateSettings({ reportColor: color.value })} className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${settings.reportColor === color.value ? 'border-primary-600 bg-primary-50' : 'border-border bg-surface hover:border-primary-300'}`}>
                            <div className="w-5 h-5 rounded-full shrink-0 shadow-inner border border-black/10" style={{ backgroundColor: color.value }} />
                            <span className="text-xs font-semibold text-text-main truncate">{color.label}</span>
                        </button>
                    ))}
                </div>
            </Card>

            {/* App Version */}
            <div className="text-center text-xs text-text-muted/40 py-2">AceTrack OS v1.0 · Ace Facades Limited</div>
        </div>
    );
}
