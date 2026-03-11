"use client";

import { createProject, deleteProject, getProjects, updateProject } from '@/actions/projects';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Building2, Calendar, CheckCircle2, ClipboardList, MapPin, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Project {
    id: string;
    name: string;
    client?: string | null;
    location: string;
    description?: string | null;
    status: string;
    startDate?: string | null;
    endDate?: string | null;
    progressPct: number;
    createdAt: Date;
    _count: { tasks: number; snags: number };
}

const STATUS_STYLES: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800',
    on_hold: 'bg-amber-100 text-amber-800',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-gray-100 text-gray-600',
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [form, setForm] = useState({ name: '', client: '', location: '', description: '', startDate: '', endDate: '', status: 'active' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { loadProjects(); }, []);

    async function loadProjects() {
        setLoading(true);
        const res = await getProjects();
        if (res.success && res.projects) setProjects(res.projects as Project[]);
        setLoading(false);
    }

    function openNew() {
        setEditingProject(null);
        setForm({ name: '', client: '', location: '', description: '', startDate: '', endDate: '', status: 'active' });
        setError('');
        setIsSheetOpen(true);
    }

    function openEdit(project: Project) {
        setEditingProject(project);
        setForm({
            name: project.name,
            client: project.client || '',
            location: project.location,
            description: project.description || '',
            startDate: project.startDate || '',
            endDate: project.endDate || '',
            status: project.status,
        });
        setError('');
        setIsSheetOpen(true);
    }

    async function handleSave() {
        if (!form.name.trim() || !form.location.trim()) { setError('Project name and location are required.'); return; }
        setSaving(true);
        setError('');
        let res;
        if (editingProject) {
            res = await updateProject(editingProject.id, form);
        } else {
            res = await createProject(form);
        }
        if (res.success) {
            setIsSheetOpen(false);
            loadProjects();
        } else {
            setError(res.error || 'Failed to save');
        }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure? This will also delete all tasks, snags, and documents in this project.')) return;
        await deleteProject(id);
        loadProjects();
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Projects</h1>
                    <p className="text-text-muted text-sm mt-0.5">Manage all Ace Facades site projects.</p>
                </div>
                <Button onClick={openNew} className="flex items-center gap-2">
                    <Plus size={16} /> New Project
                </Button>
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
                    <Building2 size={48} className="mx-auto text-text-muted/40 mb-4" />
                    <h3 className="text-lg font-semibold text-text-main mb-2">No Projects Yet</h3>
                    <p className="text-text-muted text-sm mb-6">Create your first project to start tracking tasks, snags, and documents.</p>
                    <Button onClick={openNew}><Plus size={16} className="mr-2" /> Create First Project</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map(project => (
                        <Card key={project.id} className="hover:border-primary-300 hover:shadow-md transition-all cursor-pointer group" onClick={() => openEdit(project)}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-text-main text-base truncate">{project.name}</h3>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[project.status] || 'bg-gray-100 text-gray-600'}`}>
                                        {project.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} className="ml-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {project.client && (
                                <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
                                    <Building2 size={14} className="shrink-0" />
                                    <span className="truncate">{project.client}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-text-muted mb-3">
                                <MapPin size={14} className="shrink-0" />
                                <span className="truncate">{project.location}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs text-text-muted mb-1">
                                    <span className="flex items-center gap-1"><TrendingUp size={12} /> Progress</span>
                                    <span className="font-bold text-text-main">{project.progressPct}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary-600 rounded-full transition-all duration-700" style={{ width: `${project.progressPct}%` }} />
                                </div>
                            </div>

                            <div className="flex gap-4 text-xs text-text-muted border-t border-border/50 pt-3 mt-2">
                                <span className="flex items-center gap-1"><ClipboardList size={12} /> {project._count.tasks} tasks</span>
                                <span className="flex items-center gap-1"><CheckCircle2 size={12} /> {project._count.snags} open snags</span>
                                {project.startDate && <span className="flex items-center gap-1 ml-auto"><Calendar size={12} /> {project.startDate}</span>}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Sheet */}
            <BottomSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title={editingProject ? 'Edit Project' : 'New Project'}>
                <div className="space-y-4 pb-6">
                    <Input label="Project Name *" placeholder="e.g. Addax Tower Facade" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                    <Input label="Client Name" placeholder="e.g. Addax Petroleum" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} />
                    <Input label="Location *" placeholder="e.g. Victoria Island, Lagos" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                    <Input label="Description" placeholder="Brief project scope..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Start Date" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                        <Input label="End Date" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                    </div>
                    {editingProject && (
                        <div>
                            <label className="block text-sm font-semibold text-text-muted mb-1.5">Status</label>
                            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-border rounded-xl px-4 py-3 text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option value="active">Active</option>
                                <option value="on_hold">On Hold</option>
                                <option value="completed">Completed</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button fullWidth onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
                    </Button>
                </div>
            </BottomSheet>
        </div>
    );
}
