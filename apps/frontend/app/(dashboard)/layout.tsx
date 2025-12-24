// src/app/(dashboard)/layout.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useMe } from '@/features/auth/hook/useAuth';

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const router = useRouter();
    const { data: me, isLoading, isError } = useMe();

    useEffect(() => {
        if (!isLoading && (isError || !me)) {
            router.replace('/login');
        }
    }, [isLoading, isError, me, router]);

    if (isLoading || (!me && !isError)) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading…</p>
                <p>{me?.name}</p>
            </div>
        );
    }

    if (!me) {
        // Redirect in effect; render nothing
        return null;
    }

    return <DashboardShell user={me}>{children}</DashboardShell>;
}
