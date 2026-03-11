"use server";

import { prisma } from "@/lib/prisma";

export async function getHSEEntries(projectId: string) {
    try {
        const entries = await prisma.hSEEntry.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, entries };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to load HSE entries' };
    }
}

export async function createHSEEntry(data: {
    type: string;
    description: string;
    severity?: string;
    actionTaken?: string;
    reportedBy: string;
    projectId: string;
}) {
    try {
        const entry = await prisma.hSEEntry.create({ data });
        return { success: true, entry };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to create HSE entry' };
    }
}

export async function getHSEStats(projectId: string) {
    try {
        const total = await prisma.hSEEntry.count({ where: { projectId } });
        const incidents = await prisma.hSEEntry.count({ where: { projectId, type: 'Incident' } });
        const nearMisses = await prisma.hSEEntry.count({ where: { projectId, type: 'Near Miss' } });
        const toolboxTalks = await prisma.hSEEntry.count({ where: { projectId, type: 'Toolbox Talk' } });
        return { success: true, stats: { total, incidents, nearMisses, toolboxTalks } };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to load HSE stats' };
    }
}

export async function deleteHSEEntry(id: string) {
    try {
        await prisma.hSEEntry.delete({ where: { id } });
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to delete HSE entry' };
    }
}
