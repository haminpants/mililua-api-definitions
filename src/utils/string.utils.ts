import { SERVER } from "@/constants/servers";
import { ServerEntry, ServerType } from "@/types";

export function getServerTypeFromUid(value: string): ServerType | undefined {
    for (const [key, server] of Object.entries(SERVER) as [ServerType, ServerEntry][]) {
        if (server.uidRegex.test(value)) { return key; }
    }
    return undefined;
}

export function getServerFromUid(value: string): ServerEntry | undefined {
    for (const [key, server] of Object.entries(SERVER) as [ServerType, ServerEntry][]) {
        if (server.uidRegex.test(value)) { return server; }
    }
    return undefined;
}