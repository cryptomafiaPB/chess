'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { setAccessToken } from '@/lib/auth-token';
import { disconnectSocket } from '@/lib/socket-client';
import { cn } from '@/lib/utils';

type DashboardShellProps = {
    user: any;
    children: ReactNode;
};

const NAV_ITEMS = [
    { href: '/play', label: 'Play' },
    { href: '/friends', label: 'Friends' },
    { href: '/profile', label: 'Profile' },
    { href: '/history', label: 'History' },
];

export function DashboardShell({ user, children }: DashboardShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const queryClient = useQueryClient();

    const logoutMutation = useMutation({
        mutationFn: () => apiClient.post('/api/v1/auth/logout'),
        onSuccess: () => {
            // Clear auth token
            setAccessToken(null);
            // Disconnect socket
            disconnectSocket();
            // Clear queries
            queryClient.removeQueries({ queryKey: ['auth', 'me'] });
            queryClient.clear();
            router.replace('/login');
        },
    });

    return (
        <div className="flex min-h-screen flex-col">
            <header className="flex h-12 items-center justify-between border-b bg-card px-4">
                <div className="flex items-center gap-4">
                    <Link href="/play" className="text-sm font-semibold">
                        Chess SaaS
                    </Link>
                    <nav className="hidden gap-3 text-sm md:flex">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'text-muted-foreground hover:text-foreground',
                                    pathname === item.href && 'font-medium text-foreground'
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden text-sm text-muted-foreground md:inline">
                        {user?.username ?? user?.email}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => logoutMutation.mutate()}
                    >
                        Logout
                    </Button>
                </div>
            </header>

            <main className="flex flex-1 flex-col bg-background">
                {children}
            </main>
        </div>
    );
}
