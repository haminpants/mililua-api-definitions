export type GlobalStateKey = typeof GLOBAL_STATE_KEYS[keyof typeof GLOBAL_STATE_KEYS];

export const GLOBAL_STATE_KEYS = {
    UidInfoCache: `uidInfoCache`
} as const;
