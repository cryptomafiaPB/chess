'use client';

import { useMe } from '@/features/auth/hook/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

// Chess piece SVG components
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

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="relative">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                {icon}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm leading-relaxed text-slate-400">{description}</p>
        </div>
    </div>
);

const TimeControlCard = ({ name, time, games }: { name: string; time: string; games: string }) => (
    <div className="group flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:border-emerald-500/50 hover:bg-white/10">
        <div className="mb-2 text-3xl font-bold text-emerald-400">{time}</div>
        <div className="text-sm font-medium text-white">{name}</div>
        <div className="mt-1 text-xs text-slate-500">{games}</div>
    </div>
);

export default function LandingPage() {
    const { data: me, isLoading } = useMe();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && me) {
            router.replace('/dashboard');
        }
    }, [isLoading, me, router]);

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
        );
    }

    // If authenticated, we're redirecting - show nothing
    if (me) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white">
            {/* Navigation */}
            <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0d0d0d]/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
                            <KnightIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold">ChessMaster</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/register"
                            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                        >
                            Play Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-16">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
                    <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
                    <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-purple-500/10 blur-[80px]" />
                </div>

                {/* Chess Board Pattern Background */}
                <div className="absolute inset-0 opacity-5">
                    <div className="h-full w-full" style={{
                        backgroundImage: `
                            linear-gradient(45deg, #fff 25%, transparent 25%),
                            linear-gradient(-45deg, #fff 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #fff 75%),
                            linear-gradient(-45deg, transparent 75%, #fff 75%)
                        `,
                        backgroundSize: '60px 60px',
                        backgroundPosition: '0 0, 0 30px, 30px -30px, -30px 0px'
                    }} />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
                    <div className="text-center">
                        {/* Badge */}
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            10,000+ players online now
                        </div>

                        {/* Headline */}
                        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                            Play Chess Online with
                            <span className="relative mt-2 block">
                                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                                    Real Players Worldwide
                                </span>
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
                            Challenge opponents in real-time, track your progress with our rating system,
                            and improve your game. Free to play, no downloads required.
                        </p>

                        {/* CTA Buttons */}
                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link
                                href="/register"
                                className="group flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/40"
                            >
                                Start Playing Now
                                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <Link
                                href="/login"
                                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
                            >
                                Sign In
                            </Link>
                        </div>

                        {/* Social Proof */}
                        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span>4.9/5 from 50k+ reviews</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>100% Free to Play</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Players from 150+ countries</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Time Controls Section */}
            <section className="relative border-t border-white/10 bg-[#111111] py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold sm:text-4xl">Choose Your Pace</h2>
                        <p className="mt-4 text-slate-400">From lightning-fast bullet to thoughtful classical games</p>
                    </div>

                    <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
                        <TimeControlCard name="Bullet" time="1 min" games="Fast & Furious" />
                        <TimeControlCard name="Blitz" time="3+2" games="Quick Thinking" />
                        <TimeControlCard name="Rapid" time="10 min" games="Balanced Play" />
                        <TimeControlCard name="Classical" time="30 min" games="Deep Analysis" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold sm:text-4xl">Everything You Need to Play & Improve</h2>
                        <p className="mt-4 text-slate-400">Powerful features to enhance your chess experience</p>
                    </div>

                    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard
                            icon={
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            }
                            title="Real-Time Matches"
                            description="Instant matchmaking with players at your skill level. No waiting, just pure chess action."
                        />
                        <FeatureCard
                            icon={
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            }
                            title="ELO Rating System"
                            description="Track your progress with our competitive rating system. Climb the leaderboards and prove your skill."
                        />
                        <FeatureCard
                            icon={
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            }
                            title="Friends & Social"
                            description="Add friends, challenge them to games, and chat during matches. Chess is better together."
                        />
                        <FeatureCard
                            icon={
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            }
                            title="Voice Chat"
                            description="Talk to your opponent during the game. Discuss moves, make friends, or engage in friendly banter."
                        />
                        <FeatureCard
                            icon={
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                            title="Multiple Time Controls"
                            description="From bullet to classical, choose the pace that suits your style. Every format, every mood."
                        />
                        <FeatureCard
                            icon={
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            }
                            title="Game Analysis"
                            description="Review your games, learn from mistakes, and understand what went wrong. Improve every day."
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative border-t border-white/10 bg-[#111111] py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-emerald-400 sm:text-5xl">1M+</div>
                            <div className="mt-2 text-sm text-slate-400">Games Played</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-emerald-400 sm:text-5xl">50K+</div>
                            <div className="mt-2 text-sm text-slate-400">Active Players</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-emerald-400 sm:text-5xl">150+</div>
                            <div className="mt-2 text-sm text-slate-400">Countries</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-emerald-400 sm:text-5xl">99.9%</div>
                            <div className="mt-2 text-sm text-slate-400">Uptime</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-20">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[100px]" />
                </div>
                <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Ready to Make Your Move?</h2>
                    <p className="mt-4 text-lg text-slate-400">
                        Join thousands of players who are already enjoying the best online chess experience.
                    </p>
                    <div className="mt-10">
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/40"
                        >
                            Create Free Account
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-[#0a0a0a] py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                                <KnightIcon className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold">ChessMaster</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                            <Link href="/about" className="hover:text-white">About</Link>
                            <Link href="/privacy" className="hover:text-white">Privacy</Link>
                            <Link href="/terms" className="hover:text-white">Terms</Link>
                            <Link href="/contact" className="hover:text-white">Contact</Link>
                        </div>
                        <div className="text-sm text-slate-600">
                            © {new Date().getFullYear()} ChessMaster. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
