"use client";

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, FileText, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Doc {
    id: string;
    title: string;
    category: string;
    rev: string;
    status: string;
    date: string;
    size?: string | null;
    url?: string | null;
}
interface Project { id: string; name: string; }

const STATUS_COLORS: Record<string, string> = {
    'Approved for Construction': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'For Review': 'bg-amber-100 text-amber-800 border-amber-200',
    'Information Only': 'bg-blue-100 text-blue-800 border-blue-200',
};
const CATEGORIES = ['Shop Drawings', 'Method Statements', 'Safety Data Sheets', 'Structural Calcs', 'Specifications', 'Other'];
const STATUSES = ['Approved for Construction', 'For Review', 'Information Only'];

export default function DocumentsPage() {
    const [docs, setDocs] = useState<Doc[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ title: '', category: 'Shop Drawings', rev: '01', status: 'For Review', date: new Date().toISOString().split('T')[0], size: '', url: '' });

    useEffect(() => {
        async function init() {
            try {
                const snap = await getDocs(query(collection(db, 'projects'), where('status', '!=', 'completed')));
                const projs = snap.docs.map(d => ({ id: d.id, name: (d.data() as any).name })) as Project[];
                if (projs.length > 0) {
                    setProjects(projs);
                    setSelectedProject(projs[0].id);
                }
            } catch (e) { console.error(e); }
            setLoading(false);
        }
        init();
    }, []);

    useEffect(() => { if (selectedProject) loadDocs(); }, [selectedProject]);

    async function loadDocs() {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, 'documents'), where('projectId', '==', selectedProject), orderBy('date', 'desc')));
            setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Doc)));
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    async function handleCreate() {
        if (!form.title.trim()) { setError('Title is required.'); return; }
        setSaving(true);
        try {
            await addDoc(collection(db, 'documents'), { ...form, projectId: selectedProject, createdAt: Timestamp.now() });
            setIsSheetOpen(false);
            setForm({ title: '', category: 'Shop Drawings', rev: '01', status: 'For Review', date: new Date().toISOString().split('T')[0], size: '', url: '' });
            loadDocs();
        } catch (e) { setError('Failed to save document.'); }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('Remove this document?')) return;
        try { await deleteDoc(doc(db, 'documents', id)); } catch (e) { console.error(e); }
        loadDocs();
    }

    const categories = ['All', ...Array.from(new Set(docs.map(d => d.category)))];
    const filtered = filter === 'All' ? docs : docs.filter(d => d.category === filter);

    if (!selectedProject && !loading) return (
        <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
            <FolderOpen size={48} className="text-text-muted/40 mb-4" />
            <h3 className="font-bold text-text-main mb-2">No Active Projects</h3>
            <p className="text-text-muted text-sm">Create a project first in the Projects section.</p>
        </div>
    );

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5 animate-in fade-in duration-500 pb-24">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-text-main">Document Hub</h1><p className="text-text-muted text-sm mt-0.5">Drawings, method statements & data sheets.</p></div>
                <Button onClick={() => { setError(''); setIsSheetOpen(true); }} className="flex items-center gap-2"><Plus size={16} /> Register</Button>
            </div>

            {projects.length > 0 && (
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full border border-border rounded-xl px-4 py-3 text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            )}

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setFilter(cat)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filter === cat ? 'bg-primary-600 text-white border-primary-600' : 'bg-surface text-text-muted border-border hover:border-primary-300'}`}>
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12 text-text-muted">Loading...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
                    <FileText size={48} className="mx-auto text-text-muted/40 mb-4" />
                    <h3 className="text-lg font-semibold text-text-main mb-2">No Documents Yet</h3>
                    <p className="text-text-muted text-sm mb-6 px-4">Register shop drawings, method statements, and safety data sheets here.</p>
                    <Button onClick={() => setIsSheetOpen(true)}><Plus size={16} className="mr-2" /> Register First Document</Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(doc => (
                        <Card key={doc.id} className="hover:border-primary-200 hover:shadow-sm transition-all group">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center shrink-0 mt-0.5"><FileText size={20} /></div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-text-main text-sm leading-tight mb-1">{doc.title}</p>
                                        <div className="flex flex-wrap gap-1.5 items-center">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[doc.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                {doc.status === 'Approved for Construction' && <CheckCircle2 size={10} className="inline mr-0.5" />}
                                                {doc.status}
                                            </span>
                                            <span className="text-xs text-text-muted">{doc.category}</span>
                                            <span className="text-xs text-text-muted">Rev. {doc.rev}</span>
                                        </div>
                                        <div className="flex gap-3 mt-1 text-xs text-text-muted">
                                            <span>{doc.date}</span>
                                            {doc.size && <span>{doc.size}</span>}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(doc.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            {doc.url && (
                                <a href={doc.url} target="_blank" rel="noreferrer" className="mt-3 block text-xs font-bold text-primary-700 hover:underline">View / Download →</a>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <BottomSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Register Document">
                <div className="space-y-4 pb-6">
                    <Input label="Document Title *" placeholder="e.g. East Elevation Curtain Wall Details" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
                    <div>
                        <label className="block text-sm font-semibold text-text-muted mb-1.5">Category</label>
                        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-border rounded-xl px-4 py-3 text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-text-muted mb-1.5">Status</label>
                        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-border rounded-xl px-4 py-3 text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
                            {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Revision No." placeholder="e.g. 04" value={form.rev} onChange={e => setForm(f => ({ ...f, rev: e.target.value }))} />
                        <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                    </div>
                    <Input label="File Size (optional)" placeholder="e.g. 12.4 MB" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} />
                    <Input label="File URL (optional)" placeholder="https://drive.google.com/..." value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button fullWidth onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Register Document'}</Button>
                </div>
            </BottomSheet>
        </div>
    );
}
