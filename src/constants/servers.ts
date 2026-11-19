import * as os from "os";
import * as vscode from "vscode";
import { ServerEntry, ServerType } from "@/types";
import { queryEnkaNetwork } from "@/services/enka.service";
import { getCachedUidInfo, setCachedUidInfo } from "@/utils/uid-cache.utils";

export const SERVER: Record<ServerType, ServerEntry> = {
    GLOBAL: {
        uidRegex: new RegExp(/^(6|7|8|18|9)\d{8}$/),
        getBeyondLocalUri: () => vscode.Uri.joinPath(vscode.Uri.file(os.homedir()), "AppData", "LocalLow", "miHoYo", "Genshin Impact", "BeyondLocal"),
        getUidInfo: async (context, uid) => {
            const cached = getCachedUidInfo(context, uid);
            if (cached) { return cached; }

            const fetched = await queryEnkaNetwork(uid);
            if (fetched) {
                setCachedUidInfo(context, uid, fetched);
                return fetched;
            }

            return {
                name: "Unknown",
                lastUpdate: 0
            };
        }
    },
    CN: {
        uidRegex: new RegExp(/^(1|2|3|5)\d{8}$/),
        getBeyondLocalUri: () => vscode.Uri.joinPath(vscode.Uri.file(os.homedir()), "AppData", "LocalLow", "miHoYo", "原神", "BeyondLocal"),
        getUidInfo: async (context, uid) => { return { name: "", lastUpdate: 0 } }
    }
} as const