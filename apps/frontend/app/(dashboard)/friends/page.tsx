'use client';

import { useState, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    useFriends,
    usePendingRequests,
    useSentRequests,
    useBlockedUsers,
    useAcceptFriendRequest,
    useRejectFriendRequest,
    useCancelFriendRequest,
    useRemoveFriend,
    useUnblockUser,
    useSendFriendRequest,
} from '@/features/friends/hooks/useFriends';
import { useSearchUsers } from '@/features/profile/hooks/useProfile';
import { useMe } from '@/features/auth/hook/useAuth';
import { ChallengeDialog } from '@/components/shared/ChallengeDialog';

type Tab = 'friends' | 'requests' | 'blocked';

// Icons
const Icons = {
    users: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
    ),
    inbox: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-17.5 0a2.25 2.25 0 0 0-2.25 2.25v1.5a2.25 2.25 0 0 0 2.25 2.25h19.5a2.25 2.25 0 0 0 2.25-2.25v-1.5a2.25 2.25 0 0 0-2.25-2.25m-17.5 0V4.125c0-.621.504-1.125 1.125-1.125h14.25c.621 0 1.125.504 1.125 1.125v9.375m-18 0h18" />
        </svg>
    ),
    block: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
    ),
    search: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
    ),
    message: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
    ),
    swords: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
        </svg>
    ),
    check: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
    ),
    x: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
    ),
    userPlus: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
        </svg>
    ),
};

// Friend card component
const FriendCard = ({
    id,
    username,
    avatar,
    isOnline,
    onRemove,
    isRemoving,
    onChallenge,
    onMessage,
}: {
    id: number;
    username: string;
    avatar: string | null;
    isOnline: boolean;
    onRemove: () => void;
    isRemoving: boolean;
    onChallenge: () => void;
    onMessage: () => void;
}) => (
    <div className="group flex items-center justify-between rounded-2xl border border-border/50 bg-card/50 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-card">
        <Link href={`/profile/${id}`} className="flex items-center gap-4">
            <div className="relative">
                <div className="h-12 w-12 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-emerald-400 transition-transform duration-200 group-hover:scale-105">
                    {avatar ? (
                        <img src={avatar} alt={username} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary-foreground">
                            {username.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                )}
            </div>
            <div>
                <div className="font-semibold transition-colors group-hover:text-primary">{username}</div>
                <div className="text-sm text-muted-foreground">
                    {isOnline ? <span className="text-emerald-400">● Online</span> : <span>○ Offline</span>}
                </div>
            </div>
        </Link>
        <div className="flex items-center gap-2">
            <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                    e.preventDefault();
                    onMessage();
                }}
                className="gap-1.5 border-border hover:border-primary/50 hover:bg-primary/10"
            >
                {Icons.message}
                <span className="hidden sm:inline">Message</span>
            </Button>
            {isOnline && (
                <Button
                    size="sm"
                    className="gap-1.5 bg-primary hover:bg-primary/90"
                    onClick={(e) => {
                        e.preventDefault();
                        onChallenge();
                    }}
                >
                    {Icons.swords}
                    <span className="hidden sm:inline">Challenge</span>
                </Button>
            )}
            <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                disabled={isRemoving}
                className="text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
            >
                {Icons.x}
            </Button>
        </div>
    </div>
);

