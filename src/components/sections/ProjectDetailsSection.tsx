"use client";

import { getActiveProjects } from '@/actions/projects';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppContext } from '@/context/AppContext';
import { ProjectDetails } from '@/types/report';
import { useEffect, useState } from 'react';

interface Props {
    data: ProjectDetails;
    onChange: (data: Partial<ProjectDetails>) => void;
}

interface Project { id: string; name: string; location: string; client?: string | null; }

export function ProjectDetailsSection({ data, onChange }: Props) {
    const { user } = useAppContext();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function init() {
            const res = await getActiveProjects();
            if (res.success && res.projects && res.projects.length > 0) {
                setProjects(res.projects as Project[]);
            }
            setLoaded(true);
        }
        init();

        // Auto-fill manager name from session if empty
        if (!data.siteManagerName && user.name) {
            onChange({ siteManagerName: user.name });
        }
        // Auto-fill today's date if empty
        if (!data.date) {
            onChange({ date: new Date().toISOString().split('T')[0] });
        }
        // Auto-fill week range if empty
        if (!data.weekUnderReview) {
            const now = new Date();
            const dayOfWeek = now.getDay();
            const monday = new Date(now);
            monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            const fmt = (d: Date) => d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
            onChange({ weekUnderReview: `${fmt(monday)} – ${fmt(sunday)}` });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleProjectSelect = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            onChange({
                projectName: project.name,
                projectCode: projectId.slice(0, 8).toUpperCase(),
            });
        }
    };

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div>
                <h2 className="text-2xl font-bold text-text-main">Project Details</h2>
                <p className="text-text-muted text-sm mt-0.5">Core information for this weekly report.</p>
            </div>

            {/* Project selector from DB */}
            {loaded && projects.length > 0 && (
                <Card className="bg-primary-50 border-primary-200">
                    <label className="block text-sm font-bold text-primary-900 mb-2">Quick-fill from Active Project</label>
                    <select
                        onChange={e => handleProjectSelect(e.target.value)}
                        className="w-full border border-primary-200 rounded-xl px-4 py-3 text-primary-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                        defaultValue=""
                    >
                        <option value="" disabled>Select a project to auto-fill…</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}{p.client ? ` (${p.client})` : ''}</option>
                        ))}
                    </select>
                </Card>
            )}

            <Card>
                <div className="space-y-5">
                    <Input
                        label="Project Name"
                        value={data.projectName}
                        onChange={(e) => onChange({ projectName: e.target.value })}
                        placeholder="e.g. Landmark Towers"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Project Code"
                            value={data.projectCode}
                            onChange={(e) => onChange({ projectCode: e.target.value })}
                            placeholder="e.g. LMT-01"
                        />
                        <Input
                            label="Date"
                            type="date"
                            value={data.date}
                            onChange={(e) => onChange({ date: e.target.value })}
                        />
                    </div>

                    <Input
                        label="Week Under Review"
                        value={data.weekUnderReview}
                        onChange={(e) => onChange({ weekUnderReview: e.target.value })}
                        placeholder="e.g. Mar 3 – Mar 9"
                    />

                    <Input
                        label="Prepared By (Site Manager)"
                        value={data.siteManagerName}
                        onChange={(e) => onChange({ siteManagerName: e.target.value })}
                        placeholder="Name"
                    />

                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium text-text-muted pl-1">Average Weather</label>
                        <select
                            value={data.weatherCondition}
                            onChange={(e) => onChange({ weatherCondition: e.target.value })}
                            className="w-full bg-surface-muted text-text-main border border-border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        >
                            <option value="Clear Sky">☀️ Clear Sky</option>
                            <option value="Sunny">🌤 Sunny</option>
                            <option value="Cloudy">☁️ Cloudy</option>
                            <option value="Rainy">🌧 Rainy</option>
                            <option value="Stormy">⛈ Stormy</option>
                        </select>
                    </div>
                </div>
            </Card>
        </div>
    );
}
