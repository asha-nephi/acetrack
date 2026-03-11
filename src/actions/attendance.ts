"use server";

import { prisma } from "@/lib/prisma";

export async function getAttendanceToday(projectId: string) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const logs = await prisma.attendanceLog.findMany({
            where: { projectId, date: { gte: today, lt: tomorrow } },
            orderBy: { timeIn: 'desc' }
        });
        return { success: true, logs };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to load attendance' };
    }
}

export async function signIn(data: {
    workerName: string;
    company?: string;
    role: string;
    projectId: string;
    notes?: string;
}) {
    try {
        const log = await prisma.attendanceLog.create({ data });
        return { success: true, log };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to sign in worker' };
    }
}

export async function signOut(logId: string) {
    try {
        const log = await prisma.attendanceLog.update({
            where: { id: logId },
            data: { timeOut: new Date() }
        });
        return { success: true, log };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to sign out worker' };
    }
}

export async function getAttendanceByDate(projectId: string, date: string) {
    try {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const logs = await prisma.attendanceLog.findMany({
            where: { projectId, date: { gte: start, lte: end } },
            orderBy: { timeIn: 'asc' }
        });
        return { success: true, logs };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to load attendance' };
    }
}
