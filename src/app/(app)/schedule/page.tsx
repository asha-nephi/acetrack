"use client";

import { getActiveProjects } from '@/actions/projects';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, ChevronRight, Clock, HardHat, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Shift {
    id: string;
    date: string; // YYYY-MM-DD
    workerName: string;
    role: string;
    startTime: string;
    endTime: string;
    projectId: string;
    notes?: string;
}

interface Project { id: string; name: string; }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHIFT_COLORS = ['bg-primary-100 text-primary-700 border-primary-200', 'bg-emerald-100 text-emerald-700 border-emerald-200', 'bg-amber-100 text-amber-700 border-amber-200', 'bg-purple-100 text-purple-700 border-purple-200', 'bg-pink-100 text-pink-700 border-pink-200'];

function getWeekDates(offset: number): string[] {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toISOString().split('T')[0];
    });
}

export default function SchedulePage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [weekOffset, setWeekOffset] = useState(0);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [form, setForm] = useState({ workerName: '', role: '', startTime: '07:00', endTime: '17:00', notes: '' });

    const weekDates = getWeekDates(weekOffset);

    useEffect(() => {
        async function init() {
            const res = await getActiveProjects();
            if (res.success && res.projects && res.projects.length > 0) {
                setProjects(res.projects as Project[]);
                setSelectedProject(res.projects[0].id);
            }
            // Load shifts from localStorage for now (no schema change needed)
            const stored = localStorage.getItem('ace_shifts');
            if (stored) setShifts(JSON.parse(stored));
        }
        init();
    }, []);

    function saveShifts(newShifts: Shift[]) {
        setShifts(newShifts);
        localStorage.setItem('ace_shifts', JSON.stringify(newShifts));
    }

    function handleAddShift() {
        if (!form.workerName.trim() || !selectedDate || !selectedProject) return;
        const newShift: Shift = {
            id: Date.now().toString(),
            date: selectedDate,
            workerName: form.workerName,
            role: form.role,
            startTime: form.startTime,
            endTime: form.endTime,
            projectId: selectedProject,
            notes: form.notes,
        };
        saveShifts([...shifts, newShift]);
        setIsSheetOpen(false);
        setForm({ workerName: '', role: '', startTime: '07:00', endTime: '17:00', notes: '' });
    }

    function handleDeleteShift(id: string) {
        saveShifts(shifts.filter(s => s.id !== id));
    }

    const projectShifts = shifts.filter(s => s.projectId === selectedProject);
    const todayStr = new Date().toISOString().split('T')[0];

    const fmtDate = (d: string) => {
        const date = new Date(d + 'T00:00:00');
        return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
    };

    const weekTotal = weekDates.reduce((acc, d) => acc + projectShifts.filter(s => s.date === d).length, 0);

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5 animate-in fade-in duration-500 pb-24">
            <div>
                <h1 className="text-2xl font-bold text-text-main">Shift Planner</h1>
                <p className="text-text-muted text-sm mt-0.5">Plan and track worker shifts for the week.</p>
            </div>

            {/* Project selector */}
            {projects.length > 0 && (
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full border border-border rounded-xl px-4 py-3 text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            )}

            {/* Week Navigator */}
            <div className="flex items-center justify-between">
                <button onClick={() => setWeekOffset(o => o - 1)} className="w-10 h-10 flex items-center justify-center rounded-xl border border-border hover:bg-surface-muted transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div className="text-center">
                    <p className="text-sm font-bold text-text-main">{weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Next Week' : weekOffset === -1 ? 'Last Week' : `Week of ${fmtDate(weekDates[0])}`}</p>
                    <p className="text-xs text-text-muted">{fmtDate(weekDates[0])} – {fmtDate(weekDates[6])}</p>
                </div>
                <button onClick={() => setWeekOffset(o => o + 1)} className="w-10 h-10 flex items-center justify-center rounded-xl border border-border hover:bg-surface-muted transition-colors">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Weekly stat */}
            <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <HardHat size={20} className="text-primary-600 shrink-0" />
                <div>
                    <p className="text-sm font-bold text-primary-900">{weekTotal} shift{weekTotal !== 1 ? 's' : ''} planned this week</p>
                    <p className="text-xs text-primary-700">across {projects.find(p => p.id === selectedProject)?.name || 'this project'}</p>
                </div>
            </div>

            {/* 7-day grid */}
            <div className="grid grid-cols-7 gap-1.5">
                {weekDates.map((date, i) => {
                    const dayShifts = projectShifts.filter(s => s.date === date);
                    const isToday = date === todayStr;
                    return (
                        <div key={date} className="flex flex-col min-h-[120px]">
                            {/* Day header */}
                            <div className={`text-center mb-1.5 rounded-lg py-1.5 ${isToday ? 'bg-primary-600 text-white' : 'bg-surface-muted'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-primary-200' : 'text-text-muted'}`}>{DAYS[i]}</p>
                                <p className={`text-sm font-black ${isToday ? 'text-white' : 'text-text-main'}`}>{new Date(date + 'T00:00:00').getDate()}</p>
                            </div>
                            {/* Shifts for this day */}
                            <div className="flex-1 space-y-1">
                                {dayShifts.map((shift, si) => (
                                    <div key={shift.id} className={`text-[9px] font-bold px-1.5 py-1 rounded-lg border leading-tight cursor-pointer hover:opacity-80 transition-opacity ${SHIFT_COLORS[si % SHIFT_COLORS.length]}`} onClick={() => handleDeleteShift(shift.id)} title={`${shift.workerName} (${shift.startTime}–${shift.endTime}) – tap to remove`}>
                                        {shift.workerName.split(' ')[0]}
                                    </div>
                                ))}
                                {/* Add button */}
                                <button onClick={() => { setSelectedDate(date); setIsSheetOpen(true); }} className="w-full flex items-center justify-center text-text-muted/40 hover:text-primary-600 hover:bg-primary-50 rounded-lg h-6 transition-colors border border-transparent hover:border-primary-200">
                                    <Plus size={12} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Shift detail list for the week */}
            {weekTotal > 0 && (
                <div>
                    <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">This Week&apos;s Shifts</h3>
                    <div className="space-y-2">
                        {weekDates.map(date => {
                            const dayShifts = projectShifts.filter(s => s.date === date);
                            if (dayShifts.length === 0) return null;
                            return dayShifts.map(shift => (
                                <Card key={shift.id} className="flex items-center justify-between group ">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-black text-sm shrink-0">
                                            {shift.workerName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-main text-sm">{shift.workerName}</p>
                                            <p className="text-xs text-text-muted">{shift.role} · {DAYS[weekDates.indexOf(date)]} {fmtDate(date)}</p>
                                            <p className="text-xs text-text-muted flex items-center gap-1"><Clock size={10} /> {shift.startTime} – {shift.endTime}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteShift(shift.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                        <Trash2 size={16} />
                                    </button>
                                </Card>
                            ));
                        })}
                    </div>
                </div>
            )}

            {/* Add Shift Sheet */}
            <BottomSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title={`Add Shift — ${selectedDate ? fmtDate(selectedDate) : ''}`}>
                <div className="space-y-4 pb-4">
                    <Input label="Worker / Staff Name *" placeholder="e.g. Emeka Johnson" value={form.workerName} onChange={e => setForm(f => ({ ...f, workerName: e.target.value }))} autoFocus />
                    <Input label="Role / Trade" placeholder="e.g. Glazier, Supervisor" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Start Time" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                        <Input label="End Time" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                    </div>
                    <Input label="Notes (Optional)" placeholder="e.g. Bring own PPE" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                    <Button fullWidth onClick={handleAddShift} disabled={!form.workerName.trim()}>Add Shift</Button>
                </div>
            </BottomSheet>
        </div>
    );
}
