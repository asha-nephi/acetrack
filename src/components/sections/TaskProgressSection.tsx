import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Fab } from '@/components/ui/Fab';
import { Input } from '@/components/ui/Input';
import { TaskItem } from '@/types/report';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    overallStatus: string;
    tasks: TaskItem[];
    onChangeStatus: (status: string) => void;
    onChangeTasks: (tasks: TaskItem[]) => void;
}

export function TaskProgressSection({ overallStatus, tasks, onChangeStatus, onChangeTasks }: Props) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

    const [formState, setFormState] = useState<Partial<TaskItem>>({
        location: '',
        description: '',
        percentageDone: 0,
        comments: ''
    });

    const handleOpenSheet = (task?: TaskItem) => {
        if (task) {
            setEditingTask(task);
            setFormState(task);
        } else {
            setEditingTask(null);
            setFormState({ location: '', description: '', percentageDone: 0, comments: '' });
        }
        setIsSheetOpen(true);
    };

    const handleSave = () => {
        if (editingTask) {
            onChangeTasks(tasks.map(t => t.id === editingTask.id ? { ...formState, id: t.id } as TaskItem : t));
        } else {
            onChangeTasks([...tasks, { ...formState, id: Date.now().toString() } as TaskItem]);
        }
        setIsSheetOpen(false);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChangeTasks(tasks.filter(t => t.id !== id));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="mb-2">
                <h2 className="text-2xl font-bold text-text-main pb-1">Task Progress</h2>
                <p className="text-text-muted text-sm">Summarize the week and track specific locations.</p>
            </div>

            <Card title="Overall Weekly Summary">
                <textarea
                    value={overallStatus}
                    onChange={(e) => onChangeStatus(e.target.value)}
                    placeholder="Briefly describe the overall progress made this week..."
                    className="w-full bg-surface-muted border border-border rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px] resize-none"
                />
            </Card>

            <div className="space-y-4 mt-8">
                <h3 className="text-lg font-semibold text-text-main pl-1">Tracked Locations</h3>

                {tasks.length === 0 ? (
                    <div className="text-center py-10 bg-surface-muted rounded-2xl border border-dashed border-border border-2">
                        <p className="text-text-muted mb-2">No tasks added yet.</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <Card key={task.id} className="relative overflow-hidden group hover:border-primary-300 transition-colors cursor-pointer" >
                            <div onClick={() => handleOpenSheet(task)}>
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-text-main">{task.location}</h4>
                                    <button
                                        onClick={(e) => handleDelete(task.id, e)}
                                        className="text-red-400 hover:text-red-600 p-1"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <p className="text-sm text-text-muted mb-4">{task.description}</p>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-text-muted">Progress</span>
                                        <span className="text-primary-700">{task.percentageDone}%</span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-500 transition-all duration-500"
                                            style={{ width: `${task.percentageDone}%` }}
                                        />
                                    </div>
                                </div>

                                {task.comments && (
                                    <div className="mt-4 pt-4 border-t border-border flex gap-2 items-start">
                                        <span className="text-xs bg-surface-muted px-2 py-1 rounded text-text-muted shrink-0">Note</span>
                                        <p className="text-sm text-text-main italic">{task.comments}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Fab icon={<Plus />} onClick={() => handleOpenSheet()} label="Add Task" />

            <BottomSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                title={editingTask ? "Edit Task" : "Add Task"}
            >
                <div className="space-y-5 pb-6">
                    <Input
                        label="Location"
                        placeholder="e.g. East Wing - Floor 5"
                        value={formState.location}
                        onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    />

                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium text-text-muted pl-1">Description / Work scope</label>
                        <textarea
                            value={formState.description}
                            onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                            className="w-full bg-surface-muted border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                        />
                    </div>

                    <div className="flex flex-col gap-2 w-full pt-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-text-muted pl-1">Completion Percentage</label>
                            <span className="font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-lg">
                                {formState.percentageDone}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0" max="100"
                            value={formState.percentageDone}
                            onChange={(e) => setFormState({ ...formState, percentageDone: parseInt(e.target.value) })}
                            className="w-full h-2 bg-surface-muted rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                        <div className="flex justify-between text-xs text-text-muted px-1">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <Input
                        label="Comments (Optional)"
                        placeholder="Any blockers or notes?"
                        value={formState.comments}
                        onChange={(e) => setFormState({ ...formState, comments: e.target.value })}
                    />

                    <Button fullWidth onClick={handleSave} className="mt-4" disabled={!formState.location || !formState.description}>
                        Save Task
                    </Button>
                </div>
            </BottomSheet>
        </div>
    );
}
