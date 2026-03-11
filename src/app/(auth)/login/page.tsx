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
            router.push('/dashboard');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl shadow-blue-900/5">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-700/30">
                        <Building2 size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">AceTrack OS</h1>
                    <p className="text-gray-500 text-sm mt-1">Facade Project Operating System</p>
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
                    <Button fullWidth onClick={handleLogin} disabled={!email || !password || loading}>
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </Button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-8">
                    Don't have an account? <Link href="/register" className="text-blue-600 hover:underline font-semibold">Register here</Link>
                </p>
            </div>
        </div>
    );
}
