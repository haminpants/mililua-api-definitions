import * as vscode from "vscode";
import { UidInfo } from "./extension.types";

export type ServerType = "GLOBAL" | "CN";

export interface ServerEntry {
    uidRegex: RegExp,
    getBeyondLocalUri: () => vscode.Uri,
    getUidInfo: (context: vscode.ExtensionContext, uid: string) => Promise<UidInfo>
}