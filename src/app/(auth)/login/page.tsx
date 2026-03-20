"use client";

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successAnim, setSuccessAnim] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Please enter your email and password');
            return;
        }

        setLoading(true);

        const res = await signIn('credentials', {
            redirect: false,
            email,
            password
        });

        if (res?.error) {
            setError('Invalid email or password');
            setLoading(false);
        } else {
            setSuccessAnim(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 1200); // 1.2s delay for the animation to play
        }
    };

    if (successAnim) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-primary-600 px-4 animate-in fade-in duration-500 Zoom-in transition-all">
                <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center text-primary-600 mb-6 shadow-2xl animate-bounce">
                    <Building2 size={40} />
                </div>
                <h2 className="text-white text-2xl font-black mb-2 animate-pulse">Welcome back</h2>
                <p className="text-primary-100/80 text-sm font-medium">Preparing your workspace...</p>
                <div className="mt-8 flex gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full bg-surface p-8 rounded-2xl shadow-xl border border-border">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary-600/30">
                        <Building2 size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-text-main">AceTrack OS</h1>
                    <p className="text-text-muted text-sm mt-1">Facade Project Operating System</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-semibold animate-in fade-in zoom-in-95">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="e.g. j.doe@acefacades.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button fullWidth onClick={(e: any) => handleLogin(e)} disabled={!email || !password || loading}>
                        {loading && !successAnim ? 'Authenticating...' : 'Sign In'}
                    </Button>
                </form>

                <p className="text-center text-sm text-text-muted mt-8">
                    Don't have an account? <Link href="/register" className="text-primary-600 hover:underline font-semibold">Register here</Link>
                </p>
            </div>
        </div>
    );
}
