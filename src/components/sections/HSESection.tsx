import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Fab } from '@/components/ui/Fab';
import { Input } from '@/components/ui/Input';
import { HSEItem } from '@/types/report';
import { Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    hse: HSEItem[];
    onChange: (hse: HSEItem[]) => void;
}

export function HSESection({ hse, onChange }: Props) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<HSEItem | null>(null);

    const [formState, setFormState] = useState<Partial<HSEItem>>({
        date: new Date().toISOString().split('T')[0],
        type: 'Toolbox Talk',
        description: '',
        actionTaken: ''
    });

    const handleOpenSheet = (item?: HSEItem) => {
        if (item) {
            setEditingItem(item);
            setFormState(item);
        } else {
            setEditingItem(null);
            setFormState({
                date: new Date().toISOString().split('T')[0],
                type: 'Toolbox Talk',
                description: '',
                actionTaken: ''
            });
        }
        setIsSheetOpen(true);
    };

    const handleSave = () => {
        if (editingItem) {
            onChange(hse.map(i => i.id === editingItem.id ? { ...formState, id: i.id } as HSEItem : i));
        } else {
            onChange([...hse, { ...formState, id: Date.now().toString() } as HSEItem]);
        }
        setIsSheetOpen(false);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(hse.filter(i => i.id !== id));
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Toolbox Talk': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'PPE Check': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Incident': return 'bg-red-100 text-red-700 border-red-200';
            case 'Near Miss': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="mb-2">
                <h2 className="text-2xl font-bold text-text-main pb-1">Health & Safety (HSE)</h2>
                <p className="text-text-muted text-sm">Log safety meetings, PPE checks, and incidents.</p>
            </div>

            <div className="space-y-4">
                {hse.length === 0 ? (
                    <div className="text-center py-12 bg-surface-muted rounded-2xl border border-dashed border-border border-2">
                        <ShieldAlert className="mx-auto text-primary-300 mb-3" size={32} />
                        <p className="text-text-muted">No HSE records added yet.</p>
                    </div>
                ) : (
                    hse.map((item) => (
                        <Card key={item.id} className="relative cursor-pointer hover:border-primary-300 transition-colors">
                            <div onClick={() => handleOpenSheet(item)}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`px-2.5 py-1 rounded border text-xs font-bold ${getTypeColor(item.type)}`}>
                                        {item.type}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-text-muted font-medium bg-surface-muted px-2 py-1 rounded border border-border">
                                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                        <button
                                            onClick={(e) => handleDelete(item.id, e)}
                                            className="text-red-400 hover:text-red-600 p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-2">
                                    <div>
                                        <span className="text-xs font-semibold text-text-muted capitalize block mb-0.5">Description</span>
                                        <p className="text-sm text-text-main font-medium">{item.description}</p>
                                    </div>
                                    {item.actionTaken && (
                                        <div className="bg-surface-muted p-2.5 rounded-lg border border-border/50">
                                            <span className="text-xs font-semibold text-text-muted capitalize block mb-0.5">Action Taken / Notes</span>
                                            <p className="text-sm text-text-main">{item.actionTaken}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Fab icon={<Plus />} onClick={() => handleOpenSheet()} label="Add Record" />

            <BottomSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                title={editingItem ? "Edit Safety Record" : "Add Safety Record"}
            >
                <div className="space-y-5 pb-6">
                    <Input
                        label="Date of Record"
                        type="date"
                        value={formState.date}
                        onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                    />

                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium text-text-muted pl-1">Record Type</label>
                        <select
                            value={formState.type}
                            onChange={(e) => setFormState({ ...formState, type: e.target.value as any })}
                            className="w-full bg-surface-muted text-text-main border border-border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        >
                            <option value="Toolbox Talk">Toolbox Talk</option>
                            <option value="PPE Check">PPE Check</option>
                            <option value="Incident">Incident</option>
                            <option value="Near Miss">Near Miss</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium text-text-muted pl-1">Description</label>
                        <textarea
                            value={formState.description}
                            onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                            placeholder="What occurred, or what was discussed?"
                            className="w-full bg-surface-muted border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium text-text-muted pl-1">Action Taken / Resolution</label>
                        <textarea
                            value={formState.actionTaken}
                            onChange={(e) => setFormState({ ...formState, actionTaken: e.target.value })}
                            placeholder="How was it resolved? E.g. 'Warned worker', 'Replaced harness'."
                            className="w-full bg-surface-muted border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                        />
                    </div>

                    <Button fullWidth onClick={handleSave} className="mt-4" disabled={!formState.date || !formState.description}>
                        Save Record
                    </Button>
                </div>
            </BottomSheet>
        </div>
    );
}
