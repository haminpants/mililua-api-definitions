import * as vscode from "vscode";
import { UidInfo } from "@/types";

export type ServerType = "GLOBAL" | "CN";

export interface ServerEntry {
    treeViewId: string,
    uidRegex: RegExp,
    getBeyondLocalUri: () => vscode.Uri,
    getUidInfo: (context: vscode.ExtensionContext, uid: string) => Promise<UidInfo>,
}