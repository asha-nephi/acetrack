"use client";

import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
    Search as SearchIcon, 
    Kanban, MapPin, Package, Users, Folder,
    ArrowRight, Clock, Hash, AlertTriangle, CheckCircle2,
    Calendar, User, Cloud, CloudOff
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

interface SearchResult {
    id: string;
    type: 'task' | 'snag' | 'material' | 'project' | 'person';
    title: string;
    subtitle: string;
    status?: string;
    href: string;
    icon: any;
    color: string;
    bg: string;
}

export default function SearchPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);
    
    // Raw data from Firestore
    const [tasks, setTasks] = useState<any[]>([]);
    const [snags, setSnags] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleStatusChange = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);

        // Fetch everything for instant client-side filtering (Firestore handles caching)
        const unsubTasks = onSnapshot(query(collection(db, 'tasks'), limit(100)), (s) => setTasks(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const unsubSnags = onSnapshot(query(collection(db, 'snags'), limit(100)), (s) => setSnags(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const unsubMaterials = onSnapshot(query(collection(db, 'materials'), limit(100)), (s) => setMaterials(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const unsubProjects = onSnapshot(query(collection(db, 'projects'), limit(50)), (s) => setProjects(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const unsubUsers = onSnapshot(query(collection(db, 'users'), limit(50)), (s) => setUsers(s.docs.map(d => ({id: d.id, ...d.data()}))));

        setLoading(false);
        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
            unsubTasks(); unsubSnags(); unsubMaterials(); unsubProjects(); unsubUsers();
        };
    }, []);

    const results = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const s = searchTerm.toLowerCase();

        const allResults: SearchResult[] = [
            ...projects.filter(p => p.name.toLowerCase().includes(s) || p.client.toLowerCase().includes(s)).map(p => ({
                id: p.id, type: 'project' as const, title: p.name, subtitle: p.client, status: p.status, href: `/projects`, icon: Folder, color: 'text-primary-600', bg: 'bg-primary-50'
            })),
            ...tasks.filter(t => t.title.toLowerCase().includes(s) || t.description?.toLowerCase().includes(s)).map(t => ({
                id: t.id, type: 'task' as const, title: t.title, subtitle: t.projectName || 'General Task', status: t.status, href: '/tasks', icon: Kanban, color: 'text-blue-600', bg: 'bg-blue-50'
            })),
            ...snags.filter(sn => sn.title.toLowerCase().includes(s) || sn.description?.toLowerCase().includes(s)).map(sn => ({
                id: sn.id, type: 'snag' as const, title: sn.title, subtitle: `Level ${sn.level} - ${sn.location || 'Site'}`, status: sn.status, href: '/snagging', icon: MapPin, color: 'text-red-600', bg: 'bg-red-50'
            })),
            ...materials.filter(m => m.itemName.toLowerCase().includes(s) || m.materialId.toLowerCase().includes(s)).map(m => ({
                id: m.id, type: 'material' as const, title: m.itemName, subtitle: `ID: ${m.materialId} • ${m.quantity} ${m.unit}`, status: m.status, href: '/scanner', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50'
            })),
            ...users.filter(u => u.name.toLowerCase().includes(s) || u.role.toLowerCase().includes(s)).map(u => ({
                id: u.id, type: 'person' as const, title: u.name, subtitle: u.role.replace('_', ' '), href: '/people', icon: User, color: 'text-emerald-600', bg: 'bg-emerald-50'
            }))
        ];

        return allResults.slice(0, 15); // Limit to top 15 matches
    }, [searchTerm, tasks, snags, materials, projects, users]);

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
            {/* Search Header */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-text-main flex items-center gap-2">
                            Universal Search
                        </h1>
                        <p className="text-text-muted text-sm">Find tasks, snags, materials, or team members.</p>
                    </div>
                    {isOnline ? (
                        <div className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            <Cloud size={10} /> Live Results
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                            <CloudOff size={10} /> Local Cache Only
                        </div>
                    )}
                </div>

                <div className="relative group">
                    <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-600 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search project items, ID codes, staff names..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-surface border-2 border-border rounded-2xl pl-12 pr-4 py-4 text-lg font-medium text-text-main focus:outline-none focus:border-primary-500 transition-all shadow-sm focus:shadow-md"
                        autoFocus
                    />
                </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-2">
                {!searchTerm ? (
                    <div className="space-y-8 pt-4">
                         {/* Quick Access */}
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/tasks" className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center gap-3 hover:bg-blue-100/50 transition-all group">
                                <div className="p-2 bg-blue-100 rounded-xl text-blue-600"><Kanban size={18} /></div>
                                <div className="text-left"><p className="text-xs font-black uppercase text-text-muted tracking-widest">Tasks</p><p className="text-sm font-bold text-blue-900 group-hover:translate-x-1 transition-transform">Browse Board</p></div>
                            </Link>
                            <Link href="/snagging" className="p-4 rounded-2xl bg-red-50/50 border border-red-100 flex items-center gap-3 hover:bg-red-100/50 transition-all group">
                                <div className="p-2 bg-red-100 rounded-xl text-red-600"><MapPin size={18} /></div>
                                <div className="text-left"><p className="text-xs font-black uppercase text-text-muted tracking-widest">Snags</p><p className="text-sm font-bold text-red-900 group-hover:translate-x-1 transition-transform">View Defects</p></div>
                            </Link>
                            <Link href="/scanner" className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center gap-3 hover:bg-amber-100/50 transition-all group">
                                <div className="p-2 bg-amber-100 rounded-xl text-amber-600"><Package size={18} /></div>
                                <div className="text-left"><p className="text-xs font-black uppercase text-text-muted tracking-widest">Materials</p><p className="text-sm font-bold text-amber-900 group-hover:translate-x-1 transition-transform">Check-in</p></div>
                            </Link>
                            <Link href="/people" className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3 hover:bg-emerald-100/50 transition-all group">
                                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><Users size={18} /></div>
                                <div className="text-left"><p className="text-xs font-black uppercase text-text-muted tracking-widest">Staff</p><p className="text-sm font-bold text-emerald-900 group-hover:translate-x-1 transition-transform">Team Directory</p></div>
                            </Link>
                        </div>

                        {/* Recent Activity Placeholder (Visual) */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-1">Common Search Queries</h3>
                            <div className="flex flex-wrap gap-2 px-1">
                                {['Alucobond panels', 'Level 4 snags', 'Site delivery', 'Crane team', 'Snag ID-'].map(query => (
                                    <button key={query} onClick={() => setSearchTerm(query)} className="px-4 py-2 bg-surface border border-border rounded-full text-xs font-bold text-text-muted hover:border-primary-500 hover:text-primary-600 transition-all">
                                        {query}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-300">
                        {results.map((result) => (
                            <Link key={`${result.type}-${result.id}`} href={result.href}>
                                <Card className="p-3 hover:shadow-md transition-all group border-transparent hover:border-primary-100">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl ${result.bg} flex items-center justify-center shrink-0`}>
                                            <result.icon size={24} className={result.color} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-text-main truncate">{result.title}</h3>
                                                {result.status && (
                                                    <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-surface border border-border font-black uppercase tracking-widest text-text-muted">
                                                        {result.status}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-text-muted truncate uppercase tracking-wider font-medium">{result.subtitle}</p>
                                        </div>
                                        <ArrowRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 animate-in fade-in duration-500">
                        <div className="w-20 h-20 bg-surface border border-border rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <SearchIcon size={32} className="text-text-muted/20" />
                        </div>
                        <h3 className="text-lg font-bold text-text-main">No matches found</h3>
                        <p className="text-text-muted text-sm max-w-[240px] mx-auto">Try searching for item names, categories, or specific Material IDs.</p>
                        <button onClick={() => setSearchTerm('')} className="mt-6 px-6 py-2.5 bg-surface border border-border rounded-xl text-sm font-bold text-text-muted hover:text-text-main hover:border-primary-400 transition-all">Clear Search</button>
                    </div>
                )}
            </div>
        </div>
    );
}
