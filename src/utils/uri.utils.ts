import * as vscode from "vscode";
import { ServerType } from "@/types";
import { SERVER } from "@/constants/servers";

export function getBeyondLocalUri(serverType: ServerType = "GLOBAL") {
    const server = SERVER[serverType] ?? SERVER["GLOBAL"];
    return server.getBeyondLocalUri();
}

export function getBeyondLocalSaveUri(serverType: ServerType = "GLOBAL", uid: string) {
    return vscode.Uri.joinPath(getBeyondLocalUri(serverType), uid, "Beyond_Local_Save_Level");
}

export function getLuaLibraryUri(context: vscode.ExtensionContext) {
    return vscode.Uri.joinPath(context.extensionUri, "resources", "library");
}