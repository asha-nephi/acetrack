"use client";

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building2, Factory, HardHat } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'site_manager' | 'factory_manager'>('site_manager');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !email.trim() || !password.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Registration failed');
            }

            // Automatically sign in the user after successful registration
            const signInRes = await signIn('credentials', {
                redirect: false,
                email,
                password
            });

            if (signInRes?.error) {
                throw new Error('Could not sign you in automatically');
            }

            router.push('/dashboard');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl shadow-blue-900/5">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-700/30">
                        <Building2 size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-gray-500 text-sm mt-1">Join the Ace Facades OS</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-semibold animate-in fade-in zoom-in-95">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <Input
                        label="Full Name"
                        placeholder="e.g. Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
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
                        placeholder="Choose a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 pl-1">Select Role</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole('site_manager')}
                                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${role === 'site_manager' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                <HardHat size={28} className="mb-2" />
                                <span className="text-sm font-bold">Site Manager</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('factory_manager')}
                                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${role === 'factory_manager' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                <Factory size={28} className="mb-2" />
                                <span className="text-sm font-bold">Factory Head</span>
                            </button>
                        </div>
                    </div>

                    <Button fullWidth onClick={handleRegister} disabled={!name || !email || !password || loading} className="mt-4">
                        {loading ? 'Creating Account...' : 'Register & Continue'}
                    </Button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-8">
                    Already have an account? <Link href="/login" className="text-blue-600 hover:underline font-semibold">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
