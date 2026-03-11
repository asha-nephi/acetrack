"use server";

import { prisma } from "@/lib/prisma";

export async function getNotifications(userId: string) {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });
        return { success: true, notifications, unreadCount };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to load notifications' };
    }
}

export async function markNotificationRead(id: string) {
    try {
        await prisma.notification.update({ where: { id }, data: { isRead: true } });
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to mark as read' };
    }
}

export async function markAllRead(userId: string) {
    try {
        await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to mark all as read' };
    }
}

export async function createNotification(data: {
    title: string;
    message: string;
    type: string;
    link?: string;
    userId: string;
}) {
    try {
        const notification = await prisma.notification.create({ data });
        return { success: true, notification };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to create notification' };
    }
}
