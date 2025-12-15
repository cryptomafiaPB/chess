"use client";

const STORAGE_KEY = 'accessToken';

let accessToken: string | null = typeof window !== 'undefined'
    ? (localStorage.getItem(STORAGE_KEY) ?? null)
    : null;

export function setAccessToken(token: string | null) {
    accessToken = token;
    if (typeof window !== 'undefined') {
        if (token) localStorage.setItem(STORAGE_KEY, token);
        else localStorage.removeItem(STORAGE_KEY);
    }
}

export function getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && stored !== accessToken) accessToken = stored;
    }
    return accessToken;
}