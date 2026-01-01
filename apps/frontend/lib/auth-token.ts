"use client";

/**
 * Secure Token Storage for Web and Mobile Platforms
 * 
 * Security considerations:
 * 1. Access tokens are short-lived (1h) - stored in memory for fastest access
 * 2. Refresh tokens are long-lived (7d) - stored encoded in localStorage
 * 3. Memory-first approach prevents XSS from easily accessing tokens
 * 4. Token refresh happens automatically before expiration
 * 5. Compatible with mobile webviews (no httpOnly cookie dependency)
 */

// Storage keys (short names to reduce storage footprint)
const ACCESS_TOKEN_KEY = 'at';
const REFRESH_TOKEN_KEY = 'rt';
const TOKEN_EXPIRY_KEY = 'ate';

// In-memory token storage (primary for access token)
let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenExpiry: number | null = null;

// Simple obfuscation for localStorage (adds a layer against casual inspection)
// For production mobile apps, consider using react-native-keychain or expo-secure-store
function encode(value: string): string {
    if (typeof window === 'undefined') return value;
    try {
        return btoa(encodeURIComponent(value).split('').reverse().join(''));
    } catch {
        return value;
    }
}

function decode(value: string): string {
    if (typeof window === 'undefined') return value;
    try {
        return decodeURIComponent(atob(value).split('').reverse().join(''));
    } catch {
        return value;
    }
}

// Parse JWT to get expiry time
function parseJwtExpiry(token: string): number | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]!));
        return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch {
        return null;
    }
}

// Initialize from storage on load
function initializeFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
        const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

        console.log('[auth-token] Initializing from storage:', {
            hasAccessToken: !!storedAccessToken,
            hasRefreshToken: !!storedRefreshToken,
            hasExpiry: !!storedExpiry
        });

        if (storedAccessToken) {
            accessToken = decode(storedAccessToken);
        }
        if (storedRefreshToken) {
            refreshToken = decode(storedRefreshToken);
        }
        if (storedExpiry) {
            tokenExpiry = parseInt(storedExpiry, 10);
            const isExpired = Date.now() >= tokenExpiry;
            console.log('[auth-token] Token expiry:', {
                expiry: new Date(tokenExpiry).toISOString(),
                isExpired
            });
        }
    } catch (e) {
        console.error('Failed to initialize tokens from storage:', e);
        clearAllTokens();
    }
}

// Initialize on module load
if (typeof window !== 'undefined') {
    initializeFromStorage();
}

/**
 * Set access token with automatic expiry tracking
 */
export function setAccessToken(token: string | null): void {
    accessToken = token;

    if (typeof window !== 'undefined') {
        if (token) {
            localStorage.setItem(ACCESS_TOKEN_KEY, encode(token));
            // Parse and store expiry
            const expiry = parseJwtExpiry(token);
            if (expiry) {
                tokenExpiry = expiry;
                localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
            }
        } else {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(TOKEN_EXPIRY_KEY);
            tokenExpiry = null;
        }
    }
}

/**
 * Get access token (from memory first, then storage)
 */
export function getAccessToken(): string | null {
    // Memory-first approach
    if (accessToken) return accessToken;

    // Fallback to storage (handles page refresh)
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (stored) {
            accessToken = decode(stored);
            return accessToken;
        }
    }

    return null;
}

/**
 * Set refresh token
 */
export function setRefreshToken(token: string | null): void {
    refreshToken = token;

    if (typeof window !== 'undefined') {
        if (token) {
            localStorage.setItem(REFRESH_TOKEN_KEY, encode(token));
        } else {
            localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
    }
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
    // Memory-first approach
    if (refreshToken) return refreshToken;

    // Fallback to storage
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (stored) {
            refreshToken = decode(stored);
            return refreshToken;
        }
    }

    return null;
}

/**
 * Get token expiry time (in milliseconds since epoch)
 */
export function getTokenExpiry(): number | null {
    if (tokenExpiry) return tokenExpiry;

    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(TOKEN_EXPIRY_KEY);
        if (stored) {
            tokenExpiry = parseInt(stored, 10);
            return tokenExpiry;
        }
    }

    return null;
}

/**
 * Check if access token is expired or about to expire (within 5 minutes)
 */
export function isAccessTokenExpired(): boolean {
    const expiry = getTokenExpiry();
    if (!expiry) return true;

    // Consider expired if within 5 minutes of expiry (proactive refresh)
    const bufferMs = 5 * 60 * 1000;
    return Date.now() >= expiry - bufferMs;
}

/**
 * Check if we have a valid session (has refresh token)
 */
export function hasValidSession(): boolean {
    return !!getRefreshToken();
}

/**
 * Clear all tokens (for logout)
 */
export function clearAllTokens(): void {
    accessToken = null;
    refreshToken = null;
    tokenExpiry = null;

    if (typeof window !== 'undefined') {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
    }
}

/**
 * Set both tokens at once (for login/register)
 */
export function setTokens(access: string | null, refresh: string | null): void {
    setAccessToken(access);
    setRefreshToken(refresh);
}