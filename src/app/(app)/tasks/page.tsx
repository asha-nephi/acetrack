"use client";

import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Clock, Kanban, Plus, Trash2, Cloud, CloudOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';

type TaskStatus = 'todo' | 'doing' | 'blocked' | 'done';

interface KanbanTask {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    assignee: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
    comments?: string;
    projectId: string;
    createdAt?: any;
}

interface Project { id: string; name: string; }

const Columns: { id: TaskStatus; label: string; dot: string }[] = [
    { id: 'todo', label: 'To Do', dot: 'bg-gray-400' },
    { id: 'doing', label: 'In Progress', dot: 'bg-blue-500' },
    { id: 'blocked', label: 'Blocked', dot: 'bg-red-500' },
    { id: 'done', label: 'Done', dot: 'bg-emerald-500' },
];

const PRIO_STYLE: Record<string, string> = {
    high: 'bg-red-50 text-red-600 border-red-200',
    medium: 'bg-amber-50 text-amber-600 border-amber-200',
    low: 'bg-blue-50 text-blue-600 border-blue-200',
};

export default function KanbanBoardPage() {
    const { user } = useAppContext();
    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleStatusChange = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);

        // Load active projects
        const q = query(collection(db, 'projects'), where('status', '==', 'active'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Project[];
            setProjects(projectsData);
            if (projectsData.length > 0 && !selectedProject) {
                setSelectedProject(projectsData[0].id);
            }
            if (projectsData.length === 0) setLoading(false);
        });

        return () => {
            unsubscribe();
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, []);

    useEffect(() => {
        if (!selectedProject || !user.id) return;
        setLoading(true);
        
        const canManageAll = user.role === 'admin' || user.role === 'md' || user.role === 'executive_director' || user.permissions?.includes('manage_tasks');
        
        let q;
        if (canManageAll) {
            q = query(
                collection(db, 'tasks'), 
                where('projectId', '==', selectedProject),
                orderBy('createdAt', 'desc')
            );
        } else {
            // Note: This requires a composite index in Firestore for projectId and assignee if orderBy is used, 
            // but we can omit orderBy here and just sort in memory if needed, or assume index exists.
            q = query(
                collection(db, 'tasks'), 
                where('projectId', '==', selectedProject),
                where('assignee', '==', user.name)
            );
        }
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let tasksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as KanbanTask[];
            
            if (!canManageAll) {
                // Sort in memory since we omitted orderBy to avoid immediate index issues
                tasksData.sort((a, b) => {
                    const tA = a.createdAt?.toMillis() || 0;
                    const tB = b.createdAt?.toMillis() || 0;
                    return tB - tA;
                });
            }
            
            setTasks(tasksData);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedProject]);

    const handleTaskClick = (task: KanbanTask) => {
        setActiveTask({ ...task });
        setIsEditing(false);
        setIsSheetOpen(true);
    };

    const handleMoveTask = async (newStatus: TaskStatus) => {
        if (!activeTask) return;
        try {
            const taskRef = doc(db, 'tasks', activeTask.id);
            await updateDoc(taskRef, { 
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            setActiveTask({ ...activeTask, status: newStatus });
        } catch (err) {
            console.error('Error moving task:', err);
        }
    };

    const handleSaveTask = async () => {
        if (!activeTask?.title?.trim() || !selectedProject) return;
        setSaving(true);
        
        try {
            const taskData = {
                ...activeTask,
                projectId: selectedProject,
                updatedAt: serverTimestamp()
            };

            if (activeTask.id.startsWith('new_')) {
                const { id, ...newData } = taskData;
                await addDoc(collection(db, 'tasks'), {
                    ...newData,
                    createdAt: serverTimestamp()
                });
            } else {
                await updateDoc(doc(db, 'tasks', activeTask.id), taskData);
            }
            setIsSheetOpen(false);
        } catch (err) {
            console.error('Error saving task:', err);
        }
        setSaving(false);
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            setIsSheetOpen(false);
            await deleteDoc(doc(db, 'tasks', id));
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    };

    const createNewTask = () => {
        if (!selectedProject) return;
        const newTask: KanbanTask = {
            id: 'new_' + Date.now(),
            title: '', description: '',
            status: 'todo', assignee: '',
            dueDate: new Date().toISOString().split('T')[0],
            priority: 'medium', comments: '',
            projectId: selectedProject
        };
        setActiveTask(newTask);
        setIsEditing(true);
        setIsSheetOpen(true);
    };

    return (
        <div className="h-[calc(100vh-80px)] md:h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
            {/* Header */}
            <div className="p-4 md:p-6 shrink-0 bg-surface border-b border-border z-10 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-text-main">Task Board</h1>
                            {isOnline ? (
                                <div className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    <Cloud size={10} /> Live Sync
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                                    <CloudOff size={10} /> Offline mode
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-text-muted">Manage daily operations across all trades.</p>
                    </div>
                    {(user.role === 'admin' || user.role === 'md' || user.role === 'executive_director' || user.permissions?.includes('manage_tasks')) && (
                        <button onClick={createNewTask} disabled={!selectedProject} className="flex items-center gap-1.5 bg-primary-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50 text-sm">
                            <Plus size={16} /> New Task
                        </button>
                    )}
                </div>
                {/* Project selector */}
                {projects.length > 0 && (
                    <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-text-main bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-sm">
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                )}
            </div>

            {loading && <div className="flex-1 flex items-center justify-center text-text-muted font-bold">Loading tasks...</div>}

            {!loading && !selectedProject && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <Kanban size={48} className="text-text-muted/40 mb-4" />
                    <h3 className="font-bold text-text-main mb-2">No Active Projects</h3>
                    <p className="text-text-muted text-sm">Create a project first to start adding tasks.</p>
                </div>
            )}

            {/* Kanban Columns */}
            {!loading && selectedProject && (
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 md:p-6 flex gap-4 snap-x snap-mandatory pb-24">
                    {Columns.map(col => {
                        const colTasks = tasks.filter(t => t.status === col.id);
                        return (
                            <div key={col.id} className="flex-shrink-0 w-[80vw] md:w-72 flex flex-col snap-center h-full">
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                                    <h2 className="font-bold text-text-main text-sm">{col.label}</h2>
                                    <span className="text-xs font-bold text-text-muted bg-surface-muted px-2 py-0.5 rounded-full ml-auto">{colTasks.length}</span>
                                </div>
                                <div className={`flex-1 overflow-y-auto rounded-2xl p-2 space-y-3 ${colTasks.length === 0 ? 'border-2 border-dashed border-border' : 'bg-surface-muted/50'}`}>
                                    {colTasks.length === 0 && (
                                        <div className="h-full flex items-center justify-center text-sm text-text-muted/50 font-medium">Empty</div>
                                    )}
                                    {colTasks.map(task => (
                                        <Card key={task.id} className="cursor-pointer hover:border-primary-300 hover:shadow-md transition-all active:scale-[0.98] group" onClick={() => handleTaskClick(task)}>
                                            <div className="flex items-start justify-between mb-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${PRIO_STYLE[task.priority]}`}>{task.priority}</span>
                                                <button onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-text-muted/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-0.5">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <h3 className="font-bold text-text-main text-sm leading-tight mb-1">{task.title}</h3>
                                            {task.description && <p className="text-xs text-text-muted line-clamp-2 mb-3 leading-relaxed">{task.description}</p>}
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                                                    <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[9px] font-bold">{task.assignee?.charAt(0)?.toUpperCase() || '?'}</div>
                                                    <span className="truncate max-w-[80px]">{task.assignee || 'Unassigned'}</span>
                                                </div>
                                                <div className={`flex items-center gap-1 text-[10px] font-bold ${task.status === 'blocked' ? 'text-red-500' : 'text-text-muted/60'}`}>
                                                    <Clock size={11} />{task.dueDate}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Task Detail / Edit Sheet */}
            <BottomSheet
                isOpen={isSheetOpen}
                onClose={() => { setIsSheetOpen(false); setTimeout(() => setActiveTask(null), 300); }}
                title={isEditing ? (activeTask?.id?.startsWith('new_') ? 'New Task' : 'Edit Task') : 'Task Details'}
            >
                {activeTask && (
                    <div className="space-y-4 pb-4">
                        {isEditing ? (
                            <>
                                <Input label="Task Title *" value={activeTask.title} onChange={e => setActiveTask({ ...activeTask, title: e.target.value })} placeholder="e.g. Install brackets at Level 3" autoFocus />
                                <div>
                                    <label className="block text-sm font-semibold text-text-muted mb-1.5">Description</label>
                                    <textarea className="w-full bg-surface-muted border border-border rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none h-20" placeholder="Add more details..." value={activeTask.description} onChange={e => setActiveTask({ ...activeTask, description: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="Assignee" value={activeTask.assignee} onChange={e => setActiveTask({ ...activeTask, assignee: e.target.value })} placeholder="e.g. Team Alpha" />
                                    <Input label="Due Date" type="date" value={activeTask.dueDate} onChange={e => setActiveTask({ ...activeTask, dueDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-text-muted mb-2">Priority</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['low', 'medium', 'high'] as const).map(p => (
                                            <button key={p} onClick={() => setActiveTask({ ...activeTask, priority: p })} className={`py-2 text-xs font-bold uppercase rounded-xl border-2 capitalize transition-all ${activeTask.priority === p ? 'bg-primary-600 text-white border-primary-600' : 'bg-surface text-text-muted border-border'}`}>{p}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-text-muted mb-1.5">Comments / Notes</label>
                                    <textarea className="w-full bg-surface-muted border border-border rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none h-16" placeholder="Extra context for the team..." value={activeTask.comments || ''} onChange={e => setActiveTask({ ...activeTask, comments: e.target.value })} />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    {!activeTask.id.startsWith('new_') && (
                                        <button onClick={() => handleDeleteTask(activeTask.id)} className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                    <Button fullWidth onClick={handleSaveTask} disabled={!activeTask.title.trim() || saving}>
                                        {saving ? 'Saving...' : 'Save Task'}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            /* View Mode */
                            <div>
                                <span className={`inline-block px-2 py-1 mb-3 rounded-md text-[10px] font-bold uppercase tracking-wider border ${PRIO_STYLE[activeTask.priority]}`}>{activeTask.priority} Priority</span>
                                <h2 className="text-xl font-bold text-text-main mb-2">{activeTask.title}</h2>
                                {activeTask.description && <p className="text-sm text-text-muted mb-4 bg-surface-muted p-3 rounded-xl border border-border">{activeTask.description}</p>}
                                <div className="flex gap-6 mb-4 border-t border-border py-3">
                                    <div><p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">Assignee</p><p className="text-sm font-bold text-text-main">{activeTask.assignee || 'Unassigned'}</p></div>
                                    <div><p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">Due Date</p><p className="text-sm font-bold text-text-main">{activeTask.dueDate}</p></div>
                                </div>
                                {activeTask.comments && <p className="text-sm text-text-muted bg-amber-50 border border-amber-100 p-3 rounded-xl mb-4">{activeTask.comments}</p>}
                                {/* Move buttons */}
                                <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">Move to:</p>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {Columns.map(col => (
                                        <button key={col.id} disabled={activeTask.status === col.id} onClick={() => handleMoveTask(col.id)} className={`py-2.5 px-3 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${activeTask.status === col.id ? 'bg-primary-50 border-primary-600 text-primary-700' : 'bg-surface border-border text-text-muted hover:bg-surface-muted'}`}>
                                            <div className={`w-2 h-2 rounded-full ${col.dot}`} /> {col.label}
                                            {activeTask.status === col.id && <span className="ml-auto text-[10px] font-bold">Active</span>}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-3 border-t border-border pt-4">
                                    <button onClick={() => handleDeleteTask(activeTask.id)} className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center">
                                        <Trash2 size={18} />
                                    </button>
                                    <Button fullWidth onClick={() => setIsEditing(true)}>Edit Task</Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </BottomSheet>
        </div>
    );
}
