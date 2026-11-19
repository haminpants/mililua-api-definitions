import * as os from "os"
import * as vscode from "vscode";
import { ServerEntry, ServerType, UidInfo } from "@/types";
import { GLOBAL_STATE_KEYS, UID_INFO_CACHE_LIFETIME_MS } from "@/constants/global-state-keys";

export const SERVER: Record<ServerType, ServerEntry> = {
    GLOBAL: {
        uidRegex: new RegExp(/^(6|7|8|18|9)\d{8}$/),
        getBeyondLocalUri: () => vscode.Uri.joinPath(vscode.Uri.file(os.homedir()), "AppData", "LocalLow", "miHoYo", "Genshin Impact", "BeyondLocal"),
        getUidInfo: async (context, uid) => {
            const now = Date.now();
            const cache = context.globalState.get<Record<string, UidInfo>>(GLOBAL_STATE_KEYS.UidInfoCache, {})[uid];
            if (cache && cache.lastUpdate >= now - UID_INFO_CACHE_LIFETIME_MS) { return cache; }
        }
    },
    CN: {
        uidRegex: new RegExp(/^(1|2|3|5)\d{8}$/),
        getBeyondLocalUri: () => vscode.Uri.joinPath(vscode.Uri.file(os.homedir()), "AppData", "LocalLow", "miHoYo", "原神", "BeyondLocal"),
        getUidInfo: async (context, uid) => {
            return {
                name: "a",
                lastUpdate: 0
            }
        }
    }
} as const