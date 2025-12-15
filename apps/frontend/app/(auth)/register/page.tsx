// src/app/(auth)/register/page.tsx
'use client';

import { useRegister } from '@/features/auth/hook/useAuth';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const registerSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3),
    password: z.string().min(8),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { mutate, isPending } = useRegister();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { email: '', username: '', password: '' },
    });

    const onSubmit = (values: RegisterFormValues) => {
        setError(null);
        mutate(values, {
            onError: (err: any) => {
                setError(err?.message ?? 'Registration failed');
            },
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
                <h1 className="mb-4 text-2xl font-semibold">Create account</h1>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Email
                        </label>
                        <Input type="email" {...form.register('email')} />
                        {form.formState.errors.email && (
                            <p className="mt-1 text-xs text-red-500">
                                {form.formState.errors.email.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Username
                        </label>
                        <Input type="text" {...form.register('username')} />
                        {form.formState.errors.username && (
                            <p className="mt-1 text-xs text-red-500">
                                {form.formState.errors.username.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Password
                        </label>
                        <Input type="password" {...form.register('password')} />
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
                        {isPending ? 'Signing up…' : 'Sign up'}
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <a
                        href="/login"
                        className="font-medium text-primary underline"
                    >
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}
