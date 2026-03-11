"use server";

import { prisma } from "@/lib/prisma";

export async function getDocuments(projectId: string) {
    try {
        const documents = await prisma.document.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, documents };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to load documents' };
    }
}

export async function createDocument(data: {
    title: string;
    category: string;
    rev: string;
    status: string;
    date: string;
    size?: string;
    url?: string;
    projectId: string;
}) {
    try {
        const document = await prisma.document.create({ data });
        return { success: true, document };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to register document' };
    }
}

export async function updateDocument(id: string, data: {
    title?: string;
    category?: string;
    rev?: string;
    status?: string;
    date?: string;
}) {
    try {
        const document = await prisma.document.update({ where: { id }, data });
        return { success: true, document };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to update document' };
    }
}

export async function deleteDocument(id: string) {
    try {
        await prisma.document.delete({ where: { id } });
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to delete document' };
    }
}
