export const UID_INFO_CACHE_LIFETIME_MS = 24 * 60 * 60 * 1000; // h * m * s * ms

export type GlobalStateKey = typeof GLOBAL_STATE_KEYS[keyof typeof GLOBAL_STATE_KEYS];
export const GLOBAL_STATE_KEYS = {
    UID_INFO_CACHE: `uidInfoCache`
} as const;
