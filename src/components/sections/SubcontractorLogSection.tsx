"use client";

import { SubcontractorItem } from '@/types/report';
import { CalendarDays, HardHat, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Fab } from '../ui/Fab';
import { Input } from '../ui/Input';

interface SubcontractorSectionProps {
    subcontractors: SubcontractorItem[];
    onChange: (subcontractors: SubcontractorItem[]) => void;
}

export const SubcontractorLogSection = ({ subcontractors, onChange }: SubcontractorSectionProps) => {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<Partial<SubcontractorItem>>({});

    const handleSave = () => {
        if (!editingLog.companyName || !editingLog.trade) return;

        if (editingLog.id) {
            onChange(subcontractors.map(log => log.id === editingLog.id ? editingLog as SubcontractorItem : log));
        } else {
            onChange([...subcontractors, { ...editingLog, id: Date.now().toString() } as SubcontractorItem]);
        }
        setIsSheetOpen(false);
        setEditingLog({});
    };

    const handleDelete = (id: string) => {
        onChange(subcontractors.filter(log => log.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-main mb-2">Sub-Contractor Sign-in Log</h2>
                <p className="text-text-muted">Track the presence and hours of external trades on site.</p>
            </div>

            <div className="space-y-4">
                {subcontractors.map((sub) => (
                    <Card
                        key={sub.id}
                        className="active:scale-[0.98] transition-transform"
                        onClick={() => {
                            setEditingLog(sub);
                            setIsSheetOpen(true);
                        }}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <HardHat size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main leading-tight">{sub.companyName}</h3>
                                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mt-0.5">{sub.trade}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-semibold flex items-center justify-end text-text-muted">
                                    <CalendarDays size={14} className="mr-1" />
                                    {sub.date || 'Today'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                            <div>
                                <p className="text-xs text-text-muted mb-1">Total Headcount</p>
                                <p className="font-bold text-text-main">{sub.headcount} workers</p>
                            </div>
                            <div>
                                <p className="text-xs text-text-muted mb-1">Hours Logged</p>
                                <p className="font-bold text-text-main">{sub.hoursWorked} hrs</p>
                            </div>
                        </div>
                    </Card>
                ))}

                {subcontractors.length === 0 && (
                    <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-border bg-surface-muted">
                        <HardHat size={40} className="mx-auto text-text-muted mb-3 opacity-50" />
                        <h3 className="text-lg font-bold text-text-main mb-1">No Trade Teams Joined Yet</h3>
                        <p className="text-sm text-text-muted">Tap the + button to log a sub-contractor for the day.</p>
                    </div>
                )}
            </div>

            <Fab
                onClick={() => {
                    setEditingLog({ date: new Date().toISOString().split('T')[0], headcount: 1, hoursWorked: 8 });
                    setIsSheetOpen(true);
                }}
                icon={<Plus size={24} />}
                label="Log Sub-Contractor"
            />

            <BottomSheet
                isOpen={isSheetOpen}
                onClose={() => {
                    setIsSheetOpen(false);
                    setEditingLog({});
                }}
                title={editingLog.id ? "Edit Sign-in Log" : "Log Sub-Contractor"}
            >
                <div className="space-y-5">
                    <Input
                        label="Company Name"
                        placeholder="e.g. Apex Scaffolding"
                        value={editingLog.companyName || ''}
                        onChange={(e) => setEditingLog({ ...editingLog, companyName: e.target.value })}
                        required
                    />

                    <Input
                        label="Trade / Specialty"
                        placeholder="e.g. Glass Installers, Sealant Techs"
                        value={editingLog.trade || ''}
                        onChange={(e) => setEditingLog({ ...editingLog, trade: e.target.value })}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Headcount"
                            type="number"
                            placeholder="0"
                            value={editingLog.headcount || ''}
                            onChange={(e) => setEditingLog({ ...editingLog, headcount: parseInt(e.target.value) || 0 })}
                            required
                        />
                        <Input
                            label="Hours Logged Today"
                            type="number"
                            placeholder="8"
                            value={editingLog.hoursWorked || ''}
                            onChange={(e) => setEditingLog({ ...editingLog, hoursWorked: parseInt(e.target.value) || 0 })}
                            required
                        />
                    </div>

                    <Input
                        label="Sign-in Date"
                        type="date"
                        value={editingLog.date || ''}
                        onChange={(e) => setEditingLog({ ...editingLog, date: e.target.value })}
                        required
                    />

                    <div className="flex gap-3 pt-6">
                        {editingLog.id && (
                            <Button
                                variant="danger"
                                onClick={() => handleDelete(editingLog.id as string)}
                                className="px-4"
                            >
                                <Trash2 size={24} />
                            </Button>
                        )}
                        <Button fullWidth onClick={handleSave} disabled={!editingLog.companyName || !editingLog.trade}>
                            {editingLog.id ? 'Save Changes' : 'Record Sign-in'}
                        </Button>
                    </div>
                </div>
            </BottomSheet>
        </div>
    );
};
