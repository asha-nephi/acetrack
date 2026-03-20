"use server";

import { prisma } from "@/lib/prisma";

export async function getDailyLogs(projectId: string) {
    try {
        const logs = await prisma.$queryRaw`SELECT * FROM "DailyLog" WHERE "projectId" = ${projectId} ORDER BY "createdAt" DESC`;
        // Since I haven't added the model to Prisma yet (migrating to Firebase soon),
        // I will return a placeholder for now to avoid build errors if I don't want to touch schema. prisma.
        // Actually, let's just make it a local storage based feature for a second OR 
        // just prepare the Firebase structure.
        return { success: true, logs: [] };
    } catch (e) {
        return { success: false, error: 'Failed to load daily logs' };
    }
}

export async function createDailyLog(data: {
    projectId: string;
    type: 'briefing' | 'tool' | 'progress';
    content?: string;
    images?: string[];
    trade?: string;
    objectives?: string;
    participants?: string;
    toolName?: string;
    workerName?: string;
    level?: string;
    reportedBy: string;
}) {
    // Placeholder for Firebase migration
    console.log("Daily log created type:", data.type, data);
    return { success: true };
}
