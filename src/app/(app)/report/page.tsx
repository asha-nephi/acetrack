"use client";

import { generatePDFReport } from '@/components/PDFReportGenerator';
import { HSESection } from '@/components/sections/HSESection';
import { MaterialsSection } from '@/components/sections/MaterialsSection';
import { ProjectDetailsSection } from '@/components/sections/ProjectDetailsSection';
import { RemarksAndImagesSection } from '@/components/sections/RemarksAndImagesSection';
import { SubcontractorLogSection } from '@/components/sections/SubcontractorLogSection';
import { TaskProgressSection } from '@/components/sections/TaskProgressSection';
import { UpcomingWorkSection } from '@/components/sections/UpcomingWorkSection';
import { useAppContext } from '@/context/AppContext';
import { initialReportData, ReportData } from '@/types/report';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Camera, ChevronLeft, ChevronRight, Download, FileText, ListTodo, Loader2, PackageCheck, ShieldAlert, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ReportBuilderPage() {
    const { settings } = useAppContext();
    const [data, setData] = useState<ReportData>(initialReportData);
    const [currentStep, setCurrentStep] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved report data on mount
    useEffect(() => {
        const savedData = localStorage.getItem('ace_report_draft');
        if (savedData) {
            try {
                setData(JSON.parse(savedData));
            } catch (e) {
                console.error("Failed to parse saved report data");
            }
        }
        setIsLoaded(true);
    }, []);

    // Save report data whenever it changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('ace_report_draft', JSON.stringify(data));
        }
    }, [data, isLoaded]);

    const steps = [
        { title: 'Project', icon: <FileText size={18} /> },
        { title: 'Tasks', icon: <ListTodo size={18} /> },
        { title: 'Teams', icon: <Users size={18} /> },
        { title: 'Plans', icon: <Calendar size={18} /> },
        { title: 'Safety', icon: <ShieldAlert size={18} /> },
        { title: 'Materials', icon: <PackageCheck size={18} /> },
        { title: 'Finalize', icon: <Camera size={18} /> },
    ];

    const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        const success = await generatePDFReport(data, settings.reportColor);
        setIsGenerating(false);
        if (success) {
            alert("Report generated successfully!");
        } else {
            alert("Failed to generate report. Please try again.");
        }
    };

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <ProjectDetailsSection
                        data={data.projectDetails}
                        onChange={(details) => setData({ ...data, projectDetails: { ...data.projectDetails, ...details } })}
                    />
                );
            case 1:
                return (
                    <TaskProgressSection
                        overallStatus={data.overallStatus}
                        tasks={data.tasks}
                        onChangeStatus={(status) => setData({ ...data, overallStatus: status })}
                        onChangeTasks={(tasks) => setData({ ...data, tasks })}
                    />
                );
            case 2:
                return (
                    <SubcontractorLogSection
                        subcontractors={data.subcontractors}
                        onChange={(subcontractors) => setData({ ...data, subcontractors })}
                    />
                );
            case 3:
                return (
                    <UpcomingWorkSection
                        upcomingWork={data.upcomingWork}
                        onChange={(upcomingWork) => setData({ ...data, upcomingWork })}
                    />
                );
            case 4:
                return (
                    <HSESection
                        hse={data.hse}
                        onChange={(hse) => setData({ ...data, hse })}
                    />
                );
            case 5:
                return (
                    <MaterialsSection
                        materials={data.materials}
                        onChange={(materials) => setData({ ...data, materials })}
                    />
                );
            case 6:
                return (
                    <RemarksAndImagesSection
                        remarks={data.remarks}
                        preparerName={data.preparerName}
                        preparerTitle={data.preparerTitle}
                        signDate={data.signDate}
                        images={data.images}
                        onChange={(diffs) => setData({ ...data, ...diffs })}
                    />
                );
            default:
                return null;
        }
    };


    if (!isLoaded) return null; // Prevent hydration mismatch

    return (
        <div className="flex flex-col font-sans h-full">

            {/* Top Navigation Bar Component */}
            <nav className="sticky top-0 z-40 bg-surface border-b border-border shadow-sm px-4 pt-4 pb-3">
                <div className="flex justify-between items-center h-14 max-w-2xl mx-auto w-full">
                    <div>
                        <h1 className="font-bold tracking-tight text-text-main leading-tight text-lg">Weekly Log</h1>
                        <p className="text-[10px] text-primary-600 font-semibold uppercase tracking-wider">Step {currentStep + 1} of {steps.length}</p>
                    </div>

                    {/* Step Indicators */}
                    <div className="flex items-center gap-1.5">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-primary-600' : 'w-2 bg-border'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-6 pb-24 overflow-x-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderCurrentStep()}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Persistent Bottom Control Bar */}
            <div className="fixed bottom-0 md:left-64 inset-x-0 z-40 bg-surface border-t border-border p-4 pb-safe-bottom">
                <div className="max-w-2xl mx-auto flex justify-between gap-4">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className={`flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center transition-all ${currentStep === 0
                            ? 'bg-surface-muted text-text-muted opacity-50 cursor-not-allowed'
                            : 'bg-surface-muted border border-border text-text-main hover:bg-gray-100 active:scale-[0.98]'
                            }`}
                    >
                        <ChevronLeft size={20} className="mr-1" />
                        Back
                    </button>

                    {currentStep < steps.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="flex-[2] py-3.5 rounded-xl font-bold flex items-center justify-center bg-primary-600 text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 active:scale-[0.98] transition-all"
                        >
                            Next Step
                            <ChevronRight size={20} className="ml-1" />
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerateReport}
                            disabled={isGenerating || !data.projectDetails.projectName}
                            className="flex-[2] py-3.5 rounded-xl font-bold flex items-center justify-center bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={20} className="mr-2 animate-spin" />
                                    Rendering...
                                </>
                            ) : (
                                <div className="flex flex-col items-center leading-none">
                                    <span className="flex items-center"><Download size={18} className="mr-1" /> Generate</span>
                                    {!data.projectDetails.projectName && <span className="text-[10px] font-normal opacity-90 mt-1">Project Name Required</span>}
                                </div>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
