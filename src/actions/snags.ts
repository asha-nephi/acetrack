"use server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function getSnags(projectId: string) {
    try {
        const snags = await prisma.snag.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, snags };
    } catch (error) {
        console.error("Error fetching snags:", error);
        return { success: false, error: 'Failed to fetch snags' };
    }
}

export async function saveSnag(data: any, isNew: boolean, projectId: string) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        // Fallback reporter if no session
        let reporterId = userId;
        if (!reporterId) {
            const fallback = await prisma.user.findFirst();
            reporterId = fallback?.id;
        }

        if (isNew) {
            const snag = await prisma.snag.create({
                data: {
                    title: data.title,
                    description: data.description || '',
                    severity: data.severity,
                    status: data.status,
                    x: data.x,
                    y: data.y,
                    assignee: data.assignee || null,
                    projectId,
                    reporterId: reporterId!,
                }
            });
            return { success: true, snag };
        } else {
            const snag = await prisma.snag.update({
                where: { id: data.id },
                data: {
                    title: data.title,
                    description: data.description,
                    severity: data.severity,
                    status: data.status,
                    assignee: data.assignee || null,
                    resolutionNote: data.resolutionNote || null,
                }
            });
            return { success: true, snag };
        }
    } catch (error) {
        console.error("Error saving snag:", error);
        return { success: false, error: 'Failed to save snag' };
    }
}

export async function deleteSnag(id: string) {
    try {
        await prisma.snag.delete({ where: { id } });
        return { success: true };
    } catch (error) {
        console.error("Error deleting snag:", error);
        return { success: false, error: 'Failed to delete snag' };
    }
}
