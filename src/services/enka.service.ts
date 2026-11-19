import { SERVER } from "@/constants/servers";
import { EnkaResponse, UidInfo } from "@/types";

export async function queryEnkaNetwork(uid: string): Promise<UidInfo | undefined> {
    if (!SERVER.GLOBAL.uidRegex.test(uid)) { return undefined; }
    const now = Date.now();
    const apiUrl = `https://enka.network/api/uid/${uid}/?info`;
    try {
        const response = await fetch(apiUrl, {
            headers: {
                "User-Agent": "MiliLua-VSCode-Extension (Discord @haminpants)"
            },
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) { throw new Error(`HTTP Error - Status: ${response.status} ${response.statusText}`); }

        const data = await response.json() as EnkaResponse;
        const nickname = data?.playerInfo?.nickname;

        if (nickname) { return { name: nickname, lastUpdate: now } }
        throw new Error(`Response body missing for UID ${uid}: playerInfo.nickname`);
    }
    catch (error) {
        console.error(`Failed to fetch UID: ${uid}`, error);
        return undefined;
    }
}