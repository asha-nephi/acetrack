"use server";

import { prisma } from "@/lib/prisma";

export async function getProjects() {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { tasks: true, snags: { where: { status: 'open' } } } }
            }
        });
        return { success: true, projects };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to load projects' };
    }
}

export async function getActiveProjects() {
    try {
        const projects = await prisma.project.findMany({
            where: { status: 'active' },
            orderBy: { name: 'asc' }
        });
        return { success: true, projects };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to load projects' };
    }
}

export async function createProject(data: {
    name: string;
    client?: string;
    location: string;
    description?: string;
    startDate?: string;
    endDate?: string;
}) {
    try {
        const project = await prisma.project.create({ data });
        return { success: true, project };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to create project' };
    }
}

export async function updateProject(id: string, data: {
    name?: string;
    client?: string;
    location?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    progressPct?: number;
}) {
    try {
        const project = await prisma.project.update({ where: { id }, data });
        return { success: true, project };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to update project' };
    }
}

export async function deleteProject(id: string) {
    try {
        await prisma.project.delete({ where: { id } });
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to delete project' };
    }
}

export async function getProjectById(id: string) {
    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                _count: { select: { tasks: true, snags: true, documents: true, materials: true } }
            }
        });
        return { success: true, project };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to load project' };
    }
}
