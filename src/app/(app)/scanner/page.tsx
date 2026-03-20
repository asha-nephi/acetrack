"use client";

import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, setDoc, updateDoc, doc, getDoc, deleteDoc, Timestamp, getDocs, limit } from 'firebase/firestore';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
    AlertTriangle, ArrowRight, Box, CheckCircle2,
    Expand, Package, Plus, ScanLine, Tag, Trash2, Cloud, CloudOff
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Material {
    id: string;
    type: string;
    description: string;
    dimensions: string;
    destination: string;
    status: string;
    supplier?: string | null;
    quantity?: string | null;
    updatedAt?: any;
}
interface Project { id: string; name: string; }

const STATUS_STYLES: Record<string, string> = {
    'In Transit': 'bg-amber-100 text-amber-700 border-amber-200',
    'At Warehouse': 'bg-blue-100 text-blue-700 border-blue-200',
    'Delivered': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Issue Reported': 'bg-red-100 text-red-700 border-red-200',
};

const MATERIAL_TYPES = [
    'Glass Panel', 'Aluminium Frame', 'Curtain Wall Unit', 'Cladding Panel',
    'Sealant', 'Fixing Kit', 'Window Unit', 'Door Frame', 'HPL Panel',
    'Polycarbonate Sheet', 'Mesh Panel', 'Terracotta Panel', 'Other'
];

