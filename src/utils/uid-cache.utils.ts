import * as vscode from "vscode";
import { UidInfo, UidInfoCache } from "@/types";
import { GLOBAL_STATE_KEYS, UID_INFO_CACHE_LIFETIME_MS } from "@/constants/global-state-keys";

let cacheWriteQueue = Promise.resolve();

export function getCachedUidInfo(context: vscode.ExtensionContext, uid: string, now = Date.now()) {
    const cachedInfo = context.globalState.get<UidInfoCache>(GLOBAL_STATE_KEYS.UID_INFO_CACHE, {})[uid];
    if (!cachedInfo || cachedInfo.lastUpdate < now - UID_INFO_CACHE_LIFETIME_MS) { return undefined; }
    return cachedInfo;
}

export function setCachedUidInfo(context: vscode.ExtensionContext, uid: string, uidInfo: UidInfo) {
    const nextWrite = cacheWriteQueue.then(async () => {
        const current = context.globalState.get<UidInfoCache>(GLOBAL_STATE_KEYS.UID_INFO_CACHE, {});
        const updated: UidInfoCache = { ...current, [uid]: uidInfo }
        await context.globalState.update(GLOBAL_STATE_KEYS.UID_INFO_CACHE, updated);
    });
    cacheWriteQueue = nextWrite.catch(error => console.error(`Failed to update cache for UID: ${uid}`, error));
}