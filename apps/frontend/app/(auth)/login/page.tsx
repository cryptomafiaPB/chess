'use client';

import { useLogin } from '@/features/auth/hook/useAuth';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

type LoginFormValues = z.infer<typeof loginSchema>;

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
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
                <h1 className="mb-4 text-2xl font-semibold">Sign in</h1>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Email
                        </label>
                        <Input
                            type="email"
                            {...form.register('email')}
                            autoComplete="email"
                        />
                        {form.formState.errors.email && (
                            <p className="mt-1 text-xs text-red-500">
                                {form.formState.errors.email.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Password
                        </label>
                        <Input
                            type="password"
                            {...form.register('password')}
                            autoComplete="current-password"
                        />
                        {form.formState.errors.password && (
                            <p className="mt-1 text-xs text-red-500">
                                {form.formState.errors.password.message}
                            </p>
                        )}
                    </div>

                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isPending}
                    >
                        {isPending ? 'Signing in...' : 'Sign in'}
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <a
                        href="/register"
                        className="font-medium text-primary underline"
                    >
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}
