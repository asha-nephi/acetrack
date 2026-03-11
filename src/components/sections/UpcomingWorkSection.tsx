import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Fab } from '@/components/ui/Fab';
import { Input } from '@/components/ui/Input';
import { UpcomingWork } from '@/types/report';
import { Calendar, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

interface Props {
    upcomingWork: UpcomingWork[];
    onChange: (work: UpcomingWork[]) => void;
}

export function UpcomingWorkSection({ upcomingWork, onChange }: Props) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingWork, setEditingWork] = useState<UpcomingWork | null>(null);

    const [formState, setFormState] = useState<Partial<UpcomingWork>>({
        date: '',
        description: '',
        laborRequired: 0,
        comments: ''
    });

    const handleOpenSheet = (work?: UpcomingWork) => {
        if (work) {
            setEditingWork(work);
            setFormState(work);
        } else {
            setEditingWork(null);
            // default to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            setFormState({
                date: tomorrow.toISOString().split('T')[0],
                description: '',
                laborRequired: 1,
                comments: ''
            });
        }
        setIsSheetOpen(true);
    };

    const handleSave = () => {
        if (editingWork) {
            onChange(upcomingWork.map(w => w.id === editingWork.id ? { ...formState, id: w.id } as UpcomingWork : w));
        } else {
            onChange([...upcomingWork, { ...formState, id: Date.now().toString() } as UpcomingWork]);
        }
        setIsSheetOpen(false);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(upcomingWork.filter(w => w.id !== id));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="mb-2">
                <h2 className="text-2xl font-bold text-text-main pb-1">Upcoming Work</h2>
                <p className="text-text-muted text-sm">Plan tasks and labor requirements for the days ahead.</p>
            </div>

            <div className="space-y-4">
                {upcomingWork.length === 0 ? (
                    <div className="text-center py-12 bg-surface-muted rounded-2xl border border-dashed border-border border-2">
                        <Calendar className="mx-auto text-primary-300 mb-3" size={32} />
                        <p className="text-text-muted">No upcoming work scheduled.</p>
                    </div>
                ) : (
                    upcomingWork.map((work) => (
                        <Card key={work.id} className="relative cursor-pointer hover:border-primary-300 transition-colors">
                            <div onClick={() => handleOpenSheet(work)}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2 text-primary-700 bg-primary-50 px-3 py-1 rounded-lg text-sm font-semibold">
                                        <Calendar size={14} />
                                        {new Date(work.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(work.id, e)}
                                        className="text-red-400 hover:text-red-600 p-1"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <p className="text-text-main font-medium mb-3">{work.description}</p>

                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-1.5 text-text-muted text-sm bg-surface-muted px-3 py-1.5 rounded-lg border border-border">
                                        <Users size={16} />
                                        <span>{work.laborRequired} Workers</span>
                                    </div>

                                    {work.comments && (
                                        <div className="text-xs text-text-muted max-w-[50%] truncate">
                                            Note: {work.comments}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Fab icon={<Plus />} onClick={() => handleOpenSheet()} label="Add Plan" />

            <BottomSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                title={editingWork ? "Edit Scheduled Work" : "Schedule Work"}
            >
                <div className="space-y-5 pb-6">
                    <Input
                        label="Date"
                        type="date"
                        value={formState.date}
                        onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                    />

                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium text-text-muted pl-1">Description of Work</label>
                        <textarea
                            value={formState.description}
                            onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                            placeholder="What exactly needs to be done?"
                            className="w-full bg-surface-muted border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                        />
                    </div>

                    <Input
                        label="Labor Required (Number of Workers)"
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="1"
                        value={formState.laborRequired}
                        onChange={(e) => setFormState({ ...formState, laborRequired: parseInt(e.target.value) || 0 })}
                    />

                    <Input
                        label="Comments / Subcontractor details (Optional)"
                        value={formState.comments}
                        onChange={(e) => setFormState({ ...formState, comments: e.target.value })}
                    />

                    <Button fullWidth onClick={handleSave} className="mt-4" disabled={!formState.date || !formState.description || !formState.laborRequired}>
                        Save Plan
                    </Button>
                </div>
            </BottomSheet>
        </div>
    );
}
