import * as vscode from "vscode";
import { COMMANDS } from "@/constants/commands";
import { ServerType } from "../types";
import { getSaveExplorer } from "../providers/save-explorer.provider";

export function registerRefreshSaveExplorerCommand(context: vscode.ExtensionContext) {
    const c = vscode.commands.registerCommand(COMMANDS.REFRESH_SAVE_EXPLORER, (serverType: ServerType) => {
        const saveExplorer = getSaveExplorer(serverType);
        if (saveExplorer) { saveExplorer.update(); }
    });
    context.subscriptions.push(c);
}