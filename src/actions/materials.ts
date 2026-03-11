"use server";

import { prisma } from "@/lib/prisma";

export async function getMaterialById(id: string) {
    try {
        const material = await prisma.material.findUnique({ where: { id } });
        if (!material) return { success: false, error: 'Material not found in database. Please register it first.' };
        return { success: true, material };
    } catch (error) {
        console.error("Error fetching material:", error);
        return { success: false, error: 'Database error' };
    }
}

export async function getMaterials(projectId: string) {
    try {
        const materials = await prisma.material.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, materials };
    } catch (error) {
        console.error("Error fetching materials:", error);
        return { success: false, error: 'Failed to fetch materials' };
    }
}

export async function createMaterial(data: {
    projectId: string;
    type: string;
    description: string;
    dimensions: string;
    destination: string;
    supplier?: string;
    quantity?: string;
    status?: string;
}) {
    try {
        // Generate a unique ID: ACE-[TYPE]-[TIMESTAMP]
        const typeCode = data.type.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
        const timestamp = Date.now().toString().slice(-5);
        const id = `ACE-${typeCode}-${timestamp}`;

        const material = await prisma.material.create({
            data: {
                id,
                type: data.type,
                description: data.description,
                dimensions: data.dimensions,
                destination: data.destination,
                supplier: data.supplier || null,
                quantity: data.quantity || null,
                status: data.status || 'In Transit',
                projectId: data.projectId,
            }
        });
        return { success: true, material };
    } catch (error) {
        console.error("Error creating material:", error);
        return { success: false, error: 'Failed to create material' };
    }
}

export async function updateMaterialStatus(id: string, status: string) {
    try {
        const material = await prisma.material.update({
            where: { id },
            data: { status, updatedAt: new Date() }
        });
        return { success: true, material };
    } catch (error) {
        console.error("Error updating material:", error);
        return { success: false, error: 'Failed to update status' };
    }
}

export async function deleteMaterial(id: string) {
    try {
        await prisma.material.delete({ where: { id } });
        return { success: true };
    } catch (error) {
        console.error("Error deleting material:", error);
        return { success: false, error: 'Failed to delete material' };
    }
}

export async function getRecentMaterialUpdates(projectId: string) {
    try {
        const materials = await prisma.material.findMany({
            where: { projectId },
            orderBy: { updatedAt: 'desc' },
            take: 10
        });
        return { success: true, materials };
    } catch (error) {
        console.error("Error fetching recent updates:", error);
        return { success: false, error: 'Failed to fetch recent updates' };
    }
}
