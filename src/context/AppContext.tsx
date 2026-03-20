"use client";

import { signOut, useSession } from 'next-auth/react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Define the shape of our User and Settings
export type UserRole = 'supervisor' | 'factory_head' | 'executive_director' | 'md' | 'admin' | null;

export interface User {
    id?: string;
    name: string;
    role: UserRole;
    permissions?: string[];
    isLoggedIn: boolean;
}

export interface Settings {
    reportColor: string; // The primary color used in the PDF report
    avatarUrl: string;
}

interface AppContextType {
    user: User;
    settings: Settings;
    login: (name: string, role: UserRole) => void;
    logout: () => void;
    updateSettings: (newSettings: Partial<Settings>) => void;
    status: 'loading' | 'authenticated' | 'unauthenticated';
}

// Default state before someone logs in
const defaultUser: User = { name: '', role: null, isLoggedIn: false };
const defaultSettings: Settings = { reportColor: '#1d4ed8', avatarUrl: '' }; // Default Ace Facades Blue

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User>(defaultUser);
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isClient, setIsClient] = useState(false);

    // Load settings from LocalStorage
    useEffect(() => {
        setIsClient(true);
        const storedSettings = localStorage.getItem('ace_settings');
        if (storedSettings) setSettings(JSON.parse(storedSettings));
    }, []);

    // Sync user with NextAuth session AND Firestore for real-time RBAC
    useEffect(() => {
        if (session && session.user?.email) {
            // Initial set from session
            setUser({
                id: (session.user as any).id as string,
                name: session.user.name || '',
                role: (session.user as any).role as UserRole,
                permissions: (session.user as any).permissions as string[] || [],
                isLoggedIn: true
            });

            // Real-time listener on the users collection to get updated role
            const q = query(collection(db, 'users'), where('email', '==', session.user.email));
            const unsubscribe = onSnapshot(q, (snap) => {
                if (!snap.empty) {
                    const userData = snap.docs[0].data();
                    setUser(prev => ({
                        ...prev,
                        role: userData.role as UserRole,
                        permissions: userData.permissions as string[] || []
                    }));
                }
            });

            return () => unsubscribe();
        } else if (status === 'unauthenticated') {
            setUser(defaultUser);
        }
    }, [session, status]);

    const login = (name: string, role: UserRole) => {
        // Dummy local fallback just in case some part of the app calls this directly
        const newUser = { name, role, isLoggedIn: true };
        setUser(newUser);
    };

    const logout = () => {
        signOut();
    };

    const updateSettings = (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem('ace_settings', JSON.stringify(updated));
    };

    if (!isClient) return null; // Avoid hydration blank screen flashing

    return (
        <AppContext.Provider value={{ user, settings, login, logout, updateSettings, status }}>
            {children}
        </AppContext.Provider>
    );
}

// Custom hook to use the context easily
export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}
