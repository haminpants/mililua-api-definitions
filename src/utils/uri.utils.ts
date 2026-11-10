import * as os from "os"
import * as vscode from "vscode";

export function getBeyondLocalUri() {
    return vscode.Uri.joinPath(vscode.Uri.file(os.homedir()), "AppData", "LocalLow", "miHoYo", "Genshin Impact", "BeyondLocal");
}

export function getBeyondLocalSaveUri(uid: string) {
    return vscode.Uri.joinPath(getBeyondLocalUri(), uid, "Beyond_Local_Save_Level");
}

export function getLuaLibraryUri(context: vscode.ExtensionContext) {
    return vscode.Uri.joinPath(context.extensionUri, "resources", "library");
}