"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
    try {
        const [
            activeProjects,
            totalSnags,
            openSnags,
            totalTasks,
            doneTasks,
            hseThisMonth,
            recentSnags,
            recentTasks,
            recentHSE,
        ] = await Promise.all([
            prisma.project.findMany({
                where: { status: 'active' },
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, client: true, location: true, progressPct: true, _count: { select: { tasks: true, snags: true } } }
            }),
            prisma.snag.count(),
            prisma.snag.count({ where: { status: 'open' } }),
            prisma.task.count(),
            prisma.task.count({ where: { status: 'done' } }),
            prisma.hSEEntry.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }
            }),
            prisma.snag.findMany({
                orderBy: { createdAt: 'desc' }, take: 4,
                select: { id: true, title: true, severity: true, status: true, createdAt: true, project: { select: { name: true } } }
            }),
            prisma.task.findMany({
                orderBy: { createdAt: 'desc' }, take: 4,
                select: { id: true, title: true, status: true, assignee: true, priority: true, createdAt: true, project: { select: { name: true } } }
            }),
            prisma.hSEEntry.findMany({
                orderBy: { createdAt: 'desc' }, take: 3,
                select: { id: true, type: true, description: true, severity: true, createdAt: true }
            }),
        ]);

        return {
            success: true,
            stats: { activeProjects: activeProjects.length, openSnags, totalTasks, doneTasks, hseThisMonth },
            projects: activeProjects,
            recentActivity: [
                ...recentSnags.map(s => ({ id: s.id, type: 'snag' as const, title: s.title, subtitle: s.project.name, meta: s.severity, status: s.status, date: s.createdAt })),
                ...recentTasks.map(t => ({ id: t.id, type: 'task' as const, title: t.title, subtitle: t.project.name, meta: t.priority, status: t.status, date: t.createdAt })),
                ...recentHSE.map(h => ({ id: h.id, type: 'hse' as const, title: h.description.slice(0, 50), subtitle: h.type, meta: h.severity || '', status: 'logged', date: h.createdAt })),
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8),
        };
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return { success: false, error: 'Failed to load dashboard stats', stats: null, projects: [], recentActivity: [] };
    }
}
