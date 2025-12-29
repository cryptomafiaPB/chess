'use client';

import { useLogin } from '@/features/auth/hook/useAuth';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Knight Icon for branding
const KnightIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 45 45" fill="currentColor">
        <g fillRule="evenodd" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
            <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" />
            <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" />
            <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" />
        </g>
    </svg>
);

export default function LoginPage() {
    const { mutate, isPending } = useLogin();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = (values: LoginFormValues) => {
        setError(null);
        mutate(values, {
            onError: (err: any) => {
                setError(err?.message ?? 'Login failed');
            },
        });
    };

    return (
        <div className="flex min-h-screen bg-[#0d0d0d]">
            {/* Left Side - Branding */}
            <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-emerald-600 to-emerald-800 p-12 lg:flex">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                        <KnightIcon className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white">ChessMaster</span>
                </Link>

                <div>
                    <h2 className="mb-4 text-4xl font-bold text-white">
                        Welcome back, Champion
                    </h2>
                    <p className="text-lg text-emerald-100">
                        Your next victory awaits. Sign in to continue your chess journey.
                    </p>
                </div>

                <div className="flex items-center gap-6 text-sm text-emerald-100">
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Instant matchmaking
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Rated games
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 lg:px-16">
                <div className="mx-auto w-full max-w-md">
                    {/* Mobile Logo */}
                    <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
                            <KnightIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">ChessMaster</span>
                    </Link>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white sm:text-3xl">Sign in to your account</h1>
                        <p className="mt-2 text-slate-400">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="font-medium text-emerald-400 hover:text-emerald-300">
                                Sign up for free
                            </Link>
                        </p>
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Email address
                            </label>
                            <Input
                                type="email"
                                {...form.register('email')}
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                            />
                            {form.formState.errors.email && (
                                <p className="mt-1.5 text-sm text-red-400">
                                    {form.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label className="block text-sm font-medium text-slate-300">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                type="password"
                                {...form.register('password')}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                            />
                            {form.formState.errors.password && (
                                <p className="mt-1.5 text-sm text-red-400">
                                    {form.formState.errors.password.message}
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-12 w-full bg-emerald-500 text-base font-semibold text-white hover:bg-emerald-600"
                        >
                            {isPending ? (
                                <>
                                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </Button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-[#0d0d0d] px-4 text-slate-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google
                            </button>
                            <button
                                type="button"
                                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                GitHub
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
