"use client";

import { createHSEEntry, deleteHSEEntry, getHSEEntries } from '@/actions/hse';
import { getActiveProjects } from '@/actions/projects';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppContext } from '@/context/AppContext';
import { AlertOctagon, AlertTriangle, CheckCircle2, ClipboardCheck, HardHat, Plus, Shield, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HSEEntry {
    id: string;
    type: string;
    description: string;
    severity?: string | null;
    actionTaken?: string | null;
    reportedBy: string;
    date: Date;
}
interface Project { id: string; name: string; }

const TYPES = ['Toolbox Talk', 'Incident', 'Near Miss', 'PPE Check', 'Inspection', 'Method Statement'];
const SEVERITIES = ['low', 'medium', 'high'];

const TYPE_ICONS: Record<string, React.ReactNode> = {
    'Incident': <AlertOctagon size={18} className="text-red-600" />,
    'Near Miss': <AlertTriangle size={18} className="text-amber-600" />,
    'Toolbox Talk': <HardHat size={18} className="text-blue-600" />,
    'PPE Check': <Shield size={18} className="text-purple-600" />,
    'Inspection': <CheckCircle2 size={18} className="text-emerald-600" />,
    'Method Statement': <ClipboardCheck size={18} className="text-slate-600" />,
};

const TYPE_BG: Record<string, string> = {
    'Incident': 'bg-red-50 border-red-100',
    'Near Miss': 'bg-amber-50 border-amber-100',
    'Toolbox Talk': 'bg-blue-50 border-blue-100',
    'PPE Check': 'bg-purple-50 border-purple-100',
    'Inspection': 'bg-emerald-50 border-emerald-100',
    'Method Statement': 'bg-slate-50 border-slate-100',
};

export default function HSEPage() {
    const { user } = useAppContext();
    const [entries, setEntries] = useState<HSEEntry[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ type: 'Toolbox Talk', description: '', severity: '' as string, actionTaken: '', reportedBy: '' });

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

    useEffect(() => { if (selectedProject) load(); }, [selectedProject]);

    async function load() {
        setLoading(true);
        const res = await getHSEEntries(selectedProject);
        if (res.success && res.entries) setEntries(res.entries as unknown as HSEEntry[]);
        setLoading(false);
    }

    async function handleCreate() {
        if (!form.description.trim()) { setError('Description is required.'); return; }
        setSaving(true);
        const res = await createHSEEntry({
            ...form,
            reportedBy: form.reportedBy || user.name || 'Unknown',
            projectId: selectedProject,
            severity: form.severity || undefined,
        });
        if (res.success) {
            setIsSheetOpen(false);
            setForm({ type: 'Toolbox Talk', description: '', severity: '', actionTaken: '', reportedBy: '' });
            load();
        } else { setError(res.error || 'Failed to save'); }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('Remove this HSE entry?')) return;
        await deleteHSEEntry(id);
        load();
    }

    const incidents = entries.filter(e => e.type === 'Incident').length;
    const nearMisses = entries.filter(e => e.type === 'Near Miss').length;
    const talks = entries.filter(e => e.type === 'Toolbox Talk').length;

    const fmt = (d: Date | string) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5 animate-in fade-in duration-500 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">HSE Log</h1>
                    <p className="text-text-muted text-sm mt-0.5">Health, Safety & Environment records.</p>
                </div>
                <Button onClick={() => { setError(''); setIsSheetOpen(true); }} className="flex items-center gap-2" disabled={!selectedProject}>
                    <Plus size={16} /> Log Entry
                </Button>
            </div>

            {/* Project selector */}
            {projects.length > 0 && (
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full border border-border rounded-xl px-4 py-3 text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-red-50 border border-red-100 rounded-xl py-3">
                    <p className="text-xl font-black text-red-900">{incidents}</p>
                    <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Incidents</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl py-3">
                    <p className="text-xl font-black text-amber-900">{nearMisses}</p>
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Near Misses</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl py-3">
                    <p className="text-xl font-black text-blue-900">{talks}</p>
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Toolbox Talks</p>
                </div>
            </div>

            {/* Entry list */}
            {loading ? (
                <div className="text-center py-10"><div className="w-7 h-7 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : entries.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
                    <Shield size={48} className="mx-auto text-text-muted/40 mb-4" />
                    <h3 className="font-bold text-text-main mb-2">No HSE Entries Yet</h3>
                    <p className="text-text-muted text-sm mb-6 px-4">Log toolbox talks, incidents, PPE checks, and inspections here.</p>
                    <Button onClick={() => setIsSheetOpen(true)}><Plus size={16} className="mr-2" /> Log First Entry</Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {entries.map(entry => (
                        <Card key={entry.id} className={`hover:shadow-md transition-all group border ${TYPE_BG[entry.type] || ''}`}>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 shrink-0">{TYPE_ICONS[entry.type] || <Shield size={18} />}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{entry.type}</span>
                                        {entry.severity && (
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${entry.severity === 'high' ? 'bg-red-100 text-red-700' : entry.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{entry.severity}</span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-text-main leading-snug">{entry.description}</p>
                                    {entry.actionTaken && <p className="text-xs text-emerald-700 mt-1 font-medium">✓ {entry.actionTaken}</p>}
                                    <p className="text-xs text-text-muted mt-1">{entry.reportedBy} · {fmt(entry.date)}</p>
                                </div>
                                <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Log HSE Sheet */}
            <BottomSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Log HSE Entry">
                <div className="space-y-4 pb-4">
                    <div>
                        <label className="block text-sm font-semibold text-text-muted mb-1.5">Entry Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TYPES.map(t => (
                                <button key={t} onClick={() => setForm(f => ({ ...f, type: t, severity: '' }))} className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 text-left flex items-center gap-2 transition-all ${form.type === t ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-border bg-surface text-text-muted hover:border-primary-300'}`}>
                                    {TYPE_ICONS[t] && <span className="shrink-0">{TYPE_ICONS[t]}</span>}
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(form.type === 'Incident' || form.type === 'Near Miss') && (
                        <div>
                            <label className="block text-sm font-semibold text-text-muted mb-1.5">Severity</label>
                            <div className="grid grid-cols-3 gap-2">
                                {SEVERITIES.map(s => (
                                    <button key={s} onClick={() => setForm(f => ({ ...f, severity: s }))} className={`py-2 text-xs font-bold rounded-xl border-2 capitalize transition-all ${form.severity === s ? (s === 'high' ? 'bg-red-600 text-white border-red-600' : s === 'medium' ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-500 text-white border-gray-500') : 'bg-surface text-text-muted border-border'}`}>{s}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-text-muted mb-1.5">Description *</label>
                        <textarea className="w-full bg-surface-muted border border-border rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none h-24" placeholder={form.type === 'Toolbox Talk' ? 'Topic discussed: e.g. Safe use of scaffolding at height...' : form.type === 'Incident' ? 'Describe the incident in detail...' : 'Describe what was observed...'} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} autoFocus />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-muted mb-1.5">Action Taken (Optional)</label>
                        <textarea className="w-full bg-surface-muted border border-border rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none h-16" placeholder="e.g. Worker sent to first aid, area cordoned off..." value={form.actionTaken} onChange={e => setForm(f => ({ ...f, actionTaken: e.target.value }))} />
                    </div>

                    <Input label="Reported By" placeholder={user.name || 'Your name'} value={form.reportedBy} onChange={e => setForm(f => ({ ...f, reportedBy: e.target.value }))} />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button fullWidth onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Log HSE Entry'}</Button>
                </div>
            </BottomSheet>
        </div>
    );
}
