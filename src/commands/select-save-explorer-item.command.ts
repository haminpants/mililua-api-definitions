import * as vscode from "vscode";
import { COMMANDS } from "@/constants/commands";
import { SaveExplorerItem } from "@/providers/save-explorer.provider";

export function registerSelectSaveExplorerItemCommand(context: vscode.ExtensionContext) {
    const selectCommand = vscode.commands.registerCommand(COMMANDS.SELECT_SAVE_EXPLORER_ITEM, async (item: SaveExplorerItem) => {
        if (!item.isSave) { return; }
        if ((vscode.workspace.workspaceFolders?.length ?? 0) > 0 || vscode.workspace.textDocuments.length > 0) {
            const choice = await vscode.window.showInformationMessage(
                `Are you sure you would like to open ${item.label}?\nAny unsaved changes in your current files and workspace will be lost.`,
                { modal: true },
                "Yes"
            );

            if (choice !== "Yes") { return; }
        }
        vscode.commands.executeCommand(`vscode.openFolder`, item.uri, { forceNewWindow: false })
    });
    context.subscriptions.push(selectCommand);
}