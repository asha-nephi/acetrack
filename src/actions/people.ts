"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true }
        });
        return { success: true, users };
    } catch (error) {
        console.error("Error fetching users:", error);
        return { success: false, error: 'Failed to fetch users' };
    }
}

export async function createUser(data: { name: string; email: string; password: string; role: string; phone?: string }) {
    try {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) return { success: false, error: 'A user with this email already exists.' };

        const hashed = await bcrypt.hash(data.password, 12);
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashed,
                role: data.role as any,
                phone: data.phone || null,
                isActive: true,
            }
        });
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    } catch (error) {
        console.error("Error creating user:", error);
        return { success: false, error: 'Failed to create user' };
    }
}

export async function updateUserRole(userId: string, role: string) {
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { role: role as any }
        });
        return { success: true, user };
    } catch (error) {
        console.error("Error updating role:", error);
        return { success: false, error: 'Failed to update role' };
    }
}

export async function deactivateUser(userId: string) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: false }
        });
        return { success: true };
    } catch (error) {
        console.error("Error deactivating user:", error);
        return { success: false, error: 'Failed to deactivate user' };
    }
}

export async function reactivateUser(userId: string) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: true }
        });
        return { success: true };
    } catch (error) {
        console.error("Error reactivating user:", error);
        return { success: false, error: 'Failed to reactivate user' };
    }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { success: false, error: 'User not found' };

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) return { success: false, error: 'Current password is incorrect' };

        const hashed = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
        return { success: true };
    } catch (error) {
        console.error("Error changing password:", error);
        return { success: false, error: 'Failed to change password' };
    }
}

export async function updateProfile(userId: string, data: { phone?: string }) {
    try {
        await prisma.user.update({ where: { id: userId }, data });
        return { success: true };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: 'Failed to update profile' };
    }
}
