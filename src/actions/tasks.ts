"use server";

import { prisma } from "@/lib/prisma";

export async function getTasks(projectId: string) {
    try {
        const tasks = await prisma.task.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, tasks };
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return { success: false, error: 'Failed to fetch tasks' };
    }
}

export async function saveTask(data: any, isNew: boolean, projectId: string) {
    try {
        if (isNew) {
            const task = await prisma.task.create({
                data: {
                    title: data.title,
                    description: data.description || '',
                    status: data.status,
                    assignee: data.assignee || 'Unassigned',
                    dueDate: data.dueDate,
                    priority: data.priority,
                    comments: data.comments || null,
                    projectId,
                }
            });
            return { success: true, task };
        } else {
            const task = await prisma.task.update({
                where: { id: data.id },
                data: {
                    title: data.title,
                    description: data.description,
                    status: data.status,
                    assignee: data.assignee,
                    dueDate: data.dueDate,
                    priority: data.priority,
                    comments: data.comments || null,
                }
            });
            return { success: true, task };
        }
    } catch (error) {
        console.error("Error saving task:", error);
        return { success: false, error: 'Failed to save task' };
    }
}

export async function deleteTask(id: string) {
    try {
        await prisma.task.delete({ where: { id } });
        return { success: true };
    } catch (error) {
        console.error("Error deleting task:", error);
        return { success: false, error: 'Failed to delete task' };
    }
}
