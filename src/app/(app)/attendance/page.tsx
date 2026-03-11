"use client";

import { getAttendanceByDate, signIn, signOut } from '@/actions/attendance';
import { getActiveProjects } from '@/actions/projects';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { CalendarDays, ChevronLeft, ChevronRight, Download, HardHat, LogIn, LogOut, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AttendanceRecord {
    id: string;
    workerName: string;
    company: string;
    role: string;
    timeIn: Date;
    timeOut?: Date | null;
    date: Date;
}

interface Project { id: string; name: string; }

const FMT_TIME = (d: Date | string) => new Date(d).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
const FMT_DATE_DISPLAY = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function AttendancePage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    const [logs, setLogs] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [signOutSheet, setSignOutSheet] = useState<AttendanceRecord | null>(null);
    const [form, setForm] = useState({ workerName: '', company: '', role: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function init() {
            const res = await getActiveProjects();
            if (res.success && res.projects && res.projects.length > 0) {
                setProjects(res.projects as Project[]);
                setSelectedProject(res.projects[0].id);
            } else { setLoading(false); }
        }
        init();
    }, []);

    useEffect(() => { if (selectedProject) load(); }, [selectedProject, selectedDate]);

    async function load() {
        setLoading(true);
        const res = await getAttendanceByDate(selectedProject, selectedDate);
        if (res.success && res.logs) setLogs(res.logs as unknown as AttendanceRecord[]);
        setLoading(false);
    }

    async function handleSignIn() {
        if (!form.workerName.trim()) return;
        setSaving(true);
        await signIn({ ...form, projectId: selectedProject });
        setIsSheetOpen(false);
        setForm({ workerName: '', company: '', role: '' });
        load();
        setSaving(false);
    }

    async function handleSignOut(logId: string) {
        await signOut(logId);
        setSignOutSheet(null);
        load();
    }

    const changeDate = (delta: number) => {
        const d = new Date(selectedDate + 'T00:00:00');
        d.setDate(d.getDate() + delta);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const onSite = logs.filter(l => !l.timeOut).length;
    const total = logs.length;

    // CSV Export
    function exportCSV() {
        const rows = [['Name', 'Company', 'Role', 'Time In', 'Time Out', 'Date']];
        logs.forEach(l => rows.push([l.workerName, l.company, l.role, FMT_TIME(l.timeIn), l.timeOut ? FMT_TIME(l.timeOut) : 'Still On Site', selectedDate]));
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `attendance_${selectedDate}.csv`; a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5 animate-in fade-in duration-500 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Attendance</h1>
                    <p className="text-text-muted text-sm mt-0.5">{isToday ? "Today's" : 'Historical'} site log</p>
                </div>
                <div className="flex gap-2">
                    {total > 0 && (
                        <button onClick={exportCSV} className="flex items-center gap-1.5 border border-border text-text-muted hover:text-text-main hover:border-primary-300 font-bold px-3 py-2 rounded-xl text-xs transition-colors">
                            <Download size={14} /> CSV
                        </button>
                    )}
                    {isToday && (
                        <Button onClick={() => setIsSheetOpen(true)} className="flex items-center gap-2" disabled={!selectedProject}>
                            <UserCheck size={16} /> Sign In
                        </Button>
                    )}
                </div>
            </div>

            {/* Project selector */}
            {projects.length > 0 && (
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full border border-border rounded-xl px-4 py-3 text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            )}

            {/* Date Navigator */}
            <div className="flex items-center gap-2">
                <button onClick={() => changeDate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl border border-border hover:bg-surface-muted transition-colors shrink-0">
                    <ChevronLeft size={18} />
                </button>
                <div className="flex-1 relative">
                    <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                        type="date"
                        value={selectedDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-sm"
                    />
                </div>
                <button onClick={() => changeDate(1)} disabled={isToday} className="w-10 h-10 flex items-center justify-center rounded-xl border border-border hover:bg-surface-muted transition-colors shrink-0 disabled:opacity-40">
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Date display */}
            <p className="text-sm font-semibold text-text-muted text-center">{FMT_DATE_DISPLAY(selectedDate)}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-primary-50 border border-primary-100 rounded-xl py-3">
                    <p className="text-2xl font-black text-primary-900">{total}</p>
                    <p className="text-[10px] font-bold text-primary-700 uppercase tracking-wider">Total Signed In</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl py-3">
                    <p className="text-2xl font-black text-emerald-900">{onSite}</p>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Still On Site</p>
                </div>
                <div className="bg-surface-muted border border-border rounded-xl py-3">
                    <p className="text-2xl font-black text-text-muted">{total - onSite}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Signed Out</p>
                </div>
            </div>

            {/* Attendance List */}
            {loading ? (
                <div className="text-center py-10"><div className="w-7 h-7 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : logs.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
                    <HardHat size={48} className="mx-auto text-text-muted/40 mb-4" />
                    <h3 className="font-bold text-text-main mb-2">No attendance for this day</h3>
                    <p className="text-text-muted text-sm">{isToday ? 'Sign in a worker to start tracking.' : 'No workers were signed in on this day.'}</p>
                    {isToday && <Button className="mt-4" onClick={() => setIsSheetOpen(true)}><UserCheck size={16} className="mr-2" /> Sign In First Worker</Button>}
                </div>
            ) : (
                <div className="space-y-2">
                    {logs.map(log => (
                        <Card key={log.id} className={`transition-all hover:shadow-sm ${log.timeOut ? 'opacity-70' : 'border-emerald-200 bg-emerald-50/30'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${log.timeOut ? 'bg-gray-200 text-gray-500' : 'bg-emerald-500 text-white'}`}>
                                    {log.workerName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-text-main text-sm">{log.workerName}</p>
                                    <p className="text-xs text-text-muted">{log.role}{log.company ? ` · ${log.company}` : ''}</p>
                                    <div className="flex gap-3 mt-1 text-xs text-text-muted">
                                        <span className="flex items-center gap-1 text-emerald-600"><LogIn size={10} /> {FMT_TIME(log.timeIn)}</span>
                                        {log.timeOut && <span className="flex items-center gap-1 text-gray-500"><LogOut size={10} /> {FMT_TIME(log.timeOut)}</span>}
                                    </div>
                                </div>
                                <div className="shrink-0 flex flex-col items-end gap-1">
                                    {!log.timeOut ? (
                                        <>
                                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">ON SITE</span>
                                            {isToday && (
                                                <button onClick={() => setSignOutSheet(log)} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 mt-1">
                                                    <LogOut size={12} /> Sign Out
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">SIGNED OUT</span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Sign In Sheet */}
            <BottomSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Sign In Worker">
                <div className="space-y-4 pb-4">
                    <Input label="Worker Name *" placeholder="e.g. Emeka Johnson" value={form.workerName} onChange={e => setForm(f => ({ ...f, workerName: e.target.value }))} autoFocus />
                    <Input label="Role / Trade" placeholder="e.g. Glazier, Scaffolder" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
                    <Input label="Company / Subcontractor" placeholder="e.g. BrightGlass Ltd" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                    <Button fullWidth onClick={handleSignIn} disabled={saving || !form.workerName.trim()}>{saving ? 'Signing in...' : '✓ Sign In Now'}</Button>
                </div>
            </BottomSheet>

            {/* Sign Out Confirmation Sheet */}
            <BottomSheet isOpen={!!signOutSheet} onClose={() => setSignOutSheet(null)} title="Sign Out Worker">
                {signOutSheet && (
                    <div className="space-y-4 pb-4">
                        <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                                <LogOut size={28} className="text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-text-main">{signOutSheet.workerName}</h3>
                            <p className="text-text-muted text-sm">{signOutSheet.role} · Signed in at {FMT_TIME(signOutSheet.timeIn)}</p>
                        </div>
                        <Button fullWidth onClick={() => handleSignOut(signOutSheet.id)} variant="danger">Confirm Sign Out</Button>
                    </div>
                )}
            </BottomSheet>
        </div>
    );
}
