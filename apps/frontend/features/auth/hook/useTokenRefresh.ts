'use client';

import { useEffect, useRef } from 'react';
import { getTokenExpiry, getRefreshToken, isAccessTokenExpired } from '@/lib/auth-token';
import { refreshAccessToken } from '@/lib/api-client';

/**
 * Hook to automatically refresh the access token before it expires
 * This runs in the background and ensures seamless token refresh
 */
export function useTokenRefresh() {
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isRefreshingRef = useRef(false);

    useEffect(() => {
        const scheduleRefresh = () => {
            // Clear any existing timeout
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }

            const expiry = getTokenExpiry();
            const refreshToken = getRefreshToken();

            // No point scheduling if we don't have a refresh token
            if (!refreshToken) {
                return;
            }

            // If no expiry, try to refresh now if we have a refresh token
            if (!expiry) {
                if (!isRefreshingRef.current) {
                    isRefreshingRef.current = true;
                    refreshAccessToken().finally(() => {
                        isRefreshingRef.current = false;
                        // Schedule next check after refresh
                        refreshTimeoutRef.current = setTimeout(scheduleRefresh, 60000);
                    });
                }
                return;
            }

            // Calculate when to refresh (5 minutes before expiry)
            const now = Date.now();
            const bufferMs = 5 * 60 * 1000; // 5 minutes
            const refreshAt = expiry - bufferMs;
            const timeUntilRefresh = refreshAt - now;

            if (timeUntilRefresh <= 0) {
                // Need to refresh now
                if (!isRefreshingRef.current) {
                    isRefreshingRef.current = true;
                    refreshAccessToken().finally(() => {
                        isRefreshingRef.current = false;
                        // Schedule next check after refresh
                        scheduleRefresh();
                    });
                }
            } else {
                // Schedule refresh for later
                console.log(`Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);
                refreshTimeoutRef.current = setTimeout(() => {
                    if (!isRefreshingRef.current) {
                        isRefreshingRef.current = true;
                        refreshAccessToken().finally(() => {
                            isRefreshingRef.current = false;
                            // Schedule next refresh
                            scheduleRefresh();
                        });
                    }
                }, timeUntilRefresh);
            }
        };

        // Initial schedule
        scheduleRefresh();

        // Also check when the page becomes visible (user returns to tab)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Check if token expired while tab was hidden
                if (isAccessTokenExpired() && getRefreshToken() && !isRefreshingRef.current) {
                    isRefreshingRef.current = true;
                    refreshAccessToken().finally(() => {
                        isRefreshingRef.current = false;
                        scheduleRefresh();
                    });
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
}
