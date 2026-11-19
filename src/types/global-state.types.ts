export interface UidInfo {
    name: string,
    lastUpdate: number
}

export type UidInfoCache = Record<string, UidInfo>;