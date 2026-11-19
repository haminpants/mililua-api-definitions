import * as vscode from "vscode";
import { COMMANDS } from "@/constants/commands";
import { getSaveExplorer } from "@/providers/save-explorer.provider";

export function registerRefreshSaveExplorerCommand(context: vscode.ExtensionContext) {
    const globalCmd = vscode.commands.registerCommand(COMMANDS.REFRESH_GLOBAL_SAVE_EXPLORER, () => {
        const saveExplorer = getSaveExplorer("GLOBAL");
        if (saveExplorer) { saveExplorer.update(); }
    });
    const cnCmd = vscode.commands.registerCommand(COMMANDS.REFRESH_CN_SAVE_EXPLORER, () => {
        const saveExplorer = getSaveExplorer("CN");
        if (saveExplorer) { saveExplorer.update(); }
    });
    context.subscriptions.push(globalCmd, cnCmd);
}