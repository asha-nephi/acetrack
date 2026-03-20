"use client";

import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useAppContext } from '@/context/AppContext';
import {
    AlertTriangle, ArrowRight, Building2, Calendar, CheckCircle2,
    HardHat, Kanban, MapPin, Package, Shield, TrendingUp, Cloud, CloudOff
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Stats { activeProjects: number; openSnags: number; totalTasks: number; doneTasks: number; hseThisMonth: number; }
interface Project { id: string; name: string; client?: string | null; location: string; progressPct: number; taskCount?: number; snagCount?: number; }
interface Activity { id: string; type: 'snag' | 'task' | 'hse' | 'daily_log'; title: string; subtitle: string; meta: string; status: string; date: any; }

const QUICK_ACTIONS = [
    { label: 'Daily Progress', desc: 'Briefing, Tools & Photos', href: '/daily-report', icon: TrendingUp, color: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
    { label: 'QA Snagging', desc: 'Log defects on blueprint', href: '/snagging', icon: MapPin, color: 'bg-red-50 border-red-100 text-red-600' },
    { label: 'Task Board', desc: 'Manage daily operations', href: '/tasks', icon: Kanban, color: 'bg-purple-50 border-purple-100 text-purple-600' },
    { label: 'Attendance', desc: "Sign in today's workers", href: '/attendance', icon: HardHat, color: 'bg-amber-50 border-amber-100 text-amber-600' },
    { label: 'HSE Log', desc: 'Safety incidents & talks', href: '/hse', icon: Shield, color: 'bg-orange-50 border-orange-100 text-orange-600' },
    { label: 'Delivery Scan', desc: 'Receive materials', href: '/material-scanner', icon: Package, color: 'bg-blue-50 border-blue-100 text-blue-600' },
];

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
    snag: <MapPin size={14} className="text-red-500" />,
    task: <Kanban size={14} className="text-blue-500" />,
    hse: <Shield size={14} className="text-emerald-500" />,
    daily_log: <TrendingUp size={14} className="text-emerald-600" />,
};

const STATUS_DOT: Record<string, string> = {
    open: 'bg-red-400', todo: 'bg-gray-400', doing: 'bg-blue-400',
    done: 'bg-emerald-400', resolved: 'bg-emerald-400', logged: 'bg-purple-400',
    blocked: 'bg-red-400', in_progress: 'bg-amber-400',
};

export default function DashboardPage() {
    const { user } = useAppContext();
    const [stats, setStats] = useState<Stats>({ activeProjects: 0, openSnags: 0, totalTasks: 0, doneTasks: 0, hseThisMonth: 0 });
    const [projects, setProjects] = useState<Project[]>([]);
    const [activity, setActivity] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleStatusChange = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);

        // Real-time Projects
        const qProjects = query(collection(db, 'projects'), where('status', '==', 'active'), limit(3));
        const unsubProjects = onSnapshot(qProjects, (snap) => {
            setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Project[]);
            setStats(prev => ({ ...prev, activeProjects: snap.size }));
        });

        // Real-time Snags Count
        const qSnags = query(collection(db, 'snags'), where('status', '!=', 'resolved'));
        const unsubSnags = onSnapshot(qSnags, (snap) => {
            setStats(prev => ({ ...prev, openSnags: snap.size }));
        });

        // Real-time Tasks Count
        const qTasks = query(collection(db, 'tasks'));
        const unsubTasks = onSnapshot(qTasks, (snap) => {
            const done = snap.docs.filter(d => d.data().status === 'done').length;
            setStats(prev => ({ ...prev, totalTasks: snap.size, doneTasks: done }));
        });

        // Combined Activity Listener
        // Since we can't easily join in Firestore, we listen to the last 5 from all main collections
        const qRecentTasks = query(collection(db, 'tasks'), orderBy('updatedAt', 'desc'), limit(5));
        const qRecentSnags = query(collection(db, 'snags'), orderBy('updatedAt', 'desc'), limit(5));
        
        const activityMap: Record<string, Activity> = {};
        const updateActivity = () => {
             const combined = Object.values(activityMap)
                .sort((a, b) => {
                    const da = a.date?.seconds ? a.date.seconds : new Date(a.date).getTime() / 1000;
                    const db = b.date?.seconds ? b.date.seconds : new Date(b.date).getTime() / 1000;
                    return db - da;
                })
                .slice(0, 8);
             setActivity(combined);
             setLoading(false);
        };

        const unsubRecentTasks = onSnapshot(qRecentTasks, (snap) => {
            snap.docs.forEach(d => {
                const data = d.data();
                activityMap[`task_${d.id}`] = {
                    id: d.id, type: 'task', title: data.title, subtitle: data.assignee || 'Unassigned',
                    meta: '', status: data.status, date: data.updatedAt || data.createdAt
                };
            });
            updateActivity();
        });

        const unsubRecentSnags = onSnapshot(qRecentSnags, (snap) => {
            snap.docs.forEach(d => {
                const data = d.data();
                activityMap[`snag_${d.id}`] = {
                    id: d.id, type: 'snag', title: data.title, subtitle: `QA / ${data.severity}`,
                    meta: '', status: data.status, date: data.updatedAt || data.createdAt
                };
            });
            updateActivity();
        });

        return () => {
            unsubProjects(); unsubSnags(); unsubTasks(); unsubRecentTasks(); unsubRecentSnags();
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const fmtDate = new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' });
    const fmtAge = (d: any) => {
        if (!d) return 'just now';
        const date = d.seconds ? new Date(d.seconds * 1000) : new Date(d);
        const mins = Math.floor((Date.now() - date.getTime()) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
        return `${Math.floor(mins / 1440)}d ago`;
    };

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-black text-text-main">{greeting}, {user.name?.split(' ')[0]}</h1>
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
                    <p className="text-text-muted text-sm mt-0.5">{fmtDate}</p>
                </div>
            </div>

            {/* Stats Row — 5 cards */}
            <div className="grid grid-cols-5 gap-2">
                {[
                    { label: 'Active Sites', value: stats.activeProjects, color: 'bg-primary-50 border-primary-100 text-primary-900' },
                    { label: 'Open Snags', value: stats.openSnags, color: 'bg-red-50 border-red-100 text-red-900' },
                    { label: 'Tasks', value: stats.totalTasks, color: 'bg-purple-50 border-purple-100 text-purple-900' },
                    { label: 'Done', value: stats.doneTasks, color: 'bg-emerald-50 border-emerald-100 text-emerald-900' },
                    { label: 'HSE / Mo.', value: stats.activeProjects > 0 ? 'Logged' : '0', color: 'bg-amber-50 border-amber-100 text-amber-900' },
                ].map(s => (
                    <div key={s.label} className={`rounded-xl border p-2.5 text-center ${s.color}`}>
                        <p className="text-xl font-black">{loading && s.value === 0 ? '—' : s.value}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wide opacity-70 mt-0.5 leading-tight">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Quick Actions</h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
                    {QUICK_ACTIONS.map(a => (
                        <Link key={a.href} href={a.href} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 ${a.color} hover:shadow-md hover:-translate-y-0.5 transition-all group`}>
                            <a.icon size={22} />
                            <span className="text-[10px] font-bold text-text-main text-center leading-tight group-hover:text-primary-700 transition-colors">{a.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Two-column layout for projects + activity */}
            <div className="grid md:grid-cols-2 gap-5">
                {/* Active Projects */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">Active Projects</h2>
                        <Link href="/projects" className="text-xs text-primary-600 font-bold flex items-center gap-1 hover:underline">
                            All <ArrowRight size={12} />
                        </Link>
                    </div>
                    {loading && projects.length === 0 ? (
                        <div className="py-10 flex justify-center"><div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
                            <Building2 size={36} className="mx-auto text-text-muted/40 mb-3" />
                            <p className="text-text-muted text-sm font-medium">No active projects.</p>
                            <Link href="/projects" className="mt-3 inline-flex items-center gap-1.5 bg-primary-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors">
                                <Building2 size={13} /> Create Project
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {projects.map(p => (
                                <div key={p.id} className="bg-surface border border-border rounded-2xl p-4 hover:border-primary-200 hover:shadow-sm transition-all">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="min-w-0">
                                            <p className="font-bold text-text-main text-sm truncate">{p.name}</p>
                                            <p className="text-xs text-text-muted truncate">{p.client ? `${p.client} · ` : ''}{p.location}</p>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">Active</span>
                                    </div>
                                    <div className="mb-2">
                                        <div className="flex justify-between text-xs text-text-muted mb-1">
                                            <span className="flex items-center gap-1"><TrendingUp size={10} /> Progress</span>
                                            <span className="font-bold text-text-main">{p.progressPct}%</span>
                                        </div>
                                        <div className="h-1.5 bg-surface-muted rounded-full"><div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${p.progressPct}%` }} /></div>
                                    </div>
                                    <div className="flex gap-3 text-xs text-text-muted">
                                        <span className="flex items-center gap-1"><Kanban size={10} /> {p.taskCount || 0} tasks</span>
                                        {(p.snagCount || 0) > 0
                                            ? <span className="flex items-center gap-1 text-red-500"><AlertTriangle size={10} /> {p.snagCount} snags</span>
                                            : <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={10} /> No snags</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div>
                    <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Recent Activity</h2>
                    {loading ? (
                        <div className="py-10 flex justify-center"><div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
                    ) : activity.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
                            <p className="text-text-muted text-sm">No activity yet. Start by logging a snag or task.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {activity.map((a, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-surface border border-border rounded-xl hover:border-primary-200 transition-all">
                                    <div className="mt-0.5 shrink-0">{ACTIVITY_ICONS[a.type]}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-text-main truncate">{a.title}</p>
                                        <p className="text-xs text-text-muted">{a.subtitle}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <div className="flex items-center gap-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[a.status] || 'bg-gray-400'}`} />
                                            <span className="text-[10px] font-bold text-text-muted capitalize">{a.status.replace('_', ' ')}</span>
                                        </div>
                                        <p className="text-[9px] text-text-muted/50">{fmtAge(a.date)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
