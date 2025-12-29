'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page redirects authenticated users to /dashboard
// The landing page (app/page.tsx) handles unauthenticated users
export default function DashboardIndexRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard');
    }, [router]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
    );
}
