import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Fab } from '@/components/ui/Fab';
import { Input } from '@/components/ui/Input';
import { MaterialItem } from '@/types/report';
import { PackageCheck, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    materials: MaterialItem[];
    onChange: (materials: MaterialItem[]) => void;
}

export function MaterialsSection({ materials, onChange }: Props) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);

    const [formState, setFormState] = useState<Partial<MaterialItem>>({
        dateReceived: new Date().toISOString().split('T')[0],
        materialName: '',
        quantity: '',
        supplier: '',
        condition: 'Good'
    });

    const handleOpenSheet = (item?: MaterialItem) => {
        if (item) {
            setEditingItem(item);
            setFormState(item);
        } else {
            setEditingItem(null);
            setFormState({
                dateReceived: new Date().toISOString().split('T')[0],
                materialName: '',
                quantity: '',
                supplier: '',
                condition: 'Good'
            });
        }
        setIsSheetOpen(true);
    };

    const handleSave = () => {
        if (editingItem) {
            onChange(materials.map(m => m.id === editingItem.id ? { ...formState, id: m.id } as MaterialItem : m));
        } else {
            onChange([...materials, { ...formState, id: Date.now().toString() } as MaterialItem]);
        }
        setIsSheetOpen(false);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(materials.filter(m => m.id !== id));
    };

    const getConditionColor = (condition: string) => {
        switch (condition) {
            case 'Good': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'Damaged': return 'text-red-600 bg-red-50 border-red-200';
            case 'Incomplete': return 'text-amber-600 bg-amber-50 border-amber-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="mb-2">
                <h2 className="text-2xl font-bold text-text-main pb-1">Site Deliveries</h2>
                <p className="text-text-muted text-sm">Track materials correctly received or damaged.</p>
            </div>

            <div className="space-y-4">
                {materials.length === 0 ? (
                    <div className="text-center py-12 bg-surface-muted rounded-2xl border border-dashed border-border border-2">
                        <PackageCheck className="mx-auto text-primary-300 mb-3" size={32} />
                        <p className="text-text-muted">No materials logged this week.</p>
                    </div>
                ) : (
                    materials.map((item) => (
                        <Card key={item.id} className="relative cursor-pointer hover:border-primary-300 transition-colors">
                            <div onClick={() => handleOpenSheet(item)}>
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-text-main pr-8">{item.materialName}</h4>
                                    <button
                                        onClick={(e) => handleDelete(item.id, e)}
                                        className="text-red-400 hover:text-red-600 p-1 absolute top-4 right-4"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2.5 py-1 rounded border border-primary-100">
                                        Qty: {item.quantity}
                                    </span>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${getConditionColor(item.condition)}`}>
                                        {item.condition}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-xs text-text-muted pt-3 border-t border-border/50">
                                    <span><strong>Supplier:</strong> {item.supplier || 'N/A'}</span>
                                    <span>{new Date(item.dateReceived).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Fab icon={<Plus />} onClick={() => handleOpenSheet()} label="Log Delivery" />

            <BottomSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                title={editingItem ? "Edit Log" : "Log Material Delivery"}
            >
                <div className="space-y-5 pb-6">
                    <Input
                        label="Date Received"
                        type="date"
                        value={formState.dateReceived}
                        onChange={(e) => setFormState({ ...formState, dateReceived: e.target.value })}
                    />

                    <Input
                        label="Material Description"
                        placeholder="e.g. 4mm Alucobond Sheets, Screws..."
                        value={formState.materialName}
                        onChange={(e) => setFormState({ ...formState, materialName: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Quantity/Volume"
                            placeholder="e.g. 50 Panels, 2 Tons"
                            value={formState.quantity}
                            onChange={(e) => setFormState({ ...formState, quantity: e.target.value })}
                        />
                        <div className="flex flex-col gap-1.5 w-full">
                            <label className="text-sm font-medium text-text-muted pl-1">Condition</label>
                            <select
                                value={formState.condition}
                                onChange={(e) => setFormState({ ...formState, condition: e.target.value as any })}
                                className="w-full bg-surface-muted text-text-main border border-border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            >
                                <option value="Good">Good</option>
                                <option value="Damaged">Damaged</option>
                                <option value="Incomplete">Incomplete</option>
                            </select>
                        </div>
                    </div>

                    <Input
                        label="Supplier / Transporter (Optional)"
                        placeholder="Who delivered this?"
                        value={formState.supplier}
                        onChange={(e) => setFormState({ ...formState, supplier: e.target.value })}
                    />

                    <Button fullWidth onClick={handleSave} className="mt-4" disabled={!formState.materialName || !formState.quantity}>
                        Save Record
                    </Button>
                </div>
            </BottomSheet>
        </div>
    );
}