// Request card component
const RequestCard = ({
    id,
    username,
    avatar,
    type,
    onAccept,
    onReject,
    onCancel,
    isPending,
}: {
    id: number;
    username: string;
    avatar: string | null;
    type: 'received' | 'sent';
    onAccept?: () => void;
    onReject?: () => void;
    onCancel?: () => void;
    isPending: boolean;
}) => (
    <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-card/50 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-card">
        <Link href={`/profile/${id}`} className="flex items-center gap-4">
            <div className="h-12 w-12 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-emerald-400">
                {avatar ? (
                    <img src={avatar} alt={username} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary-foreground">
                        {username.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <div>
                <div className="font-semibold">{username}</div>
                <div className="text-sm text-muted-foreground">
                    {type === 'received' ? (
                        <span className="text-primary">Wants to be your friend</span>
                    ) : (
                        'Request pending...'
                    )}
                </div>
            </div>
        </Link>
        <div className="flex items-center gap-2">
            {type === 'received' ? (
                <>
                    <Button size="sm" onClick={onAccept} disabled={isPending} className="gap-1.5 bg-primary hover:bg-primary/90">
                        {Icons.check}
                        Accept
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onReject}
                        disabled={isPending}
                        className="text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                    >
                        Decline
                    </Button>
                </>
            ) : (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isPending}
                    className="text-muted-foreground hover:bg-muted"
                >
                    Cancel
                </Button>
            )}
        </div>
    </div>
);

// Blocked user card
const BlockedCard = ({
    id,
    username,
    avatar,
    onUnblock,
    isPending,
}: {
    id: number;
    username: string;
    avatar: string | null;
    onUnblock: () => void;
    isPending: boolean;
}) => (
    <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-card/50 p-4">
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 overflow-hidden rounded-xl bg-muted">
                {avatar ? (
                    <img src={avatar} alt={username} className="h-full w-full object-cover opacity-50 grayscale" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground">
                        {username.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <div>
                <div className="font-semibold text-muted-foreground">{username}</div>
                <div className="text-sm text-red-400">Blocked</div>
            </div>
        </div>
        <Button size="sm" variant="outline" onClick={onUnblock} disabled={isPending}>
            Unblock
        </Button>
    </div>
);

// Search result card with status awareness
const SearchResultCard = ({
    id,
    username,
    avatar,
    isOnline,
    status,
    onAddFriend,
    isPending,
}: {
    id: number;
    username: string;
    avatar: string | null;
    isOnline: boolean;
    status: 'none' | 'friend' | 'request_sent' | 'request_received';
    onAddFriend: () => void;
    isPending: boolean;
}) => (
    <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-card/50 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-card">
        <Link href={`/profile/${id}`} className="flex items-center gap-4">
            <div className="relative">
                <div className="h-11 w-11 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-emerald-400">
                    {avatar ? (
                        <img src={avatar} alt={username} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-primary-foreground">
                            {username.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
                )}
            </div>
            <span className="font-semibold">{username}</span>
        </Link>
        {status === 'none' && (
            <Button size="sm" onClick={onAddFriend} disabled={isPending} className="gap-1.5 bg-primary hover:bg-primary/90">
                {Icons.userPlus}
                {isPending ? 'Sending...' : 'Add Friend'}
            </Button>
        )}
        {status === 'friend' && (
            <span className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                {Icons.check}
                Friends
            </span>
        )}
        {status === 'request_sent' && (
            <span className="rounded-xl bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">Request Sent</span>
        )}
        {status === 'request_received' && (
            <Button size="sm" onClick={onAddFriend} disabled={isPending} className="gap-1.5 bg-primary hover:bg-primary/90">
                {Icons.check}
                Accept
            </Button>
        )}
    </div>
);

// Empty state component
const EmptyState = ({ icon, title, description }: { icon: ReactNode; title: string; description: string }) => (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">{icon}</div>
        <h3 className="mb-2 font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
    </div>
);

// Loading skeleton
const LoadingSkeleton = () => (
    <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted" />
        ))}
    </div>
);

export default function FriendsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('friends');
    const [searchQuery, setSearchQuery] = useState('');
    const [challengeTarget, setChallengeTarget] = useState<{ id: number; username: string } | null>(null);

    // Get current user
    const { data: me } = useMe();

    // Data fetching
    const { data: friends = [], isLoading: friendsLoading } = useFriends();
    const { data: pendingRequests = [], isLoading: requestsLoading } = usePendingRequests();
    const { data: sentRequests = [], isLoading: sentLoading } = useSentRequests();
    const { data: blockedUsers = [], isLoading: blockedLoading } = useBlockedUsers();
    const { data: searchResults = [], isLoading: searchLoading } = useSearchUsers(searchQuery);

    // Mutations
    const acceptRequest = useAcceptFriendRequest();
    const rejectRequest = useRejectFriendRequest();
    const cancelRequest = useCancelFriendRequest();
    const removeFriend = useRemoveFriend();
    const unblockUser = useUnblockUser();
    const sendRequest = useSendFriendRequest();

    // Create sets for quick lookup
    const friendIds = useMemo(() => new Set(friends.map((f: any) => f.id)), [friends]);
    const sentRequestIds = useMemo(() => new Set(sentRequests.map((r: any) => r.receiver?.id)), [sentRequests]);
    const receivedRequestIds = useMemo(() => new Set(pendingRequests.map((r: any) => r.sender?.id)), [pendingRequests]);

    // Filter and enhance search results with relationship status
    const enhancedSearchResults = useMemo(() => {
        return searchResults
            .filter((user: any) => user.id !== me?.id) // Exclude self
            .map((user: any) => ({
                ...user,
                relationStatus: friendIds.has(user.id)
                    ? 'friend'
                    : sentRequestIds.has(user.id)
                        ? 'request_sent'
                        : receivedRequestIds.has(user.id)
                            ? 'request_received'
                            : 'none',
            }));
    }, [searchResults, me?.id, friendIds, sentRequestIds, receivedRequestIds]);

    const tabs = [
        { id: 'friends' as Tab, label: 'Friends', count: friends.length, icon: Icons.users },
        {
            id: 'requests' as Tab,
            label: 'Requests',
            count: pendingRequests.length + sentRequests.length,
            icon: Icons.inbox,
            highlight: pendingRequests.length > 0,
        },
        { id: 'blocked' as Tab, label: 'Blocked', count: blockedUsers.length, icon: Icons.block },
    ];

    const onlineFriends = friends.filter((f: any) => f.isOnline);
    const offlineFriends = friends.filter((f: any) => !f.isOnline);

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 lg:py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Friends</h1>
                <p className="mt-1 text-muted-foreground">Manage your friends, requests, and blocked users</p>
            </div>

            {/* Search */}
            <div className="mb-8">
                <div className="relative">
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {Icons.search}
                    </div>
                    <Input
                        type="text"
                        placeholder="Search for players to add..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 rounded-xl border-border/50 bg-card/50 pl-12 transition-all focus:border-primary focus:bg-card"
                    />
                </div>

                {/* Search Results */}
                {searchQuery.length >= 2 && (
                    <div className="mt-4 space-y-3">
                        {searchLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : enhancedSearchResults.length > 0 ? (
                            <>
                                <p className="mb-3 text-sm text-muted-foreground">
                                    Found <span className="font-medium text-foreground">{enhancedSearchResults.length}</span> players
                                </p>
                                {enhancedSearchResults.map((user: any) => (
                                    <SearchResultCard
                                        key={user.id}
                                        id={user.id}
                                        username={user.username}
                                        avatar={user.avatar}
                                        isOnline={user.isOnline}
                                        status={user.relationStatus}
                                        onAddFriend={() => sendRequest.mutate(user.id)}
                                        isPending={sendRequest.isPending}
                                    />
                                ))}
                            </>
                        ) : (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                No players found matching "<span className="font-medium">{searchQuery}</span>"
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-1 rounded-2xl border border-border/50 bg-muted/50 p-1.5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all duration-200',
                            activeTab === tab.id
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                        aria-pressed={activeTab === tab.id}
                    >
                        <span className={cn(activeTab === tab.id && 'text-primary')}>{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.count > 0 && (
                            <span
                                className={cn(
                                    'min-w-[20px] rounded-full px-1.5 py-0.5 text-xs font-semibold',
                                    tab.highlight ? 'bg-primary text-primary-foreground' : activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10'
                                )}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-3">
                {/* Friends Tab */}
                {activeTab === 'friends' && (
                    <>
                        {friendsLoading ? (
                            <LoadingSkeleton />
                        ) : friends.length === 0 ? (
                            <EmptyState
                                icon={Icons.users}
                                title="No friends yet"
                                description="Search for players above to add them as friends"
                            />
                        ) : (
                            <>
                                {/* Online friends first */}
                                {onlineFriends.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                                            Online — {onlineFriends.length}
                                        </h3>
                                        <div className="space-y-3">
                                            {onlineFriends.map((friend: any) => (
                                                <FriendCard
                                                    key={friend.id}
                                                    id={friend.id}
                                                    username={friend.username}
                                                    avatar={friend.avatar}
                                                    isOnline={true}
                                                    onRemove={() => removeFriend.mutate(friend.id)}
                                                    isRemoving={removeFriend.isPending}
                                                    onChallenge={() => setChallengeTarget({ id: friend.id, username: friend.username })}
                                                    onMessage={() => router.push(`/messages?friend=${friend.id}`)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Offline friends */}
                                {offlineFriends.length > 0 && (
                                    <div>
                                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                                            Offline — {offlineFriends.length}
                                        </h3>
                                        <div className="space-y-3">
                                            {offlineFriends.map((friend: any) => (
                                                <FriendCard
                                                    key={friend.id}
                                                    id={friend.id}
                                                    username={friend.username}
                                                    avatar={friend.avatar}
                                                    isOnline={false}
                                                    onRemove={() => removeFriend.mutate(friend.id)}
                                                    isRemoving={removeFriend.isPending}
                                                    onChallenge={() => setChallengeTarget({ id: friend.id, username: friend.username })}
                                                    onMessage={() => router.push(`/messages?friend=${friend.id}`)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                    <>
                        {requestsLoading || sentLoading ? (
                            <LoadingSkeleton />
                        ) : pendingRequests.length === 0 && sentRequests.length === 0 ? (
                            <EmptyState
                                icon={Icons.inbox}
                                title="No pending requests"
                                description="Friend requests you send or receive will appear here"
                            />
                        ) : (
                            <>
                                {/* Received requests */}
                                {pendingRequests.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs">
                                                {pendingRequests.length}
                                            </span>
                                            Received Requests
                                        </h3>
                                        <div className="space-y-3">
                                            {pendingRequests.map((request: any, index: number) => {
                                                return (
                                                    <RequestCard
                                                        key={`${request.requestId}-${index}`}
                                                        id={request.sender.id}
                                                        username={request.sender.username}
                                                        avatar={request.sender.avatar}
                                                        type="received"
                                                        onAccept={() => acceptRequest.mutate(request.requestId)}
                                                        onReject={() => rejectRequest.mutate(request.requestId)}
                                                        isPending={acceptRequest.isPending || rejectRequest.isPending}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Sent requests */}
                                {sentRequests.length > 0 && (
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                                            Sent — {sentRequests.length}
                                        </h3>
                                        <div className="space-y-3">
                                            {sentRequests.map((request: any, index: number) => {
                                                return (
                                                    <RequestCard
                                                        key={`${request.requestId}-${index}`}
                                                        id={request.receiver.id}
                                                        username={request.receiver.username}
                                                        avatar={request.receiver.avatar}
                                                        type="sent"
                                                        onCancel={() => cancelRequest.mutate(request.requestId)}
                                                        isPending={cancelRequest.isPending}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* Blocked Tab */}
                {activeTab === 'blocked' && (
                    <>
                        {blockedLoading ? (
                            <LoadingSkeleton />
                        ) : blockedUsers.length === 0 ? (
                            <EmptyState icon={Icons.block} title="No blocked users" description="Users you block will appear here" />
                        ) : (
                            <div className="space-y-3">
                                {blockedUsers.map((user: any) => (
                                    <BlockedCard
                                        key={user.id}
                                        id={user.userId}
                                        username={user.username}
                                        avatar={user.avatar}
                                        onUnblock={() => unblockUser.mutate(user.userId)}
                                        isPending={unblockUser.isPending}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Challenge Dialog */}
            {challengeTarget && (
                <ChallengeDialog
                    isOpen={true}
                    onClose={() => setChallengeTarget(null)}
                    friendId={String(challengeTarget.id)}
                    friendUsername={challengeTarget.username}
                />
            )}
        </div>
    );
}
