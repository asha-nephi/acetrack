import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AlertCircle, Camera, Image as ImageIcon, X } from 'lucide-react';
import { useRef } from 'react';

interface Props {
    remarks: string;
    preparerName: string;
    preparerTitle: string;
    signDate: string;
    images: { id: string; url: string; caption: string }[];
    onChange: (data: Partial<{ remarks: string; preparerName: string; preparerTitle: string; signDate: string; images: { id: string; url: string; caption: string }[] }>) => void;
}

export function RemarksAndImagesSection({ remarks, preparerName, preparerTitle, signDate, images, onChange }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Simulate reading files and creating object URLs for preview
        // In a real app we might compress these or upload to a server
        const newImages = Array.from(files).map((file) => ({
            id: Date.now().toString() + Math.random().toString(),
            url: URL.createObjectURL(file),
            caption: ''
        }));

        onChange({ images: [...images, ...newImages] });

        // reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const updateCaption = (id: string, caption: string) => {
        onChange({
            images: images.map(img => img.id === id ? { ...img, caption } : img)
        });
    };

    const removeImage = (id: string) => {
        // Revoke object URL to prevent memory leaks
        const imgToRemove = images.find(img => img.id === id);
        if (imgToRemove) URL.revokeObjectURL(imgToRemove.url);

        onChange({ images: images.filter(img => img.id !== id) });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="mb-2">
                <h2 className="text-2xl font-bold text-text-main pb-1">Final Remarks & Evidence</h2>
                <p className="text-text-muted text-sm">Add closing notes, progress pictures, and sign-off.</p>
            </div>

            <Card title="Additional Remarks / Required Actions">
                <textarea
                    value={remarks}
                    onChange={(e) => onChange({ remarks: e.target.value })}
                    placeholder="Any urgent needs, safety concerns, or miscellaneous notes?"
                    className="w-full bg-surface-muted border border-border rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px] resize-none"
                />
            </Card>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text-main pl-1">Progress Pictures</h3>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Primary action to open camera or gallery */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="col-span-2 py-4 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary-300 rounded-2xl bg-primary-50/50 hover:bg-primary-50 transition-colors text-primary-600"
                    >
                        <div className="flex gap-4">
                            <Camera size={28} />
                            <ImageIcon size={28} />
                        </div>
                        <span className="font-semibold text-sm">Tap to Add Photos</span>
                        <span className="text-xs text-primary-600/70">From Camera or Gallery</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                    />
                </div>

                {images.length > 0 && (
                    <div className="space-y-4">
                        {images.map((img) => (
                            <div key={img.id} className="relative bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
                                <button
                                    onClick={() => removeImage(img.id)}
                                    className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors backdrop-blur-sm"
                                >
                                    <X size={16} />
                                </button>
                                <img src={img.url} alt="Progress" className="w-full h-48 object-cover bg-surface-muted" />
                                <div className="p-3">
                                    <Input
                                        label="Image Caption"
                                        placeholder="e.g. Installing structural steel on NW corner"
                                        value={img.caption}
                                        onChange={(e) => updateCaption(img.id, e.target.value)}
                                        className="!bg-transparent"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-6 border-t border-border mt-8">
                <h3 className="text-lg font-semibold text-text-main pl-1 mb-4 flex items-center gap-2">
                    Sign-off
                    <AlertCircle size={16} className="text-amber-500" />
                </h3>
                <Card className="space-y-4 bg-amber-50/30 border-amber-200">
                    <Input
                        label="Preparer First & Last Name"
                        value={preparerName}
                        onChange={(e) => onChange({ preparerName: e.target.value })}
                        placeholder="Your Name"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Title/Role"
                            value={preparerTitle}
                            onChange={(e) => onChange({ preparerTitle: e.target.value })}
                            placeholder="e.g. Site Supervisor"
                        />
                        <Input
                            label="Date"
                            type="date"
                            value={signDate}
                            onChange={(e) => onChange({ signDate: e.target.value })}
                        />
                    </div>
                </Card>
            </div>

        </div>
    );
}
