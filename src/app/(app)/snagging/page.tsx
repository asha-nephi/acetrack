"use client";

import { getActiveProjects } from '@/actions/projects';
import { deleteSnag, getSnags, saveSnag } from '@/actions/snags';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertTriangle, CheckCircle2, Filter, MapPin, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Severity = 'minor' | 'major' | 'critical';
type SnagStatus = 'open' | 'in_progress' | 'resolved';

interface SnagPin {
    id: string;
    x: number;
    y: number;
    title: string;
    description: string;
    severity: Severity;
    status: SnagStatus;
    assignee?: string;
    resolutionNote?: string;
}

interface Project { id: string; name: string; }

const SEV_COLOR: Record<string, string> = {
    critical: 'bg-red-600 text-white border-red-800',
    major: 'bg-amber-500 text-white border-amber-700',
    minor: 'bg-blue-500 text-white border-blue-700',
    resolved: 'bg-emerald-500 text-white border-emerald-700',
};

const SEV_BADGE: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    major: 'bg-amber-100 text-amber-700 border-amber-200',
    minor: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function SnaggingPage() {
    const [pins, setPins] = useState<SnagPin[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [activePin, setActivePin] = useState<SnagPin | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingPinId, setEditingPinId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
    const [loading, setLoading] = useState(true);
    const imageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function init() {
            const res = await getActiveProjects();
            if (res.success && res.projects && res.projects.length > 0) {
                setProjects(res.projects as Project[]);
                setSelectedProject(res.projects[0].id);
            } else {
                setLoading(false);
            }
        }
        init();
    }, []);

    useEffect(() => {
        if (selectedProject) loadSnags();
    }, [selectedProject]);

    async function loadSnags() {
        setLoading(true);
        const res = await getSnags(selectedProject);
        if (res.success && res.snags) setPins(res.snags as unknown as SnagPin[]);
        setLoading(false);
    }

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current || !selectedProject) return;
        if ((e.target as Element).closest('.snag-pin')) return;

        const rect = imageRef.current.getBoundingClientRect();
        const xPos = ((e.clientX - rect.left) / rect.width) * 100;
        const yPos = ((e.clientY - rect.top) / rect.height) * 100;

        const newPin: SnagPin = {
            id: 'new_' + Date.now(),
            x: xPos, y: yPos,
            title: '', description: '',
            severity: 'minor', status: 'open',
            assignee: '', resolutionNote: ''
        };
        setPins(prev => [...prev, newPin]);
        setActivePin(newPin);
        setEditingPinId(newPin.id);
        setIsSheetOpen(true);
    };

    const handlePinClick = (pin: SnagPin) => {
        setActivePin({ ...pin });
        setEditingPinId(pin.id);
        setIsSheetOpen(true);
    };

    const savePin = async () => {
        if (!activePin || !activePin.title.trim()) return;
        const isNew = activePin.id.startsWith('new_');
        const tempId = activePin.id;

        setPins(prev => prev.map(p => p.id === tempId ? activePin : p));
        setIsSheetOpen(false);
        setActivePin(null);
        setEditingPinId(null);

        const res = await saveSnag(activePin, isNew, selectedProject);
        if (res.success && res.snag) {
            setPins(prev => prev.map(p => p.id === tempId ? (res.snag as unknown as SnagPin) : p));
        }
    };

    const handleDeletePin = async (id: string) => {
        setPins(prev => prev.filter(p => p.id !== id));
        setIsSheetOpen(false);
        setActivePin(null);
        setEditingPinId(null);
        if (!id.startsWith('new_')) await deleteSnag(id);
    };

    const pinColor = (pin: SnagPin) => pin.status === 'resolved' ? SEV_COLOR.resolved : (SEV_COLOR[pin.severity] || 'bg-gray-400 text-white border-gray-600');

    const filteredPins = filter === 'all' ? pins : pins.filter(p => p.status === filter);
    const openCount = pins.filter(p => p.status === 'open').length;
    const inProgressCount = pins.filter(p => p.status === 'in_progress').length;

    if (!selectedProject && !loading) return (
        <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
            <MapPin size={48} className="text-text-muted/40 mb-4" />
            <h3 className="font-bold text-text-main mb-2">No Active Projects</h3>
            <p className="text-text-muted text-sm">Create a project first to start snagging.</p>
        </div>
    );

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5 animate-in fade-in duration-500 pb-28">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-main">QA Snagging</h1>
                <p className="text-text-muted text-sm mt-0.5">Tap on the blueprint to log a defect pin.</p>
            </div>

            {/* Project Selector */}
            {projects.length > 0 && (
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full border border-border rounded-xl px-4 py-3 text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-red-50 border border-red-100 rounded-xl py-3">
                    <p className="text-xl font-black text-red-900">{openCount}</p>
                    <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Open</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl py-3">
                    <p className="text-xl font-black text-amber-900">{inProgressCount}</p>
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">In Progress</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl py-3">
                    <p className="text-xl font-black text-emerald-900">{pins.filter(p => p.status === 'resolved').length}</p>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Resolved</p>
                </div>
            </div>

            {/* Blueprint Canvas */}
            <div
                className="relative w-full aspect-[4/3] bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden shadow-inner cursor-crosshair group"
                ref={imageRef}
                onClick={handleImageClick}
            >
                {/* Grid background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-40" />
                {/* Facade SVG */}
                <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] text-primary-800/20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect x="5" y="5" width="90" height="90" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    {[20, 40, 60, 80].map(x => <line key={x} x1={x} y1="5" x2={x} y2="95" stroke="currentColor" strokeWidth="0.8" />)}
                    {[25, 50, 75].map(y => <line key={y} x1="5" y1={y} x2="95" y2={y} stroke="currentColor" strokeWidth="0.8" />)}
                    <rect x="40" y="20" width="20" height="15" fill="currentColor" opacity="0.3" />
                    <rect x="20" y="50" width="15" height="20" fill="currentColor" opacity="0.2" />
                    <rect x="65" y="50" width="15" height="20" fill="currentColor" opacity="0.2" />
                </svg>
                <p className="absolute bottom-4 inset-x-0 text-center text-text-muted/50 text-xs font-bold uppercase tracking-widest pointer-events-none select-none">
                    Tap to drop a pin
                </p>

                {/* Pins */}
                {pins.map(pin => (
                    <button
                        key={pin.id}
                        className={`snag-pin absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg border-2 flex items-center justify-center transition-all hover:scale-125 focus:outline-none ${pinColor(pin)} ${pin.id === editingPinId ? 'ring-4 ring-primary-400/50 scale-110 z-10' : 'z-0'} ${pin.status === 'open' && pin.severity === 'critical' ? 'animate-pulse' : ''}`}
                        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                        onClick={e => { e.stopPropagation(); handlePinClick(pin); }}
                    >
                        {pin.status === 'resolved' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    </button>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
                <Filter size={14} className="text-text-muted shrink-0" />
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {(['all', 'open', 'in_progress', 'resolved'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filter === f ? 'bg-primary-600 text-white border-primary-600' : 'bg-surface text-text-muted border-border hover:border-primary-300'}`}>
                            {f === 'all' ? `All (${pins.length})` : f === 'open' ? `Open (${openCount})` : f === 'in_progress' ? `In Progress (${inProgressCount})` : `Resolved (${pins.filter(p => p.status === 'resolved').length})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Snag List */}
            <div className="space-y-2">
                {loading && <p className="text-sm text-text-muted italic py-4 text-center">Loading snags...</p>}
                {!loading && filteredPins.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
                        <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
                        <p className="text-text-muted text-sm">{filter === 'all' ? 'No snags logged yet. Tap the blueprint to add one.' : `No ${filter.replace('_', ' ')} snags.`}</p>
                    </div>
                )}
                {filteredPins.map(pin => (
                    <div key={pin.id} className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl shadow-sm cursor-pointer hover:border-primary-300 hover:shadow-md transition-all" onClick={() => handlePinClick(pin)}>
                        <div className={`w-3 h-3 rounded-full shrink-0 ${pin.status === 'resolved' ? 'bg-emerald-500' : pin.severity === 'critical' ? 'bg-red-600' : pin.severity === 'major' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${pin.status === 'resolved' ? 'text-text-muted line-through' : 'text-text-main'}`}>
                                {pin.title || 'Untitled Snag'}
                            </p>
                            {pin.assignee && <p className="text-xs text-text-muted truncate">→ {pin.assignee}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {pin.severity !== 'minor' && (
                                <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-full px-2 py-0.5 ${SEV_BADGE[pin.severity] || ''}`}>{pin.severity}</span>
                            )}
                            <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-full px-2 py-0.5 ${pin.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : pin.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{pin.status.replace('_', ' ')}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Sheet */}
            <BottomSheet
                isOpen={isSheetOpen}
                onClose={() => {
                    if (activePin && !activePin.title) setPins(prev => prev.filter(p => p.id !== activePin.id));
                    setIsSheetOpen(false);
                    setActivePin(null);
                    setEditingPinId(null);
                }}
                title={activePin?.title || 'Log New Snag'}
            >
                {activePin && (
                    <div className="space-y-4 pb-4">
                        <Input label="Defect Title *" placeholder="e.g. Broken Glass Panel" value={activePin.title} onChange={e => setActivePin({ ...activePin, title: e.target.value })} autoFocus />
                        <Input label="Assignee (Who fixes it?)" placeholder="e.g. Team Alpha / Glazing crew" value={activePin.assignee || ''} onChange={e => setActivePin({ ...activePin, assignee: e.target.value })} />

                        <div>
                            <label className="block text-sm font-semibold text-text-muted mb-1.5">Observation Details</label>
                            <textarea className="w-full bg-surface-muted border border-border rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none h-20" placeholder="Describe the issue..." value={activePin.description} onChange={e => setActivePin({ ...activePin, description: e.target.value })} />
                        </div>

                        {/* Severity selector */}
                        <div>
                            <label className="block text-sm font-semibold text-text-muted mb-2">Severity</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['minor', 'major', 'critical'] as Severity[]).map(sev => (
                                    <button key={sev} onClick={() => setActivePin({ ...activePin, severity: sev })} className={`py-2 text-xs font-bold rounded-xl border-2 capitalize transition-all ${activePin.severity === sev ? (sev === 'critical' ? 'bg-red-600 text-white border-red-600' : sev === 'major' ? 'bg-amber-500 text-white border-amber-500' : 'bg-blue-500 text-white border-blue-500') : 'bg-surface text-text-muted border-border'}`}>
                                        {sev}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status selector */}
                        <div>
                            <label className="block text-sm font-semibold text-text-muted mb-2">Status</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['open', 'in_progress', 'resolved'] as SnagStatus[]).map(stat => (
                                    <button key={stat} onClick={() => setActivePin({ ...activePin, status: stat })} className={`py-2 text-xs font-bold rounded-xl border-2 capitalize transition-all ${activePin.status === stat ? (stat === 'resolved' ? 'bg-emerald-600 text-white border-emerald-600' : stat === 'in_progress' ? 'bg-amber-500 text-white border-amber-500' : 'bg-red-500 text-white border-red-500') : 'bg-surface text-text-muted border-border'}`}>
                                        {stat === 'in_progress' ? 'In Progress' : stat.charAt(0).toUpperCase() + stat.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {activePin.status === 'resolved' && (
                            <div>
                                <label className="block text-sm font-semibold text-text-muted mb-1.5">Resolution Note</label>
                                <textarea className="w-full bg-surface-muted border border-border rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none h-16" placeholder="Describe what was done to fix this..." value={activePin.resolutionNote || ''} onChange={e => setActivePin({ ...activePin, resolutionNote: e.target.value })} />
                            </div>
                        )}

                        {/* Action buttons — sticky-style at bottom */}
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => handleDeletePin(activePin.id)} className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                            <Button fullWidth onClick={savePin} disabled={!activePin.title.trim()}>
                                Save Snag
                            </Button>
                        </div>
                    </div>
                )}
            </BottomSheet>
        </div>
    );
}
