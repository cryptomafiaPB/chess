'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMe } from '@/features/auth/hook/useAuth';
import {
    useDashboard,
    useUpdateProfile,
    useChangePassword,
    useUpdateAvatar,
    usePreferences,
    useUpdatePreferences,
    useDeleteAccount,
} from '@/features/profile/hooks/useProfile';
import { UserPreferences } from '@/features/profile/api';
import { useFriends } from '@/features/friends/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { COUNTRIES, getCountryFlag } from '@/constants/country';
import { clearAllTokens } from '@/lib/auth-token';

// Tab types
type SettingsTab = 'profile' | 'account' | 'gameplay' | 'notifications';

// Format date
const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// Icons
const Icons = {
    User: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    Shield: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    ),
    Gamepad: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Bell: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    ),
    Camera: () => (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Check: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ),
    X: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    Volume: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
    ),
    Eye: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ),
    Trash: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    ),
};

// Rating card component
const RatingCard = ({
    timeControl,
    rating,
    games,
    wins,
    losses,
    draws,
}: {
    timeControl: string;
    rating: number;
    games: number;
    wins: number;
    losses: number;
    draws: number;
}) => {
    const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;
    const icons: Record<string, string> = {
        bullet: '⚡',
        blitz: '🔥',
        rapid: '⏱️',
        classical: '♟️',
    };

    return (
        <div className="group rounded-xl border bg-card p-4 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5">
            <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium capitalize text-muted-foreground">
                    <span className="text-lg">{icons[timeControl] || '♟️'}</span>
                    {timeControl}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {games} games
                </span>
            </div>
            <div className="mb-3 text-4xl font-bold tracking-tight">{rating}</div>
            <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-emerald-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {wins}W
                </span>
                <span className="flex items-center gap-1 text-red-500">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    {losses}L
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    {draws}D
                </span>
                <span className="ml-auto font-medium text-muted-foreground">{winRate}%</span>
            </div>
        </div>
    );
};

// Toggle Switch Component
const Toggle = ({
    checked,
    onChange,
    disabled,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-emerald-500' : 'bg-muted'
        )}
    >
        <span
            className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                checked ? 'translate-x-5' : 'translate-x-0'
            )}
        />
    </button>
);

// Slider Component
const Slider = ({
    value,
    onChange,
    min = 0,
    max = 100,
    disabled,
}: {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    disabled?: boolean;
}) => (
    <div className="flex items-center gap-3">
        <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span className="w-10 text-sm text-muted-foreground">{value}%</span>
    </div>
);

