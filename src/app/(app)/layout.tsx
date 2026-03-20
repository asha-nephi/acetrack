"use client";

import { getNotifications, markAllRead } from '@/actions/notifications';
import { useAppContext } from '@/context/AppContext';
import {
    Bell, Building2, Calendar, FileText,
    Folder,
    HardHat, Home,
    Kanban, LogOut, MapPin, Plus, ScanBarcode, Search, Settings,
    Shield,
    User as UserIcon,
    Users,
    X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface NavItem { name: string; href: string; icon: ReactNode; }
interface Notification { id: string; title: string; message: string; type: string; isRead: boolean; link?: string | null; createdAt: Date; }

export default function AppLayout({ children }: { children: ReactNode }) {
    const { user, logout, status } = useAppContext();
    const router = useRouter();
    const pathname = usePathname();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotif, setShowNotif] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status, router]);

    useEffect(() => {
        if (user.id) loadNotifications();
    }, [user.id]);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotif(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    async function loadNotifications() {
        if (!user.id) return;
        const res = await getNotifications(user.id);
        if (res.success && res.notifications) {
            setNotifications(res.notifications as unknown as Notification[]);
            setUnreadCount(res.unreadCount || 0);
        }
    }

    async function handleMarkAllRead() {
        if (!user.id) return;
        await markAllRead(user.id);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    }

    if (status === 'loading' || status === 'unauthenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
            </div>
        );
    }

    const handleLogout = () => { logout(); router.push('/login'); };

    const isAdmin = user.role === 'admin' || user.role === 'md';
    const isSiteManager = user.role === 'site_manager' || isAdmin;
    const isFactory = user.role === 'factory_manager' || isAdmin;

    const navSections = [
        {
            title: 'Operations',
            items: [
                { name: 'Dashboard', href: '/dashboard', icon: <Home size={18} /> },
                { name: 'Search', href: '/search', icon: <Search size={18} /> },
                { name: 'Daily Progress', href: '/daily-report', icon: <Plus size={18} /> },
                ...(isSiteManager ? [
                    { name: 'Task Board', href: '/tasks', icon: <Kanban size={18} /> },
                    { name: 'QA Snagging', href: '/snagging', icon: <MapPin size={18} /> },
                ] : []),
            ]
        },
        {
            title: 'Site Logs',
            items: [
                { name: 'Attendance', href: '/attendance', icon: <HardHat size={18} /> },
                { name: 'HSE Log', href: '/hse', icon: <Shield size={18} /> },
                { name: 'Shift Planner', href: '/schedule', icon: <Calendar size={18} /> },
                ...(isFactory ? [
                    { name: 'Material Scanner', href: '/scanner', icon: <ScanBarcode size={18} /> },
                ] : []),
            ]
        },
        {
            title: 'Management',
            items: [
                { name: 'Projects', href: '/projects', icon: <Building2 size={18} /> },
                { name: 'Weekly Report', href: '/report', icon: <FileText size={18} /> },
                { name: 'Documents', href: '/documents', icon: <Folder size={18} /> },
                ...(isAdmin ? [
                    { name: 'People', href: '/people', icon: <Users size={18} /> },
                ] : []),
            ]
        }
    ];

    // Mobile bottom nav: 5 most-used items
    const bottomNavItems = [
        { name: 'Home', href: '/dashboard', icon: <Home size={22} /> },
        { name: 'Search', href: '/search', icon: <Search size={22} /> },
        { name: 'Daily', href: '/daily-report', icon: <Plus size={22} /> },
        ...(isSiteManager ? [{ name: 'Tasks', href: '/tasks', icon: <Kanban size={22} /> }] : []),
        { name: 'HSE', href: '/hse', icon: <Shield size={22} /> },
    ].slice(0, 5);

    const fmtTime = (d: Date | string) => {
        const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return `${Math.floor(diff / 1440)}d ago`;
    };

    const TYPE_ICONS: Record<string, ReactNode> = {
        snag: <MapPin size={14} className="text-red-500" />,
        task: <Kanban size={14} className="text-blue-500" />,
        document: <FileText size={14} className="text-purple-500" />,
        system: <Bell size={14} className="text-gray-500" />,
    };

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-surface border-r border-border flex-col py-6 sticky top-0 h-screen overflow-y-auto">
                <div className="px-5 mb-8 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-700/30">A</div>
                    <div>
                        <h1 className="font-black text-text-main leading-tight">AceTrack OS</h1>
                        <p className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">Facade Operations</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 space-y-6">
                    {navSections.map((section) => (
                        <div key={section.title}>
                            <h3 className="px-4 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">{section.title}</h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                    return (
                                        <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all font-semibold text-sm ${isActive ? 'bg-primary-50 text-primary-700 shadow-sm shadow-primary-700/5' : 'text-text-muted hover:bg-surface-muted hover:text-text-main'}`}>
                                            {item.icon}{item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    <Link href="/settings" className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all font-semibold text-sm ${pathname === '/settings' ? 'bg-primary-50 text-primary-700' : 'text-text-muted hover:bg-surface-muted hover:text-text-main'}`}>
                        <Settings size={18} /> Settings
                    </Link>
                </nav>

                <div className="px-4 mt-4 border-t border-border pt-4">
                    <div className="flex items-center gap-3 mb-4 p-3 bg-surface-muted rounded-xl border border-border">
                        <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-text-main truncate">{user.name}</p>
                            <p className="text-xs text-text-muted capitalize">{user.role?.replace(/_/g, ' ')}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 w-full px-2 py-2 rounded-lg hover:bg-red-50 transition-colors">
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Top Bar */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center text-white font-black text-sm">A</div>
                        <span className="font-black text-text-main text-sm">AceTrack OS</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button onClick={() => setShowNotif(p => !p)} className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-muted transition-colors">
                                <Bell size={20} className="text-text-muted" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                )}
                            </button>
                            {/* Notification Dropdown */}
                            {showNotif && (
                                <div className="absolute right-0 top-12 w-80 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                        <h3 className="font-bold text-text-main text-sm">Notifications</h3>
                                        <div className="flex gap-2">
                                            {unreadCount > 0 && <button onClick={handleMarkAllRead} className="text-xs text-primary-600 font-bold hover:underline">Mark all read</button>}
                                            <button onClick={() => setShowNotif(false)} className="text-text-muted hover:text-text-main"><X size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="py-8 text-center text-text-muted text-sm">No notifications</div>
                                        ) : notifications.map(n => (
                                            <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-surface-muted transition-colors ${!n.isRead ? 'bg-primary-50/50' : ''}`}>
                                                <div className="mt-0.5 shrink-0">{TYPE_ICONS[n.type] || <Bell size={14} />}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-bold text-text-main leading-tight ${!n.isRead ? 'text-primary-900' : ''}`}>{n.title}</p>
                                                    <p className="text-xs text-text-muted truncate">{n.message}</p>
                                                    <p className="text-[10px] text-text-muted/60 mt-0.5">{fmtTime(n.createdAt)}</p>
                                                </div>
                                                {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary-600 shrink-0 mt-1" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <Link href="/settings" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-muted">
                            <UserIcon size={20} className="text-text-muted" />
                        </Link>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 w-full pb-20 md:pb-0 overflow-x-hidden">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-border">
                <div className="flex justify-around items-center h-16 px-2">
                    {bottomNavItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${isActive ? 'text-primary-700' : 'text-text-muted'}`}>
                                {item.icon}
                                <span className={`text-[9px] font-bold transition-all ${isActive ? 'opacity-100' : 'opacity-0'}`}>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
            <PWAInstallPrompt />
        </div>
    );
}
