"use client";

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppContext } from '@/context/AppContext';
import {
    Camera, CheckCircle2, History,
    Image as ImageIcon,
    Loader2,
    MessageCircle,
    Plus,
    RefreshCw,
    Send
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Project { id: string; name: string; }

type Tab = 'briefing' | 'tools' | 'progress';

export default function DailyReportPage() {
    const { user } = useAppContext();
    const [activeTab, setActiveTab] = useState<Tab>('briefing');
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    
    // Briefing State
    const [briefing, setBriefing] = useState({ trade: '', objectives: '', participants: '' });
    // Tools State
    const [toolLog, setToolLog] = useState({ toolName: '', workerName: '', level: '' });
    // Progress State
    const [progress, setProgress] = useState({ content: '', images: [] as string[] });
    
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Initial load: Projects
    useEffect(() => {
        async function loadProjects() {
            const q = query(collection(db, 'projects'), where('status', '==', 'active'));
            // Real-time projects listener
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const plist = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
                setProjects(plist);
                if (plist.length > 0 && !selectedProject) setSelectedProject(plist[0].id);
            });
            return () => unsubscribe();
        }
        loadProjects();
    }, [selectedProject]);

    // Load recent logs for selected project
    useEffect(() => {
        if (!selectedProject) return;
        const q = query(
            collection(db, 'dailyLogs'), 
            where('projectId', '==', selectedProject),
            orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isSyncing: doc.metadata.hasPendingWrites }));
            setRecentLogs(logs.slice(0, 5));
        });
        return () => unsubscribe();
    }, [selectedProject]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const data: any = {
                projectId: selectedProject,
                reportedBy: user.name || 'Unknown',
                createdAt: serverTimestamp(),
            };

            if (activeTab === 'briefing') {
                Object.assign(data, { type: 'briefing', ...briefing });
            } else if (activeTab === 'tools') {
                Object.assign(data, { type: 'tool', ...toolLog });
            } else {
                Object.assign(data, { type: 'progress', content: progress.content, images: progress.images });
            }

            // client-side addDoc (works offline!)
            await addDoc(collection(db, 'dailyLogs'), data);
            
            setSuccess(true);
            if (activeTab === 'briefing') setBriefing({ trade: '', objectives: '', participants: '' });
            else if (activeTab === 'tools') setToolLog({ toolName: '', workerName: '', level: '' });
            else setProgress({ content: '', images: [] });
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            console.error("Save error:", e);
        }
        setSaving(false);
    };

    const handleShareWhatsApp = () => {
        const projectName = projects.find(p => p.id === selectedProject)?.name || 'Project';
        const date = new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
        let text = `*Daily Site Log - ${date}*\n*Project:* ${projectName}\n\n`;
        
        if (activeTab === 'briefing') {
            text += `*TRADE BRIEFING*\n*Trade:* ${briefing.trade}\n*Objectives:* ${briefing.objectives}\n*Participants:* ${briefing.participants}`;
        } else if (activeTab === 'tools') {
            text += `*TOOL ISSUANCE*\n*Tool:* ${toolLog.toolName}\n*To:* ${toolLog.workerName}\n*Level:* ${toolLog.level}`;
        } else {
            text += `*SITE PROGRESS*\n${progress.content}`;
        }
        
        text += `\n\n_Reported by ${user.name} via AceTrack OS_`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-text-main font-premium">Daily Site Log</h1>
                    <p className="text-text-muted text-sm mt-0.5">Offline-first cloud reporting.</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-primary-600 tracking-widest bg-primary-50 px-2 py-1 rounded-lg">Sync Active</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-surface-muted rounded-xl p-1 gap-1">
                {(['briefing', 'tools', 'progress'] as const).map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${activeTab === t ? 'bg-surface text-primary-700 shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
                        {t === 'briefing' ? 'Briefing' : t === 'tools' ? 'Tools' : 'Progress'}
                    </button>
                ))}
            </div>

            {/* Project Selector */}
            <div className="space-y-1.5">
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold shadow-sm">
                    {projects.length > 0 ? projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : <option>No active projects found</option>}
                </select>
            </div>

            {/* Content Card */}
            <Card className="space-y-4 shadow-xl shadow-black/5 border-border/50">
                {activeTab === 'briefing' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Input label="Trade / Squad" placeholder="e.g. Alucobond Installers" value={briefing.trade} onChange={e => setBriefing({...briefing, trade: e.target.value})} />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-text-muted pl-1">Daily Objectives</label>
                            <textarea value={briefing.objectives} onChange={e => setBriefing({...briefing, objectives: e.target.value})}
                                placeholder="What needs to be achieved today?"
                                className="w-full h-24 bg-surface-muted text-text-main border border-border rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm resize-none" />
                        </div>
                        <Input label="Participants" placeholder="e.g. 1 Supervisor, 4 Fitters" value={briefing.participants} onChange={e => setBriefing({...briefing, participants: e.target.value})} />
                    </div>
                )}

                {activeTab === 'tools' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Input label="Tool Name" placeholder="e.g. Hilti Anchor Gun" value={toolLog.toolName} onChange={e => setToolLog({...toolLog, toolName: e.target.value})} />
                        <Input label="Issued To" placeholder="e.g. Musa Ibrahim" value={toolLog.workerName} onChange={e => setToolLog({...toolLog, workerName: e.target.value})} />
                        <Input label="Site Level / Area" placeholder="e.g. Grid D-5, Level 10" value={toolLog.level} onChange={e => setToolLog({...toolLog, level: e.target.value})} />
                    </div>
                )}

                {activeTab === 'progress' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-text-muted pl-1">Work Description</label>
                            <textarea value={progress.content} onChange={e => setProgress({...progress, content: e.target.value})}
                                placeholder="Describe completed facade work..."
                                className="w-full h-32 bg-surface-muted text-text-main border border-border rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm resize-none" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {progress.images.map((img, i) => (
                                <div key={i} className="aspect-square rounded-xl bg-gray-100 relative overflow-hidden ring-1 ring-inset ring-black/5">
                                    <img src={img} alt="Progress" className="w-full h-full object-cover" />
                                </div>
                            ))}
                            <button className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-text-muted hover:border-primary-300 hover:text-primary-600 transition-all bg-surface">
                                <Camera size={20} />
                                <span className="text-[10px] font-bold mt-1">Add Photo</span>
                            </button>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100 flex items-center gap-2 text-xs font-bold animate-in zoom-in-95">
                        <CheckCircle2 size={16} /> Data cached locally and will sync to cloud.
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <Button variant="secondary" fullWidth onClick={handleShareWhatsApp} className="flex items-center justify-center gap-2">
                        <MessageCircle size={18} /> WhatsApp
                    </Button>
                    <Button fullWidth onClick={handleSave} disabled={saving} className="flex items-center justify-center gap-2">
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        Log to Cloud
                    </Button>
                </div>
            </Card>

            {/* History Feed */}
            <div>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                        <History size={14} /> Recent site activities
                    </h2>
                    <button onClick={() => { setSyncing(true); setTimeout(() => setSyncing(false), 2000); }} className="text-[10px] font-bold text-primary-600 flex items-center gap-1 hover:underline">
                        <RefreshCw size={10} className={syncing ? 'animate-spin' : ''} /> Force Sync
                    </button>
                </div>
                <div className="space-y-2">
                    {recentLogs.length === 0 ? (
                        <Card className="p-8 border-dashed bg-surface/30 flex flex-col items-center justify-center text-center">
                            <History size={32} className="text-text-muted/20 mb-2" />
                            <p className="text-xs text-text-muted">No logs recorded for this project yet.</p>
                        </Card>
                    ) : recentLogs.map(log => (
                        <Card key={log.id} className="p-3 bg-surface/80 flex items-center justify-between border-border/40 group">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black
                                    ${log.type === 'briefing' ? 'bg-purple-100 text-purple-700' : log.type === 'tool' ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'}`}>
                                    {log.type?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-text-main line-clamp-1">
                                        {log.type === 'briefing' ? log.trade : log.type === 'tool' ? log.toolName : log.content}
                                    </p>
                                    <p className="text-[10px] text-text-muted flex items-center gap-1">
                                        {log.reportedBy} · {log.isSyncing ? 'Syncing...' : 'Synced'}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

