import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Fab } from '@/components/ui/Fab';
import { Input } from '@/components/ui/Input';
import { ExpenseItem, Financials } from '@/types/report';
import { Plus, Receipt, Trash2, TrendingDown } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Props {
    financials: Financials;
    onChange: (financials: Financials) => void;
}

interface FormState {
    date: string;
    description: string;
    amount: string | number;
    comments: string;
}

export function FinancialsSection({ financials, onChange }: Props) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

    const [formState, setFormState] = useState<FormState>({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '', // Using string temporarily for easier input handling
        comments: ''
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const totalSpent = useMemo(() => {
        return financials.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    }, [financials.expenses]);

    const totalFundsAvailable = financials.amountCleared + financials.imprestPaid;
    const balance = totalFundsAvailable - (totalSpent + financials.amountPaidPrevWeek);
    const isOverage = balance < 0;

    const handleOpenSheet = (expense?: ExpenseItem) => {
        if (expense) {
            setEditingExpense(expense);
            setFormState({ date: expense.date, description: expense.description, amount: expense.amount.toString(), comments: expense.comments });
        } else {
            setEditingExpense(null);
            setFormState({
                date: new Date().toISOString().split('T')[0],
                description: '',
                amount: '',
                comments: ''
            });
        }
        setIsSheetOpen(true);
    };

    const handleSave = () => {
        const amountVal = parseFloat(formState.amount as any);
        if (isNaN(amountVal) || amountVal <= 0) return;

        const newExpense = {
            ...formState,
            amount: amountVal,
            id: editingExpense ? editingExpense.id : Date.now().toString()
        } as ExpenseItem;

        if (editingExpense) {
            onChange({
                ...financials,
                expenses: financials.expenses.map(e => e.id === editingExpense.id ? newExpense : e)
            });
        } else {
            onChange({
                ...financials,
                expenses: [...financials.expenses, newExpense]
            });
        }
        setIsSheetOpen(false);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange({
            ...financials,
            expenses: financials.expenses.filter(e => e.id !== id)
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="mb-2">
                <h2 className="text-2xl font-bold text-text-main pb-1">Financials & Expenses</h2>
                <p className="text-text-muted text-sm">Track weekly spending and reconcile imprest.</p>
            </div>

            {/* Summary Dashboard */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-primary-600 rounded-2xl p-4 text-white shadow-lg shadow-primary-600/20">
                    <span className="text-primary-100 text-xs font-semibold uppercase tracking-wider block mb-1">Total Spent</span>
                    <span className="text-xl font-bold">{formatCurrency(totalSpent)}</span>
                </div>
                <div className={`${isOverage ? 'bg-red-500 shadow-red-500/20' : 'bg-emerald-500 shadow-emerald-500/20'} rounded-2xl p-4 text-white shadow-lg`}>
                    <span className="text-white/80 text-xs font-semibold uppercase tracking-wider block mb-1">
                        {isOverage ? 'Overage' : 'Remaining Bal.'}
                    </span>
                    <span className="text-xl font-bold">{formatCurrency(Math.abs(balance))}</span>
                </div>
            </div>

            {/* Weekly Expenses List */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-text-main pl-1 flex items-center justify-between">
                    Itemized Expenses
                    <span className="text-sm font-normal text-text-muted bg-surface-muted px-2 py-0.5 rounded-full border border-border">
                        {financials.expenses.length} items
                    </span>
                </h3>

                {financials.expenses.length === 0 ? (
                    <div className="text-center py-10 bg-surface-muted rounded-2xl border border-dashed border-border border-2">
                        <Receipt className="mx-auto text-primary-300 mb-3" size={32} />
                        <p className="text-text-muted text-sm px-4">No expenses recorded yet. Tap the button below to add one.</p>
                    </div>
                ) : (
                    financials.expenses.map((expense) => (
                        <div
                            key={expense.id}
                            onClick={() => handleOpenSheet(expense)}
                            className="bg-surface p-4 rounded-xl border border-border shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                                    <TrendingDown size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-text-main text-sm">{expense.description}</p>
                                    <p className="text-xs text-text-muted mt-0.5">{new Date(expense.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="font-bold text-text-main">{formatCurrency(expense.amount)}</span>
                                <button
                                    onClick={(e) => handleDelete(expense.id, e)}
                                    className="text-red-400 hover:text-red-600"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Reconciliation Inputs */}
            <h3 className="text-lg font-semibold text-text-main pl-1 pt-6 border-t border-border/50">Reconciliation</h3>
            <Card className="space-y-4 bg-primary-50/30 border-primary-100">
                <Input
                    label="Amount Cleared for the Week (₦)"
                    type="number"
                    inputMode="decimal"
                    value={financials.amountCleared || ''}
                    onChange={(e) => onChange({ ...financials, amountCleared: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                />
                <Input
                    label="Amount Paid from Previous Week (₦)"
                    type="number"
                    inputMode="decimal"
                    value={financials.amountPaidPrevWeek || ''}
                    onChange={(e) => onChange({ ...financials, amountPaidPrevWeek: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                />
                <Input
                    label="Imprest Paid (₦)"
                    type="number"
                    inputMode="decimal"
                    value={financials.imprestPaid || ''}
                    onChange={(e) => onChange({ ...financials, imprestPaid: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                />
            </Card>

            <Fab icon={<Plus />} onClick={() => handleOpenSheet()} label="Add Expense" />

            <BottomSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                title={editingExpense ? "Edit Expense" : "Log Expense"}
            >
                <div className="space-y-5 pb-6">
                    <Input
                        label="Date"
                        type="date"
                        value={formState.date}
                        onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                    />

                    <Input
                        label="Description"
                        placeholder="e.g. Fuel for generator, Lunch..."
                        value={formState.description}
                        onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                        autoFocus={!editingExpense}
                    />

                    <Input
                        label="Amount (₦)"
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        className="text-lg font-bold"
                        value={formState.amount as string}
                        onChange={(e) => setFormState({ ...formState, amount: e.target.value as any })}
                    />

                    <Input
                        label="Comments / Receipt No. (Optional)"
                        value={formState.comments}
                        onChange={(e) => setFormState({ ...formState, comments: e.target.value })}
                    />

                    <Button
                        fullWidth
                        onClick={handleSave}
                        className="mt-4"
                        disabled={!formState.date || !formState.description || !formState.amount || parseFloat(formState.amount as string) <= 0}
                    >
                        Save Expense
                    </Button>
                </div>
            </BottomSheet>
        </div>
    );
}
