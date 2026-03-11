export interface ProjectDetails {
    projectName: string;
    projectCode: string;
    weekUnderReview: string;
    siteManagerName: string;
    date: string;
    weatherCondition: string;
}

export interface ExpenseItem {
    id: string;
    date: string;
    description: string;
    amount: number;
    comments: string;
}

export interface Financials {
    amountCleared: number;
    amountPaidPrevWeek: number;
    imprestPaid: number;
    expenses: ExpenseItem[];
}

export interface TaskItem {
    id: string;
    location: string;
    description: string;
    percentageDone: number;
    comments: string;
}

export interface UpcomingWork {
    id: string;
    date: string;
    description: string;
    laborRequired: number;
    comments: string;
}

export interface HSEItem {
    id: string;
    type: 'Toolbox Talk' | 'Incident' | 'Near Miss' | 'PPE Check';
    description: string;
    actionTaken: string;
    date: string;
}

export interface MaterialItem {
    id: string;
    materialName: string;
    quantity: string;
    supplier: string;
    condition: 'Good' | 'Damaged' | 'Incomplete';
    dateReceived: string;
}

export interface SubcontractorItem {
    id: string;
    companyName: string;
    trade: string;
    headcount: number;
    hoursWorked: number;
    date: string;
}

export interface ReportData {
    projectDetails: ProjectDetails;
    overallStatus: string;
    tasks: TaskItem[];
    subcontractors: SubcontractorItem[];
    upcomingWork: UpcomingWork[];
    hse: HSEItem[];
    materials: MaterialItem[];
    remarks: string;
    preparerName: string;
    preparerTitle: string;
    signDate: string;
    images: { id: string; url: string; caption: string }[];
}

// Minimal initial state — all arrays are empty; fields auto-fill from session/date
export const initialReportData: ReportData = {
    projectDetails: {
        projectName: '',
        projectCode: '',
        weekUnderReview: '',
        siteManagerName: '',
        date: new Date().toISOString().split('T')[0],
        weatherCondition: '',
    },
    overallStatus: '',
    tasks: [],
    subcontractors: [],
    upcomingWork: [],
    hse: [],
    materials: [],
    remarks: '',
    preparerName: '',
    preparerTitle: '',
    signDate: new Date().toISOString().split('T')[0],
    images: [],
};