// Profile Tab Content
const ProfileTab = ({ me, onAvatarUpdate }: { me: any; onAvatarUpdate: () => void }) => {
    const [username, setUsername] = useState(me.username);
    const [bio, setBio] = useState(me.profile?.bio || '');
    const [country, setCountry] = useState(me.profile?.country || '');
    const [successMessage, setSuccessMessage] = useState('');

    const updateProfile = useUpdateProfile();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile.mutate(
            { username, bio, country },
            {
                onSuccess: () => {
                    setSuccessMessage('Profile updated successfully!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                },
            }
        );
    };

    return (
        <div className="space-y-6">
            {/* Avatar Section */}
            <div className="rounded-xl border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold">Profile Picture</h3>
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="h-24 w-24 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500">
                            {me.avatar_url ? (
                                <img
                                    src={me.avatar_url}
                                    alt={me.username}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                                    {me.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onAvatarUpdate}
                            className="absolute -bottom-2 -right-2 rounded-full bg-emerald-500 p-2 text-white shadow-lg transition-transform hover:scale-110"
                        >
                            <Icons.Camera />
                        </button>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Upload a new avatar image. Recommended size: 256x256px.
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Supported formats: JPG, PNG, GIF (max 2MB)
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Info */}
            <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold">Profile Information</h3>

                {successMessage && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
                        <Icons.Check />
                        {successMessage}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Username</label>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Your username"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell others about yourself..."
                            rows={4}
                            maxLength={500}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">{bio.length}/500 characters</p>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Country</label>
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="">Select your country</option>
                            {COUNTRIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={updateProfile.isPending}
                            className="bg-emerald-500 hover:bg-emerald-600"
                        >
                            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

// Account Tab Content
const AccountTab = ({ me }: { me: any }) => {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const changePassword = useChangePassword();
    const deleteAccount = useDeleteAccount();

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 8) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }

        changePassword.mutate(
            { currentPassword, newPassword },
            {
                onSuccess: () => {
                    setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                },
                onError: (err: any) => {
                    setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password' });
                },
            }
        );
    };

    const handleDeleteAccount = () => {
        deleteAccount.mutate(deletePassword, {
            onSuccess: () => {
                clearAllTokens();
                router.push('/login');
            },
            onError: (err: any) => {
                alert(err.message || 'Failed to delete account');
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Email Section */}
            <div className="rounded-xl border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold">Email Address</h3>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                    <span>{me.email}</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                        Verified
                    </span>
                </div>
            </div>

            {/* Password Section */}
            <form onSubmit={handlePasswordChange} className="rounded-xl border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold">Change Password</h3>

                {passwordMessage && (
                    <div
                        className={cn(
                            'mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm',
                            passwordMessage.type === 'success'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-red-500/10 text-red-500'
                        )}
                    >
                        {passwordMessage.type === 'success' ? <Icons.Check /> : <Icons.X />}
                        {passwordMessage.text}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Current Password</label>
                        <Input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">New Password</label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Confirm New Password</label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={changePassword.isPending || !currentPassword || !newPassword || !confirmPassword}
                            className="bg-emerald-500 hover:bg-emerald-600"
                        >
                            {changePassword.isPending ? 'Changing...' : 'Change Password'}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Danger Zone */}
            <div className="rounded-xl border border-red-500/20 bg-card p-6">
                <h3 className="mb-2 text-lg font-semibold text-red-500">Danger Zone</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                    Once you delete your account, there is no going back. Please be certain.
                </p>

                {!showDeleteConfirm ? (
                    <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                    >
                        <Icons.Trash />
                        <span className="ml-2">Delete Account</span>
                    </Button>
                ) : (
                    <div className="space-y-4 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                        <p className="text-sm text-red-500">
                            This action cannot be undone. Enter your password to confirm.
                        </p>
                        <Input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Enter your password"
                            className="border-red-500/30"
                        />
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeletePassword('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDeleteAccount}
                                disabled={deleteAccount.isPending || !deletePassword}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                {deleteAccount.isPending ? 'Deleting...' : 'Confirm Delete'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Gameplay Tab Content
const GameplayTab = () => {
    const { data: preferences, isLoading } = usePreferences();
    const updatePreferences = useUpdatePreferences();

    const handleToggle = (key: string, value: boolean) => {
        updatePreferences.mutate({ [key]: value });
    };

    const handleSlider = (key: string, value: number) => {
        updatePreferences.mutate({ [key]: value });
    };

    const handleSelect = (key: string, value: string) => {
        updatePreferences.mutate({ [key]: value });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
        );
    }

    const prefs: Partial<UserPreferences> = preferences || {};

    return (
        <div className="space-y-6">
            {/* Sound Settings */}
            <div className="rounded-xl border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                    <Icons.Volume />
                    <h3 className="text-lg font-semibold">Sound Settings</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Sound Effects</p>
                            <p className="text-sm text-muted-foreground">Enable all game sounds</p>
                        </div>
                        <Toggle
                            checked={prefs.soundEnabled ?? true}
                            onChange={(v) => handleToggle('soundEnabled', v)}
                        />
                    </div>

                    {(prefs.soundEnabled ?? true) && (
                        <>
                            <div className="border-t pt-4">
                                <p className="mb-3 font-medium">Volume</p>
                                <Slider
                                    value={prefs.soundVolume ?? 80}
                                    onChange={(v) => handleSlider('soundVolume', v)}
                                />
                            </div>

                            <div className="flex items-center justify-between border-t pt-4">
                                <p className="text-sm">Move sounds</p>
                                <Toggle
                                    checked={prefs.moveSound ?? true}
                                    onChange={(v) => handleToggle('moveSound', v)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-sm">Capture sounds</p>
                                <Toggle
                                    checked={prefs.captureSound ?? true}
                                    onChange={(v) => handleToggle('captureSound', v)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-sm">Check alerts</p>
                                <Toggle
                                    checked={prefs.checkSound ?? true}
                                    onChange={(v) => handleToggle('checkSound', v)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-sm">Game end sounds</p>
                                <Toggle
                                    checked={prefs.gameEndSound ?? true}
                                    onChange={(v) => handleToggle('gameEndSound', v)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-sm">Notification sounds</p>
                                <Toggle
                                    checked={prefs.notificationSound ?? true}
                                    onChange={(v) => handleToggle('notificationSound', v)}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Display Settings */}
            <div className="rounded-xl border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                    <Icons.Eye />
                    <h3 className="text-lg font-semibold">Display Settings</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Board Theme</label>
                        <select
                            value={prefs.boardTheme || 'classic'}
                            onChange={(e) => handleSelect('boardTheme', e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="classic">Classic</option>
                            <option value="wood">Wood</option>
                            <option value="marble">Marble</option>
                            <option value="green">Green</option>
                            <option value="blue">Blue</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Piece Set</label>
                        <select
                            value={prefs.pieceSet || 'standard'}
                            onChange={(e) => handleSelect('pieceSet', e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="standard">Standard</option>
                            <option value="neo">Neo</option>
                            <option value="alpha">Alpha</option>
                            <option value="chess7">Chess7</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                        <div>
                            <p className="font-medium">Show Coordinates</p>
                            <p className="text-sm text-muted-foreground">Display board coordinates (a-h, 1-8)</p>
                        </div>
                        <Toggle
                            checked={prefs.showCoordinates ?? true}
                            onChange={(v) => handleToggle('showCoordinates', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Show Legal Moves</p>
                            <p className="text-sm text-muted-foreground">Highlight possible moves when selecting a piece</p>
                        </div>
                        <Toggle
                            checked={prefs.showLegalMoves ?? true}
                            onChange={(v) => handleToggle('showLegalMoves', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Show Last Move</p>
                            <p className="text-sm text-muted-foreground">Highlight the previous move on the board</p>
                        </div>
                        <Toggle
                            checked={prefs.showLastMove ?? true}
                            onChange={(v) => handleToggle('showLastMove', v)}
                        />
                    </div>
                </div>
            </div>

            {/* Game Behavior */}
            <div className="rounded-xl border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                    <Icons.Gamepad />
                    <h3 className="text-lg font-semibold">Game Behavior</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Auto-promote to Queen</p>
                            <p className="text-sm text-muted-foreground">Skip promotion dialog and always promote to queen</p>
                        </div>
                        <Toggle
                            checked={prefs.autoPromoteToQueen ?? false}
                            onChange={(v) => handleToggle('autoPromoteToQueen', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Confirm Moves</p>
                            <p className="text-sm text-muted-foreground">Require confirmation before making a move</p>
                        </div>
                        <Toggle
                            checked={prefs.confirmMoves ?? false}
                            onChange={(v) => handleToggle('confirmMoves', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Voice Chat</p>
                            <p className="text-sm text-muted-foreground">Enable voice communication during games</p>
                        </div>
                        <Toggle
                            checked={prefs.voiceEnabled ?? true}
                            onChange={(v) => handleToggle('voiceEnabled', v)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Notifications Tab Content
const NotificationsTab = () => {
    const { data: preferences, isLoading } = usePreferences();
    const updatePreferences = useUpdatePreferences();

    const handleToggle = (key: string, value: boolean) => {
        updatePreferences.mutate({ [key]: value });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
        );
    }

    const prefs: Partial<UserPreferences> = preferences || {};

    return (
        <div className="space-y-6">
            <div className="rounded-xl border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                    <Icons.Bell />
                    <h3 className="text-lg font-semibold">Notification Preferences</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">Receive important updates via email</p>
                        </div>
                        <Toggle
                            checked={prefs.emailNotifications ?? true}
                            onChange={(v) => handleToggle('emailNotifications', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                        <div>
                            <p className="font-medium">Game Invites</p>
                            <p className="text-sm text-muted-foreground">Get notified when someone challenges you</p>
                        </div>
                        <Toggle
                            checked={prefs.gameInviteNotifications ?? true}
                            onChange={(v) => handleToggle('gameInviteNotifications', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Friend Requests</p>
                            <p className="text-sm text-muted-foreground">Get notified about new friend requests</p>
                        </div>
                        <Toggle
                            checked={prefs.friendRequestNotifications ?? true}
                            onChange={(v) => handleToggle('friendRequestNotifications', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Messages</p>
                            <p className="text-sm text-muted-foreground">Get notified about new direct messages</p>
                        </div>
                        <Toggle
                            checked={prefs.messageNotifications ?? true}
                            onChange={(v) => handleToggle('messageNotifications', v)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Avatar Upload Modal
const AvatarUploadModal = ({
    isOpen,
    onClose,
    currentAvatar,
    username,
}: {
    isOpen: boolean;
    onClose: () => void;
    currentAvatar: string | null;
    username: string;
}) => {
    const [avatarUrl, setAvatarUrl] = useState('');
    const [previewError, setPreviewError] = useState(false);
    const updateAvatar = useUpdateAvatar();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!avatarUrl) return;

        updateAvatar.mutate(avatarUrl, {
            onSuccess: () => {
                onClose();
                setAvatarUrl('');
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Update Profile Picture</h2>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
                        <Icons.X />
                    </button>
                </div>

                <div className="mb-6 flex justify-center">
                    <div className="h-32 w-32 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500">
                        {avatarUrl && !previewError ? (
                            <img
                                src={avatarUrl}
                                alt="Preview"
                                className="h-full w-full object-cover"
                                onError={() => setPreviewError(true)}
                            />
                        ) : currentAvatar ? (
                            <img
                                src={currentAvatar}
                                alt={username}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
                                {username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Image URL</label>
                        <Input
                            value={avatarUrl}
                            onChange={(e) => {
                                setAvatarUrl(e.target.value);
                                setPreviewError(false);
                            }}
                            placeholder="https://example.com/avatar.jpg"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Enter a direct link to your image
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateAvatar.isPending || !avatarUrl}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                        >
                            {updateAvatar.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Main Page Component
export default function MyProfilePage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [showAvatarModal, setShowAvatarModal] = useState(false);

    const { data: me, isLoading: meLoading } = useMe();
    const { data: dashboard, isLoading: dashboardLoading } = useDashboard();
    const { data: friends = [] } = useFriends();

    const isLoading = meLoading || dashboardLoading;

    const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: 'profile', label: 'Profile', icon: <Icons.User /> },
        { id: 'account', label: 'Account', icon: <Icons.Shield /> },
        { id: 'gameplay', label: 'Gameplay', icon: <Icons.Gamepad /> },
        { id: 'notifications', label: 'Notifications', icon: <Icons.Bell /> },
    ];

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading your profile…</p>
                </div>
            </div>
        );
    }

    if (!me || !dashboard) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Failed to load profile</p>
                <Link href="/dashboard">
                    <Button>Back to Dashboard</Button>
                </Link>
            </div>
        );
    }

    const { ratings, summary } = dashboard;
    const ratingsArray = Object.entries(ratings).map(([key, value]) => ({
        timeControl: key,
        ...value,
    }));
    const bestRating = ratingsArray.reduce(
        (best, current) => (current.rating > best.rating ? current : best),
        { rating: 0, timeControl: '' }
    );

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            {/* Profile Header Card */}
            <div className="mb-8 overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5">
                <div className="relative">
                    {/* Banner */}
                    <div className="h-32 bg-gradient-to-r from-emerald-500 to-cyan-500 sm:h-40" />

                    {/* Profile Info */}
                    <div className="relative px-6 pb-6">
                        {/* Avatar */}
                        <div className="absolute -top-16 left-6 sm:-top-20">
                            <div className="relative">
                                <div className="h-28 w-28 overflow-hidden rounded-2xl border-4 border-card bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-xl sm:h-36 sm:w-36">
                                    {me.avatar_url ? (
                                        <img
                                            src={me.avatar_url}
                                            alt={me.username}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white sm:text-5xl">
                                            {me.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-card bg-emerald-500" />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="ml-0 pt-16 sm:ml-44 sm:pt-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-2xl font-bold sm:text-3xl">{me.username}</h1>
                                        {me.profile?.country && (
                                            <Image
                                                src={getCountryFlag(me.profile?.country)}
                                                alt={me.profile?.country || ''}
                                                width={28}
                                                height={21}
                                                className="rounded"
                                            />
                                        )}
                                    </div>
                                    {me.profile?.bio && (
                                        <p className="mt-2 max-w-xl text-muted-foreground">{me.profile.bio}</p>
                                    )}
                                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Joined {formatDate(me.createdAt)}
                                        </span>
                                        {bestRating.rating > 0 && (
                                            <span className="flex items-center gap-1.5">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                                Peak: {bestRating.rating} ({bestRating.timeControl})
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            {friends.length} friends
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="flex gap-6 rounded-xl bg-card/50 p-4 backdrop-blur">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold">{summary.totalGames}</div>
                                        <div className="text-xs text-muted-foreground">Games</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-emerald-500">{summary.wins}</div>
                                        <div className="text-xs text-muted-foreground">Wins</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-amber-500">{summary.winRate}%</div>
                                        <div className="text-xs text-muted-foreground">Win Rate</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid gap-8 lg:grid-cols-[280px,1fr]">
                {/* Sidebar - Ratings & Navigation */}
                <div className="space-y-6">
                    {/* Ratings */}
                    <div className="rounded-xl border bg-card p-4">
                        <h3 className="mb-4 font-semibold">Your Ratings</h3>
                        <div className="space-y-3">
                            {ratingsArray.map((r) => (
                                <RatingCard
                                    key={r.timeControl}
                                    timeControl={r.timeControl}
                                    rating={r.rating}
                                    games={r.gamesPlayed}
                                    wins={r.wins}
                                    losses={r.losses}
                                    draws={r.draws}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Settings Navigation */}
                    <nav className="rounded-xl border bg-card p-2">
                        <h3 className="mb-2 px-3 py-2 text-sm font-semibold text-muted-foreground">
                            Settings
                        </h3>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                    activeTab === tab.id
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Settings Content */}
                <div>
                    <h2 className="mb-6 text-xl font-bold">
                        {tabs.find((t) => t.id === activeTab)?.label} Settings
                    </h2>
                    {activeTab === 'profile' && (
                        <ProfileTab me={me} onAvatarUpdate={() => setShowAvatarModal(true)} />
                    )}
                    {activeTab === 'account' && <AccountTab me={me} />}
                    {activeTab === 'gameplay' && <GameplayTab />}
                    {activeTab === 'notifications' && <NotificationsTab />}
                </div>
            </div>

            {/* Avatar Upload Modal */}
            <AvatarUploadModal
                isOpen={showAvatarModal}
                onClose={() => setShowAvatarModal(false)}
                currentAvatar={me.avatar_url}
                username={me.username}
            />
        </div>
    );
}