export default function MaterialScannerPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [activeTab, setActiveTab] = useState<'scan' | 'inventory'>('scan');
    const [isScanning, setIsScanning] = useState(false);
    const [manualId, setManualId] = useState('');
    const [scannedItem, setScannedItem] = useState<Material | null>(null);
    const [scanActionStatus, setScanActionStatus] = useState<'idle' | 'success' | 'damaged' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [recentItems, setRecentItems] = useState<Material[]>([]);
    const [allMaterials, setAllMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);

    // Register form
    const [isRegSheetOpen, setIsRegSheetOpen] = useState(false);
    const [regForm, setRegForm] = useState({ type: 'Glass Panel', description: '', dimensions: '', destination: '', supplier: '', quantity: '' });
    const [regSaving, setRegSaving] = useState(false);
    const [regError, setRegError] = useState('');

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleStatusChange = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);

        async function init() {
            const snap = await getDocs(query(collection(db, 'projects'), where('status', '==', 'active')));
            const ps = snap.docs.map(d => ({ id: d.id, name: d.data().name }));
            if (ps.length > 0) {
                setProjects(ps);
                setSelectedProject(ps[0].id);
            } else { setLoading(false); }
        }
        init();
        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, []);

    useEffect(() => { 
        if (!selectedProject) return;
        setLoading(true);
        // Inventory listener
        const qAll = query(collection(db, 'materials'), where('projectId', '==', selectedProject), orderBy('createdAt', 'desc'));
        const unsubAll = onSnapshot(qAll, (snap) => {
            setAllMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Material[]);
            setLoading(false);
        });

        // Recent listener
        const qRecent = query(collection(db, 'materials'), where('projectId', '==', selectedProject), orderBy('updatedAt', 'desc'), limit(10));
        const unsubRecent = onSnapshot(qRecent, (snap) => {
            setRecentItems(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Material[]);
        });

        return () => { unsubAll(); unsubRecent(); };
    }, [selectedProject]);

    const handleLookup = async (id: string) => {
        if (!id.trim()) return;
        setIsScanning(true);
        setScannedItem(null);
        setScanActionStatus('idle');
        setErrorMsg('');
        
        try {
            const docRef = doc(db, 'materials', id.trim().toUpperCase());
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setScannedItem({ id: docSnap.id, ...docSnap.data() } as Material);
            } else {
                setErrorMsg('Material not found in database. Please register it first.');
                setScanActionStatus('error');
            }
        } catch (e) {
            setErrorMsg('Lookup failed');
            setScanActionStatus('error');
        }
        setIsScanning(false);
    };

    const handleReceive = async () => {
        if (!scannedItem) return;
        try {
            await updateDoc(doc(db, 'materials', scannedItem.id), { status: 'Delivered', updatedAt: Timestamp.now() });
            setScannedItem({ ...scannedItem, status: 'Delivered' });
            setScanActionStatus('success');
        } catch (e) { setErrorMsg('Update failed'); }
    };

    const handleReportIssue = async () => {
        if (!scannedItem) return;
        try {
            await updateDoc(doc(db, 'materials', scannedItem.id), { status: 'Issue Reported', updatedAt: Timestamp.now() });
            setScannedItem({ ...scannedItem, status: 'Issue Reported' });
            setScanActionStatus('damaged');
        } catch (e) { setErrorMsg('Update failed'); }
    };

    const handleRegisterMaterial = async () => {
        if (!regForm.description.trim() || !selectedProject) { setRegError('Description is required.'); return; }
        setRegSaving(true);
        setRegError('');
        try {
            const typeCode = regForm.type.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
            const timestamp = Date.now().toString().slice(-5);
            const id = `ACE-${typeCode}-${timestamp}`;

            const materialData = {
                ...regForm,
                projectId: selectedProject,
                status: 'In Transit',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };

            await setDoc(doc(db, 'materials', id), materialData);
            setIsRegSheetOpen(false);
            setRegForm({ type: 'Glass Panel', description: '', dimensions: '', destination: '', supplier: '', quantity: '' });
            setScannedItem({ id, ...materialData } as any);
            setScanActionStatus('idle');
            setActiveTab('scan');
        } catch (e) { setRegError('Failed to register'); }
        setRegSaving(false);
    };

    const handleDeleteMaterial = async (id: string) => {
        if (!confirm(`Delete material ${id}?`)) return;
        try {
            await deleteDoc(doc(db, 'materials', id));
        } catch (e) { console.error(e); }
    };

    const fmt = (d: Date | string) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });

    const SCAN_STATUS_COLORS: Record<string, string> = {
        idle: 'border-border', success: 'border-emerald-400 bg-emerald-50/50', damaged: 'border-red-400 bg-red-50/50', error: 'border-red-400 bg-red-50/50'
    };

    if (!selectedProject && projects.length === 0) return (
        <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
            <Package size={48} className="text-text-muted/40 mb-4" />
            <h3 className="font-bold text-text-main mb-2">No Active Projects</h3>
            <p className="text-text-muted text-sm">Create a project first to start tracking materials.</p>
        </div>
    );

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5 animate-in fade-in duration-500 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-text-main">Material Scanner</h1>
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
                    <p className="text-text-muted text-sm mt-0.5">Scan, register and track material deliveries.</p>
                </div>
                <Button onClick={() => setIsRegSheetOpen(true)} className="flex items-center gap-2" disabled={!selectedProject}>
                    <Plus size={16} /> Register
                </Button>
            </div>

            {/* Project selector */}
            {projects.length > 0 && (
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full border border-border rounded-xl px-4 py-3 text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            )}

            {/* Tabs */}
            <div className="flex bg-surface-muted rounded-xl p-1 gap-1">
                {(['scan', 'inventory'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-surface text-text-main shadow-sm' : 'text-text-muted'}`}>
                        {tab === 'scan' ? 'Scan / Lookup' : `Inventory (${allMaterials.length})`}
                    </button>
                ))}
            </div>

            {/* ===== SCAN TAB ===== */}
            {activeTab === 'scan' && (
                <div className="space-y-4">
                    {/* Scanner UI */}
                    <div className={`relative w-full aspect-[4/3] rounded-2xl border-2 overflow-hidden flex flex-col items-center justify-center transition-all ${SCAN_STATUS_COLORS[scanActionStatus]}`}>
                        {scanActionStatus === 'success' ? (
                            <>
                                <CheckCircle2 size={56} className="text-emerald-500 mb-3" />
                                <p className="text-xl font-black text-emerald-700">Delivery Confirmed!</p>
                                <p className="text-sm text-emerald-600 mt-1">{scannedItem?.id}</p>
                            </>
                        ) : scanActionStatus === 'damaged' ? (
                            <>
                                <AlertTriangle size={56} className="text-red-500 mb-3" />
                                <p className="text-xl font-black text-red-700">Issue Reported</p>
                                <p className="text-sm text-red-600 mt-1">QA team has been notified</p>
                            </>
                        ) : isScanning ? (
                            <>
                                <ScanLine size={48} className="text-primary-600 animate-bounce mb-3" />
                                <p className="text-lg font-bold text-primary-700">Looking up material...</p>
                            </>
                        ) : scannedItem ? (
                            <div className="w-full p-5 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-mono text-xs font-bold text-text-muted">{scannedItem.id}</p>
                                        <h3 className="text-lg font-black text-text-main">{scannedItem.description}</h3>
                                        <p className="text-sm text-text-muted">{scannedItem.type}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${STATUS_STYLES[scannedItem.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                        {scannedItem.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-surface-muted rounded-lg p-2.5 flex items-center gap-2">
                                        <Expand size={14} className="text-primary-600 shrink-0" />
                                        <div><p className="text-text-muted">Dimensions</p><p className="font-bold text-text-main">{scannedItem.dimensions}</p></div>
                                    </div>
                                    <div className="bg-surface-muted rounded-lg p-2.5 flex items-center gap-2">
                                        <ArrowRight size={14} className="text-primary-600 shrink-0" />
                                        <div><p className="text-text-muted">Destination</p><p className="font-bold text-text-main">{scannedItem.destination}</p></div>
                                    </div>
                                    {scannedItem.supplier && (
                                        <div className="bg-surface-muted rounded-lg p-2.5 flex items-center gap-2">
                                            <Tag size={14} className="text-primary-600 shrink-0" />
                                            <div><p className="text-text-muted">Supplier</p><p className="font-bold text-text-main">{scannedItem.supplier}</p></div>
                                        </div>
                                    )}
                                    {scannedItem.quantity && (
                                        <div className="bg-surface-muted rounded-lg p-2.5 flex items-center gap-2">
                                            <Box size={14} className="text-primary-600 shrink-0" />
                                            <div><p className="text-text-muted">Quantity</p><p className="font-bold text-text-main">{scannedItem.quantity}</p></div>
                                        </div>
                                    )}
                                </div>
                                {scannedItem.status !== 'Delivered' && (
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={handleReportIssue} className="flex-1 py-2.5 text-sm font-bold rounded-xl border-2 border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                                            Report Issue
                                        </button>
                                        <button onClick={handleReceive} className="flex-1 py-2.5 text-sm font-bold rounded-xl border-2 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                                            Confirm Delivery
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : scanActionStatus === 'error' ? (
                            <>
                                <AlertTriangle size={48} className="text-amber-500 mb-3" />
                                <p className="text-base font-bold text-text-main">{errorMsg}</p>
                                <Button onClick={() => setIsRegSheetOpen(true)} className="mt-3">+ Register New Material</Button>
                            </>
                        ) : (
                            <>
                                <ScanLine size={48} className="text-text-muted/30 mb-3" />
                                <p className="text-text-muted font-bold">Enter a Material ID below</p>
                                <p className="text-xs text-text-muted/60 mt-1">e.g. ACE-GLS-48291</p>
                            </>
                        )}
                    </div>

                    {/* Manual lookup */}
                    <div className="flex gap-2">
                        <input
                            className="flex-1 bg-surface-muted border border-border rounded-xl px-4 py-3 text-text-main font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase placeholder:normal-case placeholder:font-normal"
                            placeholder="Type or scan material ID…"
                            value={manualId}
                            onChange={e => setManualId(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && handleLookup(manualId)}
                        />
                        <Button onClick={() => handleLookup(manualId)} disabled={isScanning || !manualId.trim()}>Look Up</Button>
                    </div>

                    {/* Recent updates */}
                    {recentItems.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Recent Updates</h3>
                            <div className="space-y-2">
                                {recentItems.slice(0, 6).map(item => (
                                    <div key={item.id} className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl cursor-pointer hover:border-primary-300 transition-all" onClick={() => { handleLookup(item.id); setManualId(item.id); }}>
                                        <div className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center shrink-0"><Box size={16} className="text-primary-600" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-text-main truncate">{item.description}</p>
                                            <p className="text-xs text-text-muted font-mono">{item.id}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{item.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== INVENTORY TAB ===== */}
            {activeTab === 'inventory' && (
                <div className="space-y-3">
                    {allMaterials.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
                            <Package size={48} className="mx-auto text-text-muted/40 mb-4" />
                            <h3 className="font-bold text-text-main mb-2">No Materials Registered</h3>
                            <p className="text-text-muted text-sm mb-6 px-4">Register the first material for this project.</p>
                            <Button onClick={() => setIsRegSheetOpen(true)}><Plus size={16} className="mr-2" /> Register Material</Button>
                        </div>
                    ) : allMaterials.map(m => (
                        <Card key={m.id} className="group hover:shadow-md hover:border-primary-200 transition-all">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                                    <Package size={18} className="text-primary-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-bold text-text-main text-sm">{m.description}</p>
                                            <p className="text-xs text-text-muted">{m.type} · {m.dimensions}</p>
                                            <p className="font-mono text-[10px] text-text-muted/60 mt-0.5">{m.id}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLES[m.status] || 'bg-gray-100 border-gray-200'}`}>{m.status}</span>
                                    </div>
                                    {(m.supplier || m.quantity) && (
                                        <div className="flex gap-3 mt-1.5 text-xs text-text-muted">
                                            {m.supplier && <span>Supplier: {m.supplier}</span>}
                                            {m.quantity && <span>Qty: {m.quantity}</span>}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => handleDeleteMaterial(m.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Register Material Sheet */}
            <BottomSheet isOpen={isRegSheetOpen} onClose={() => setIsRegSheetOpen(false)} title="Register New Material">
                <div className="space-y-4 pb-4">
                    <div>
                        <label className="block text-sm font-semibold text-text-muted mb-1.5">Material Type</label>
                        <select value={regForm.type} onChange={e => setRegForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-border rounded-xl px-4 py-3 text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
                            {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <Input label="Description *" placeholder="e.g. 1200×2400mm Low-E Double Glazed Unit" value={regForm.description} onChange={e => setRegForm(f => ({ ...f, description: e.target.value }))} autoFocus />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Dimensions" placeholder="e.g. 1200×2400mm" value={regForm.dimensions} onChange={e => setRegForm(f => ({ ...f, dimensions: e.target.value }))} />
                        <Input label="Quantity" placeholder="e.g. 24 pcs" value={regForm.quantity} onChange={e => setRegForm(f => ({ ...f, quantity: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Supplier" placeholder="e.g. Vitro Glass" value={regForm.supplier} onChange={e => setRegForm(f => ({ ...f, supplier: e.target.value }))} />
                        <Input label="Destination" placeholder="e.g. Level 3 Grid B" value={regForm.destination} onChange={e => setRegForm(f => ({ ...f, destination: e.target.value }))} />
                    </div>
                    <p className="text-xs text-text-muted">A unique Material ID (e.g. ACE-GLS-48291) will be auto-generated.</p>
                    {regError && <p className="text-red-500 text-sm">{regError}</p>}
                    <Button fullWidth onClick={handleRegisterMaterial} disabled={regSaving}>{regSaving ? 'Saving...' : 'Register Material'}</Button>
                </div>
            </BottomSheet>
        </div>
    );
}
