// src/app/(dashboard)/layout.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/features/auth/hook/useAuth';
import { useTokenRefresh } from '@/features/auth/hook/useTokenRefresh';
import { clearAllTokens } from '@/lib/auth-token';
import { disconnectSocket } from '@/lib/socket-client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/features/dm/hooks/useDM';
import { ChallengeNotifications } from '@/components/shared/ChallengeNotifications';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/play', label: 'Play', icon: 'play' },
    { href: '/friends', label: 'Friends', icon: 'users' },
    { href: '/messages', label: 'Messages', icon: 'messages' },
    { href: '/leaderboard', label: 'Leaderboard', icon: 'trophy' },
    { href: '/history', label: 'History', icon: 'clock' },
];

const NavIcon = ({ type, className }: { type: string; className?: string }) => {
    const iconClass = cn("h-5 w-5", className);
    switch (type) {
        case 'home':
            return (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
            );
        case 'play':
            return (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
            );
        case 'users':
            return (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
            );
        case 'trophy':
            return (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
                </svg>
            );
        case 'clock':
            return (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            );
        case 'messages':
            return (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
            );
        case 'settings':
            return (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            );
        case 'logout':
            return (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
            );
        case 'menu':
            return (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            );
        case 'close':
            return (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            );
        default:
            return null;
    }
};

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

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const queryClient = useQueryClient();
    const { data: me, isLoading, isError } = useMe();
    const { data: unreadCount = 0 } = useUnreadCount();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Proactively refresh tokens before they expire
    useTokenRefresh();

    const logoutMutation = useMutation({
        mutationFn: () => apiClient.post('/api/v1/auth/logout'),
        onSuccess: () => {
            // Clear all tokens (access + refresh)
            clearAllTokens();
            // Disconnect socket
            disconnectSocket();
            // Clear queries
            queryClient.removeQueries({ queryKey: ['auth', 'me'] });
            queryClient.clear();
            router.replace('/login');
        },
    });

    useEffect(() => {
        // Only redirect if we're done loading and there's definitely no user
        // isError will be true if: session check found no tokens OR query actually failed
        if (!isLoading && isError) {
            console.log('[DashboardLayout] Redirecting to login - no valid session');
            router.replace('/login');
        }
    }, [isLoading, isError, router]);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <KnightIcon className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Loading ChessMaster...</p>
                </div>
            </div>
        );
    }

    if (!me) {
        // Still show loading while redirect happens
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <KnightIcon className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Loading ChessMaster...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-400 shadow-lg shadow-primary/25">
                            <KnightIcon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="hidden sm:block">
                            <span className="text-lg font-bold tracking-tight">ChessMaster</span>
                            <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Beta</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center gap-1 md:flex" role="navigation" aria-label="Main navigation">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    )}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <NavIcon type={item.icon} />
                                    <span>{item.label}</span>
                                    {item.href === '/messages' && unreadCount > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground shadow-lg">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Menu */}
                    <div className="flex items-center gap-3">
                        {/* Profile Link */}
                        <Link
                            href="/profile/me"
                            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-muted"
                        >
                            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-primary to-emerald-400 ring-2 ring-primary/20">
                                {me?.avatar_url ? (
                                    <img src={me.avatar_url} alt={me.username} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary-foreground">
                                        {me?.username?.charAt(0).toUpperCase() ?? '?'}
                                    </div>
                                )}
                            </div>
                            <span className="hidden font-medium lg:inline">
                                {me?.username ?? me?.email}
                            </span>
                        </Link>

                        {/* Logout Button - Desktop */}
                        <button
                            onClick={() => logoutMutation.mutate()}
                            disabled={logoutMutation.isPending}
                            className="hidden items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground md:flex"
                            aria-label="Sign out"
                        >
                            <NavIcon type="logout" className="h-4 w-4" />
                            <span>{logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}</span>
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
                            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={mobileMenuOpen}
                        >
                            <NavIcon type={mobileMenuOpen ? 'close' : 'menu'} />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="border-t border-border bg-card/95 backdrop-blur-xl md:hidden animate-fade-in">
                        <nav className="mx-auto max-w-7xl px-4 py-4" role="navigation" aria-label="Mobile navigation">
                            <div className="grid gap-1">
                                {NAV_ITEMS.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                'relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                                                isActive
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            )}
                                            aria-current={isActive ? 'page' : undefined}
                                        >
                                            <NavIcon type={item.icon} />
                                            <span>{item.label}</span>
                                            {item.href === '/messages' && unreadCount > 0 && (
                                                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                                <hr className="my-2 border-border" />
                                <button
                                    onClick={() => logoutMutation.mutate()}
                                    disabled={logoutMutation.isPending}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/10"
                                >
                                    <NavIcon type="logout" />
                                    <span>{logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}</span>
                                </button>
                            </div>
                        </nav>
                    </div>
                )}
            </header>

            {/* Challenge Notifications - Global across all dashboard pages */}
            <ChallengeNotifications />

            {/* Main Content */}
            <main id="main-content" className="flex-1" tabIndex={-1}>
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-xl pb-safe md:hidden" role="navigation" aria-label="Mobile bottom navigation">
                <div className="mx-auto flex max-w-md items-center justify-around py-2">
                    {NAV_ITEMS.slice(0, 5).map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs transition-all duration-200',
                                    isActive
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <NavIcon type={item.icon} className={cn(isActive && 'scale-110')} />
                                <span className="font-medium">{item.label}</span>
                                {item.href === '/messages' && unreadCount > 0 && (
                                    <span className="absolute right-1.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                                {isActive && (
                                    <span className="absolute -top-1 h-1 w-1 rounded-full bg-primary" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom padding for mobile nav */}
            <div className="h-20 md:hidden" />
        </div>
    );
}
