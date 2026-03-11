"use client";

import { signOut, useSession } from 'next-auth/react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Define the shape of our User and Settings
export type UserRole = 'site_manager' | 'factory_manager' | 'md' | 'admin' | null;

export interface User {
    id?: string;
    name: string;
    role: UserRole;
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

    // Sync user with NextAuth session
    useEffect(() => {
        if (session && session.user) {
            setUser({
                id: (session.user as any).id as string,
                name: session.user.name || '',
                role: (session.user as any).role as UserRole,
                isLoggedIn: true
            });
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
